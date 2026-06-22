import { PlatformBranding } from "./PlatformBranding";

export abstract class PlatformSettingsRepository {
	abstract getBranding(): Promise<PlatformBranding>;

	abstract saveBranding(branding: PlatformBranding): Promise<void>;
}
