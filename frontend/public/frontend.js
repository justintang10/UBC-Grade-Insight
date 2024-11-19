import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.getElementById("click-me-button").addEventListener("click", handleClickMe);

async function handleClickMe() {
	try {
		const response = await fetch("http://localhost:4321/echo/hello");
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		alert("This is a test! \n" + json["result"]);
	} catch (e) {
		alert("Error! \n" + e.message);
	}
}







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
