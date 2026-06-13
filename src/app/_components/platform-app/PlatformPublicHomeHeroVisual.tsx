import Image from "next/image";
import type { ReactElement } from "react";

const HOME_HERO_IMAGE = "/assets/img/home_image.png";

/** Main hero illustration for the public home. */
export function PlatformPublicHomeHeroVisual(): ReactElement {
	return (
		<div className="relative w-full overflow-hidden rounded-xl">
			<Image
				src={HOME_HERO_IMAGE}
				alt="Tarjeta de fidelización Fideli con sellos de café, un latte, un croissant y un premio"
				width={1774}
				height={887}
				className="h-auto w-full"
				priority
				sizes="(max-width: 448px) 100vw, 448px"
			/>
		</div>
	);
}
