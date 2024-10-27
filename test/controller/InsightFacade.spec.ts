import {
	IInsightFacade,
	//InsightDataset,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	//InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let singleCourseDataSet: string;
	let emptyDataset: string;
	let smallDataset: string;
	let emptyCourseDataset: string;
	let imageFile: string;
	let invalidCourseDataset: string;
	let singleCourseMissingField: string;
	let singleCourseSingleSection: string;
	let wrongDirectoryName: string;
	let goodAndBadSections: string;

	let validRoomsDataset: string;

	const smallDatasetNumRows = 103;
	const singleCourseDatasetNumRows = 22;
	const two = 2;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		singleCourseDataSet = await getContentFromArchives("singleCourseDataset.zip");
		emptyDataset = await getContentFromArchives("emptyDataset.zip");
		smallDataset = await getContentFromArchives("smallDataset.zip");

		emptyCourseDataset = await getContentFromArchives("emptyCourseDataset.zip");
		imageFile = await getContentFromArchives("image.zip");
		invalidCourseDataset = await getContentFromArchives("invalidCourseDataset.zip");
		singleCourseMissingField = await getContentFromArchives("singleCourseMissingField.zip");
		singleCourseSingleSection = await getContentFromArchives("singleCourseSingleSection.zip");
		wrongDirectoryName = await getContentFromArchives("wrongDirectoryName.zip");
		goodAndBadSections = await getContentFromArchives("goodAndBadSections.zip");

		validRoomsDataset = await getContentFromArchives("campus.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		/*
		AddDataset ID tests
		 */

		it("should reject with empty dataset id", async function () {
			return facade
				.addDataset("", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should reject with a dataset id containing only whitespace", async function () {
			return facade
				.addDataset("      ", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should reject with a dataset id containing an underscore", async function () {
			return facade
				.addDataset("dataset_id", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should reject with a dataset id containing multiple underscores", async function () {
			return facade
				.addDataset("_under_scores_id_", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should successfully add a dataset with a permitted id", async function () {
			return facade
				.addDataset("datasetid", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.have.members(["datasetid"]);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should reject with a dataset id that is the same as the id of an already added dataset", async function () {
			try {
				await facade.addDataset("validIdDuplicate", singleCourseDataSet, InsightDatasetKind.Sections);
				await facade.addDataset("validIdDuplicate", singleCourseDataSet, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			// expect.fail("Should have thrown above.");
		});

		/*
		AddDataset Content Validation Tests
		 */

		it("should reject with an empty dataset", async function () {
			return facade
				.addDataset("datasetid", emptyDataset, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should pass with a single course dataset", async function () {
			return facade
				.addDataset("datasetid", singleCourseDataSet, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.have.members(["datasetid"]);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should pass with a small dataset", async function () {
			return facade
				.addDataset("datasetid", smallDataset, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.have.members(["datasetid"]);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should fail with an invalid zip file", async function () {
			return facade
				.addDataset("datasetid", imageFile, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should fail with an invalid course file", async function () {
			return facade
				.addDataset("datasetid", invalidCourseDataset, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should fail with an empty course file", async function () {
			return facade
				.addDataset("datasetid", emptyCourseDataset, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should fail if one of the course sections is missing a needed field", async function () {
			return facade
				.addDataset("datasetid", singleCourseMissingField, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should pass for a dataset with a single section", async function () {
			return facade
				.addDataset("datasetid", singleCourseSingleSection, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.have.members(["datasetid"]);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should fail if the directory is not named courses", async function () {
			return facade
				.addDataset("datasetid", wrongDirectoryName, InsightDatasetKind.Sections)
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should actually add the dataset", async function () {
			await facade.addDataset("datasetid", singleCourseSingleSection, InsightDatasetKind.Sections);

			return facade
				.listDatasets()
				.then((result) => {
					expect(result.length).to.equal(1);
					expect(result[0].id).to.equal("datasetid");
					expect(result[0].kind).to.equal(InsightDatasetKind.Sections);
					expect(result[0].numRows).to.equal(1);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should pass for a dataset with both valid and invalid sections, and should only add the valid ones", async function () {
			try {
				const datasetIds = await facade.addDataset("datasetid", goodAndBadSections, InsightDatasetKind.Sections);
				expect(datasetIds).to.have.members(["datasetid"]);
				const listedDatasets = await facade.listDatasets();
				expect(listedDatasets.length).to.equal(1);
			} catch (err) {
				expect.fail("should not have failed: " + err);
			}
		});

		it("should be able to add the entire PAIR given dataset (big)", async function () {
			try {
				const datasetIds = await facade.addDataset("pairDataset", sections, InsightDatasetKind.Sections);
				expect(datasetIds).to.have.members(["pairDataset"]);
				const listedDatasets = await facade.listDatasets();
				expect(listedDatasets.length).to.equal(1);
			} catch (err) {
				expect.fail("should not have failed: " + err);
			}
		});

		it("should be able to add a valid rooms dataset", async function () {
			try {
				const datasetIds = await facade.addDataset("rooms", validRoomsDataset, InsightDatasetKind.Rooms);
				expect(datasetIds).to.have.members(["rooms"]);
				const listedDatasets = await facade.listDatasets();
				expect(listedDatasets.length).to.equal(1);
				const numrows = 364;
				expect(listedDatasets[0].numRows).to.equal(numrows);
			} catch (err) {
				expect.fail("should not have failed: " + err);
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(async function () {
			// This section resets the insightFacade instance
			// This runs before each test
			await clearDisk();
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		/*
		RemoveDataset ID validation
		 */

		it("should fail to remove with an empty dataset id", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			return facade
				.removeDataset("")
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should fail to remove with a dataset id containing only whitespace", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			return facade
				.removeDataset("      ")
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should fail to remove with a dataset id containing an underscore", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			return facade
				.removeDataset("test_data")
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});

		it("should reject an id string that does not match any of the added dataset ids", async function () {
			try {
				await facade.addDataset("validId", smallDataset, InsightDatasetKind.Sections);
				await facade.addDataset("anotherValidId", smallDataset, InsightDatasetKind.Sections);

				await facade.removeDataset("someOtherId");

				expect.fail("Should have thrown above.");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		/*
		RemoveDataset removal behaviour validation
		 */

		it("should successfully remove with a permitted dataset id", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			return facade
				.removeDataset("testdata")
				.then((result) => {
					expect(result).to.equal("testdata");
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should fail in the case where a dataset is removed twice sequentially", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			await facade.removeDataset("testdata");

			return facade
				.removeDataset("testdata")
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(NotFoundError);
				});
		});

		it("should fail to remove a dataset that is not there", async function () {
			return facade
				.removeDataset("testdata")
				.then((result) => {
					expect.fail("should not have succeeded: " + result);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(NotFoundError);
				});
		});
	});

	describe("ListDatasets", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should properly return details of small dataset when added", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);

			return facade
				.listDatasets()
				.then((result) => {
					expect(result.length).to.equal(1);
					expect(result[0].id).to.equal("testdata");
					expect(result[0].kind).to.equal(InsightDatasetKind.Sections);
					expect(result[0].numRows).to.equal(smallDatasetNumRows);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should properly return details of two datasets when added", async function () {
			await facade.addDataset("testdata", smallDataset, InsightDatasetKind.Sections);
			await facade.addDataset("testdata2", singleCourseDataSet, InsightDatasetKind.Sections);
			return facade
				.listDatasets()
				.then((result) => {
					expect(result.length).to.equal(two);
					expect(result[0].id).to.equal("testdata");
					expect(result[0].kind).to.equal(InsightDatasetKind.Sections);
					expect(result[0].numRows).to.equal(smallDatasetNumRows);

					expect(result[1].id).to.equal("testdata2");
					expect(result[1].kind).to.equal(InsightDatasetKind.Sections);
					expect(result[1].numRows).to.equal(singleCourseDatasetNumRows);
				})
				.catch((err) => {
					expect.fail("should not have failed: " + err);
				});
		});

		it("should properly return an empty array when no datasets have been added", async function () {
			return facade
				.listDatasets()
				.then((result) => {
					expect(result.length).to.equal(0);
				})
				.catch((err) => {
					expect.fail("Should not have failed: " + err);
				});
		});
	});

	/*
		The following functions: deepEqual and isPrimitive were taken from this Stack Overflow post:
		https://stackoverflow.com/questions/25456013/javascript-deepequal-comparison.
		I am using this to compare sections, and use this to test performQuery's results, as well as compare sections in
		the handleOrComparison function in queryParsingEngine.ts
		the sections in results.
		- Munn Chai
	 */
	function deepEqual(obj1: any, obj2: any): boolean {
		if (obj1 === obj2) {
			return true;
		}

		if (isPrimitive(obj1) && isPrimitive(obj2)) {
			return obj1 === obj2;
		}

		if (Object.keys(obj1).length !== Object.keys(obj2).length) {
			return false;
		}

		// compare objects with same number of keys
		for (const key in obj1) {
			if (!(key in obj2)) {
				//other object doesn't have this prop
				return false;
			}
			if (!deepEqual(obj1[key], obj2[key])) {
				return false;
			}
		}

		return true;
	}

	//check if value is primitive
	function isPrimitive(obj: any): boolean {
		return obj !== Object(obj);
	}

	/*
		End of Stack Overflow functions
	 */

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);

			return facade
				.performQuery(input)
				.then((result) => {
					if (errorExpected) {
						expect.fail("performQuery resolved when it should have rejected with " + expected);
					}

					expect(result.length).to.equal(expected.length);

					// This undermines the use of ORDER in the queries, but accurately tests queries that do not
					// contain an ORDER key
					for (const section of result) {
						let inExpected = false;
						for (const expectedSection of expected) {
							if (deepEqual(section, expectedSection)) {
								inExpected = true;
								break;
							}
						}
						expect(inExpected).to.equal(true);
					}
				})
				.catch((err) => {
					if (!errorExpected) {
						expect.fail("performQuery threw unexpected error: " + err);
					}

					//make sure returned error is correct
					if (expected === "InsightError") {
						expect(err).to.be.instanceOf(InsightError);
					} else {
						expect(err).to.be.instanceOf(ResultTooLargeError);
					}
				});
		}

		before(async function () {
			facade = new InsightFacade();

			//reload the dataset from memory
			await clearDisk();
			sections = await getContentFromArchives("pair.zip");

			// Add the dataset to InsightFacade once.
			// Will *fail* if there is a problem reading the dataset.
			try {
				const datasetIds = await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				expect(datasetIds).to.have.length(1);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/andWithOneFilter.json] SELECT avg WHERE avg > 98 AND", checkQuery);
		it("[valid/AndWithOnlyOneStatement.json] SELECT dept, id, avg WHERE id = 411", checkQuery);
		it(
			"[valid/bigQuery.json] SELECT dept, id, avg, instructor WHERE sections_avg > 90 AND sections_dept = ch* OR sections_avg = 67 AND NOT sections_pass < 60 OR sections_instructor = si* AND sections_id = 100 AND NOT sections_avg < 63 ORDER BY avg",
			checkQuery
		);
		it("[valid/emptyResults.json] SELECT dept, id, avg WHERE avg > 100", checkQuery);
		it("[valid/exactQueryAllFields.json] exact query for one row", checkQuery);
		it("[valid/largeResult.json] SELECT dept, avg WHERE avg > 88.75 OR avg < 51.5", checkQuery);
		it("[valid/orderByStringField.json] SELECT avg, dept WHERE avg > 95 ORDER BY dept", checkQuery);
		it("[valid/queryWithNot.json] SELECT dept, avg WHERE NOT avg > 55 AND dept = math", checkQuery);
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/validByInstructor.json] SELECT dept, id, avg WHERE instructor = belleville, patrice", checkQuery);
		it(
			"[valid/validOrAnd.json] SELECT dept, id, avg WHERE dept = apsc AND avg > 90, OR dept = mech AND avg < 60",
			checkQuery
		);
		it("[valid/validWildcard.json] SELECT dept, id, avg WHERE dept = cpsc AND id = 5*", checkQuery);

		//invalids
		it("[invalid/avgAsString.json] SELECT avg WHERE avg = '43'", checkQuery);
		it("[invalid/avgQueriedWithIs.json] SELECT avg WHERE avg IS 80", checkQuery);
		it("[invalid/badQueryGrammar.json] SELECT avg WHERE AND", checkQuery);
		// it("[invalid/badQueryGrammar2.json] SELECT avg WHERE IS", checkQuery);
		it("[invalid/emptyColumnsList.json] SELECT WHERE avg > 97", checkQuery);
		it("[invalid/emptyIsStatement.json] SELECT dept, id, WHERE IS", checkQuery);
		it("[invalid/idAsInt.json] SELECT avg WHERE id IS 400", checkQuery);
		it("[invalid/idQueriedWithEq.json] SELECT avg where id = 400", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/invalidWildcard.json] SELECT dept, id, avg WHERE dept = c*sc AND id = 5*", checkQuery);
		it("[invalid/matchAll.json] SELECT dept, id, WHERE", checkQuery);
		it("[invalid/missingOptions.json] SELECT WHERE avg > 97 NO OPTIONS", checkQuery);
		it("[invalid/referencesMultipleDatasets.json] SELECT dept, id, avg WHERE dept = engl AND avg > 60", checkQuery);
		it("[invalid/resultTooLarge.json] SELECT avg WHERE avg > 88.74", checkQuery);
		it("[invalid/invalid_options.json] Query missing OPTIONS", checkQuery);
		it("[invalid/invalid_wildcard.json] Query includes an invalid wildcard", checkQuery);
		it("[invalid/invalid_missing_columns.json] Query missing COLUMNS", checkQuery);
		it("[invalid/invalid_empty_columns.json] Query has empty COLUMNS", checkQuery);
		it("[invalid/invalid_results_too_large.json] Query returns too many results", checkQuery);
		it("[invalid/invalid_input_type.json] Query where input is not an object", checkQuery);
		it("[invalid/invalid_order_value.json] Query where ORDER is not a valid column", checkQuery);
		it("[invalid/queryWhichContainsInvalidFilter.json] Query which contains invalid filter key", checkQuery);
		it("[invalid/queryOfLogicComparisonWithEmptyFilter_list.json] Query which contains empty filter_list", checkQuery);
		it(
			"[invalid/queryOfLogicComparisonWithEmptyFilter_list.json] Query of logic comparison with invalid filter key",
			checkQuery
		);
		it("[invalid/queryOfMcomparisonWithInvalidMcomparator.json] Query which contains invalid mcomparator", checkQuery);
		it(
			"[invalid/queryOfMcomparisonWithInvalidValueType.json] Query of mcomparator which includes invalid value typee",
			checkQuery
		);
		it(
			"[invalid/queryOfMcomparisonWithMkeyThatContainsUnderscore.json] Query of mcomparison with invalid filter key",
			checkQuery
		);
		it("[invalid/queryOfMcomparisonWithSkey.json] Query of mcomparison with an skey", checkQuery);
		it("[invalid/queryOfNegationWithInvalidFilterKey.json] Query of negation with invalid filter key", checkQuery);
		it("[invalid/queryOfScomparisonWithInvalidKey.json] Query of scomparison with invalid filter key", checkQuery);
		it("[invalid/queryOfScomparisonWithMfield.json] Query of scomparison with an mfield", checkQuery);
	});
});
