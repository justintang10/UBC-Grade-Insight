
export class Dataset {
	private readonly sections: Dataset[];

	constructor(sections: Dataset[]) {
		this.sections = sections;
	}

	public getDataset(): Dataset[] {
		return this.sections;
	}
}
