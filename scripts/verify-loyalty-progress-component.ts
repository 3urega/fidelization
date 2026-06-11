/* eslint-disable no-console -- CLI verify script */
import { buildLoyaltyProgressSlots } from "../src/app/_components/loyalty/LoyaltyProgress";
import { parseLoyaltyVisualTemplate } from "../src/app/_components/loyalty/loyaltyVisualTemplates";

function assertSlots(label: string, slots: string[], expected: string[]): void {
	const actual = slots.join(",");
	const want = expected.join(",");

	if (actual !== want) {
		console.error(`❌ ${label}: got [${actual}] expected [${want}]`);
		process.exit(1);
	}

	console.log(`✅ ${label}`);
}

function main(): void {
	assertSlots(
		"7/10 progress",
		buildLoyaltyProgressSlots({ current: 7, required: 10 }),
		[
			"filled",
			"filled",
			"filled",
			"filled",
			"filled",
			"filled",
			"filled",
			"empty",
			"empty",
			"reward",
		],
	);

	assertSlots(
		"completed campaign",
		buildLoyaltyProgressSlots({ current: 0, required: 5, completed: true }),
		["filled", "filled", "filled", "filled", "reward"],
	);

	if (parseLoyaltyVisualTemplate("invalid") !== "generic") {
		console.error("❌ invalid template should fallback to generic");
		process.exit(1);
	}

	console.log("✅ invalid template → generic");
	console.log("✅ verify:loyalty-progress-component passed");
}

main();
