import type { InteractiveMapClientConfig } from "./InteractiveMapClientConfig";

export abstract class InteractiveMapClientConfigProvider {
	abstract getConfig(): InteractiveMapClientConfig;
}
