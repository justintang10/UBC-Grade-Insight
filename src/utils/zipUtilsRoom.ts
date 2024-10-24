import { Room } from "../models/room";

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
	//this promise is meaningless and only meant to prevent lint errors
	return new Promise((resolve, reject) => {
		if (!b64string) {
			reject(new Error("B64string is required"));
		}
		resolve("hello");
	});
}

//TODO: this function tooo (see zipUtilsSection again)
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
