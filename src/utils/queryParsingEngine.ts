import { InsightError, InsightResult } from "../controller/IInsightFacade";
import {
	deepEqual,
	doesInputStringMatch,
	getAndCheckColumnName,
	getAndCheckDatasetId,
	isLComparator,
	isMComparator,
	isMField,
	isSField,
	QueryComparison,
	sortByOrder,
} from "./queryEngineUtils";

/* Takes queryParameters (a {'FILTER'})
	eg.

	{
		"AND": [
			{
				"GT": {
					"sections_avg": 90
				}
			},
			{
				"IS": {
					"sections_dept": "biol"
				}
			}
		]
  	}

	or

	{
		"GT": {
			"sections_avg": 90
		}
	}

	Returns sections that match the given query parameters
	*/
export function handleWhere(queryParams: any, sections: any, datasetId: string): InsightResult[] {
	let result;

	// Return all sections if parameters are empty
	if (Object.keys(queryParams).length === 0) {
		return sections;
	}

	const MAX_QUERY_KEYS = 1;
	if (queryParams.length > MAX_QUERY_KEYS) {
		throw new InsightError("Invalid Query: WHERE should only have 1 key, has 2");
	}

	// Match queryParams key to comparator type (logic comparison, mcomparison, etc.)
	const queryKey = Object.keys(queryParams)[0];
	if (isLComparator(queryKey)) {
		result = handleLComparison(queryKey, queryParams[queryKey], sections, datasetId);
	} else if (isMComparator(queryKey)) {
		result = handleMComparison(queryKey, queryParams[queryKey], sections, datasetId);
	} else if (queryKey === "IS") {
		result = handleSComparison(queryParams[queryKey], sections, datasetId);
	} else if (queryKey === "NOT") {
		result = handleNegation(queryParams[queryKey], sections, datasetId);
	} else {
		throw new InsightError("Invalid Query: Invalid query key");
	}

	return result;
}

/* Takes queryKey ("AND" or "OR") and queryParams (an array of {'FILTER': {...}})
eg.
[
	{
		"GT": {
			"sections_avg": 90
		}
	},
	{
		"IS": {
			"sections_dept": "biol"
		}
	}
]

// Returns sections that match the given query parameters
*/
export function handleLComparison(
	queryKey: string,
	queryParams: any,
	sections: any,
	datasetId: string
): InsightResult[] {
	let result: InsightResult[] = [];

	if (queryParams.length === 0) {
		throw new InsightError("Invalid Query: Logic Comparison Filter List is empty");
	}

	if (queryKey === "AND") {
		result = handleAndComparison(queryParams, sections, datasetId);
	} else if (queryKey === "OR") {
		result = handleOrComparison(queryParams, sections, datasetId);
	} else {
		throw new InsightError("Invalid Query: Invalid Logic Comparator: " + queryKey);
	}

	return result;
}

export function handleAndComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
	let result: InsightResult[] = [];
	for (const innerQueryParam of queryParams) {
		const recursiveResult = handleWhere(innerQueryParam, sections, datasetId);

		// Any sections AND [] returns []
		if (recursiveResult.length === 0) {
			return [];
		}

		if (result.length === 0) {
			// First iteration initializes result
			result = recursiveResult.slice();
		} else {
			// All other iterations compare the returned sections to the result and removes section if it is not in both
			const newResult = [];
			for (const section of result) {
				if (recursiveResult.includes(section)) {
					newResult.push(section);
				}
			}
			result = newResult;
		}
	}
	return result;
}

export function handleOrComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
	const result: InsightResult[] = [];
	for (const innerQueryParam of queryParams) {
		const recursiveResult = handleWhere(innerQueryParam, sections, datasetId);

		for (const section of recursiveResult) {
			if (!deepIncludes(result, section)) {
				result.push(section);
			}
		}
	}

	return result;
}

function deepIncludes(array: any, object: any): boolean {
	for (const element of array) {
		if (element.uuid === object.uuid) {
			return true;
		}
	}

	return false;
}

