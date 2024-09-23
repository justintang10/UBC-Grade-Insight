import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";

export class Dataset implements InsightDataset {

	private readonly sections: Dataset[];
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;

	constructor(sections: Dataset[], id: string, kind: InsightDatasetKind, numRows: number) {
		this.sections = sections;
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
	}

	public getDataset(): Dataset[] {
		return this.sections;
	}
}
