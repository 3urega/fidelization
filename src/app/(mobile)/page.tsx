import type { Metadata } from "next";

import { PlatformGoogleOAuthEnabledMarker } from "../_components/platform-app/PlatformGoogleOAuthEnabledMarker";
import { PlatformPublicHomeActions } from "../_components/platform-app/PlatformPublicHomeActions";
import { PlatformPublicHomeBenefits } from "../_components/platform-app/PlatformPublicHomeBenefits";
import { PlatformPublicHomeHeroVisual } from "../_components/platform-app/PlatformPublicHomeHeroVisual";
import { PlatformPublicHomeLogo } from "../_components/platform-app/PlatformPublicHomeLogo";

export const metadata: Metadata = {
	title: "Fideli — Tus cafés favoritos te recompensan",
	description:
		"Acumula sellos, consigue premios y descubre promociones exclusivas en tus locales favoritos.",
};

export default function PlatformAppPublicHomePage(): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col gap-6 py-2">
			<PlatformGoogleOAuthEnabledMarker />
			<header className="flex flex-col items-center gap-3 text-center">
				<PlatformPublicHomeLogo />
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-foreground">
						Tus cafés favoritos te recompensan
					</h1>
					<p className="text-sm text-muted">
						Acumula sellos, consigue premios y disfruta de ventajas exclusivas.
					</p>
				</div>
			</header>

			<PlatformPublicHomeHeroVisual />
			<PlatformPublicHomeBenefits />
			<PlatformPublicHomeActions />
		</main>
	);
}
