/* eslint-disable no-console -- CLI verify script */
import {
	formatStaffScanOutcomeMessage,
	formatStaffScanOutcomesMessage,
	type StaffScanOutcome,
} from "../src/contexts/loyalty/customers/domain/StaffScanOutcome";
import { parseStaffScanTargetInput } from "../src/contexts/loyalty/customers/domain/StaffScanTarget";
import { InvalidStampScan } from "../src/contexts/loyalty/customers/domain/InvalidStampScan";

function assertParseOk(
	label: string,
	input: { targetType?: unknown; targetId?: unknown },
	expected: { targetType: string; targetId: string },
): void {
	const parsed = parseStaffScanTargetInput(input);

	if (parsed.targetType !== expected.targetType || parsed.targetId !== expected.targetId) {
		console.error(`❌ ${label}:`, parsed, "expected", expected);
		process.exit(1);
	}

	console.log(`✅ ${label}`);
}

function assertParseFails(
	label: string,
	input: { targetType?: unknown; targetId?: unknown },
): void {
	try {
		parseStaffScanTargetInput(input);
		console.error(`❌ ${label}: expected InvalidStampScan`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampScan)) {
			console.error(`❌ ${label}: wrong error`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label}`);
}

function assertMessage(label: string, outcome: StaffScanOutcome, expected: string): void {
	const message = formatStaffScanOutcomeMessage(outcome);

	if (message !== expected) {
		console.error(`❌ ${label}: got "${message}" expected "${expected}"`);
		process.exit(1);
	}

	console.log(`✅ ${label}`);
}

function main(): void {
	assertParseOk(
		"parse stamp_campaign",
		{ targetType: "stamp_campaign", targetId: "  campaign-uuid  " },
		{ targetType: "stamp_campaign", targetId: "campaign-uuid" },
	);

	assertParseOk(
		"parse promotion",
		{ targetType: "promotion", targetId: "promo-uuid" },
		{ targetType: "promotion", targetId: "promo-uuid" },
	);

	assertParseFails("missing targetType", { targetId: "x" });
	assertParseFails("invalid targetType", { targetType: "stampTypeId", targetId: "x" });
	assertParseFails("missing targetId", { targetType: "stamp_campaign" });
	assertParseFails("empty targetId", { targetType: "stamp_campaign", targetId: "   " });

	assertMessage(
		"message point_recorded",
		{ kind: "point_recorded", pointsBalance: 5 },
		"Punto anotado",
	);

	assertMessage(
		"message stamp_added",
		{
			kind: "stamp_added",
			campaignId: "c1",
			campaignName: "Café 10",
			current: 5,
			required: 10,
		},
		"¡Producto anotado! 5 de 10 completados",
	);

	assertMessage(
		"message card_completed",
		{ kind: "card_completed", campaignId: "c1", campaignName: "Café 10" },
		"¡Has completado la tarjeta!",
	);

	assertMessage(
		"message card_already_completed",
		{ kind: "card_already_completed", campaignId: "c1", campaignName: "Café 10" },
		"La tarjeta ya está completada",
	);

	assertMessage(
		"message promotion_applied",
		{
			kind: "promotion_applied",
			promotionId: "p1",
			promotionTitle: "2x1",
			usedCount: 1,
			maxUsesPerUser: 3,
		},
		"Promoción aplicada",
	);

	assertMessage(
		"message promotion_exhausted",
		{
			kind: "promotion_exhausted",
			promotionId: "p1",
			promotionTitle: "2x1",
			maxUsesPerUser: 3,
		},
		"¡La promoción ya ha sido agotada!",
	);

	const progressCombo = formatStaffScanOutcomesMessage([
		{ kind: "point_recorded", pointsBalance: 6 },
		{
			kind: "stamp_added",
			campaignId: "c1",
			campaignName: "Café",
			current: 5,
			required: 10,
		},
	]);

	if (progressCombo !== "Punto anotado · ¡Producto anotado! 5 de 10 completados") {
		console.error("❌ progress combo:", progressCombo);
		process.exit(1);
	}

	console.log("✅ outcomes combo stamp progress");

	const completedCombo = formatStaffScanOutcomesMessage([
		{ kind: "point_recorded", pointsBalance: 10 },
		{
			kind: "stamp_added",
			campaignId: "c1",
			campaignName: "Café",
			current: 10,
			required: 10,
		},
		{ kind: "card_completed", campaignId: "c1", campaignName: "Café" },
	]);

	if (
		completedCombo !==
		"Punto anotado · ¡Producto anotado! 10 de 10 completados · ¡Has completado la tarjeta!"
	) {
		console.error("❌ completed combo:", completedCombo);
		process.exit(1);
	}

	console.log("✅ outcomes combo card completed");
	console.log("✅ verify:staff-scan-flow-spec-use-case passed");
}

main();
