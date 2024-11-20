
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
	// Get all departments in dataset

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
			"ORDER": "courseAvg"
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
