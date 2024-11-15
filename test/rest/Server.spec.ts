import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "./../../src/rest/Server";
import { getContentFromArchives } from "../TestUtil";

describe("Facade C3", function () {
	let server: Server;
	let sectionsBytes: Buffer;

	before(async function () {
		const sections = await getContentFromArchives("pair.zip");
		sectionsBytes = Buffer.from(sections, "base64");

		try {
			//start server (random unused port)
			const port = 49155;
			server = new Server(port);
			await server.start();
		} catch (err) {
			Log.error("failed to start server");
			expect.fail("Failed to start C3 server: " + err);
		}
	});

	after(async function () {
		try {
			await server.stop();
		} catch (err) {
			Log.error("failed to stop server");
			expect.fail("Failed to stop C3 server: " + err);
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/sections/sections";

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(sectionsBytes)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.body.result).to.have.members(["sections"]);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("GET test for courses dataset", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/datasets";

		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.body.result).to.have.length(1);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("POST test for courses dataset (query)", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/query";
		const query = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					const queryResultLen = 49;
					expect(res.body.result).to.have.length(queryResultLen);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("DELETE test for courses dataset", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/sections";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});
});
