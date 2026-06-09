import type { Metadata } from "next";

import { PlatformUserQrScreen } from "./PlatformUserQrScreen";

export const metadata: Metadata = {
	title: "Mi QR — App Fidelización",
};

export default function PlatformUserQrPage(): React.ReactElement {
	return <PlatformUserQrScreen />;
}
