import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { getContentFromArchives } from "../TestUtil";
import { Base64ZipToJSON, jsonToSections } from "../../src/utils/zipUtils";

use(chaiAsPromised);

describe("addDatasetUtils", function () {
	let smallDataset: string;
	let image: string;

	before(async function () {
		smallDataset = await getContentFromArchives("smallDataset.zip");
		image = await getContentFromArchives("image.zip");
	});

	describe("DecodeBase64ToBlob", function () {
		it("should decode a base64-encoded zipfile to a blob", async function () {
			try {
				await Base64ZipToJSON(smallDataset);
				//TODO: fix the expect here
				//expect(json).to.not.be.undefined;
			} catch (error) {
				expect.fail("should not have thrown: " + error);
			}
		});

		it("should fail to decode an image to sections", async function () {
			try {
				const result = await Base64ZipToJSON(image);
				expect.fail("should have thrown an error: " + result);
			} catch (error) {
				expect(error).to.be.instanceOf(Error);
			}
		});
	});

	describe("jsonToSections", function () {
		it("should ?????", async function () {
			const smallDatasetNumSections = 103;
			try {
				const json = await Base64ZipToJSON(smallDataset);
				const sections = jsonToSections(json);
				expect(sections).to.have.length(smallDatasetNumSections);
			} catch (error) {
				expect.fail("should not have failed: " + error);
			}
		});
	});
});
