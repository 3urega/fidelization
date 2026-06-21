import type { Metadata } from "next";

import { RouletteSpinClient } from "./RouletteSpinClient";

type RuletaPageProps = {
	params: { slug: string };
};

export function generateMetadata({ params }: RuletaPageProps): Metadata {
	return {
		title: `Ruleta — ${params.slug}`,
	};
}

export default function EstablishmentRoulettePage(): React.ReactElement {
	return <RouletteSpinClient />;
}
