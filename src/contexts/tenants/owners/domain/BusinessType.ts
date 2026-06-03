export enum BusinessType {
	Cafe = "cafe",
	Bakery = "bakery",
	Restaurant = "restaurant",
	Bar = "bar",
	Retail = "retail",
}

const BUSINESS_TYPES = new Set<string>(Object.values(BusinessType));

export function isBusinessType(value: string): value is BusinessType {
	return BUSINESS_TYPES.has(value);
}

export const BUSINESS_TYPE_OPTIONS: readonly { value: BusinessType; label: string }[] = [
	{ value: BusinessType.Cafe, label: "Café" },
	{ value: BusinessType.Bakery, label: "Panadería" },
	{ value: BusinessType.Restaurant, label: "Restaurante" },
	{ value: BusinessType.Bar, label: "Bar" },
	{ value: BusinessType.Retail, label: "Tienda" },
] as const;
