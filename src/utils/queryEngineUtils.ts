export function isLComparator(queryKey: string): boolean {
	const lComparators = ["AND", "OR"];

	return lComparators.includes(queryKey);
}

export function isMComparator(queryKey: string): boolean {
	const lComparators = ["GT", "LT", "EQ"];

	return lComparators.includes(queryKey);
}

export function isMField(field: string): boolean {
	const mFields = ["avg", "pass", "fail", "audit", "year"];

	return mFields.includes(field);
}

export function isSField(field: string): boolean {
	const sFields = ["dept", "id", "instructor", "title", "uuid"];

	return sFields.includes(field);
}
