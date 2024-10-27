import {InsightError, InsightResult} from "../controller/IInsightFacade";
import {
	doesInputStringMatch,
	getAndCheckColumnName,
	getAndCheckDatasetId, handleAvg, handleCount, handleMax, handleMin, handleSum,
	isLComparator,
	isMComparator,
	isMField,
	isSField, parseMapKeyToObj,
	QueryComparison,
	sortByMultipleColumns,
	sortByOrder, translateToInsightResult,
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
	let result: InsightResult[] = [];
	for (const innerQueryParam of queryParams) {
		const recursiveResult = handleWhere(innerQueryParam, sections, datasetId);

		// Combine and remove duplicates (WARNING: may be screwy if object references don't match)
		result = [...new Set([...result, ...recursiveResult])];
	}
	return result;
}

/* Takes queryKey ("GT" or "LT" or "EQ") and queryParams (a {mkey: number})
eg.

{
	"sections_avg": 90
}

// Returns sections that match the given query parameters
*/
export function handleMComparison(
	queryKey: string,
	queryParams: any,
	sections: any,
	datasetId: string
): InsightResult[] {
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

		if (!["GT", "LT", "EQ"].includes(queryKey)) {
			throw new InsightError("Invalid Query: invalid query key: " + queryKey);
		} else if (
			(queryKey === "GT" && value > comparisonValue) ||
			(queryKey === "LT" && value < comparisonValue) ||
			(queryKey === "EQ" && value === comparisonValue)
		) {
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
export function handleOptions(options: any, sections: any, datasetId: string, isTransformed: boolean): InsightResult[] {
	// If COLUMNS does not exist, throw InsightError
	// If COLUMNS is empty, throw InsightError
	// above is done in getDatasetId()
	let columns: any;
	let order: any = null;
	for (const queryKey in options) {
		if (queryKey === "COLUMNS") {
			columns = options[queryKey];
		} else if (queryKey === "ORDER") {
			order = options[queryKey];
		} else {
			throw new InsightError("Invalid Query: invalid key in options");
		}
	}

	let result = sections;

	if (!isTransformed) {
		result = translateToInsightResult(columns, sections, datasetId);
	}

	// sort by order
	if (order !== null) {
		result = handleOrder(order, columns, result);
	}

	return result;
}


/* order is
  {
      "dir": "DOWN",
        "keys": [
          "sections_dept",
          "sections_avg"
        ]
    }
    OR
    "sections_dept"
 */
export function handleOrder(order: any, columns: any, sections: any): InsightResult[] {
	let result = sections;

	if (typeof(order) === "string") { // Same as C1
		if (!columns.includes(order)) {
			throw new InsightError("Invalid Query: ORDER must be a column in COLUMNS");
		}
		result = sortByOrder(result, order);
	} else if (typeof(order) === "object") { // C2
		result = handleOrderObject(order, columns, sections);
	} else {
		throw new InsightError("Invalid Query: ORDER is not a string or object");
	}
	return result;
}

/* order is
	{
      	"dir": "DOWN",
		"keys": [
		  "sections_dept",
		  "sections_avg"
		]
    }
*/

export function handleOrderObject(order: any, columns: any, sections: any): InsightResult[] {
	let result = sections;
	// Error handling
	let direction = ""
	let keys: any;
	try {
		direction = order.dir;
		keys = order.keys;
	} catch {
		throw new InsightError("Invalid Query: missing ORDER keys or ORDER dir");
	}
	if (direction !== "UP" && direction !== "DOWN") {
		throw new InsightError("Invalid Query: dir is not UP or DOWN");
	}
	if (Object.prototype.toString.call(keys) !== "[object Array]") {
		throw new InsightError("Invalid Query: invalid type of ORDER keys");
	}
	if (keys.length === 0) {
		throw new InsightError("Invalid Query: ORDER keys is empty")
	}

	for (const key of keys) {
		if (!columns.includes(key)) {
			throw new InsightError("Invalid Query: ORDER keys must be a column in COLUMNS");
		}
	}
	// This is the sorting function
	result = sortByMultipleColumns(result, direction, keys);

	return result;
}

/*	transformations is
	{
		"GROUP": [
		  "sections_title"
		],
		"APPLY": [
		  {
			"overallAvg": {
			  "AVG": "sections_avg"
			}
		  }
		]
	}
 */
export function handleTransformations(transformations: any, columns: any, sections: any): InsightResult[] {

	let group: any;
	let apply: any;
	try {
		group = transformations.GROUP;
		apply = transformations.APPLY;
	} catch {
		throw new InsightError("Invalid Query: missing GROUP or APPLY in TRANSFORMATIONS");
	}
	if (group.length === 0) {
		throw new InsightError("Invalid Query: GROUP must have at least 1 key");
	}

	const applyKeys = apply.map((obj: {}) => Object.keys(obj)[0]);
	for (const column of columns) {
		if (column.includes("_") && !group.includes(column)) {
			throw new InsightError("Invalid Query: Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
		} else if (!column.includes("_") && !applyKeys.includes(column)) {
			throw new InsightError("Invalid Query: Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
		}
	}

	return handleAggregation(group, apply, sections);
}

export function handleAggregation(group: any, apply: any, sections: any): InsightResult[] {

	const map = handleGroup(group, sections);

	const result: InsightResult[] = [];
	for (const [key, value] of map) { // key is "sections_avg:90,sections_title:310", value is array of sections that match the key
		const insightResult: InsightResult = parseMapKeyToObj(key);

		for (const aggregation of apply) {
			insightResult[Object.keys(aggregation)[0]] = handleAggregationCalculation(aggregation, value);
		}

		result.push(insightResult);
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
export function handleAggregationCalculation(aggregation: any, sections: any): number {
	const aggregationInside = Object.values(aggregation)[0] as any;
	const aggregationType = Object.keys(aggregationInside)[0];
	const columnFieldPair = Object.values(aggregationInside)[0] as string;

	if (aggregationType === "COUNT") { // Count can be used on SFields, others cannot
		return handleCount(sections);
	}

	const columnName = getAndCheckColumnName(columnFieldPair, QueryComparison.EITHER);
	let result = 0;
	if (isSField(columnName)) {
		throw new InsightError("Invalid Query: Cannot aggregate on SField: " + columnName);
	}

	if (aggregationType === "MAX") {
		result = handleMax(columnName, sections);
	} else if (aggregationType === "MIN") {
		result = handleMin(columnName, sections);
	} else if (aggregationType === "AVG") {
		result = handleAvg(columnName, sections);
	} else if (aggregationType === "SUM") {
		result = handleSum(columnName, sections);
	} else {
		throw new InsightError("Invalid Query: invalid transformation operator: " + aggregationType);
	}

	return result;
}

export function handleGroup(group: any, sections: any): Map<string, any> {
	const map = new Map<string, any>();
	for (const section of sections) {
		let key = "";

		for (const column of group) { // creates a key of the given group_by columns, which will be used as a key in a map
			const columnName = getAndCheckColumnName(column, QueryComparison.EITHER);
			if (isMField(columnName)) {
				const field = section.getMField(columnName);
				key = key + column + ":" + field + "~";
			} else if (isSField(columnName)) {
				const field = section.getSField(columnName);
				key = key + column + ":" + field + "~";
			} else {
				throw new InsightError("Invalid Query: invalid key in GROUP");
			}
		}

		if (map.has(key)) {
			const array = map.get(key);
			array.push(section);
		} else {
			map.set(key, [section]);
		}
	}
	return map;
}

