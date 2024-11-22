import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


// Return to datasets page
document.getElementById("back-button").addEventListener("click", goToDatasets);
function goToDatasets() {
	location.href = "index.html";
}

// Show and hide insight containers
function showInsightContainer(insightName) {
	hideAllInsightContainers()

	const insightContainer = document.getElementById(insightName);
	insightContainer.style.display = "block";
}

function hideAllInsightContainers() {
	const insightContainers = document.getElementsByClassName("insightContainer");

	for (const container of insightContainers) {
		container.style.display = "none";
	}
}

let deptMap = {};
let years = [];

// Gets dataset info for the dropdowns and options that the user can then choose: eg. get a list of all courses, so the user can choose a course to find averages for.
async function getRequiredInfoFromDatasets() {

	// Course Averages
	// Get all courses in dataset
	const coursesPromise = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(queries.getCourses),
	});
	const courses = await coursesPromise.json();

	// Top Professors
	// Get all courses in dataset

	// Easiest Courses
	// Get all departments in dataset
	const deptsPromise = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(queries.getDepartments),
	});
	const depts = await deptsPromise.json();

	// Busiest Professors
	// Get all departments in dataset, and all years in dataset
	const yearsPromise = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(queries.getYears),
	});
	const yearsObj = await yearsPromise.json();

	years = [];
	for (const section of yearsObj.result) {
		if (Object.values(section)[0] == 1900) {
			continue;
		}
		years.push(Object.values(section)[0]);
	}

	// Department Performance
	// Department

	// Professor Audit Rates
	// Department
	// Get pass, fail, audit nums


	// Make a map of "dept": ["id1", "id2", "id3"]
	deptMap = {};
	for (const deptObj of depts.result) {
		const deptName = deptObj[Object.keys(deptObj)[0]];
		deptMap[deptName] = [];
	}
	for (const courseObj of courses.result) {
		const deptName = courseObj[Object.keys(courseObj)[0]];
		const courseID = courseObj[Object.keys(courseObj)[1]];

		const array = deptMap[deptName];
		array.push(courseID);
	}
	// console.log(deptMap);

	updateInsightResultContainers();
}

function updateInsightResultContainers() {
	updateCourseAveragesContainer();
	updateTopProfsContainer();
	updateEasiestCoursesContainer();
	updateBusiestProfessorsContainer();
	updateDeptPerformanceContainer();
	updateProfAuditsContainer();
}




function updateCourseAveragesContainer() {
	const deptDropdown = document.getElementById("courseAverageDeptDropdown");

	for (const dept in deptMap) {
		const option = document.createElement("option");
		option.value = dept;
		option.innerHTML = dept;
		deptDropdown.appendChild(option);
	}

	const courseDropdown = document.getElementById("courseAverageCourseDropdown");

	deptDropdown.addEventListener('change', function () {
		updateCoursesDropdown(courseDropdown, deptMap[deptDropdown.value]);
	});

	deptDropdown.addEventListener('focus', function () {
		deptDropdown.selectedIndex = -1;
		courseDropdown.innerHTML = "";
	});

	// View insights button
	const getInsightButton = document.getElementById("courseAverageButton");
	getInsightButton.addEventListener('click',
		function() {
			getCourseAverageInsight();
		})
}

