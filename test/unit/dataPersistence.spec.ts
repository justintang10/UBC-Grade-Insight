import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { getContentFromArchives } from "../TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import { InsightDatasetKind, InsightError, NotFoundError } from "../../src/controller/IInsightFacade";

use(chaiAsPromised);

describe("addDatasetUtils", function () {
	let smallDataset: string;
	let insightFacade: InsightFacade;

	before(async function () {
		smallDataset = await getContentFromArchives("smallDataset.zip");
		insightFacade = new InsightFacade();
	});

	describe("AddDataset data persistence", function () {
		it("should write a data file", async function () {
			try {
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.removeDataset("dataset1");
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should load a dataset file", async function () {
			try {
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				const numSections = 103;
				const dataset = await insightFacade.loadDatasetFromFile("dataset1");
				await insightFacade.removeDataset("dataset1");
				expect(dataset.getSections()).to.have.length(numSections);
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should delete a dataset file", async function () {
			try {
				//delete datasets first
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.addDataset("dataset2", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.removeDataset("dataset1");
				await insightFacade.removeDataset("dataset2");
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should list", async function () {
			try {
				const two = 2;
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.addDataset("dataset2", smallDataset, InsightDatasetKind.Sections);
				const listedDatasets = await insightFacade.listDatasets();
				expect(listedDatasets).to.have.length(two);
				await insightFacade.removeDataset("dataset1");
				await insightFacade.removeDataset("dataset2");
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should be able to access datasets from old instances, as long as they were not deleted", async function () {
			try {
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.addDataset("dataset2", smallDataset, InsightDatasetKind.Sections);
				await insightFacade.removeDataset("dataset2");

				const insightFacade2 = new InsightFacade();

				const listedDatasets = await insightFacade2.listDatasets();
				expect(listedDatasets).to.have.length(1);

				await insightFacade.removeDataset("dataset1");
				try {
					await insightFacade.removeDataset("dataset2");
					expect.fail("should have thrown.");
				} catch (error) {
					expect(error).to.be.instanceOf(NotFoundError);
				}
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should fail to add a dataset to a new instance, if the dataset exists on disk but is not loaded", async function () {
			try {
				await insightFacade.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);

				const insightFacade2 = new InsightFacade();

				await insightFacade2.addDataset("dataset1", smallDataset, InsightDatasetKind.Sections);
				expect.fail("should have thrown");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
		});
	});
});
