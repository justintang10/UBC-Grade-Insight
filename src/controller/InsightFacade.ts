import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { Base64ZipToJsonSections, jsonToSections } from "../utils/zipUtilsSection";
import { Section } from "../models/section";
import { SectionsDataset } from "../models/sectionsDataset";
import { jsonToRoomsDataset, jsonToSectionsDataset } from "../utils/persistenceUtils";
import "../utils/queryEngineUtils";
import { getDatasetId } from "../utils/queryEngineUtils";
import { handleOptions, handleTransformations, handleWhere } from "../utils/queryParsingEngine";
import { RoomsDataset } from "../models/roomsDataset";
import { Base64ZipToJsonRooms } from "../utils/zipUtilsRoom";
import fs from "fs-extra";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private sectionsDatasets: SectionsDataset[] = [];
	private roomsDatasets: RoomsDataset[] = [];
	private readonly MAX_QUERIES: number = 5000;

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		//validate that the id is valid and not already in our dataset array
		if (id.trim().length === 0) {
			throw new InsightError("Dataset Id cannot be only whitespace.");
		} else if (id.indexOf("_") > -1) {
			throw new InsightError("Dataset Id cannot contain underscores.");
		}

		//check dataset id against dataset .json files
		const addedDatasets = await this.listDatasets();
		if (addedDatasets.map((dataset) => dataset.id).includes(id)) {
			throw new InsightError("Dataset Id is already added, new datasets must have unique Ids.");
		}

		if (kind === InsightDatasetKind.Sections) {
			await this.addSectionsDataset(id, content);
		} else if (kind === InsightDatasetKind.Rooms) {
			await this.addRoomsDataset(id, content);
		} else {
			throw new InsightError("Incorrect value for 'kind': " + kind);
		}

		return await this.getDatasetIds();
	}

	private async addSectionsDataset(id: string, content: string): Promise<void> {
		try {
			const jsonData = await Base64ZipToJsonSections(content);
			const data: Section[] = jsonToSections(jsonData);
			const sectionsDataset = new SectionsDataset(data, id, InsightDatasetKind.Sections, data.length);

			this.sectionsDatasets.push(sectionsDataset);
			await this.saveDatasetToFile(sectionsDataset);
		} catch (error) {
			throw new InsightError("Error parsing sections dataset: " + error);
		}
	}

	private async addRoomsDataset(id: string, content: string): Promise<void> {
		try {
			const rooms = await Base64ZipToJsonRooms(content);
			const roomsDataset = new RoomsDataset(rooms, id, InsightDatasetKind.Rooms, rooms.length);

			this.roomsDatasets.push(roomsDataset);
			await this.saveDatasetToFile(roomsDataset);
		} catch (error) {
			throw new InsightError("Error parsing rooms dataset: " + error);
		}
	}

	private async getDatasetIds(): Promise<string[]> {
		const datasetInfo = await this.listDatasets();
		return datasetInfo.map((dataset) => dataset.id);
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
			this.sectionsDatasets = this.sectionsDatasets.filter((dataset) => dataset.id !== id);
			this.roomsDatasets = this.roomsDatasets.filter((dataset) => dataset.id !== id);
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
		let where = null;
		let options = null;
		let transformations = null;
		for (const key in query) {
			if (key === "WHERE") {
				where = query[key];
			} else if (key === "OPTIONS") {
				options = query[key];
			} else if (key === "TRANSFORMATIONS") {
				transformations = query[key];
			}
		}
		if (where === null || options === null) {
			throw new InsightError("Invalid Query: Missing WHERE or OPTIONS");
		}

		// Get first datasetId to retrieve sections
		const datasetId = getDatasetId(options); // ALSO CHECKS IF COLUMNS EXISTS AND IS NONEMPTY

		// Get all data (an array of either sections or rooms) from given dataset
		const allSections = await this.getDataFromDataset(datasetId);

		let isSections = true;
		if (allSections[0].constructor.name === "Room") {
			isSections = false;
		}

		// Pass query["WHERE"] into handleWhere, as well as all sections from dataset
		// handleWhere will then return all the valid sections from the query
		const validSections = handleWhere(where, allSections, datasetId, isSections);

		let transformationsInQuery = false;
		let transformedSections = validSections;
		if (transformations !== null) {
			transformedSections = handleTransformations(transformations, options.COLUMNS, validSections, isSections);
			transformationsInQuery = true;
		}

		// Pass 1st argument of dictionary["OPTIONS"] into handleOptions, as well as validSections
		// handleOptions will return the array of columns and values for each section

		const result = handleOptions(options, transformedSections, datasetId, transformationsInQuery, isSections);

		// If result.length is > 5000, throw ResultTooLargeError
		if (result.length > this.MAX_QUERIES) {
			throw new ResultTooLargeError("Result Too Large: Only queries with a maximum of 5000 results are supported");
		}

		return result;
	}

	private async getDataFromDataset(datasetId: string): Promise<any> {
		await this.loadDatasetFromFile(datasetId); // will throw error if dataset not found in disk
		// ^^ I think putting this line before the loops might break things/be expensive, since we only want to load the
		// dataset from the disk if the dataset is not found in memory? eg. if a dataset is already
		// in memory, this function will push it into sectionsDatasets/roomsDatasets either way, so we'll have
		// duplicate datasets in the array (which I don't actually think breaks anything, it's just weird?)
		// - Munn

		for (const dataset of this.sectionsDatasets) {
			if (dataset.id === datasetId) {
				return dataset.getSections();
			}
		}

		for (const dataset of this.roomsDatasets) {
			if (dataset.id === datasetId) {
				return dataset.getRooms();
			}
		}

		throw new InsightError("Dataset not found on disk or in memory uh oh");
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

	private async saveDatasetToFile(dataset: InsightDataset): Promise<void> {
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

	public async loadDatasetFromFile(id: string): Promise<InsightDataset> {
		const filePath = `./data/${id}.json`;

		try {
			const datasetFile = await fs.readJson(filePath);
			const datasetInterface = { id: datasetFile.id, kind: datasetFile.kind, numRows: datasetFile.numRows };

			if (datasetFile.kind === InsightDatasetKind.Sections) {
				const dataset = jsonToSectionsDataset(datasetFile);
				this.sectionsDatasets.push(dataset);
			} else if (datasetFile.kind === InsightDatasetKind.Rooms) {
				const dataset = jsonToRoomsDataset(datasetFile);
				this.roomsDatasets.push(dataset);
			}

			return datasetInterface;
		} catch (error) {
			throw new InsightError("Error loading dataset from disk: " + error);
		}
	}
}
