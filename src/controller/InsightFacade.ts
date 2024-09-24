import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private datasets: InsightDataset[] = [];
	private readonly MAX_QUERIES: number = 5000;

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(
			`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		);
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
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
		const datasetId = await this.checkDatasetId(queryOptions);

		// Get all sections from given dataset
		const allSections = await this.getSectionsFromDataset(datasetId);

		// Pass query["WHERE"] into handleWhere, as well as all sections from dataset
		// handleWhere will then return all the valid sections from the query
		const validSections = await this.handleWhere(queryWhere, allSections, datasetId);

		// Pass 1st argument of dictionary["OPTIONS"] into handleOptions, as well as validSections
		// handleOptions will return the array of columns and values for each section
		const result = await this.handleOptions(queryOptions, validSections, datasetId);

		// If result.length is > 5000, throw ResultTooLargeError
		if (result.length > this.MAX_QUERIES) {
			throw new ResultTooLargeError("Result Too Large: Only queries with a maximum of 5000 results are supported");
		}

		return result;
	}

	private async checkDatasetId(queryOptions: any): Promise<string> {
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

	private async getSectionsFromDataset(datasetId: String): Promise<any> {
		// get dataset sections by id

		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleWhere(queryParams: any, sections: any, datasetId: String): Promise<InsightResult[]> {
		let result;

		// Return all sections if parameters are empty
		if (queryParams.length === 0) {
			return sections;
		}

		const MAX_QUERY_KEYS = 1;
		if (queryParams.length > MAX_QUERY_KEYS) {
			throw new InsightError("Invalid Query: WHERE should only have 1 key, has 2");
		}

		// Match queryParams key to comparator type (logic comparison, mcomparison, etc.)
		const queryKey = Object.keys(queryParams)[0];
		if (queryKey === "AND" || queryKey === "OR") {
			result = this.handleLComparison(queryParams, sections, datasetId);
		} else if (queryKey === "GT" || queryKey === "LT" || queryKey === "EQ") {
			result = this.handleMComparison(queryParams, sections, datasetId);
		} else if (queryKey === "IS") {
			result = this.handleSComparison(queryParams, sections, datasetId);
		} else if (queryKey === "NOT") {
			result = this.handleNegation(queryParams, sections, datasetId);
		} else {
			throw new InsightError("Invalid Query: Invalid query key");
		}

		return result;
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleLComparison(
		queryParams: any,
		sections: any,
		datasetId: String
	): Promise<InsightResult[]> {
		// If queryParameters[0] != (AND || OR) throw InsightError
		for (const key in queryParams) {
			if (key === "AND") {

			} else if (key === "OR") {

			} else {
				throw new InsightError("Invalid Query: Invalid Logic Comparator: " + key);
			}
		}
		// else return

		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleMComparison(
		queryParameters: unknown,
		sections: unknown,
		datasetId: String
	): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleSComparison(
		queryParameters: unknown,
		sections: unknown,
		datasetId: String
	): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleNegation(
		queryParameters: unknown,
		sections: unknown,
		datasetId: String
	): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes array of sections
	// Returns array of InsightResult
	private async handleOptions(queryOptions: unknown, sections: unknown, datasetId: String): Promise<InsightResult[]> {
		// If COLUMNS does not exist, throw InsightError
		// If COLUMNS is empty, throw InsightError

		// initialize empty array

		// 	for column in columns:
		//      if column key is invalid, throw insight error
		//      column key is invalid if:
		// 			referenced dataset has not been added
		// 			referenced dataset column does not exist
		// 			references multiple datasets
		// 	    else:
		// 			turn sections into result that only contains given columns

		// sort by order

		return [];
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
