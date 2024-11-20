
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
	console.log(deptMap);

	updateInsightResultContainers();
}

function updateInsightResultContainers() {
	const courseAveragesContainer = document.getElementById("Course Averages");

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
