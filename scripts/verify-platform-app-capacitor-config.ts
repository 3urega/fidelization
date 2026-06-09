/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseJoinDeepLink } from "../src/lib/platform/deepLinks";

function assertDeepLinkParser(): void {
	const cases: Array<[string, string | null]> = [
		["fidelization://join/cafe-demo", "cafe-demo"],
		["fidelization://join/my-cafe/", "my-cafe"],
		["https://example.com/join/x", null],
		["fidelization://other/cafe", null],
	];

	for (const [url, expected] of cases) {
		const actual = parseJoinDeepLink(url);
		if (actual !== expected) {
			console.error(`❌ parseJoinDeepLink(${url}) expected ${expected}, got ${actual}`);
			process.exit(1);
		}
	}

	console.log("✅ parseJoinDeepLink OK");
}

function assertAndroidManifest(): void {
	const manifestPath = join(process.cwd(), "android/app/src/main/AndroidManifest.xml");
	const manifest = readFileSync(manifestPath, "utf8");

	if (!manifest.includes('android:scheme="fidelization"') || !manifest.includes('android:host="join"')) {
		console.error("❌ AndroidManifest missing fidelization://join intent-filter");
		process.exit(1);
	}

	console.log("✅ AndroidManifest deep link intent-filter");
}

function assertCapacitorConfig(): void {
	const config = readFileSync(join(process.cwd(), "capacitor.config.ts"), "utf8");

	if (!config.includes('webDir: "out"')) {
		console.error("❌ capacitor.config.ts missing webDir out/");
		process.exit(1);
	}

	console.log("✅ capacitor.config.ts webDir=out");
}

async function main(): Promise<void> {
	assertDeepLinkParser();
	assertAndroidManifest();
	assertCapacitorConfig();

	if (process.env.SKIP_CAPACITOR_BUILD === "1") {
		console.log("⏭️ skip build:capacitor (SKIP_CAPACITOR_BUILD=1)");
		console.log("✅ verify:platform-app-capacitor-config passed");
		return;
	}

	const { spawnSync } = await import("node:child_process");
	const bash = process.platform === "win32" ? "bash" : "bash";
	const result = spawnSync(bash, ["scripts/build-capacitor.sh"], {
		cwd: process.cwd(),
		stdio: "inherit",
		env: process.env,
	});

	if (result.status !== 0) {
		console.error("❌ npm run build:capacitor failed");
		process.exit(result.status ?? 1);
	}

	console.log("✅ build:capacitor passed");
	console.log("✅ verify:platform-app-capacitor-config passed");
}

void main();
