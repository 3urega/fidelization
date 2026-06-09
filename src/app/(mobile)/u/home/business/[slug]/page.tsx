import type { Metadata } from "next";

import { PlatformBusinessAdminEntry } from "./PlatformBusinessAdminEntry";

type PlatformBusinessAdminPageProps = {
	params: { slug: string };
};

export function generateMetadata({ params }: PlatformBusinessAdminPageProps): Metadata {
	return {
		title: `${params.slug} — App Fidelización`,
	};
}

export default function PlatformBusinessAdminPage(): React.ReactElement {
	return <PlatformBusinessAdminEntry />;
}
