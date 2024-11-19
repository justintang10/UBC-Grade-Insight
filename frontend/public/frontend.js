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

const plot = Plot.rectY(
	{length: 1000},
	Plot.binX(
		{y: "count"},
		{x: Math.random}
	)
).plot();

const div = document.querySelector("#myplot");

div.append(plot);
