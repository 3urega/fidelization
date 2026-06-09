import type { Metadata } from "next";

import { PlatformUserDashboard } from "./PlatformUserDashboard";

export const metadata: Metadata = {
	title: "Inicio — App Fidelización",
};

export default function PlatformUserHomePage(): React.ReactElement {
	return <PlatformUserDashboard />;
}
