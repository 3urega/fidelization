export type DiscoverableEstablishment = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

export type DiscoverableEstablishmentsPage = {
	establishments: DiscoverableEstablishment[];
	hasMore: boolean;
};
