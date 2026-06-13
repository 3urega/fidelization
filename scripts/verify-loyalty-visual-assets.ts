/* eslint-disable no-console -- CLI verify script */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
	getStampSpriteUrl,
	LOYALTY_REWARD_SPRITE_URL,
	LOYALTY_VISUAL_TEMPLATES,
	resolveStampSprite,
	type LoyaltyStampSpriteState,
} from "../src/app/_components/loyalty/loyaltyVisualTemplates";

const STAMP_STATES: LoyaltyStampSpriteState[] = ["empty", "filled", "reward"];
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function assertFile(publicPath: string, renderMode: "svg-mask" | "raster"): void {
	const filePath = join(process.cwd(), "public", publicPath.replace(/^\//, ""));

	if (!existsSync(filePath)) {
		console.error("❌ missing file:", publicPath);
		process.exit(1);
	}

	if (renderMode === "svg-mask") {
		const contents = readFileSync(filePath, "utf8");
		if (!contents.includes("currentColor")) {
			console.error("❌ expected currentColor in:", publicPath);
			process.exit(1);
		}
	}

	console.log(`✅ ${publicPath}`);
}

function main(): void {
	for (const template of LOYALTY_VISUAL_TEMPLATES) {
		for (const state of STAMP_STATES) {
			const asset = resolveStampSprite(template.id, state);
			assertFile(asset.url, asset.renderMode);
		}
	}

	const rewardPaths = new Set(
		LOYALTY_VISUAL_TEMPLATES.map((template) => getStampSpriteUrl(template.id, "reward")),
	);

	if (rewardPaths.size !== 1 || !rewardPaths.has(LOYALTY_REWARD_SPRITE_URL)) {
		console.error("❌ all templates must share the same reward sprite", [...rewardPaths]);
		process.exit(1);
	}

	console.log("✅ shared reward sprite for all templates");
	console.log("✅ all stamp assets on disk");
}

async function run(): Promise<void> {
	main();

	const sampleUrl = `${baseUrl}${resolveStampSprite("coffee", "filled").url}`;

	try {
		const response = await fetch(sampleUrl);
		if (response.status !== 200) {
			console.error("❌ HTTP sample (dev server optional):", sampleUrl, response.status);
			process.exit(1);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("image/png")) {
			console.error("❌ HTTP sample is not PNG:", sampleUrl, contentType);
			process.exit(1);
		}

		console.log("✅ HTTP sample OK:", sampleUrl);
	} catch {
		console.log("⚠️ HTTP sample skipped (dev server not running)");
	}

	console.log("✅ verify:loyalty-visual-assets passed");
}

void run();
