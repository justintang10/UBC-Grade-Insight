import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import { Base64ZipToJSON, jsonToSections } from "../utils/zipUtils";
import { Section } from "../models/section";
import { Dataset } from "../models/dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: InsightDataset[] = [];

	public constructor() {
		//TODO: read from json
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			const jsonData = await Base64ZipToJSON(content);
			const sectionsArray: Section[] = jsonToSections(jsonData);
			const dataset: InsightDataset = new Dataset(sectionsArray, id, kind, sectionsArray.length);
			this.datasets.push(dataset);
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
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
