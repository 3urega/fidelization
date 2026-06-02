import {
	applyPresetToDocument,
	resolvePresetTokens,
} from "../src/app/_components/theme/applyPreset";
import {
	defaultPresetId,
	systemBaseTokens,
	themePresetIds,
	type ThemePresetId,
} from "../src/app/_components/theme/themePresets";

function createDocumentMock(): Map<string, string> {
	const properties = new Map<string, string>();

	// @ts-expect-error minimal DOM mock for runtime theme application
	globalThis.document = {
		documentElement: {
			style: {
				setProperty(name: string, value: string): void {
					properties.set(name, value);
				},
			},
		},
	};

	return properties;
}

function assertResolvedPreset(presetId: ThemePresetId): void {
	const resolved = resolvePresetTokens(presetId);

	for (const key of Object.keys(systemBaseTokens)) {
		if (!(key in resolved) || resolved[key as keyof typeof resolved] === undefined) {
			console.error(`❌ ${presetId}: missing merged token ${key}`);
			process.exit(1);
		}
	}

	const properties = createDocumentMock();
	const applied = applyPresetToDocument(presetId);

	for (const [name, value] of Object.entries(applied)) {
		if (properties.get(name) !== value) {
			console.error(`❌ ${presetId}: DOM mismatch for ${name}`);
			process.exit(1);
		}
	}

	console.log(`✅ preset ${presetId}: merge + applyPresetToDocument`);
}

for (const presetId of themePresetIds) {
	assertResolvedPreset(presetId);
}

const backgrounds = themePresetIds.map((id) => resolvePresetTokens(id)["--color-background"]);
const uniqueBackgrounds = new Set(backgrounds);

if (uniqueBackgrounds.size !== themePresetIds.length) {
	console.error("❌ Presets should differ in --color-background (sanity check for VS2)");
	process.exit(1);
}

if (defaultPresetId !== "cafeClassic") {
	console.error("❌ defaultPresetId should be cafeClassic");
	process.exit(1);
}

console.log("✅ All presets merge system base + overrides");
console.log(`✅ defaultPresetId: ${defaultPresetId}`);
