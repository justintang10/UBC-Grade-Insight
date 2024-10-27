import { InsightError, InsightResult } from "../controller/IInsightFacade";

export function isLComparator(queryKey: string): boolean {
	const lComparators = ["AND", "OR"];

	return lComparators.includes(queryKey);
}

export function isMComparator(queryKey: string): boolean {
	const lComparators = ["GT", "LT", "EQ"];

	return lComparators.includes(queryKey);
}

export function isMField(field: string): boolean {
	const mFields = ["avg", "pass", "fail", "audit", "year"];

	return mFields.includes(field);
}

export function isSField(field: string): boolean {
	const sFields = ["dept", "id", "instructor", "title", "uuid"];

	return sFields.includes(field);
}

// Returns true if value matches given input string, false otherwise
// Throws Insight Error if given inputstring contains asterisks in places other than the beginning and end
export function doesInputStringMatch(inputString: string, value: string): boolean {
	const firstLetter = inputString.charAt(0);
	const lastLetter = inputString.charAt(inputString.length - 1);

	if (inputString === "**" || inputString === "*") {
		return true;
	}

	if (firstLetter === "*" && lastLetter === "*") {
		if (inputString.substring(1, inputString.length - 1).includes("*")) {
			throw new InsightError("Invalid Query: input string includes asterisk(s) that are not at the beginning or end");
		}

		return value.includes(inputString.substring(1, inputString.length - 1));
	} else if (firstLetter === "*") {
		if (inputString.substring(1, inputString.length).includes("*")) {
			throw new InsightError("Invalid Query: input string includes asterisk(s) that are not at the beginning or end");
		}

		return value.endsWith(inputString.substring(1, inputString.length));
	} else if (lastLetter === "*") {
		if (inputString.substring(0, inputString.length - 1).includes("*")) {
			throw new InsightError("Invalid Query: input string includes asterisk(s) that are not at the beginning or end");
		}

		return value.startsWith(inputString.substring(0, inputString.length - 1));
	}

	if (inputString.includes("*")) {
		throw new InsightError("Invalid Query: input string includes asterisk(s) that are not at the beginning or end");
	}

	return inputString === value;
}

export function getDatasetId(queryOptions: any): string {
	let hasColumns = false;
	let columns: any;
	for (const queryKey in queryOptions) {
		if (queryKey === "COLUMNS") {
			hasColumns = true;
			columns = queryOptions[queryKey];
		}
	}
	if (!hasColumns) {
		throw new InsightError("Invalid Query: Missing COLUMNS");
	}
	if (columns.length <= 0) {
		throw new InsightError("Invalid Query: Columns cannot be an empty array");
	}

	// traverse down options->columns->columns[0] to check which dataset is being used???? super scuffed
	const columnName: string = queryOptions.COLUMNS[0];
	let datasetId = "";
	for (let i = 0; i < columnName.length; i++) {
		if (columnName.charAt(i) === "_") {
			datasetId = columnName.substring(0, i);
		}
	}
	if (datasetId === "") {
		throw new InsightError("Invalid Query: Dataset ID cannot be empty");
	}

	return datasetId;
}

export function getAndCheckDatasetId(datasetColumnPair: string, previousDatasetId: string): string {
	let thisDatasetId = "";
	let underscoreFound = false;
	for (let i = 0; i < datasetColumnPair.length; i++) {
		if (datasetColumnPair.charAt(i) === "_") {
			if (underscoreFound) {
				throw new InsightError("Invalid Query: dataset key contains multiple underscores");
			}

			thisDatasetId = datasetColumnPair.substring(0, i);
			underscoreFound = true;
		}
	}

	if (thisDatasetId === "") {
		throw new InsightError("Invalid Query: Dataset ID cannot be empty");
	}

	if (thisDatasetId !== previousDatasetId) {
		throw new InsightError(
			"Invalid Query: multiple datasets referenced: '" + thisDatasetId + "' and '" + previousDatasetId + "'."
		);
	}

	return thisDatasetId;
}

export function getAndCheckColumnName(datasetColumnPair: string, comparisonType: QueryComparison): string {
	let columnName = "";
	let underscoreFound = false;
	for (let i = 0; i < datasetColumnPair.length; i++) {
		if (datasetColumnPair.charAt(i) === "_") {
			if (underscoreFound) {
				throw new InsightError("Invalid Query: dataset key contains multiple underscores");
			}

			columnName = datasetColumnPair.substring(i + 1, datasetColumnPair.length);
			underscoreFound = true;
		}
	}

	if (comparisonType === QueryComparison.SCOMPARISON) {
		if (!isSField(columnName)) {
			throw new InsightError("Invalid Query: SCOMPARISON performed with an non-SFIELD: " + columnName);
		}
	} else if (comparisonType === QueryComparison.MCOMPARISON) {
		if (!isMField(columnName)) {
			throw new InsightError("Invalid Query: MCOMPARISON performed with an non-MFIELD: " + columnName);
		}
	} else if (comparisonType === QueryComparison.EITHER) {
		if (!isMField(columnName) && !isSField(columnName)) {
			throw new InsightError("Invalid Query: " + columnName + " is not a valid column field!");
		}
	}

	return columnName;
}

