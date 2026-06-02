import { applyThemeTokensToDocument } from "./applyThemeTokens";
import {
	defaultPresetId,
	resolvePresetTokens,
	type ThemePresetId,
	type ThemeTokenSet,
} from "./themePresets";

export type { ThemePresetId };
export { defaultPresetId, resolvePresetTokens };

export function applyPresetToDocument(presetId: ThemePresetId): ThemeTokenSet {
	const tokens = resolvePresetTokens(presetId);
	applyThemeTokensToDocument(tokens);

	return tokens;
}

/** Canonical preset API (issue #3). */
export const applyPreset = applyPresetToDocument;
