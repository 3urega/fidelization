/* eslint-disable no-console -- CLI verify script */
import { InvalidRouletteConfig } from "../src/contexts/loyalty/games/domain/InvalidRouletteConfig";
import { parseRouletteConfig } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import type { RoulettePrizeType } from "../src/contexts/loyalty/games/domain/RoulettePrizeType";
import { RouletteSegment } from "../src/contexts/loyalty/games/domain/RouletteSegment";
import { RouletteSegmentsExhausted } from "../src/contexts/loyalty/games/domain/RouletteSegmentsExhausted";
import {
	computeSegmentProbabilities,
	filterAvailableSegments,
	pickSegment,
} from "../src/contexts/loyalty/games/domain/RouletteWheel";

const SEGMENT_NONE = {
	id: "00000000-0000-4000-8000-000000000001",
	label: "Sin premio",
	weight: 40,
	prizeType: "none",
	prize: {},
};

const SEGMENT_POINTS = {
	id: "00000000-0000-4000-8000-000000000002",
	label: "+10 puntos",
	weight: 30,
	prizeType: "points",
	prize: { points: 10 },
};

const SEGMENT_STAMP = {
	id: "00000000-0000-4000-8000-000000000003",
	label: "+1 sello",
	weight: 15,
	prizeType: "stamp",
	prize: { campaignId: "00000000-0000-4000-8000-000000000010" },
};

const SEGMENT_PROMO = {
	id: "00000000-0000-4000-8000-000000000004",
	label: "10% descuento",
	weight: 10,
	prizeType: "promotion",
	prize: { promotionId: "00000000-0000-4000-8000-000000000020" },
};

const SEGMENT_PHYSICAL = {
	id: "00000000-0000-4000-8000-000000000005",
	label: "Café gratis",
	weight: 4,
	prizeType: "physical",
	prize: { description: "Café gratis" },
	stockLimit: 5,
	stockUsed: 0,
};

const SEGMENT_JACKPOT = {
	id: "00000000-0000-4000-8000-000000000006",
	label: "+50 puntos",
	weight: 1,
	prizeType: "points",
	prize: { points: 50 },
};

const DEMO_RULES = {
	maxSpinsPerDay: 1,
	maxSpinsPerWeek: 3,
	eligibilityTtlHours: 24,
	trigger: "after_staff_scan",
};

const DEMO_CONFIG = {
	version: 1,
	segments: [
		SEGMENT_NONE,
		SEGMENT_POINTS,
		SEGMENT_STAMP,
		SEGMENT_PROMO,
		SEGMENT_PHYSICAL,
		SEGMENT_JACKPOT,
	],
	rules: DEMO_RULES,
};

function assertParseOk(label: string, input: unknown): void {
	try {
		const config = parseRouletteConfig(input);

		if (config.toPrimitives().segments.length < 2) {
			console.error(`❌ ${label}: expected at least 2 segments`);
			process.exit(1);
		}

		console.log(`✅ ${label}`);
	} catch (error) {
		console.error(`❌ ${label}:`, error);
		process.exit(1);
	}
}

