interface BuildingData {
	codeName: string;
	fullName: string;
	address: string;
	fileLink: string;
	page: any | null;
}

interface RoomData {
	number: string;
	seats: number;
	furniture: string;
	type: string;
	href: string;
}

export function getAllTables(node: any): any[] {
	let tables: any[] = [];

	if (node.childNodes) {
		for (const child of node.childNodes) {
			tables = [...tables, ...getAllTables(child)];
		}
	}

	if (node.nodeName === "table") {
		tables.push(node);
	}

	return tables;
}

export function tableIsValid(table: any): boolean {
	let tbody: any;
	for (const child of table.childNodes) {
		if (child.nodeName === "tbody") {
			tbody = child;
		}
	}
	if (!tbody) {
		return false;
	}

	let tr: any;
	for (const child of tbody.childNodes) {
		if (child.nodeName === "tr") {
			tr = child;
			break;
		}
	}
	if (!tr) {
		return false;
	}
	let td: any;
	for (const child of tr.childNodes) {
		if (child.nodeName === "td") {
			td = child;
			break;
		}
	}
	if (!td) {
		return false;
	}

	return checkTableClasses(td.attrs[0].value);
}

function checkTableClasses(classes: string): boolean {
	return classes.includes("views-field");
}

export function getBuildingTableData(buildingsTable: any): BuildingData[] {
	let tbody: any;
	for (const childNode of buildingsTable.childNodes) {
		if (childNode.nodeName === "tbody") {
			tbody = childNode;
			break;
		}
	}

	const tableRows = tbody.childNodes.filter((row: any) => {
		return row.nodeName === "tr";
	});
	const buildingsData: BuildingData[] = [];
	for (const row of tableRows) {
		const buildingData: BuildingData = getBuildingInfoFromRow(row);
		buildingsData.push(buildingData);
	}
	return buildingsData;
}

function getBuildingInfoFromRow(row: any): BuildingData {
	const rowData = row.childNodes.filter((child: any) => {
		return child.nodeName === "td";
	});
	const buildingCodeName = rowData[1].childNodes[0].value.replace("\n", "").trim();
	const nameIndex = 2;
	const buildingFullName = rowData[nameIndex].childNodes[1].childNodes[0].value;
	const addressIndex = 3;
	const buildingAddress = rowData[addressIndex].childNodes[0].value.replace("\n", "").trim();
	const linkIndex = 4;
	const fileLink: string = rowData[linkIndex].childNodes[1].attrs[0].value.replace("./", "");

	return {
		codeName: buildingCodeName,
		fullName: buildingFullName,
		address: buildingAddress,
		fileLink: fileLink,
		page: null,
	};
}

export function getRoomsData(buildingPage: any): any[] {
	const roomTables = getRoomTables(buildingPage);
	if (roomTables.length === 0) {
		return [];
	}
	const roomTable = roomTables[0];

	let tbody: any;
	for (const childNode of roomTable.childNodes) {
		if (childNode.nodeName === "tbody") {
			tbody = childNode;
			break;
		}
	}

	const tableRows = tbody.childNodes.filter((row: any) => {
		return row.nodeName === "tr";
	});

	const roomsData: RoomData[] = [];
	for (const row of tableRows) {
		const roomData: RoomData = getRoomInfoFromRow(row);
		roomsData.push(roomData);
	}
	return roomsData;
}

function getRoomTables(buildingJson: any): any[] {
	const roomTables: any[] = [];
	const tables = getAllTables(buildingJson);
	for (const table of tables) {
		if (tableIsValid(table)) {
			roomTables.push(table);
		}
	}
	return roomTables;
}

function getRoomInfoFromRow(row: any): RoomData {
	const rowData = row.childNodes.filter((child: any) => {
		return child.nodeName === "td";
	});

	const roomNumber = rowData[0].childNodes[1].childNodes[0].value;
	const numSeats = Number(rowData[1].childNodes[0].value.replace("\n", "").trim());
	const furnitureIndex = 2;
	const furniture = rowData[furnitureIndex].childNodes[0].value.replace("\n", "").trim();
	const typeIndex = 3;
	const roomType: string = rowData[typeIndex].childNodes[0].value.replace("\n", "").trim();
	const hrefIndex = 4;
	const href: string = rowData[hrefIndex].childNodes[1].attrs[0].value;

	return {
		number: roomNumber,
		seats: numSeats,
		furniture: furniture,
		type: roomType,
		href: href,
	};
}
