import { Room } from "../models/room";
import JSZip from "jszip";
import { InsightError } from "../controller/IInsightFacade";
import {parse} from "parse5";

//TODO: Justin if you want, see zipUtilsSection to see how we handled this for sections datasets

//TODO: parse the rooms dataset to JSON
/*
 * TODO: rooms dataset validation and addition
 * 	- files are .htm
 * 	- id same specs
 * 	- at least 1 valid room
 * 	- needs index.htm file
 * 	- index.htm MUST have a building table
 * 	- each room has all required fields (see room object in models)
 * 	- each room's geolocation query must succeed
 * ( this is a quick list based on the spec, likely not comprehensive so loop back to spec as needed
 *
 * */

//TODO: this function, see zipUtilsSection for inspo
/*
 * Should take in a rooms dataset as a zipped directory of .htm files (see the campus.zip on the 310 website),
 * should validate all requirements to ensure that it is valid, then return a JSON representation of the rooms
 * (see Base64ZipToJsonSections in zipUtilsSection for an analogous function for sections)
 * - note that here we will have to use the Parse5 library's parse function, and look through the html structure*/
export async function Base64ZipToJsonRooms(b64string: string): Promise<any> {
	const zip = new JSZip();
	const zipData = await zip.loadAsync(b64string, { base64: true });

	const indexHtmlJson = await getIndexHtml(zipData);
	indexHtmlJson.toString();

	//TODO: find buildings table in indexHtmlJson
	const buildings = getBuildingTable(indexHtmlJson);
	buildings.forEach((building) => {
		building.toString()})

	//TODO: load associated buildings files

	//TODO: parse buildings files

	//TODO: get rooms data from buildings files



	//this promise is meaningless and only meant to prevent lint errors
	return new Promise((resolve, reject) => {
		if (!b64string) {
			reject(new Error("B64string is required"));
		}
		resolve("hello");
	});
}

export async function getIndexHtml(zipData: JSZip): Promise<any> {
	const indexHtml = zipData.file("index.htm")
	if (!indexHtml) {
		throw new InsightError("No index.htm file found.");
	}
	try {
		const indexHtmlContent = await indexHtml.async("string");
		return parse(indexHtmlContent);
	} catch (error) {
		throw new InsightError("Error parsing Index.htm: " + error);
	}
}

export function getBuildingTable(indexJson: any): any[] {

	const allTables = getAllTables(indexJson);

	for (const table of allTables) {
		if (tableIsBuildingTable(table)) {
			return table;
		}
	}

	throw new InsightError("No valid building table found.");
}

function getAllTables(node: any): any[] {
	let tables: any[] = [];

	if (node.childNodes) {
		for (const child of node.childNodes) {
			tables = [...tables, ...getAllTables(child)]
		}
	}

	if (node.nodeName === 'table') {
		tables.push(node);
	}

	return tables;
}

function tableIsBuildingTable(table: any): boolean {
	let tbody: any;
	for (const child of table.childNodes) {
		if (child.nodeName === 'tbody') {
			tbody = child;
		}
	}
	if (!tbody) {
		return false;
	}

	let tr: any;
	for (const child of tbody.childNodes) {
		if (child.nodeName === 'tr') {
			tr = child;
		}
	}

	if (!tr) {
		return false;
	}

	let td: any;
	for (const child of tr.childNodes) {
		if (child.nodeName === 'td') {
			td = child;
		}
	}

	if (!td) {
		return false;
	}

	if (td.attrs.class === "views-field views-field-field-building-image") {
		return true;
	}

	return false;
}



//TODO: this function too (see zipUtilsSection again)
/*
 * Takes in a json representation of rooms (from the above function), and converts it to an array of rooms
 *  (a RoomsDataset), so that it can be used internally by performQuery & saved to disk etc.
 * 	once again see zipUtilsSection
 * */
export function jsonToRooms(jsonData: any): Room[] {
	const rooms: Room[] = [];
	//meaningless line to stop error
	jsonData.trimEnd();

	return rooms;
}
