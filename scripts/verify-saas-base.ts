import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveTenantFromRequest } from "../src/lib/tenant/resolveTenant";

const root = process.cwd();

const requiredPaths = [
	"src/app/(public)/page.tsx",
	"src/app/(public)/layout.tsx",
	"src/app/(auth)/login/page.tsx",
	"src/app/(auth)/layout.tsx",
	"src/app/(app)/home/page.tsx",
	"src/app/(app)/layout.tsx",
	"src/lib/tenant/resolveTenant.ts",
	"src/lib/env.ts",
	"src/middleware.ts",
];

for (const relativePath of requiredPaths) {
	if (!existsSync(join(root, relativePath))) {
		console.error(`❌ Missing: ${relativePath}`);
		process.exit(1);
	}
}

const middlewareSource = readFileSync(join(root, "src/middleware.ts"), "utf8");

if (!middlewareSource.includes("resolveTenantFromRequest")) {
	console.error("❌ middleware.ts must call resolveTenantFromRequest");
	process.exit(1);
}

if (!middlewareSource.includes("/profile")) {
	console.error("❌ middleware.ts must protect /profile");
	process.exit(1);
}

const tenant = resolveTenantFromRequest(new Request("http://localhost/"));

if (tenant !== null) {
	console.error("❌ resolveTenantFromRequest should return null in Fase 0");
	process.exit(1);
}

console.log("✅ Route groups (public)/(auth)/(app) present");
console.log("✅ resolveTenant stub + middleware wiring");
console.log("✅ src/lib/env.ts present");
