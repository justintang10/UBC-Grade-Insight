// import { expect, use } from "chai";
// import chaiAsPromised from "chai-as-promised";
// import { getContentFromArchives } from "../TestUtil";
// import { Base64ZipToJSON, jsonToSections } from "../../src/utils/zipUtils";
//
// use(chaiAsPromised);
//
// describe("addDatasetUtils", function () {
// 	let smallDataset: string;
// 	let singleCourseDataset: string;
// 	let singleSectionDataset: string;
// 	let image: string;
//
// 	const smallDatasetNumSections = 103;
// 	const singleCourseDatasetNumSections = 22;
//
// 	before(async function () {
// 		smallDataset = await getContentFromArchives("smallDataset.zip");
// 		singleCourseDataset = await getContentFromArchives("singleCourseDataset.zip");
// 		singleSectionDataset = await getContentFromArchives("singleCourseSingleSection.zip");
// 		image = await getContentFromArchives("image.zip");
// 	});
//
// 	describe("DecodeBase64ToBinary", function () {
// 		it("should decode a base64-encoded zipfile to a blob", async function () {
// 			try {
// 				await Base64ZipToJSON(smallDataset);
// 			} catch (error) {
// 				expect.fail("should not have thrown: " + error);
// 			}
// 		});
//
// 		it("should fail to decode an image to sections", async function () {
// 			try {
// 				const result = await Base64ZipToJSON(image);
// 				expect.fail("should have thrown an error: " + result);
// 			} catch (error) {
// 				expect(error).to.be.instanceOf(Error);
// 			}
// 		});
// 	});
//
// 	describe("jsonToSections", function () {
// 		it("should parse a zipped dataset into an array of sections", async function () {
// 			try {
// 				const json = await Base64ZipToJSON(smallDataset);
// 				const sections = jsonToSections(json);
// 				expect(sections).to.have.length(smallDatasetNumSections);
// 			} catch (error) {
// 				expect.fail("should not have failed: " + error);
// 			}
// 		});
//
// 		it("should parse a single course zipped dataset into an array of sections", async function () {
// 			try {
// 				const json = await Base64ZipToJSON(singleCourseDataset);
// 				const sections = jsonToSections(json);
// 				expect(sections).to.have.length(singleCourseDatasetNumSections);
// 			} catch (error) {
// 				expect.fail("should not have failed: " + error);
// 			}
// 		});
//
// 		it("should parse a single section zipped dataset into an array of sections", async function () {
// 			try {
// 				const json = await Base64ZipToJSON(singleSectionDataset);
// 				const sections = jsonToSections(json);
// 				expect(sections).to.have.length(1);
// 			} catch (error) {
// 				expect.fail("should not have failed: " + error);
// 			}
// 		});
// 	});
// });
