export type PlatformIntegrationItemStatus = {
	key: string;
	label: string;
	configured: boolean;
	hint?: string;
};

export type PlatformIntegrationGroupStatus = {
	key: string;
	label: string;
	configured: boolean;
	items: PlatformIntegrationItemStatus[];
};

export type PlatformIntegrationStatus = {
	groups: PlatformIntegrationGroupStatus[];
};
