import Image from "next/image";
import type { ReactElement } from "react";

const LOGO_IMAGE = "/assets/img/logo_fideli.png";

export function PlatformPublicHomeLogo(): ReactElement {
	return (
		<Image
			src={LOGO_IMAGE}
			alt="Fideli — app de fidelización"
			width={1536}
			height={1024}
			className="mx-auto h-auto w-full max-w-[13.5rem]"
			priority
			sizes="(max-width: 448px) 40vw, 216px"
		/>
	);
}
