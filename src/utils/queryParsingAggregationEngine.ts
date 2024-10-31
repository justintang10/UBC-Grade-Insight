import { InsightError } from "../controller/IInsightFacade";
import { getAndCheckColumnName, isMField, isSField, QueryComparison } from "./queryEngineUtils";
import Decimal from "decimal.js";

export function handleAggregationCalculation(aggregation: any, sections: any, isSections: boolean): number {
	const aggregationInside = Object.values(aggregation)[0] as any;
	const aggregationType = Object.keys(aggregationInside)[0];
	const columnFieldPair = Object.values(aggregationInside)[0] as string;

	const columnName = getAndCheckColumnName(columnFieldPair, QueryComparison.EITHER, isSections);
	if (aggregationType === "COUNT") {
		// Count can be used on SFields, others cannot
		return handleCount(columnName, sections, isSections);
	}

	let result = 0;
	if (isSField(columnName, isSections)) {
		throw new InsightError("Invalid Query: Cannot aggregate on SField: " + columnName);
	}

	if (aggregationType === "MAX") {
		result = handleMax(columnName, sections);
	} else if (aggregationType === "MIN") {
		result = handleMin(columnName, sections);
	} else if (aggregationType === "AVG") {
		result = handleAvg(columnName, sections);
	} else if (aggregationType === "SUM") {
		result = handleSum(columnName, sections);
	} else {
		throw new InsightError("Invalid Query: invalid transformation operator: " + aggregationType);
	}

	return result;
}

export function handleGroup(group: any, sections: any, isSections: boolean): Map<string, any> {
	const map = new Map<string, any>();
	for (const section of sections) {
		let key = "";

		for (const column of group) {
			// creates a key of the given group_by columns, which will be used as a key in a map
			const columnName = getAndCheckColumnName(column, QueryComparison.EITHER, isSections);
			if (isMField(columnName, isSections)) {
				const field = section.getMField(columnName);
				key = key + column + ":" + field + "~";
			} else if (isSField(columnName, isSections)) {
				const field = section.getSField(columnName);
				key = key + column + ":" + field + "~";
			} else {
				throw new InsightError("Invalid Query: invalid key in GROUP");
			}
		}

		if (map.has(key)) {
			const array = map.get(key);
			array.push(section);
		} else {
			map.set(key, [section]);
		}
	}
	return map;
}

export function handleMax(columnName: any, sections: any): number {
	let max = Number.MIN_SAFE_INTEGER;
	for (const section of sections) {
		const value = section.getMField(columnName);
		if (value > max) {
			max = value;
		}
	}
	return max;
}

export function handleMin(columnName: any, sections: any): number {
	let min = Number.MAX_SAFE_INTEGER;
	for (const section of sections) {
		const value = section.getMField(columnName);
		if (value < min) {
			min = value;
		}
	}
	return min;
}

export function handleAvg(columnName: any, sections: any): number {
	let sum = new Decimal(0);

	for (const section of sections) {
		const value = section.getMField(columnName);
		const decimalValue = new Decimal(value);
		sum = Decimal.add(sum, decimalValue);
	}
	const decimalCount = 2; // deal with floating point error
	const avg = sum.toNumber() / sections.length;
	return Number(avg.toFixed(decimalCount));
}

export function handleSum(columnName: any, sections: any): number {
	let sum = 0;
	for (const section of sections) {
		const value = section.getMField(columnName);
		sum += value;
	}
	const decimalCount = 2;
	return Number(sum.toFixed(decimalCount));
}

export function handleCount(columnName: any, sections: any, isSections: boolean): number {
	const uniqueValues: any = [];

	for (const section of sections) {
		if (isSField(columnName, isSections)) {
			const value = section.getSField(columnName);
			if (!uniqueValues.includes(value)) {
				uniqueValues.push(value);
			}
		} else if (isMField(columnName, isSections)) {
			const value = section.getMField(columnName);
			if (!uniqueValues.includes(value)) {
				uniqueValues.push(value);
			}
		}
	}

	return uniqueValues.length;
}
