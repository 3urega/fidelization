import { notFound } from "next/navigation";
import { type ReactElement } from "react";

import { InteractiveSearchZoneMapDevClient } from "./InteractiveSearchZoneMapDevClient";

export default function InteractiveSearchZoneMapDevPage(): ReactElement {
	if (process.env.NODE_ENV !== "development") {
		notFound();
	}

	return <InteractiveSearchZoneMapDevClient />;
}
