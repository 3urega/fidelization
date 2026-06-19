export type UserStampCampaignProgress = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeId?: string | null;
	stampTypeLabel?: string;
	visualTemplate?: string | null;
	cardBackgroundVariant?: string | null;
	conditions?: string;
};

export type UserEstablishmentStampSource = {
	name: string;
	slug: string;
	logoUrl: string | null;
	stampProgress: UserStampCampaignProgress[];
};

export type UserStampCardItem = {
	establishmentName: string;
	establishmentSlug: string;
	logoUrl: string | null;
	campaign: UserStampCampaignProgress;
};

export type UserStampCardsSummary = {
	inProgress: UserStampCardItem[];
	completed: UserStampCardItem[];
};

function compareStampCardItems(a: UserStampCardItem, b: UserStampCardItem): number {
	const byEstablishment = a.establishmentName.localeCompare(b.establishmentName, "es");
	if (byEstablishment !== 0) {
		return byEstablishment;
	}

	return a.campaign.campaignName.localeCompare(b.campaign.campaignName, "es");
}

export function buildUserStampCardsSummary(
	establishments: UserEstablishmentStampSource[],
): UserStampCardsSummary {
	const inProgress: UserStampCardItem[] = [];
	const completed: UserStampCardItem[] = [];

	for (const establishment of establishments) {
		for (const campaign of establishment.stampProgress) {
			const item: UserStampCardItem = {
				establishmentName: establishment.name,
				establishmentSlug: establishment.slug,
				logoUrl: establishment.logoUrl,
				campaign,
			};

			if (campaign.completed) {
				completed.push(item);
			} else if (campaign.current > 0) {
				inProgress.push(item);
			}
		}
	}

	inProgress.sort(compareStampCardItems);
	completed.sort(compareStampCardItems);

	return { inProgress, completed };
}
