import { Room } from "../models/room";
import JSZip from "jszip";
import { InsightError } from "../controller/IInsightFacade";
import { parse } from "parse5";
import { getAllTables, getBuildingTableData, getRoomsData, tableIsValid } from "./htmlTableParsing";

interface BuildingData {
	codeName: string;
	fullName: string;
	address: string;
	fileLink: string;
	page: any | null;
}

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

	const buildings = getBuildingTable(indexHtmlJson);

	const buildingsData: BuildingData[] = getBuildingTableData(buildings);

	const buildingsDataWithFiles: BuildingData[] = await parseBuildingFiles(buildingsData, zipData);

	const roomsJson = await buildingFileJsonToRoomsJson(buildingsDataWithFiles);

	const roomArray: string | any[] = [];
	for (const roomList of roomsJson) {
		for (const room of roomList) {
			roomArray.push(room);
		}
	}

	return roomArray;
}

export async function getIndexHtml(zipData: JSZip): Promise<any> {
	const indexHtml = zipData.file("index.htm");
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
		if (tableIsValid(table)) {
			return table;
		}
	}

	throw new InsightError("No valid building table found.");
}

async function parseBuildingFiles(buildingsData: BuildingData[], zipData: JSZip): Promise<any[]> {
	const buildingFilePromises: Promise<any>[] = buildingsData.map(async (bd) => {
		const file = zipData.file(bd.fileLink);

		if (file) {
			const fileContent = await file.async("string");
			bd.page = parse(fileContent);
			return bd;
		}
		return {};
	});

	if (buildingFilePromises.length === 0) {
		throw new InsightError("No valid building files to parse.");
	}

	return await Promise.all(buildingFilePromises);
}

async function buildingFileJsonToRoomsJson(buildingsData: BuildingData[]): Promise<any[]> {
	const roomJsonPromises: Promise<any>[] = buildingsData.map(async (buildingData) => {
		return parseRoomsFromBuilding(buildingData);
	});

	return await Promise.all(roomJsonPromises);
}

async function parseRoomsFromBuilding(buildingData: BuildingData): Promise<any> {
	const URIEncodedAddress = encodeURI(buildingData.address);
	const apiCallUrl = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team052/" + URIEncodedAddress;
	const response = await fetch(apiCallUrl);
	const data = await response.json();

	if (data.error) {
		throw new InsightError("Failed to fetch geo data for: " + buildingData.address);
	}

	const roomsData = getRoomsData(buildingData.page);

	const roomsJson = [];
	for (const room of roomsData) {
		const roomObj = new Room(
			buildingData.fullName,
			buildingData.codeName,
			room.number,
			buildingData.codeName + "_" + room.number,
			buildingData.address,
			data.lat,
			data.lon,
			room.seats,
			room.type,
			room.furniture,
			room.href
		);
		roomsJson.push(roomObj);
	}
	return roomsJson;
}
