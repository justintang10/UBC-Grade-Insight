import { InsightError, InsightResult } from "../controller/IInsightFacade";

export function isLComparator(queryKey: string): boolean {
	const lComparators = ["AND", "OR"];

	return lComparators.includes(queryKey);
}

export function isMComparator(queryKey: string): boolean {
	const lComparators = ["GT", "LT", "EQ"];

	return lComparators.includes(queryKey);
}

export function isMField(field: string, isSections: boolean): boolean {
	let mFields;
	if (isSections) {
		mFields = ["avg", "pass", "fail", "audit", "year"];
	} else {
		mFields = ["lat", "lon", "seats"];
	}

	return mFields.includes(field);
}

export function isSField(field: string, isSections: boolean): boolean {
	let sFields;
	if (isSections) {
		sFields = ["dept", "id", "instructor", "title", "uuid"];
	} else {
		sFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	}

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

export function getDatasetId(queryOptions: any, queryTransformations: any): string {
	let datasetId = "";
	try {
		const listColumns = queryOptions.COLUMNS;
		for (const column of listColumns) {
			const columnSplit = column.split("_");
			if (columnSplit.length > 1) {
				datasetId = columnSplit[0];
			}
		}
	} catch {
		throw new InsightError("Invalid Query: COLUMNS not found");
	}

	if (datasetId === "") {
		try {
			const group = queryTransformations.GROUP;
			for (const column of group) {
				const columnSplit = column.split("_");
				if (columnSplit.length > 1) {
					datasetId = columnSplit[0];
				}
			}
		} catch {
			throw new InsightError("Invalid Query: Dataset ID could not be found!");
		}
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

export function getAndCheckColumnName(
	datasetColumnPair: string,
	comparisonType: QueryComparison,
	isSections: boolean
): string {
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
		if (!isSField(columnName, isSections)) {
			throw new InsightError("Invalid Query: SCOMPARISON performed with an non-SFIELD: " + columnName);
		}
	} else if (comparisonType === QueryComparison.MCOMPARISON) {
		if (!isMField(columnName, isSections)) {
			throw new InsightError("Invalid Query: MCOMPARISON performed with an non-MFIELD: " + columnName);
		}
	} else if (comparisonType === QueryComparison.EITHER) {
		if (!isMField(columnName, isSections) && !isSField(columnName, isSections)) {
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

export function translateToInsightResult(
	columns: any,
	sections: any,
	datasetId: string,
	isSections: boolean
): InsightResult[] {
	// initialize empty array
	const result: InsightResult[] = [];

	for (const section of sections) {
		const insightResult: InsightResult = {};
		for (const datasetColumnPair of columns) {
			getAndCheckDatasetId(datasetColumnPair, datasetId);
			const columnName = getAndCheckColumnName(datasetColumnPair, QueryComparison.EITHER, isSections);

			if (isMField(columnName, isSections)) {
				insightResult[datasetColumnPair] = section.getMField(columnName);
			} else if (isSField(columnName, isSections)) {
				insightResult[datasetColumnPair] = section.getSField(columnName);
			}
		}

		result.push(insightResult);
	}

	return result;
}

// mapKey looks something like "sections_avg:90~Number`sections_title:CPSC310~String`"
export function parseMapKeyToObj(mapKey: string): InsightResult {
	const result: InsightResult = {};
	while (mapKey.length > 0) {
		const endOfColumn = mapKey.indexOf("`");
		const endKeyValuePair = mapKey.indexOf("~");
		const keyValuePair = mapKey.substring(0, endKeyValuePair);
		const colonIndex = keyValuePair.indexOf(":");
		const key = keyValuePair.substring(0, colonIndex);
		let value = keyValuePair.substring(colonIndex + 1, keyValuePair.length) as string | number;
		const type = mapKey.substring(endKeyValuePair + 1, endOfColumn);
		if (type === "Number") {
			value = Number(value);
		}
		result[key] = value;
		mapKey = mapKey.substring(endOfColumn + 1, mapKey.length);
	}
	return result;
}

/* aggregation looks like this
	{
		"overallAvg": {
		  "AVG": "sections_avg"
		}
	}
*/

export function translateTransformedToInsightResult(columns: any, sections: any): InsightResult[] {
	const result: InsightResult[] = [];

	for (const section of sections) {
		const insightResult: InsightResult = {};

		for (const datasetColumnPair of columns) {
			insightResult[datasetColumnPair] = section[datasetColumnPair];
		}

		result.push(insightResult);
	}

	return result;
}