async function getCourseAverageInsight() {
	const deptDropdown = document.getElementById("courseAverageDeptDropdown");
	const courseDropdown = document.getElementById("courseAverageCourseDropdown");

	const deptId = deptDropdown.value;
	const courseId = courseDropdown.value;

	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getCourseAverages));
	const datasetId = localStorage.getItem("CurrentDatasetID");
	const datasetIdDept = datasetId + "_dept";
	const datasetIdCourse = datasetId + "_id";
	const is1 = {}
	is1[datasetIdDept] = deptId;
	const is2 = {}
	is2[datasetIdCourse] = courseId;
	query["WHERE"] = {
		"AND": [
			{
				"IS": is1
			},
			{
				"IS": is2
			}
		]
	}

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(query),
	});

	const avgs = await response.json();
	console.log("Course Averages over the years for: " + deptId + " " + courseId);
	console.log(avgs);

	// Plotting stuff


	const plotData = [];
	for (const sectionResult of avgs.result) {
		if (Object.values(sectionResult)[0] == 1900) {
			console.log("Overall Average is: ", Object.values(sectionResult)[1]);
			continue;
		}
		const dataPoint = {
			"Year": Object.values(sectionResult)[0],
			"Course Average": Object.values(sectionResult)[1]
		};
		plotData.push(dataPoint);
	}

	const plotOptions = {
		y: {grid: true},
		x: {grid: true},
		width: Math.min(innerWidth, 800),
		marks: [
			Plot.ruleY([0, 100]), // Set Y axis range as 0, 100
		]
	}

	const avgPlot = Plot.line(plotData, {x: "Year", y: "Course Average", tip: "xy", marker: "circle"}).plot(plotOptions);

	const div = document.getElementById("courseAveragePlot");
	div.innerHTML = "";
	div.append(avgPlot);
}




function updateTopProfsContainer() {
	const deptDropdown = document.getElementById("topProfsDeptDropdown");

	for (const dept in deptMap) {
		const option = document.createElement("option");
		option.value = dept;
		option.innerHTML = dept;
		deptDropdown.appendChild(option);
	}

	const courseDropdown = document.getElementById("topProfsCourseDropdown");

	deptDropdown.addEventListener('change', function () {
		updateCoursesDropdown(courseDropdown, deptMap[deptDropdown.value]);
	});

	deptDropdown.addEventListener('focus', function () {
		deptDropdown.selectedIndex = -1;
		courseDropdown.innerHTML = "";
	});

	// View insights button
	const getInsightButton = document.getElementById("topProfsButton");
	getInsightButton.addEventListener('click',
		function() {
			getTopProfsInsight();
		})
}

async function getTopProfsInsight() {
	const deptDropdown = document.getElementById("topProfsDeptDropdown");
	const courseDropdown = document.getElementById("topProfsCourseDropdown");

	const deptId = deptDropdown.value;
	const courseId = courseDropdown.value;

	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getTopProfs));
	const datasetId = localStorage.getItem("CurrentDatasetID");
	const datasetIdDept = datasetId + "_dept";
	const datasetIdCourse = datasetId + "_id";
	const is1 = {}
	is1[datasetIdDept] = deptId;
	const is2 = {}
	is2[datasetIdCourse] = courseId;
	query["WHERE"] = {
		"AND": [
			{
				"IS": is1
			},
			{
				"IS": is2
			}
		]
	}

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(query),
	});

	const avgs = await response.json();
	console.log("Top Profs for: " + deptId + " " + courseId);
	console.log(avgs);

	const newData = [];
	for (const sectionResult of avgs.result) {
		if (Object.values(sectionResult)[0] == "") { // Ignore averages
			continue;
		}
		const newResult = {};
		newResult["Instructor"] = Object.values(sectionResult)[0];
		newResult["Course Average"] = Object.values(sectionResult)[1];
		newData.push(newResult);
	}

	const plotOptions = {
		y: {grid: true},
		color: {
			legend: true,
			domain: [0, 100],
			pivot: 50,
			type: "diverging",
			scheme: "RdYlGn"
		},
		width: Math.min(innerWidth, 800),
		marks: [
			Plot.ruleY([0, 100]) // Set Y axis range as 0, 100
		],
		x:{
			tickRotate: -45
		},
		marginBottom: 150
	}

	const avgPlot = Plot.barY(newData, {x: "Instructor", y: "Course Average", tip: "xy", fill: "Course Average", sort: {x: "-y"}, marginLeft: 60}).plot(plotOptions);

	const div = document.getElementById("topProfsPlot");
	div.innerHTML = "";

	div.append(avgPlot);

	const table = document.createElement("table");
	table.className = "table text";
	const headerRow = document.createElement("tr");
	const courseNameHeader = document.createElement("th");
	courseNameHeader.className = "tableColumn";
	courseNameHeader.innerHTML = "Professor";
	const passRateHeader = document.createElement("th");
	passRateHeader.className = "tableColumn";
	passRateHeader.innerHTML = "Course Average";
	headerRow.appendChild(courseNameHeader);
	headerRow.appendChild(passRateHeader);

	table.appendChild(headerRow);

	for (const sectionResult of newData) {
		const row = document.createElement("tr");
		const courseNameData = document.createElement("td");
		courseNameData.className = "tableColumn";
		courseNameData.innerHTML = Object.values(sectionResult)[0];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[1];
		row.appendChild(courseNameData);
		row.appendChild(passRateData);

		table.appendChild(row);
	}

	div.appendChild(table);
}




