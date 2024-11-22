import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// document.getElementById("click-me-button").addEventListener("click", handleClickMe);

// async function handleClickMe() {
// 	try {
// 		const response = await fetch("http://localhost:4321/echo/hello");
// 		if (!response.ok) {
// 			throw new Error(`Response status: ${response.status}`);
// 		}

// 		const json = await response.json();
// 		alert("This is a test! \n" + json["result"]);
// 	} catch (e) {
// 		alert("Error! \n" + e.message);
// 	}
// }

document.getElementById("add-dataset-button").addEventListener("click", handleAddDatasetButton);

async function handleAddDatasetButton(event) {
	event.preventDefault();
	const datasetID = document.getElementById("addDatasetID").value;
	const datasetType = document.getElementById("addDatasetType").value;
	const datasetZIP = document.getElementById("addDatasetFile").files[0];

	if (datasetID == "" && datasetZIP == null) {
		alert("Please enter a dataset ID and a dataset file");
	} else if (datasetID == "") {
		alert("Please enter a dataset ID");
	} else if (datasetZIP == null) {
		alert("Please add a dataset file");
	}
	// Convert file into array buffer
	const fileReader = new FileReader();
	fileReader.readAsArrayBuffer(datasetZIP);

	// File reader callback
	fileReader.onload = async function () {

		const response = await fetch("http://localhost:4321/dataset/" + datasetID + "/" + datasetType, {
			method: "PUT",
			headers: {"Content-Type": "application/x-zip-compressed"},
			body: fileReader.result
		});
		const json = await response.json()
		if(response.status != 200) {
			alert("Error: " + response.status + " - " + json.error)
		} else {
			alert("Dataset added successfully!");
		}
		await updateDatasetList();
	}

	fileReader.onerror = function () {
		console.log(fileReader.error);
	}
}

async function removeDataset(datasetID) {

	const response = await fetch("http://localhost:4321/dataset/" + datasetID, {
		method: "DELETE"
	});

	// const json = await response.json()
	// console.log(json);
	alert("Dataset removed successfully!");
	await updateDatasetList();
}






// Fetches dataset ids and displays them
async function updateDatasetList() {
	const datasetsDiv = document.getElementById("datasetsContainer");
	datasetsDiv.innerHTML = '';

	const response = await fetch("http://localhost:4321/datasets");

	var json = await response.json()
	var results = json.result;

	// Show "no datasets added" div if
	const noDatasetsText = document.getElementById("noDatasetsText");
	if (results.length == 0) {
		noDatasetsText.style.display = "block";
	} else {
		noDatasetsText.style.display = "none";
	}

	for (const result of results) {
		const datasetID = result.id;
		const datasetType = result.kind;

		// Create container
		const container = document.createElement("div");
		container.className = "datasetContainer text"

		// Dataset ID text
		const idDiv = document.createElement("div");
		const idText = document.createTextNode(datasetID);
		idDiv.appendChild(idText);
		container.append(idDiv);

		// Dataset Type text
		const typeDiv = document.createElement("div");
		const typeText = document.createTextNode("Type: " + datasetType);
		typeDiv.appendChild(typeText);
		container.append(typeDiv);

		// View insights button
		const viewButtonDiv = document.createElement("div");
		viewButtonDiv.className = "header3";
		const viewButtonButton = document.createElement("button");
		viewButtonButton.className = "viewButton"
		viewButtonButton.addEventListener('click',
			function() {
				goToInsights(datasetID);
			})
		const viewButtonText = document.createTextNode("View Insights");
		viewButtonButton.appendChild(viewButtonText);
		viewButtonDiv.appendChild(viewButtonButton);
		container.append(viewButtonDiv);

		// Remove button
		const removeButtonDiv = document.createElement("div");
		removeButtonDiv.className = "header3";
		const removeButtonButton = document.createElement("button");
		removeButtonButton.className = "removeButton"
		removeButtonButton.addEventListener('click',
			function() {
				removeDataset(datasetID);
			})
		const removeButtonText = document.createTextNode("Remove Dataset");
		removeButtonButton.appendChild(removeButtonText);
		removeButtonDiv.appendChild(removeButtonButton);
		container.append(removeButtonDiv);

		datasetsDiv.append(container);
	}
}

function goToInsights(datasetID) {
	localStorage.setItem("CurrentDatasetID", datasetID);

	location.href = "insights.html"
}


// Initialize
await updateDatasetList();

// Plotting stuff
// const plotOptions = {
// 	y: {grid: true}
// }
//
// const plot1DData = [1, 3, 2, 5, 2, 6];
// const plot1D = Plot.lineY(plot1DData).plot(plotOptions);
//
// const plot2DData = [[0, 1], [1, 3], [3, 5], [4, 2], [5, 6], [9, 2]];
// const plot2D = Plot.line(plot2DData).plot(plotOptions);
//
//
//
// const div = document.querySelector("#testplots");
// div.append(plot1D);
// div.append(plot2D);