function assertParseFails(label: string, input: unknown): void {
	try {
		parseRouletteConfig(input);
		console.error(`❌ ${label}: expected InvalidRouletteConfig`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidRouletteConfig)) {
			console.error(`❌ ${label}: wrong error`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label}`);
}

function segmentFrom(input: {
	id: string;
	label: string;
	weight: number;
	prizeType: RoulettePrizeType;
	prize?: Record<string, unknown>;
	stockLimit?: number | null;
	stockUsed?: number;
}): RouletteSegment {
	return RouletteSegment.fromPrimitives({
		id: input.id,
		label: input.label,
		weight: input.weight,
		prizeType: input.prizeType,
		prize: input.prize ?? {},
		stockLimit: input.stockLimit ?? null,
		stockUsed: input.stockUsed ?? 0,
	});
}

function main(): void {
	assertParseOk("parse demo config", DEMO_CONFIG);

	assertParseFails("reject version !== 1", { ...DEMO_CONFIG, version: 2 });
	assertParseFails("reject 1 segment", {
		version: 1,
		segments: [SEGMENT_NONE],
		rules: DEMO_RULES,
	});
	assertParseFails("reject 9 segments", {
		version: 1,
		segments: [
			SEGMENT_NONE,
			SEGMENT_POINTS,
			SEGMENT_STAMP,
			SEGMENT_PROMO,
			SEGMENT_PHYSICAL,
			SEGMENT_JACKPOT,
			{ ...SEGMENT_NONE, id: "00000000-0000-4000-8000-000000000007" },
			{ ...SEGMENT_POINTS, id: "00000000-0000-4000-8000-000000000008" },
			{ ...SEGMENT_POINTS, id: "00000000-0000-4000-8000-000000000009" },
		],
		rules: DEMO_RULES,
	});
	assertParseFails("reject weight 0", {
		version: 1,
		segments: [SEGMENT_NONE, { ...SEGMENT_POINTS, weight: 0 }],
		rules: DEMO_RULES,
	});
	assertParseFails("reject invalid prizeType", {
		version: 1,
		segments: [SEGMENT_NONE, { ...SEGMENT_POINTS, prizeType: "jackpot" }],
		rules: DEMO_RULES,
	});
	assertParseFails("reject points without prize.points", {
		version: 1,
		segments: [SEGMENT_NONE, { ...SEGMENT_POINTS, prize: {} }],
		rules: DEMO_RULES,
	});
	assertParseFails("reject duplicate segment ids", {
		version: 1,
		segments: [SEGMENT_NONE, { ...SEGMENT_POINTS, id: SEGMENT_NONE.id }],
		rules: DEMO_RULES,
	});
	assertParseFails("reject maxSpinsPerWeek < maxSpinsPerDay", {
		...DEMO_CONFIG,
		rules: { ...DEMO_RULES, maxSpinsPerDay: 5, maxSpinsPerWeek: 2 },
	});

	const lowWeight = segmentFrom({
		id: "00000000-0000-4000-8000-0000000000a1",
		label: "Low",
		weight: 10,
		prizeType: "none",
	});
	const highWeight = segmentFrom({
		id: "00000000-0000-4000-8000-0000000000a2",
		label: "High",
		weight: 90,
		prizeType: "none",
	});
	const pair = [lowWeight, highWeight];

	const available = filterAvailableSegments([
		lowWeight,
		segmentFrom({
			id: "00000000-0000-4000-8000-0000000000a3",
			label: "Sold out",
			weight: 50,
			prizeType: "none",
			stockLimit: 1,
			stockUsed: 1,
		}),
	]);

	if (available.length !== 1 || available[0]?.toPrimitives().id !== lowWeight.toPrimitives().id) {
		console.error("❌ filterAvailableSegments excludes exhausted stock");
		process.exit(1);
	}

	console.log("✅ filterAvailableSegments excludes exhausted stock");

	const exhaustedOnly = [
		segmentFrom({
			id: "00000000-0000-4000-8000-0000000000b1",
			label: "Out",
			weight: 10,
			prizeType: "none",
			stockLimit: 1,
			stockUsed: 1,
		}),
	];

	try {
		pickSegment(exhaustedOnly, () => 0);
		console.error("❌ expected RouletteSegmentsExhausted when all out of stock");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSegmentsExhausted)) {
			console.error("❌ wrong error for exhausted pool", error);
			process.exit(1);
		}
	}

	console.log("✅ pickSegment throws when all segments exhausted");

	const lowPick = pickSegment(pair, () => 0);

	if (lowPick.segment.toPrimitives().id !== lowWeight.toPrimitives().id || lowPick.segmentIndex !== 0) {
		console.error("❌ pickSegment rng=0 expected first segment", lowPick);
		process.exit(1);
	}

	console.log("✅ pickSegment rng=0 picks first weighted segment");

	const highPick = pickSegment(pair, () => 0.95);

	if (
		highPick.segment.toPrimitives().id !== highWeight.toPrimitives().id ||
		highPick.segmentIndex !== 1
	) {
		console.error("❌ pickSegment rng=0.95 expected high weight segment", highPick);
		process.exit(1);
	}

	console.log("✅ pickSegment rng=0.95 picks high weight segment");

	const lastEdgePick = pickSegment(pair, () => 0.999999);

	if (lastEdgePick.segment.toPrimitives().id !== highWeight.toPrimitives().id) {
		console.error("❌ pickSegment edge roll expected last segment", lastEdgePick);
		process.exit(1);
	}

	console.log("✅ pickSegment edge roll picks last segment");

	const renormalized = computeSegmentProbabilities([
		lowWeight,
		segmentFrom({
			id: "00000000-0000-4000-8000-0000000000c1",
			label: "Sold",
			weight: 90,
			prizeType: "none",
			stockLimit: 1,
			stockUsed: 1,
		}),
	]);

	if (renormalized.length !== 1 || renormalized[0]?.probability !== 1) {
		console.error("❌ computeSegmentProbabilities renormalizes to 100%", renormalized);
		process.exit(1);
	}

	console.log("✅ computeSegmentProbabilities renormalizes when one segment exhausted");

	const probs = computeSegmentProbabilities(pair);
	const lowProb = probs.find((row) => row.segmentId === lowWeight.toPrimitives().id);
	const highProb = probs.find((row) => row.segmentId === highWeight.toPrimitives().id);

	if (lowProb?.probability !== 0.1 || highProb?.probability !== 0.9) {
		console.error("❌ computeSegmentProbabilities ratios", probs);
		process.exit(1);
	}

	console.log("✅ computeSegmentProbabilities returns correct ratios");

	console.log("✅ verify:roulette-wheel-use-case passed");
}

main();
