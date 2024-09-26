import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { Base64ZipToJSON, jsonToSections } from "../utils/zipUtils";
import { Section } from "../models/section";
import { Dataset } from "../models/dataset";
import { jsonToDataset } from "../utils/persistenceUtils";
import "../utils/queryEngineUtils";
import {
	doesInputStringMatch,
	getAndCheckColumnName,
	getAndCheckDatasetId,
	getDatasetId,
	getSectionsFromDataset,
	isLComparator,
	isMComparator,
	isMField,
	isSField,
	QueryComparison,
	sortByOrder,
} from "../utils/queryEngineUtils";

const fs = require("fs-extra");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private datasets: Dataset[] = [];
	private readonly MAX_QUERIES: number = 5000;

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		//validate that the id is valid and not already in our dataset array
		if (id.trim().length === 0) {
			throw new InsightError("Dataset Id cannot be only whitespace.");
		} else if (id.indexOf("_") > -1) {
			throw new InsightError("Dataset Id cannot contain underscores.");
		}

		if (this.datasets.map((dataset) => dataset.id).includes(id)) {
			throw new InsightError("Dataset Id is already added, new datasets must have unique Ids.");
		}

		//parse and add the section data from the encoded dataset
		try {
			const jsonData = await Base64ZipToJSON(content);
			const sectionsArray: Section[] = jsonToSections(jsonData);
			const dataset: Dataset = new Dataset(sectionsArray, id, kind, sectionsArray.length);
			this.datasets.push(dataset);

			try {
				await this.saveDatasetToFile(dataset);
			} catch (error) {
				throw new InsightError("Error saving dataset to file: " + error);
			}
		} catch (error) {
			throw new InsightError("Error: " + error);
		}
		return this.getDatasetIds();
	}

	private getDatasetIds(): string[] {
		const ids: string[] = [];
		this.datasets.forEach((dataset: InsightDataset) => {
			ids.push(dataset.id);
		});
		return ids;
	}

	public async removeDataset(id: string): Promise<string> {
		if (id.trim().length === 0) {
			throw new InsightError("Dataset Id cannot be only whitespace.");
		} else if (id.indexOf("_") > -1) {
			throw new InsightError("Dataset Id cannot contain underscores.");
		}

		const dir = "./data";
		await fs.ensureDir(dir);
		const datasetFiles = await fs.readdir(dir);
		if (!datasetFiles.map((datasetFile: string) => datasetFile.replace(".json", "")).includes(id)) {
			throw new NotFoundError(`Dataset with id ${id} not found.`);
		}

		try {
			this.datasets = this.datasets.filter((dataset) => dataset.id !== id);
			await this.deleteDatasetFile(id);
		} catch (error) {
			throw new InsightError("Error removing dataset: " + error);
		}
		return id;
	}

	// Takes JSON object representing query in EBNF
	// Returns array of section information which match the given query
	public async performQuery(query: any): Promise<InsightResult[]> {
		// Note: Super scuffed: does not check for duplicate wheres or options. But also: the reference UI does not check either?
		let hasWhere = false;
		let hasOptions = false;
		let queryWhere;
		let queryOptions;
		for (const key in query) {
			if (key === "WHERE") {
				hasWhere = true;
				queryWhere = query[key];
			} else if (key === "OPTIONS") {
				hasOptions = true;
				queryOptions = query[key];
			}
		}
		if (!hasWhere) {
			throw new InsightError("Invalid Query: Missing WHERE");
		} else if (!hasOptions) {
			throw new InsightError("Invalid Query: Missing OPTIONS");
		}

		// Get first datasetId to retrieve sections
		const datasetId = getDatasetId(queryOptions); // ALSO CHECKS IF COLUMNS EXISTS AND IS NONEMPTY

		// Get all sections from given dataset
		const allSections = getSectionsFromDataset(datasetId, this.datasets);

		// Pass query["WHERE"] into handleWhere, as well as all sections from dataset
		// handleWhere will then return all the valid sections from the query
		const validSections = this.handleWhere(queryWhere, allSections, datasetId);

		// Pass 1st argument of dictionary["OPTIONS"] into handleOptions, as well as validSections
		// handleOptions will return the array of columns and values for each section
		const result = this.handleOptions(queryOptions, validSections, datasetId);

		// If result.length is > 5000, throw ResultTooLargeError
		if (result.length > this.MAX_QUERIES) {
			throw new ResultTooLargeError("Result Too Large: Only queries with a maximum of 5000 results are supported");
		}

		return result;
	}

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
	private handleWhere(queryParams: any, sections: any, datasetId: string): InsightResult[] {
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
			result = this.handleLComparison(queryKey, queryParams[queryKey], sections, datasetId);
		} else if (isMComparator(queryKey)) {
			result = this.handleMComparison(queryKey, queryParams[queryKey], sections, datasetId);
		} else if (queryKey === "IS") {
			result = this.handleSComparison(queryParams[queryKey], sections, datasetId);
		} else if (queryKey === "NOT") {
			result = this.handleNegation(queryParams[queryKey], sections, datasetId);
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
	private handleLComparison(queryKey: string, queryParams: any, sections: any, datasetId: string): InsightResult[] {
		let result: InsightResult[] = [];

		if (queryParams.length === 0) {
			throw new InsightError("Invalid Query: Logic Comparison Filter List is empty");
		}

		if (queryKey === "AND") {
			result = this.handleAndComparison(queryParams, sections, datasetId);
		} else if (queryKey === "OR") {
			result = this.handleOrComparison(queryParams, sections, datasetId);
		} else {
			throw new InsightError("Invalid Query: Invalid Logic Comparator: " + queryKey);
		}

		return result;
	}

	private handleAndComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
		let result: InsightResult[] = [];
		for (const innerQueryParam of queryParams) {
			const recursiveResult = this.handleWhere(innerQueryParam, sections, datasetId);

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

	private handleOrComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
		let result: InsightResult[] = [];
		for (const innerQueryParam of queryParams) {
			const recursiveResult = this.handleWhere(innerQueryParam, sections, datasetId);

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
	private handleMComparison(queryKey: string, queryParams: any, sections: any, datasetId: string): InsightResult[] {
		if (Object.keys(queryParams).length === 0) {
			throw new InsightError("Invalid Query: no keys found in MCOMPARISON");
		}

		if (Object.keys(queryParams).length > 1) {
			throw new InsightError("Invalid Query: too many query keys in MCOMPARISON");
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

			if (queryKey === "GT") {
				if (value > comparisonValue) {
					result.push(section);
				}
			} else if (queryKey === "LT") {
				if (value < comparisonValue) {
					result.push(section);
				}
			} else if (queryKey === "EQ") {
				if (value === comparisonValue) {
					result.push(section);
				}
			} else {
				throw new InsightError("Invalid Query: invalid query key: " + queryKey);
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
	private handleSComparison(queryParams: any, sections: any, datasetId: string): InsightResult[] {
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
	private handleNegation(queryParams: any, sections: any, datasetId: string): InsightResult[] {
		const result: InsightResult[] = [];
		const resultsToExclude: InsightResult[] = this.handleWhere(queryParams, sections, datasetId);

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
	private handleOptions(queryOptions: any, sections: any, datasetId: string): InsightResult[] {
		// If COLUMNS does not exist, throw InsightError
		// If COLUMNS is empty, throw InsightError
		// above is done in getDatasetId()
		let columns: any;
		let order: any = null;
		for (const queryKey in queryOptions) {
			if (queryKey === "COLUMNS") {
				columns = queryOptions[queryKey];
			}
			if (queryKey === "ORDER") {
				order = queryOptions[queryKey];
			}
		}
		if (columns.length <= 0) {
			throw new InsightError("Invalid Query: Columns cannot be an empty array");
		}

		// initialize empty array
		let result: InsightResult[] = [];

		for (const section of sections) {
			const insightResult: InsightResult = {};
			for (const datasetColumnPair of columns) {
				getAndCheckDatasetId(datasetColumnPair, datasetId);
				const columnName = getAndCheckColumnName(datasetColumnPair, QueryComparison.EITHER);

				let value: any;
				if (isMField(columnName)) {
					value = section.getMField(columnName);
				} else if (isSField(columnName)) {
					value = section.getSField(columnName);
				}

				insightResult[datasetColumnPair] = value;
			}

			result.push(insightResult);
		}

		// sort by order
		if (order !== null) {
			result = sortByOrder(result, order);
		}

		return result;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const dir = "./data";
		await fs.ensureDir(dir);
		const datasetFiles = await fs.readdir(dir);
		const datasetPromises = datasetFiles.map(async (datasetFile: string) => {
			const id = datasetFile.replace(".json", "");
			return await this.loadDatasetFromFile(id);
		});

		const datasets = await Promise.all(datasetPromises);
		return datasets.map((dataset) => {
			const interfaceData: InsightDataset = { id: dataset.id, kind: dataset.kind, numRows: dataset.numRows };
			return interfaceData;
		});
	}

	private async saveDatasetToFile(dataset: Dataset): Promise<void> {
		const jsonIndentation = 2;
		const jsonDataset = JSON.stringify(dataset, null, jsonIndentation);
		const filePath = `./data/${dataset.id}.json`;
		try {
			await fs.outputFile(filePath, jsonDataset);
		} catch (error) {
			throw new InsightError("Error saving dataset to disk: " + error);
		}
	}

	private async deleteDatasetFile(id: string): Promise<void> {
		const filePath = `./data/${id}.json`;
		try {
			await fs.remove(filePath);
		} catch (error) {
			throw new InsightError("Error removing dataset file: " + error);
		}
	}

	public async loadDatasetFromFile(id: string): Promise<Dataset> {
		const filePath = `./data/${id}.json`;
		let dataset: Dataset;

		try {
			const datasetFile = await fs.readJson(filePath);
			dataset = jsonToDataset(datasetFile);
			this.datasets.push(dataset);
		} catch (error) {
			throw new InsightError("Error loading dataset from disk: " + error);
		}
		return dataset;
	}
}