function updateEasiestCoursesContainer() {
	const deptDropdown = document.getElementById("easiestCoursesDeptDropdown");

	for (const dept in deptMap) {
		const option = document.createElement("option");
		option.value = dept;
		option.innerHTML = dept;
		deptDropdown.appendChild(option);
	}


	// View insights button
	const getInsightButton = document.getElementById("easiestCoursesButton");
	getInsightButton.addEventListener('click',
		function() {
			getEasiestCoursesInsight();
		})
}

async function getEasiestCoursesInsight() {
	const deptDropdown = document.getElementById("easiestCoursesDeptDropdown");

	const deptId = deptDropdown.value;

	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getEasiestCourses));
	const datasetId = localStorage.getItem("CurrentDatasetID");
	const datasetIdDept = datasetId + "_dept";
	const is = {}
	is[datasetIdDept] = deptId;
	query["WHERE"] = {
		"IS": is
	}

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(query),
	});

	const avgs = await response.json();

	let newResult = [];
	for (const course of avgs.result) {
		var passRate = 0;
		if (course["sumFails"] == 0) {
			passRate = 100;
		} else {
			passRate = 100 * course["sumPasses"] / (course["sumPasses"] + course["sumFails"]);
			passRate = Math.round(passRate * 100) / 100;
		}

		const newCourse = {};
		newCourse[Object.keys(course)[0]] = Object.values(course)[0];
		newCourse["passRate"] = passRate;
		newResult.push(newCourse);
	}
	newResult.sort(function(a, b) {
		return b["passRate"] - a["passRate"];
	})

	console.log("Courses with highest pass rates for: " + deptId);
	console.log(newResult);

	const newData = [];
	for (const sectionResult of newResult) {
		if (Object.values(sectionResult)[0] == "") { // Ignore averages
			continue;
		}
		const newResult = {};
		newResult["Course"] = deptId + Object.values(sectionResult)[0];
		newResult["Pass Rate"] = Object.values(sectionResult)[1];
		newData.push(newResult);
	}

	const plotOptions = {
		y: {grid: true},
		color: {
			legend: true,
			pivot: 50,
			type: "diverging",
			scheme: "RdYlGn"
		},
		width: Math.min(innerWidth, 800),
		marks: [
			Plot.ruleY([0, 100]) // Set Y axis range as 0, 100
		],
		x:{
			tickRotate: -45
		},
		marginBottom: 150
	}

	const avgPlot = Plot.barY(newData, {x: "Course", y: "Pass Rate", tip: "xy", fill: "Pass Rate", sort: {x: "-y"}, marginLeft: 60}).plot(plotOptions);
	console.log(avgPlot.scale("color"));
	const div = document.getElementById("easiestCoursesPlot");
	div.innerHTML = "";

	div.append(avgPlot);

	const table = document.createElement("table");
	table.className = "table text";
	const headerRow = document.createElement("tr");
	const courseNameHeader = document.createElement("th");
	courseNameHeader.className = "tableColumn";
	courseNameHeader.innerHTML = "Course";
	const passRateHeader = document.createElement("th");
	passRateHeader.className = "tableColumn";
	passRateHeader.innerHTML = "Pass Rate (%)";
	headerRow.appendChild(courseNameHeader);
	headerRow.appendChild(passRateHeader);

	table.appendChild(headerRow);

	for (const sectionResult of newResult) {
		const row = document.createElement("tr");
		const courseNameData = document.createElement("td");
		courseNameData.className = "tableColumn";
		courseNameData.innerHTML = deptId + " " + Object.values(sectionResult)[0];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[1];
		row.appendChild(courseNameData);
		row.appendChild(passRateData);

		table.appendChild(row);
	}

	div.appendChild(table);
}



