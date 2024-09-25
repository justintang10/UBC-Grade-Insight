import { Section } from "../models/section";
import { Dataset } from "../models/dataset";

export function jsonToDataset(jsonData: any): Dataset {
	const sections: Section[] = [];
	const id = jsonData.id;
	const kind = jsonData.kind;
	const numRows = jsonData.numRows;

	for (const section of jsonData.sections) {
		const sectionObj = new Section(
			section.id,
			section.Course,
			section.Title,
			section.Professor,
			section.Subject,
			section.Year,
			section.Avg,
			section.Pass,
			section.Fail,
			section.Audit
		);

		sections.push(sectionObj);
	}

	return new Dataset(sections, id, kind, numRows);
}
