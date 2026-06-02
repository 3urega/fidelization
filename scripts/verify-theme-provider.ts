import "dotenv/config";

import { applyPresetToDocument } from "../src/app/_components/theme/applyPreset";
import { applyThemeToDocument } from "../src/app/_components/theme/applyTheme";
import { demoTenantTheme, mockTenantThemes } from "../src/app/_components/theme/mockTenantThemes";
import { themePresetIds } from "../src/app/_components/theme/themePresets";

function createDocumentMock(): Map<string, string> {
	const setProperties = new Map<string, string>();

	// @ts-expect-error minimal DOM mock for runtime theme application
	globalThis.document = {
		documentElement: {
			style: {
				setProperty(name: string, value: string): void {
					setProperties.set(name, value);
				},
			},
		},
	};

	return setProperties;
}

function assertThemeApplied(
	label: string,
	theme: { primaryColor: string; secondaryColor: string },
	properties: Map<string, string>,
): void {
	applyThemeToDocument(theme);

	if (properties.get("--color-primary") !== theme.primaryColor) {
		console.error(`❌ ${label}: --color-primary mismatch`);
		process.exit(1);
	}

	if (properties.get("--color-secondary") !== theme.secondaryColor) {
		console.error(`❌ ${label}: --color-secondary mismatch`);
		process.exit(1);
	}

	console.log(`✅ applyTheme: ${label}`);
}

for (const [label, theme] of Object.entries(mockTenantThemes)) {
	assertThemeApplied(label, theme, createDocumentMock());
}

for (const presetId of themePresetIds) {
	const properties = createDocumentMock();
	const applied = applyPresetToDocument(presetId);

	if (!applied["--color-background"]) {
		console.error(`❌ preset ${presetId}: missing background token`);
		process.exit(1);
	}

	if (properties.get("--color-background") !== applied["--color-background"]) {
		console.error(`❌ preset ${presetId}: background not applied to DOM`);
		process.exit(1);
	}

	console.log(`✅ applyPreset: ${presetId}`);
}

async function verifyDemoApiBranding(): Promise<void> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

	try {
		const response = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
		const body = (await response.json()) as {
			tenant?: { name: string; primaryColor: string; secondaryColor: string };
			error?: { description?: string };
		};

		if (!response.ok || !body.tenant) {
			console.log(
				"⚠️  Demo API skipped (dev server?):",
				body.error?.description ?? response.status,
			);

			return;
		}

		if (
			body.tenant.primaryColor !== demoTenantTheme.primaryColor ||
			body.tenant.secondaryColor !== demoTenantTheme.secondaryColor
		) {
			console.error("❌ Demo tenant colors do not match demoTenantTheme mock");
			process.exit(1);
		}

		console.log(`✅ Demo API returns tenant branding (${body.tenant.name})`);
	} catch {
		console.log("⚠️  Demo API skipped (dev server not running)");
	}
}

void verifyDemoApiBranding();
