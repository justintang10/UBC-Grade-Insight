import { InsightDataset, InsightDatasetKind } from "../controller/IInsightFacade";
import { Room } from "./room";

export class RoomsDataset implements InsightDataset {
	private readonly rooms: Room[];
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;

	constructor(rooms: Room[], id: string, kind: InsightDatasetKind, numRows: number) {
		this.rooms = rooms;
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
	}

	public getRooms(): Room[] {
		return this.rooms;
	}
}