function updateBusiestProfessorsContainer() {
	const deptDropdown = document.getElementById("busiestProfsDeptDropdown");

	for (const dept in deptMap) {
		const option = document.createElement("option");
		option.value = dept;
		option.innerHTML = dept;
		deptDropdown.appendChild(option);
	}

	const yearDropdown = document.getElementById("busiestProfsYearDropdown");

	for (const year of years) {
		const option = document.createElement("option");
		option.value = year;
		option.innerHTML = year;
		yearDropdown.appendChild(option);
	}

	// View insights button
	const getInsightButton = document.getElementById("busiestProfsButton");
	getInsightButton.addEventListener('click',
		function() {
			getBusiestProfsInsight();
		})
}

async function getBusiestProfsInsight() {
	const deptDropdown = document.getElementById("busiestProfsDeptDropdown");
	const yearDropdown = document.getElementById("busiestProfsYearDropdown");
	const deptId = deptDropdown.value;
	const year = Number(yearDropdown.value);
	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getBusiestProfs));
	const datasetId = localStorage.getItem("CurrentDatasetID");
	const datasetIdDept = datasetId + "_dept";
	const datasetIdYear = datasetId + "_year";
	const is1 = {};
	is1[datasetIdDept] = deptId;
	const is2 = {};
	is2[datasetIdYear] = year;
	query["WHERE"] = {
		"AND": [
			{
				"IS": is1
			},
			{
				"EQ": is2
			}
		]
	}

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(query),
	});

	const profCourseCount = await response.json();
	const result = profCourseCount.result;

	const newData = [];
	let maxCourses = 0;
	for (const sectionResult of result) {
		if (Object.values(sectionResult)[0] == "") { // Ignore averages
			continue;
		}
		const newResult = {};
		newResult["Instructor"] = deptId + Object.values(sectionResult)[0];
		newResult["# Courses Taught"] = Object.values(sectionResult)[1];
		if (maxCourses < Object.values(sectionResult)[1]) {
			maxCourses = Object.values(sectionResult)[1];
		}
		newData.push(newResult);
	}

	const plotOptions = {
		y: {grid: true},
		color: {
			legend: true,
			pivot: maxCourses / 2,
			type: "diverging",
			scheme: "RdYlGn"
		},
		width: Math.min(innerWidth, 800),
		interval: 1,
		marks: [
			Plot.ruleY([0]) // Set Y axis range as 0, 100
		],
		x:{
			tickRotate: -45
		},
		marginBottom: 150
	}

	const avgPlot = Plot.barY(newData, {x: "Instructor", y: "# Courses Taught", tip: "xy", fill: "# Courses Taught", sort: {x: "-y"}, marginLeft: 60}).plot(plotOptions);

	const div = document.getElementById("busiestProfsPlot");
	div.innerHTML = "";

	div.append(avgPlot);

	const table = document.createElement("table");
	table.className = "table text";
	const headerRow = document.createElement("tr");
	const courseNameHeader = document.createElement("th");
	courseNameHeader.className = "tableColumn";
	courseNameHeader.innerHTML = "Instructor";
	const passRateHeader = document.createElement("th");
	passRateHeader.className = "tableColumn";
	passRateHeader.innerHTML = "Number of Courses Taught";
	headerRow.appendChild(courseNameHeader);
	headerRow.appendChild(passRateHeader);

	table.appendChild(headerRow);

	for (const sectionResult of result) {
		const row = document.createElement("tr");
		const courseNameData = document.createElement("td");
		courseNameData.className = "tableColumn";
		courseNameData.innerHTML = Object.values(sectionResult)[0];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[1];
		row.appendChild(courseNameData);
		row.appendChild(passRateData);

		table.appendChild(row);
	}

	div.appendChild(table);
}

