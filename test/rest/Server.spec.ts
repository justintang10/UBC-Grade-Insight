import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "./../../src/rest/Server";
import { getContentFromArchives } from "../TestUtil";

describe("Facade C3", function () {
	let server: Server;
	let sectionsBytes: Buffer;
	let sectionsBytesInvalid: Buffer;
	let roomsBytes: Buffer;

	before(async function () {
		const sections = await getContentFromArchives("pair.zip");
		const rooms = await getContentFromArchives("campus.zip");
		sectionsBytes = Buffer.from(sections, "base64");
		sectionsBytesInvalid = Buffer.from("invalid dataset", "base64");
		roomsBytes = Buffer.from(rooms, "base64");

		try {
			//start server (random unused port)
			const port = 49155;
			server = new Server(port);
			await server.start();
		} catch (err) {
			Log.error("failed to start server");
			expect.fail("Failed to start C3 server: " + err);
		}

		//remove dataset that gets added (in case test suite failed to complete & remove)
		const SERVER_URL = "localhost:49155";
		const COURSES_ENDPOINT_URL = "/dataset/sections";
		const ROOMS_ENDPOINT_URL = "/dataset/rooms";
		try {
			await request(SERVER_URL).delete(COURSES_ENDPOINT_URL);
			await request(SERVER_URL).delete(ROOMS_ENDPOINT_URL);
		} catch (err) {
			Log.error(err);
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

	it("PUT test for rooms dataset", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/rooms/rooms";

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(roomsBytes)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.body.result).to.have.members(["sections","rooms"]);
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

	it("PUT test for courses dataset (duplicate dataset id)", function () {
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
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
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

	it("PUT test for courses dataset (invalid dataset)", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/sections/sectionsinvalid";

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(sectionsBytesInvalid)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
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

	it("GET test for datasets", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/datasets";

		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.body.result).to.have.length(2);
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

	it("POST test for courses dataset (invalid query)", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/query";
		const query = {
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
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
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

	it("DELETE test for courses dataset (dataset not found)", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/sections";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
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

	it("DELETE test for courses dataset (datasetid invalid)", function () {
		const SERVER_URL = "localhost:49155";
		const ENDPOINT_URL = "/dataset/section_s";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(res.body.result);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
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

	it("GET test for datasets (after removal)", function () {
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
});
