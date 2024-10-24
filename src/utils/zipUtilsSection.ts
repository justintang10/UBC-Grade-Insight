import JSZip from "jszip";
import { Section } from "../models/section";
import { InsightError } from "../controller/IInsightFacade";

export async function Base64ZipToJsonSections(b64string: string): Promise<any> {
	const zip = new JSZip();
	const zipData = await zip.loadAsync(b64string, { base64: true });

	// Filter valid file names
	const fileNames = Object.keys(zipData.files);
	const validFileNames = [];
	for (const fileName of fileNames) {
		if (courseFileNameInCorrectFormat(fileName)) {
			validFileNames.push(fileName);
		}
	}

	// For each valid file name, map to the respective jsonData of that file
	const courseDataPromises: Promise<any>[] = validFileNames.map(async (fileName) => {
		const file = zipData.file(fileName);

		if (file) {
			const fileContent = await file.async("string");
			return JSON.parse(fileContent);
		}
		return {};
	});

	// Check if dataset is invalid
	if (courseDataPromises.length === 0) {
		throw new InsightError("dataset empty or invalid, was unable to parse course sections from given files");
	}

	// Await promises
	return await Promise.all(courseDataPromises);
}

/*
 * Verifies that the course file name is in the format "courses/ABDC123"
 * - filters out .DS_Store file, automatically added on Mac
 *
 * */
function courseFileNameInCorrectFormat(fileName: string): boolean {
	return fileName.startsWith("courses/") && !fileName.endsWith(".DS_Store") && !(fileName === "courses/");
}

/*
 * The JSON data parsed by the above Base64ZipToJSON function has the following form:
 *
 * {
 * 	[
 * 		"CPSC111": {
 * 			"result": [... array of sections]
 * 		},
 * 		"next course":{...}
 * 	]
 * }
 *
 * this function assumes this format
 * */
export function jsonToSections(jsonData: any): Section[] {
	const requiredFields = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
	const sections: Section[] = [];

	for (const course of jsonData) {
		for (const section of course.result) {
			//verify that the section has all required fields - skip if not
			const sectionIsValid = requiredFields.every((field) => field in section);

			if (!sectionIsValid) {
				continue;
			}

			const overallYear = 1900;
			let trueYear = Number(section.Year);
			if (section.Section === "overall") {
				trueYear = overallYear;
			}

			const sectionObj = new Section(
				section.id.toString(),
				section.Course,
				section.Title,
				section.Professor,
				section.Subject,
				trueYear,
				section.Avg,
				section.Pass,
				section.Fail,
				section.Audit
			);

			sections.push(sectionObj);
		}
	}

	if (sections.length === 0) {
		throw new InsightError("No valid course sections in dataset");
	}

	return sections;
}