/* Takes queryKey ("GT" or "LT" or "EQ") and queryParams (a {mkey: number})
eg.

{
	"sections_avg": 90
}

// Returns sections that match the given query parameters
*/
export function handleMComparison(key: string, queryParams: any, sections: any, datasetId: string): InsightResult[] {
	if (Object.keys(queryParams).length !== 1) {
		throw new InsightError("Invalid Query: invalid number of keys in MCOMPARISON: " + Object.keys(queryParams).length);
	}

	const datasetColumnPair = Object.keys(queryParams)[0]; // eg. sections_avg
	getAndCheckDatasetId(datasetColumnPair, datasetId);
	const thisDatasetColumn = getAndCheckColumnName(datasetColumnPair, QueryComparison.MCOMPARISON);

	const comparisonValue = queryParams[datasetColumnPair];

	if (typeof comparisonValue !== "number") {
		throw new InsightError("Invalid Query: Invalid type in MCOMPARISON: " + typeof comparisonValue);
	}

	const result: InsightResult[] = [];

	for (const section of sections) {
		const value = section.getMField(thisDatasetColumn);

		if (!["GT", "LT", "EQ"].includes(key)) {
			throw new InsightError("Invalid Query: invalid query key: " + key);
		} else if (key === "GT" && value > comparisonValue) {
			result.push(section);
		} else if (key === "LT" && value < comparisonValue) {
			result.push(section);
		} else if (key === "EQ" && value === comparisonValue) {
			result.push(section);
		}
	}

	return result;
}

/* Takes queryParameters (values which correspond to the WHERE key in the given query json)
{
	"sections_dept": "*ol"
}
// Returns sections that match the given query parameters
 */
export function handleSComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
	if (Object.keys(queryParams).length === 0) {
		throw new InsightError("Invalid Query: no keys found in SCOMPARISON");
	}

	if (Object.keys(queryParams).length > 1) {
		throw new InsightError("Invalid Query: too many query keys in SCOMPARISON");
	}

	const datasetColumnPair = Object.keys(queryParams)[0]; // eg. sections_avg
	getAndCheckDatasetId(datasetColumnPair, datasetId);
	const thisDatasetColumn = getAndCheckColumnName(datasetColumnPair, QueryComparison.SCOMPARISON);

	const comparisonValue = queryParams[datasetColumnPair];

	if (typeof comparisonValue !== "string") {
		throw new InsightError("Invalid Query: Invalid type in SCOMPARISON: " + typeof comparisonValue);
	}

	const result: InsightResult[] = [];

	for (const section of sections) {
		const value = section.getSField(thisDatasetColumn);

		if (doesInputStringMatch(comparisonValue, value)) {
			result.push(section);
		}
	}

	return result;
}

// Takes queryParameters (values which correspond to the WHERE key in the given query json)
// Returns sections that match the given query parameters
export function handleNegation(queryParams: any, sections: any, datasetId: string): InsightResult[] {
	const result: InsightResult[] = [];
	const resultsToExclude: InsightResult[] = handleWhere(queryParams, sections, datasetId);

	for (const section of sections) {
		if (!resultsToExclude.includes(section)) {
			result.push(section);
		}
	}

	return result;
}

/* Takes
	"COLUMNS": [
		"sections_dept",
		"sections_avg"
	],
	"ORDER": "sections_avg"

	Returns array of InsightResult
	 */
export function handleOptions(queryOptions: any, sections: any, datasetId: string): InsightResult[] {
	// If COLUMNS does not exist, throw InsightError
	// If COLUMNS is empty, throw InsightError
	// above is done in getDatasetId()
	let columns: any;
	let order: any = null;
	for (const queryKey in queryOptions) {
		if (queryKey === "COLUMNS") {
			columns = queryOptions[queryKey];
		} else if (queryKey === "ORDER") {
			order = queryOptions[queryKey];
		} else {
			throw new InsightError("Invalid Query: invalid key in options");
		}
	}

	// initialize empty array
	let result: InsightResult[] = [];

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

	// sort by order
	if (order !== null) {
		if (!columns.includes(order)){
			throw new InsightError("Invalid Query: ORDER must be a column in COLUMNS");
		}
		result = sortByOrder(result, order);
	}

	return result;
}
