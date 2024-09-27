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
	const column = getAndCheckColumnName(order, QueryComparison.EITHER);

	if (isMField(column)) {
		// order by
		sections.sort(function (a: any, b: any) {
			const aNum = a[order];
			const bNum = b[order];
			if (aNum < bNum) {
				return -1;
			}
			if (aNum > bNum) {
				return 1;
			}
			if (aNum === bNum) {
				return 0;
			}
		});
	} else if (isSField(column)) {
		// order by alphabetical
		sections.sort(function (a: any, b: any) {
			return a[order].localeCompare(b[order]);
		});
	}

	return sections;
}

export enum QueryComparison {
	MCOMPARISON,
	SCOMPARISON,
	EITHER,
}
