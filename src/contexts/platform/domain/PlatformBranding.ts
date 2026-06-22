export const DEFAULT_PLATFORM_DISPLAY_NAME = "Plataforma";

export const PLATFORM_SETTING_DISPLAY_NAME = "display_name";
export const PLATFORM_SETTING_LOGO_URL = "logo_url";

export type PlatformBrandingPrimitives = {
	displayName: string;
	logoUrl: string;
};

export class PlatformBranding {
	private constructor(
		public readonly displayName: string,
		public readonly logoUrl: string,
	) {}

	static default(): PlatformBranding {
		return new PlatformBranding(DEFAULT_PLATFORM_DISPLAY_NAME, "");
	}

	static fromPrimitives(primitives: PlatformBrandingPrimitives): PlatformBranding {
		return new PlatformBranding(primitives.displayName, primitives.logoUrl);
	}

	toPrimitives(): PlatformBrandingPrimitives {
		return {
			displayName: this.displayName,
			logoUrl: this.logoUrl,
		};
	}
}