function updateDeptPerformanceContainer() {

	// View insights button
	const getInsightButton = document.getElementById("deptPerformanceButton");
	getInsightButton.addEventListener('click',
		function() {
			getDeptPerformanceInsight();
		})
}

async function getDeptPerformanceInsight() {

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(queries.getDeptPerformance),
	});

	const deptPerformance = await response.json();
	const result = deptPerformance.result;
	console.log(deptPerformance);

	const newData = [];
	for (const sectionResult of result) {
		if (Object.values(sectionResult)[0] == "") { // Ignore blank depts
			continue;
		}
		const newResult = {};
		newResult["Department"] = Object.values(sectionResult)[0];
		const numStudents = Object.values(sectionResult)[1] + Object.values(sectionResult)[2];
		const numPass = Object.values(sectionResult)[1];
		let passRate = 0;
		if (numStudents > 0) {
			passRate = numPass / numStudents * 100;
		}
		passRate = Math.round(passRate * 100) / 100;
		newResult["Dept Average"] = Object.values(sectionResult)[4];
		newResult["Pass Rate (%)"] = passRate;
		newData.push(newResult);
	}
	newData.sort(function(a, b) {
		return b["Dept Average"] - a["Dept Average"]
	})

	const plotOptions = {
		y: {grid: true},
		width: Math.min(innerWidth, 800),
		interval: 1,
		marks: [
			Plot.ruleY([100]),
			Plot.ruleX([100]),
		]
	}

	const avgPlot = Plot.dot(newData, {x: "Dept Average", y: "Pass Rate (%)", stroke: "Department", sort: {x: "-y"}, marginLeft: 60, tip: "xy"}).plot(plotOptions);

	const div = document.getElementById("deptPerformancePlot");
	div.innerHTML = "";

	div.append(avgPlot);

	const table = document.createElement("table");
	table.className = "table text";
	const headerRow = document.createElement("tr");
	const courseNameHeader = document.createElement("th");
	courseNameHeader.className = "tableColumn";
	courseNameHeader.innerHTML = "Department";
	const avgHeader = document.createElement("th");
	avgHeader.className = "tableColumn";
	avgHeader.innerHTML = "Department Average (%)";
	const passRateHeader = document.createElement("th");
	passRateHeader.className = "tableColumn";
	passRateHeader.innerHTML = "Pass Rate (%)";
	headerRow.appendChild(courseNameHeader);
	headerRow.appendChild(avgHeader);
	headerRow.appendChild(passRateHeader);

	table.appendChild(headerRow);

	for (const sectionResult of newData) {
		const row = document.createElement("tr");
		const courseNameData = document.createElement("td");
		courseNameData.className = "tableColumn";
		courseNameData.innerHTML = Object.values(sectionResult)[0];
		const avgData = document.createElement("td");
		avgData.className = "tableColumn";
		avgData.innerHTML = Object.values(sectionResult)[1];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[2];
		row.appendChild(courseNameData);
		row.appendChild(avgData);
		row.appendChild(passRateData);

		table.appendChild(row);
	}

	div.appendChild(table);
}

