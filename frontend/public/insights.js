import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

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

	// Department Performance
	// None

	// Professor Audit Rates
	// None...?


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

	const avgPlot = Plot.line(plotData, {x: "Year", y: "Course Average", marker: "circle"}).plot(plotOptions);

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
		width: Math.min(innerWidth, 800),
		marks: [
			Plot.ruleY([0, 100]) // Set Y axis range as 0, 100
		]
	}

	const avgPlot = Plot.barY(newData, {x: "Instructor", y: "Course Average", sort: {x: "-y"}, marginLeft: 60}).plot(plotOptions);

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
		courseNameData.innerHTML = deptId + Object.values(sectionResult)[0];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[1];
		row.appendChild(courseNameData);
		row.appendChild(passRateData);

		table.appendChild(row);
		console.log(row);
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
		width: Math.min(innerWidth, 800),
		marks: [
			Plot.ruleY([0, 100]) // Set Y axis range as 0, 100
		]
	}

	const avgPlot = Plot.barY(newData, {x: "Course", y: "Pass Rate", sort: {x: "-y"}, marginLeft: 60}).plot(plotOptions);

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
		courseNameData.innerHTML = deptId + Object.values(sectionResult)[0];
		const passRateData = document.createElement("td");
		passRateData.className = "tableColumn";
		passRateData.innerHTML = Object.values(sectionResult)[1];
		row.appendChild(courseNameData);
		row.appendChild(passRateData);

		table.appendChild(row);
		console.log(row);
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

	// View insights button
	const getInsightButton = document.getElementById("busiestProfsButton");
	getInsightButton.addEventListener('click',
		function() {
			getBusiestProfsInsight();
		})
}

async function getBusiestProfsInsight() {
	const deptDropdown = document.getElementById("busiestProfsDeptDropdown");

	const deptId = deptDropdown.value;

	// Clone query, as to not modify the original
	const query = JSON.parse(JSON.stringify(queries.getBusiestProfs));
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
	console.log(avgs);
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

let deptMap = {};

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
			"ORDER": "numCourses"
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
