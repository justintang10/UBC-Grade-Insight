import { InsightDataset, InsightDatasetKind } from "../controller/IInsightFacade";
import { Section } from "./section";

export class Dataset implements InsightDataset {
	private readonly sections: Section[];
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;

	constructor(sections: Section[], id: string, kind: InsightDatasetKind, numRows: number) {
		this.sections = sections;
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
	}

	public getDataset(): Section[] {
		return this.sections;
	}
}
