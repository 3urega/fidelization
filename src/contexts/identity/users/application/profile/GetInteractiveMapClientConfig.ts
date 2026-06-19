import { Service } from "diod";

import type { InteractiveMapClientConfig } from "../../../../shared/maps/domain/InteractiveMapClientConfig";
import { InteractiveMapClientConfigProvider } from "../../../../shared/maps/domain/InteractiveMapClientConfigProvider";

@Service()
export class GetInteractiveMapClientConfig {
	constructor(private readonly interactiveMapClientConfigProvider: InteractiveMapClientConfigProvider) {}

	execute(): InteractiveMapClientConfig {
		return this.interactiveMapClientConfigProvider.getConfig();
	}
}
