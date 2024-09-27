import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { doesInputStringMatch } from "../../src/utils/queryEngineUtils";
import { InsightError } from "../../src/controller/IInsightFacade";

use(chaiAsPromised);

describe("queryEngineUtils", function () {
	describe("DoesInputStringMatch", function () {
		it("should accept any string when inputstring is '**'", async function () {
			const matches = doesInputStringMatch("**", "anythingdjSDIUHqwuekH41241");

			expect(matches).to.equal(true);
		});

		it("should accept any string when inputstring is '*'", async function () {
			const matches = doesInputStringMatch("*", "ascjoqiwjdAOIDJAslkdads");

			expect(matches).to.equal(true);
		});

		it("should accept any beginning when input string begins with asterisk", async function () {
			const matches = doesInputStringMatch("*EndingOfInputString", "This Should accept the EndingOfInputString");

			expect(matches).to.equal(true);
		});

		it("should accept any ending when input string ends with asterisk", async function () {
			const matches = doesInputStringMatch("This Should accept the *", "This Should accept the EndingOfInputString");

			expect(matches).to.equal(true);
		});

		it("should accept any beginning and end when input string starts and ends with asterisk", async function () {
			const matches = doesInputStringMatch("*InTheMiddle*", "anythingdjSDInTheMiddleUHqwuekH41241");

			expect(matches).to.equal(true);
		});

		it("should reject an input string with more than 2 asterisks", async function () {
			try {
				doesInputStringMatch("***", "***");
				expect.fail("Should have thrown above");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
		});

		it("should reject an input string with more than 2 asterisks", async function () {
			try {
				doesInputStringMatch("*eofaeafae*dsds*", "Anything");
				expect.fail("Should have thrown above");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
		});

		it("should reject incorrect beginning when inputstring starts with asterisk", async function () {
			const matches = doesInputStringMatch("*ollll", "ollllending");

			expect(matches).to.equal(false);
		});

		it("should reject incorrect ending when inputstring end with asterisk", async function () {
			const matches = doesInputStringMatch("ollll*", "beginningollll");

			expect(matches).to.equal(false);
		});

		it("should reject is inputstring starts and ends with asterisk but value does not contain the input string", async function () {
			const matches = doesInputStringMatch("*ollll*", "Not here");

			expect(matches).to.equal(false);
		});

		it("should reject an input string which has an asterisk in the middle", async function () {
			try {
				doesInputStringMatch("co*c", "Anything");
				expect.fail("Should have thrown above");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
		});
	});
});
