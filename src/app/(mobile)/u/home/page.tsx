import type { Metadata } from "next";

import { PlatformUserHomePlaceholder } from "./PlatformUserHomePlaceholder";

export const metadata: Metadata = {
	title: "Inicio — App Fidelización",
};

export default function PlatformUserHomePage(): React.ReactElement {
	return <PlatformUserHomePlaceholder />;
}
