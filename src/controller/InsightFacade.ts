import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { Base64ZipToJSON, jsonToSections } from "../utils/zipUtils";
import { Section } from "../models/section";
import { Dataset } from "../models/dataset";
import { jsonToDataset } from "../utils/persistenceUtils";

const fs = require("fs-extra");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: InsightDataset[] = [];

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

		if (!this.datasets.map((dataset) => dataset.id).includes(id)) {
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

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
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
