/* eslint-disable no-console -- CLI verify script */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
	getStampSpriteUrl,
	LOYALTY_VISUAL_TEMPLATES,
	type LoyaltyStampSpriteState,
} from "../src/app/_components/loyalty/loyaltyVisualTemplates";

const STAMP_STATES: LoyaltyStampSpriteState[] = ["empty", "filled", "reward"];
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function main(): void {
	for (const template of LOYALTY_VISUAL_TEMPLATES) {
		for (const state of STAMP_STATES) {
			const publicPath = getStampSpriteUrl(template.id, state).replace(/^\//, "");
			const filePath = join(process.cwd(), "public", publicPath);

			if (!existsSync(filePath)) {
				console.error("❌ missing file:", publicPath);
				process.exit(1);
			}

			const contents = readFileSync(filePath, "utf8");
			if (!contents.includes("currentColor")) {
				console.error("❌ expected currentColor in:", publicPath);
				process.exit(1);
			}

			console.log(`✅ ${publicPath}`);
		}
	}

	console.log("✅ all stamp SVG assets on disk");
}

async function run(): Promise<void> {
	main();

	const sampleUrl = `${baseUrl}${getStampSpriteUrl("coffee", "filled")}`;

	try {
		const response = await fetch(sampleUrl);
		if (response.status !== 200) {
			console.error("❌ HTTP sample (dev server optional):", sampleUrl, response.status);
			process.exit(1);
		}

		const body = await response.text();
		if (!body.includes("<svg")) {
			console.error("❌ HTTP sample is not SVG:", sampleUrl);
			process.exit(1);
		}

		console.log("✅ HTTP sample OK:", sampleUrl);
	} catch {
		console.log("⚠️ HTTP sample skipped (dev server not running)");
	}

	console.log("✅ verify:loyalty-visual-assets passed");
}

void run();
