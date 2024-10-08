import JSZip from "jszip";
import { Section } from "../models/section";
import { InsightError } from "../controller/IInsightFacade";

function base64ToBinary(b64string: string): Uint8Array {
	const binaryBuffer = Buffer.from(b64string, "base64");
	return new Uint8Array(binaryBuffer);
}

export async function Base64ZipToJSON(b64string: string): Promise<any> {
	const byteArray = base64ToBinary(b64string);

	const zip = new JSZip();
	const zipData = await zip.loadAsync(byteArray);

	/* the following code was partially generated by ChatGPT */
	const courseFilePromises = Object.keys(zipData.files)
		.filter((fileName) => courseFileNameInCorrectFormat(fileName))
		.map(async (fileName) => {
			const file = zipData.file(fileName);
			if (file) {
				const fileContent = await file.async("string");
				const contentAsJSON = JSON.parse(fileContent);
				return { [fileName.replace("courses/", "")]: contentAsJSON };
			}
			return {};
		});

	if (courseFilePromises.length === 0) {
		throw new InsightError("dataset empty or invalid, was unable to parse course sections from given files");
	}

	const courseData = await Promise.all(courseFilePromises);
	/* end GPT code */

	return courseData;
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
		const courseSections = course[Object.keys(course)[0]];
		for (const section of courseSections.result) {
			//assert that the required fields all exist
			requiredFields.forEach((field) => {
				if (!(field in section)) {
					throw new InsightError(`field ${field} not found in section data`);
				}
			});

			const sectionObj = new Section(
				section.id.toString(),
				section.Course,
				section.Title,
				section.Professor,
				section.Subject,
				Number(section.Year),
				section.Avg,
				section.Pass,
				section.Fail,
				section.Audit
			);

			sections.push(sectionObj);
		}
	}

	return sections;
}