export function sortByOrder(sections: any, order: string): InsightResult[] {

	sections.sort(function (a: any, b: any) {
		const aValue = a[order];
		const bValue = b[order];
		if (aValue < bValue) {
			return -1;
		}
		if (aValue > bValue) {
			return 1;
		}
		if (aValue === bValue) {
			return 0;
		}
	});

	return sections;
}

export function sortByMultipleColumns(sections: any, direction: string, keys: any): InsightResult[] {

	sections.sort(function (a: any, b: any) {
		let value = compareParameters(a, b, 0, keys);
		if (direction === "DOWN") {
			value *= -1;
		}
		return value;
	});

	return sections;
}

// a is a section
// b is a section
// i is index of current key
// keys is an array of column names
function compareParameters(a: any, b: any, i: number, keys: any): number {
	// Out of keys to compare, will not sort
	if (i >= keys.length) {
		return 0;
	}

	let ret;
	const keyColumnPair = keys[i];
	if (a[keyColumnPair] > b[keyColumnPair]) {
		ret = 1;
	} else if (a[keyColumnPair] < b[keyColumnPair]) {
		ret = -1;
	} else {
		ret = compareParameters(a, b, i + 1, keys); // if a[keyColumnPair] === b[keyColumnPair], compare by the next key
	}

	return ret;
}

export enum QueryComparison {
	MCOMPARISON,
	SCOMPARISON,
	EITHER,
}

export function translateToInsightResult(columns: any, sections: any, datasetId: string): InsightResult[] {
	// initialize empty array
	const result: InsightResult[] = [];

	for (const section of sections) {
		const insightResult: InsightResult = {};
		for (const datasetColumnPair of columns) {
			getAndCheckDatasetId(datasetColumnPair, datasetId);
			const columnName = getAndCheckColumnName(datasetColumnPair, QueryComparison.EITHER);

			if (isMField(columnName)) {
				insightResult[datasetColumnPair] = section.getMField(columnName);
			} else if (isSField(columnName)) {
				insightResult[datasetColumnPair] = section.getSField(columnName);
			}
		}

		result.push(insightResult);
	}

	return result;
}

export function handleMax(columnName: any, sections: any): number {
	let max = Number.MIN_SAFE_INTEGER;
	for (const section of sections) {
		const value = section.getMField(columnName);
		if (value > max) {
			max = value;
		}
	}
	return max;
}

export function handleMin(columnName: any, sections: any): number {
	let min = Number.MAX_SAFE_INTEGER;
	for (const section of sections) {
		const value = section.getMField(columnName);
		if (value < min) {
			min = value;
		}
	}
	return min;
}

export function handleAvg(columnName: any, sections: any): number {
	let sum = 0;
	if (sections[0].getSField("title") === "adv soil s") {
		console.log("Hi");
	}
	for (const section of sections) {
		const value = section.getMField(columnName);
		sum += value;
	}
	const decimalCount = 2;
	sum = Number(sum.toFixed(decimalCount)); // deal with floating point error
	const avg = sum / sections.length;
	return Number(avg.toFixed(decimalCount));
}

export function handleSum(columnName: any, sections: any): number {
	let sum = 0;
	for (const section of sections) {
		const value = section.getMField(columnName);
		sum += value;
	}
	return sum;
}

export function handleCount(sections: any): number {
	return sections.length;
}

// key is "sections_avg:90,sections_title:310"
export function parseMapKeyToObj(mapKey: string): InsightResult {
	const result: InsightResult = {};
	while (mapKey.length > 0) {
		const nextCommaIndex = mapKey.indexOf("~");
		const keyValuePair = mapKey.substring(0, nextCommaIndex);
		const colonIndex = keyValuePair.indexOf(":");
		const key = keyValuePair.substring(0, colonIndex);
		let value = keyValuePair.substring(colonIndex + 1, keyValuePair.length) as number | string;
		if (!Number.isNaN(Number(value)) && value !== "") { // cast value to number if it is a valid number
			value = Number(value);
		}
		result[key] = value;
		mapKey = mapKey.substring(nextCommaIndex + 1, mapKey.length);
	}
	return result;
}
