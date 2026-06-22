import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import {
	PLATFORM_SETTING_DISPLAY_NAME,
	PLATFORM_SETTING_LOGO_URL,
	PlatformBranding,
} from "../domain/PlatformBranding";
import { PlatformSettingsRepository } from "../domain/PlatformSettingsRepository";

@Service()
export class PrismaPlatformSettingsRepository extends PlatformSettingsRepository {
	async getBranding(): Promise<PlatformBranding> {
		const rows = await prisma.platformSetting.findMany({
			where: {
				key: {
					in: [PLATFORM_SETTING_DISPLAY_NAME, PLATFORM_SETTING_LOGO_URL],
				},
			},
		});

		const byKey = new Map(rows.map((row) => [row.key, row.value]));

		return PlatformBranding.fromPrimitives({
			displayName: byKey.get(PLATFORM_SETTING_DISPLAY_NAME) ?? PlatformBranding.default().displayName,
			logoUrl: byKey.get(PLATFORM_SETTING_LOGO_URL) ?? "",
		});
	}

	async saveBranding(branding: PlatformBranding): Promise<void> {
		const primitives = branding.toPrimitives();

		await prisma.$transaction([
			prisma.platformSetting.upsert({
				where: { key: PLATFORM_SETTING_DISPLAY_NAME },
				create: {
					key: PLATFORM_SETTING_DISPLAY_NAME,
					value: primitives.displayName,
				},
				update: {
					value: primitives.displayName,
				},
			}),
			prisma.platformSetting.upsert({
				where: { key: PLATFORM_SETTING_LOGO_URL },
				create: {
					key: PLATFORM_SETTING_LOGO_URL,
					value: primitives.logoUrl,
				},
				update: {
					value: primitives.logoUrl,
				},
			}),
		]);
	}
}
