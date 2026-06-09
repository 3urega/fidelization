import type { Metadata } from "next";

import { PlatformEstablishmentDetail } from "./PlatformEstablishmentDetail";

type PlatformEstablishmentPageProps = {
	params: { slug: string };
};

export function generateMetadata({ params }: PlatformEstablishmentPageProps): Metadata {
	return {
		title: `${params.slug} — App Fidelización`,
	};
}

export default function PlatformEstablishmentPage(): React.ReactElement {
	return <PlatformEstablishmentDetail />;
}
