import { InsightDataset, InsightDatasetKind } from "../controller/IInsightFacade";
import { Section } from "./section";

export class SectionsDataset implements InsightDataset {
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

	public getSections(): Section[] {
		return this.sections;
	}
}
