import type { Metadata } from "next";

import { PlatformJoinDeepLink } from "./PlatformJoinDeepLink";

type PlatformJoinPageProps = {
	params: { slug: string };
};

export function generateMetadata({ params }: PlatformJoinPageProps): Metadata {
	return {
		title: `Unirse a ${params.slug} — App Fidelización`,
	};
}

/** Deep link entry: QR / escaparate → /u/join/{slug} (issue #42). */
export default function PlatformJoinPage(): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<PlatformJoinDeepLink />
		</main>
	);
}
