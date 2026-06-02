import { extractSubdomain } from "../src/lib/tenant/extractSubdomain";
import { loadTenantBySlug } from "../src/lib/tenant/mockTenantBySlug";

const cases: Array<{ host: string; domain: string; expected: string | null }> = [
	{ host: "cafe-demo.localhost:3000", domain: "localhost", expected: "cafe-demo" },
	{ host: "localhost:3000", domain: "localhost", expected: null },
	{ host: "www.localhost:3000", domain: "localhost", expected: null },
	{ host: "unknown.localhost:3000", domain: "localhost", expected: "unknown" },
	{ host: "cafe-demo.app.example.com", domain: "app.example.com", expected: "cafe-demo" },
	{ host: "app.example.com", domain: "app.example.com", expected: null },
];

for (const { host, domain, expected } of cases) {
	const slug = extractSubdomain(host, domain);
	if (slug !== expected) {
		console.error(`❌ extractSubdomain("${host}", "${domain}") → ${slug}, expected ${expected}`);
		process.exit(1);
	}
}

const demo = loadTenantBySlug("cafe-demo");
if (!demo || demo.tenantId !== "00000000-0000-4000-8000-000000000002") {
	console.error("❌ loadTenantBySlug(cafe-demo) failed");
	process.exit(1);
}

if (loadTenantBySlug("unknown-tenant") !== null) {
	console.error("❌ unknown slug should not resolve");
	process.exit(1);
}

console.log("✅ extractSubdomain cases");
console.log("✅ mock tenant map (cafe-demo)");
