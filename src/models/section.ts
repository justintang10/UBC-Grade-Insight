export class Section {
	private readonly uuid: String;
	private readonly id: String;
	private readonly title: String;
	private readonly instructor: String;
	private readonly department: String;
	private readonly year: number;
	private readonly avg: number;
	private readonly pass: number;
	private readonly fail: number;
	private readonly audit: number;

	constructor(
		uuid: String,
		id: String,
		title: String,
		instructor: String,
		department: String,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.department = department;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}

	public getUuid(): String {
		return this.uuid;
	}

	public getId(): String {
		return this.id;
	}

	public getTitle(): String {
		return this.title;
	}

	public getInstructor(): String {
		return this.instructor;
	}

	public getDepartment(): String {
		return this.department;
	}
}
