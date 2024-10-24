import { Room } from "../models/room";

//TODO: parse the rooms dataset to JSON
/*
 * TODO: rooms dataset validation and addition
 *  	- must have kind .room
 * 	- files are .htm
 * 	- id same specs
 * 	- at least 1 valid room
 * 	- needs index.htm file
 * 	- index.htm MUST have a building table
 * 	- each room has all required fields (...)
 * 	- each room's geolocation query must succeed
 *
 * */

//TODO: this function, see zipUtilsSection for inspo
export async function Base64ZipToJsonRooms(b64string: string): Promise<any> {
	//this promise is meaningless and only meant to prevent lint errors
	return new Promise((resolve, reject) => {
		if (!b64string) {
			reject(new Error("B64string is required"));
		}
		resolve("hello");
	});
}

//TODO: this function tooo
export function jsonToRooms(jsonData: any): Room[] {
	const rooms: Room[] = [];
	//meaningless line to stop error
	jsonData.trimEnd();

	return rooms;
}
