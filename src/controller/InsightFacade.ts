import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult } from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
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

	// Returns array of section information which match the given query
	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// Parse query into a dictionary or jsonObject or something
		const queryDict = {
			// TODO: replace example dictionary
			WHERE: 0,
			OPTIONS: 0,
		};

		// If queryDict missing WHERE or OPTIONS: throw InsightError
		// Also need to check query keys to make sure the query only references 1 dataset - still unsure about this
		// const firstDatasetId = this.checkDatasetId(query);

		// Pass 1st argument of dictionary["WHERE"] into handleWhere
		// handleWhere will then return all the valid sections from the query
		const validSections = await this.handleWhere(queryDict.WHERE, []);

		// Pass 1st argument of dictionary["OPTIONS"] into handleOptions, as well as validSections
		// handleOptions will return the array of columns and values for each section
		const result = await this.handleOptions(queryDict.OPTIONS, validSections);

		// If result.length is > 5000, throw ResultTooLargeError

		return result;
	}

	private async checkDatasetId(query: unknown): Promise<InsightResult[]> {
		// traverse down options->columns->columns[0] to check which dataset is being used???? super scuffed
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleWhere(queryParameters: unknown, sections: unknown): Promise<InsightResult[]> {
		let result;

		// Match queryParameters[0] to comparator type (logic comparison, mcomparison, etc.)
		switch (queryParameters) {
			case "lcomparison":
				result = this.handleLComparison(queryParameters, sections);
				break;
			case "mcomparison":
				result = this.handleMComparison(queryParameters, sections);
				break;
			case "scomparison":
				result = this.handleSComparison(queryParameters, sections);
				break;
			case "negation":
				result = this.handleNegation(queryParameters, sections);
				break;
		}
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleLComparison(queryParameters: unknown, sections: unknown): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleMComparison(queryParameters: unknown, sections: unknown): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleSComparison(queryParameters: unknown, sections: unknown): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes queryParameters (values which correspond to the WHERE key in the given query json)
	// Returns sections that match the given query parameters
	private async handleNegation(queryParameters: unknown, sections: unknown): Promise<InsightResult[]> {
		// TODO
		return [];
	}

	// Takes array of sections
	// Returns array of InsightResult
	private async handleOptions(queryOptions: unknown, sections: unknown): Promise<InsightResult[]> {
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
