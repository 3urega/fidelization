export type DiscoverableEstablishment = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	coverImageUrl: string | null;
	tags: string[];
};

export type DiscoverableEstablishmentsPage = {
	establishments: DiscoverableEstablishment[];
	hasMore: boolean;
};
