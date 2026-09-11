import type { ReactElement, ReactNode } from "react";

import { StaffScanSessionProvider } from "../../_components/loyalty/StaffScanSessionProvider";

export default function ScanLayout({ children }: { children: ReactNode }): ReactElement {
	return <StaffScanSessionProvider>{children}</StaffScanSessionProvider>;
}
