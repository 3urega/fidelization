/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetPlatformSettings } from "../src/contexts/platform/application/settings/GetPlatformSettings";
import { UpdatePlatformSettings } from "../src/contexts/platform/application/settings/UpdatePlatformSettings";
import { InvalidPlatformBranding } from "../src/contexts/platform/domain/InvalidPlatformBranding";
import {
	DEFAULT_PLATFORM_DISPLAY_NAME,
	PlatformBranding,
} from "../src/contexts/platform/domain/PlatformBranding";
import { PlatformSettingsRepository } from "../src/contexts/platform/domain/PlatformSettingsRepository";
import { buildPlatformIntegrationStatus } from "../src/lib/platform/integrationStatus";

class InMemoryPlatformSettingsRepository extends PlatformSettingsRepository {
	constructor(private branding: PlatformBranding = PlatformBranding.default()) {
		super();
	}

	async getBranding(): Promise<PlatformBranding> {
		return this.branding;
	}

	async saveBranding(branding: PlatformBranding): Promise<void> {
		this.branding = branding;
	}

	snapshot(): PlatformBranding {
		return this.branding;
	}
}

async function assertInvalidBranding(
	update: UpdatePlatformSettings,
	input: { displayName?: string; logoUrl?: string },
	expectedMessagePart: string,
): Promise<void> {
	try {
		await update.execute({ branding: input });
		console.error("❌ expected InvalidPlatformBranding for", input);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidPlatformBranding)) {
			console.error("❌ unexpected error", error);
			process.exit(1);
		}

		if (!error.message.includes(expectedMessagePart)) {
			console.error("❌ unexpected branding error message", error.message);
			process.exit(1);
		}
	}
}

async function main(): Promise<void> {
	const repository = new InMemoryPlatformSettingsRepository();
	const getSettings = new GetPlatformSettings(repository);
	const updateSettings = new UpdatePlatformSettings(repository);

	const defaults = await getSettings.execute();

	if (defaults.branding.displayName !== DEFAULT_PLATFORM_DISPLAY_NAME || defaults.branding.logoUrl !== "") {
		console.error("❌ default branding", defaults.branding);
		process.exit(1);
	}

	console.log("✅ GetPlatformSettings returns defaults");

	const integrations = buildPlatformIntegrationStatus();
	const groupKeys = integrations.groups.map((group) => group.key);

	if (
		!groupKeys.includes("auth") ||
		!groupKeys.includes("stripe") ||
		!groupKeys.includes("googleOAuth") ||
		!groupKeys.includes("appDomain") ||
		!groupKeys.includes("smtp")
	) {
		console.error("❌ integration groups", groupKeys);
		process.exit(1);
	}

	const serialized = JSON.stringify(integrations);

	if (serialized.includes("sk_") || serialized.includes("whsec_") || serialized.includes("change-me")) {
		console.error("❌ integration status must not expose secret values");
		process.exit(1);
	}

	console.log("✅ buildPlatformIntegrationStatus groups without secrets");

	const updated = await updateSettings.execute({
		branding: {
			displayName: "Fideli Admin",
			logoUrl: "https://example.com/logo.png",
		},
	});

	if (updated.displayName !== "Fideli Admin" || updated.logoUrl !== "https://example.com/logo.png") {
		console.error("❌ update branding", updated);
		process.exit(1);
	}

	const afterUpdate = await getSettings.execute();

	if (
		afterUpdate.branding.displayName !== "Fideli Admin" ||
		afterUpdate.branding.logoUrl !== "https://example.com/logo.png"
	) {
		console.error("❌ persisted branding", afterUpdate.branding);
		process.exit(1);
	}

	console.log("✅ UpdatePlatformSettings persists branding");

	await assertInvalidBranding(updateSettings, { displayName: "   " }, "displayName is required");
	await assertInvalidBranding(updateSettings, { logoUrl: "not-a-url" }, "valid http or https URL");
	await assertInvalidBranding(updateSettings, { logoUrl: "ftp://example.com/x.png" }, "http or https");
	await assertInvalidBranding(updateSettings, {}, "At least one branding field");

	console.log("✅ InvalidPlatformBranding validation");

	const logoOnly = await updateSettings.execute({ branding: { logoUrl: "" } });

	if (logoOnly.logoUrl !== "" || logoOnly.displayName !== "Fideli Admin") {
		console.error("❌ partial logo update", logoOnly);
		process.exit(1);
	}

	console.log("✅ partial branding update");

	console.log("\n✅ verify:platform-admin-settings-use-case passed");
}

void main();
