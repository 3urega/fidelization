"use client";

import { createContext, type ReactElement, type ReactNode, useContext } from "react";

import { useStaffScanSessionState } from "./useStaffScanSession";
import type { StaffScanSessionData, StaffScanSessionError } from "./staffScanSessionTypes";

type StaffScanSessionContextValue = {
	session: StaffScanSessionData | null;
	loading: boolean;
	error: StaffScanSessionError | null;
	pendingQrValue: string | null;
	loadByQr: (qrValue: string) => Promise<StaffScanSessionData | null>;
	loadByCustomerId: (customerId: string) => Promise<StaffScanSessionData | null>;
	refetch: () => Promise<StaffScanSessionData | null>;
	clearSession: () => void;
};

const StaffScanSessionContext = createContext<StaffScanSessionContextValue | null>(null);

export function StaffScanSessionProvider({ children }: { children: ReactNode }): ReactElement {
	const value = useStaffScanSessionState();

	return (
		<StaffScanSessionContext.Provider value={value}>{children}</StaffScanSessionContext.Provider>
	);
}

export function useStaffScanSession(): StaffScanSessionContextValue {
	const context = useContext(StaffScanSessionContext);

	if (!context) {
		throw new Error("useStaffScanSession must be used within StaffScanSessionProvider");
	}

	return context;
}
