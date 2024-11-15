import { Section } from "../models/section";
import { SectionsDataset } from "../models/sectionsDataset";
import { RoomsDataset } from "../models/roomsDataset";
import { Room } from "../models/room";

export function jsonToSectionsDataset(jsonData: any): SectionsDataset {
	const sections: Section[] = [];
	const id = jsonData.id;
	const kind = jsonData.kind;
	const numRows = jsonData.numRows;

	for (const section of jsonData.sections) {
		const sectionObj = new Section(
			section.uuid,
			section.id,
			section.title,
			section.instructor,
			section.department,
			section.year,
			section.avg,
			section.pass,
			section.fail,
			section.audit
		);

		sections.push(sectionObj);
	}

	return new SectionsDataset(sections, id, kind, numRows);
}

export function jsonToRoomsDataset(jsonData: any): RoomsDataset {
	const rooms: Room[] = [];
	const id = jsonData.id;
	const kind = jsonData.kind;
	const numRows = jsonData.numRows;

	for (const room of jsonData.rooms) {
		const roomObj = new Room(
			room.fullname,
			room.shortname,
			room.number,
			room.name,
			room.address,
			room.lat,
			room.lon,
			room.seats,
			room.type,
			room.furniture,
			room.href
		);

		rooms.push(roomObj);
	}
	return new RoomsDataset(rooms, id, kind, numRows);
}