function updateProfAuditsContainer() {
	const deptDropdown = document.getElementById("profAuditsDropdown");

	for (const dept in deptMap) {
		const option = document.createElement("option");
		option.value = dept;
		option.innerHTML = dept;
		deptDropdown.appendChild(option);
	}

	// View insights button
	const getInsightButton = document.getElementById("profAuditsButton");
	getInsightButton.addEventListener('click',
		function() {
			getProfAuditsInsight();
		})
}

async function getProfAuditsInsight() {
	const deptDropdown = document.getElementById("profAuditsDropdown");
	const deptId = deptDropdown.value;
	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getProfAudits));
	const datasetId = localStorage.getItem("CurrentDatasetID");
	const datasetIdDept = datasetId + "_dept";
	const is1 = {};
	is1[datasetIdDept] = deptId;
	query["WHERE"] = {
		"IS": is1
	}

	const response = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(query),
	});

	const profCourseCount = await response.json();
	const result = profCourseCount.result;

	const newData = [];
	let maxAudits = 0;
	for (const sectionResult of result) {
		if (Object.values(sectionResult)[3] == 0 || Object.values(sectionResult)[0] == "") { // Ignore profs with no audits, or instructors value ""
			continue;
		}
		const newResult = {};
		newResult["Instructor"] = Object.values(sectionResult)[0];
		const numStudents = Object.values(sectionResult)[1] + Object.values(sectionResult)[2] + Object.values(sectionResult)[3];
		const numAudits = Object.values(sectionResult)[3];
		let auditRate = 100 * numAudits / numStudents;
		auditRate = Math.round(auditRate * 100) / 100;
		newResult["Audit Rate"] = auditRate;
		newResult["# Audits"] = numAudits;
		if (maxAudits < numAudits) {
			maxAudits = numAudits;
		}
		newData.push(newResult);
	}

	newData.sort(function (a, b) {
		return b["# Audits"] - a["# Audits"];
	})

	const plotOptions = {
		y: {grid: true},
		color: {
			legend: true,
			pivot: maxAudits / 2,
			type: "diverging",
			scheme: "RdYlGn"
		},
		width: Math.min(innerWidth, 800),
		interval: 1,
		marks: [
			Plot.ruleY([0]) // Set Y axis range as 0, 100
		],
		x:{
			tickRotate: -45
		},
		marginBottom: 150
	}

	const avgPlot = Plot.barY(newData, {x: "Instructor", y: "# Audits", sort: {x: "-y"}, tip: "xy", fill: "# Audits", marginLeft: 60}).plot(plotOptions);

	const div = document.getElementById("profAuditsPlot");
	div.innerHTML = "";

	div.append(avgPlot);

	const table = document.createElement("table");
	table.className = "table text";
	const headerRow = document.createElement("tr");
	const courseNameHeader = document.createElement("th");
	courseNameHeader.className = "tableColumn";
	courseNameHeader.innerHTML = "Instructor";
	const auditRateHeader = document.createElement("th");
	auditRateHeader.className = "tableColumn";
	auditRateHeader.innerHTML = "Audit Rate (%)";
	const auditNumHeader = document.createElement("th");
	auditNumHeader.className = "tableColumn";
	auditNumHeader.innerHTML = "Number of Audits";
	headerRow.appendChild(courseNameHeader);
	headerRow.appendChild(auditNumHeader);
	headerRow.appendChild(auditRateHeader);

	table.appendChild(headerRow);

	for (const sectionResult of newData) {
		const row = document.createElement("tr");
		const courseNameData = document.createElement("td");
		courseNameData.className = "tableColumn";
		courseNameData.innerHTML = Object.values(sectionResult)[0];
		const auditRateData = document.createElement("td");
		auditRateData.className = "tableColumn";
		auditRateData.innerHTML = Object.values(sectionResult)[1];
		const auditNumData = document.createElement("td");
		auditNumData.className = "tableColumn";
		auditNumData.innerHTML = Object.values(sectionResult)[2];
		row.appendChild(courseNameData);
		row.appendChild(auditNumData);
		row.appendChild(auditRateData);

		table.appendChild(row);
	}

	div.appendChild(table);
}


