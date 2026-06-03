/* eslint-disable no-console -- CLI verify script */
import { formatTenantHost } from "../src/lib/tenant/formatTenantHost";
import { slugifyBusinessName } from "../src/lib/tenant/slugifyBusinessName";

const cases: Array<{
	params: Parameters<typeof formatTenantHost>[0];
	expected: string | null;
}> = [
	{ params: { slug: "cafe-joan", appDomain: "localhost", port: "3000" }, expected: "cafe-joan.localhost:3000" },
	{ params: { slug: "cafe-joan", appDomain: "localhost" }, expected: "cafe-joan.localhost" },
	{ params: { slug: "cafe-joan", appDomain: "platform.com", port: "443" }, expected: "cafe-joan.platform.com" },
	{ params: { slug: "", appDomain: "localhost" }, expected: null },
	{ params: { slug: "x", appDomain: undefined }, expected: null },
];

for (const { params, expected } of cases) {
	const result = formatTenantHost(params);
	if (result !== expected) {
		console.error("❌ formatTenantHost", params, "→", result, "expected", expected);
		process.exit(1);
	}
}

if (slugifyBusinessName("Café Joan") !== "cafe-joan") {
	console.error("❌ slugifyBusinessName");
	process.exit(1);
}

console.log("✅ formatTenantHost cases");
console.log("✅ slugifyBusinessName");