function updateCoursesDropdown(dropDownElement, courseIds) {
	dropDownElement.innerHTML = "";

	for (const id of courseIds) {
		const option = document.createElement("option");
		option.value = id;
		option.innerHTML = id;
		dropDownElement.appendChild(option);
	}
}



const queries = {
	"getCourses": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_dept",
				localStorage.getItem("CurrentDatasetID") + "_id"
			],
			"ORDER": localStorage.getItem("CurrentDatasetID") + "_dept"
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_dept",
				localStorage.getItem("CurrentDatasetID") + "_id"
			],
			"APPLY": []
		}
	},
	"getDepartments": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_dept"
			],
			"ORDER": localStorage.getItem("CurrentDatasetID") + "_dept"
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_dept"
			],
			"APPLY": []
		}
	},
	"getYears": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_year"
			],
			"ORDER": localStorage.getItem("CurrentDatasetID") + "_year"
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_year"
			],
			"APPLY": []
		}
	},
	"getCourseAverages": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_year",
				"courseAvg"
			],
			"ORDER": localStorage.getItem("CurrentDatasetID") + "_year"
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_year"
			],
			"APPLY": [
				{
					"courseAvg": {
						"AVG": localStorage.getItem("CurrentDatasetID") + "_avg"
					}
				}
			]
		}
	},
	"getTopProfs": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_instructor",
				"courseAvg"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					"courseAvg"
				]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_instructor"
			],
			"APPLY": [
				{
					"courseAvg": {
						"AVG": localStorage.getItem("CurrentDatasetID") + "_avg"
					}
				}
			]
		}
	},
	"getEasiestCourses": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_id",
				"sumPasses",
				"sumFails"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					localStorage.getItem("CurrentDatasetID") + "_id"
				]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_id"
			],
			"APPLY": [
				{
					"sumPasses": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_pass"
					}
				},
				{
					"sumFails": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_fail"
					}
				}
			]
		}
	},
	"getBusiestProfs": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_instructor",
				"numCourses"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					"numCourses"
				]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_instructor"
			],
			"APPLY": [
				{
					"numCourses": {
						"COUNT": localStorage.getItem("CurrentDatasetID") + "_uuid"
					}
				}
			]
		}
	},
	"getDeptPerformance": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_dept",
				"sumPasses",
				"sumFails",
				"sumAudits",
				"deptAvg",
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					"deptAvg"
				]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_dept"
			],
			"APPLY": [
				{
					"deptAvg": {
						"AVG":  localStorage.getItem("CurrentDatasetID") + "_avg"
					}
				},
				{
					"sumPasses": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_pass"
					}
				},
				{
					"sumFails": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_fail"
					}
				},
				{
					"sumAudits": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_audit"
					}
				}
			]
		}
	},
	"getProfAudits": {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				localStorage.getItem("CurrentDatasetID") + "_instructor",
				"sumPasses",
				"sumFails",
				"sumAudits",
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				localStorage.getItem("CurrentDatasetID") + "_instructor"
			],
			"APPLY": [
				{
					"sumPasses": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_pass"
					}
				},
				{
					"sumFails": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_fail"
					}
				},
				{
					"sumAudits": {
						"SUM": localStorage.getItem("CurrentDatasetID") + "_audit"
					}
				}
			]
		}
	}
}




const datasetIDDiv = document.getElementById("datasetID");
datasetIDDiv.innerHTML = localStorage.getItem("CurrentDatasetID");

for (const button of document.getElementsByClassName("insightButton")) {
	button.addEventListener('click', function () {
		showInsightContainer(button.innerHTML);
	});
}

hideAllInsightContainers()
await getRequiredInfoFromDatasets()
