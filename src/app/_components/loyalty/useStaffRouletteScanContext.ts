"use client";

import { useCallback, useEffect, useState } from "react";

type ScanContextResponse = {
	unlockEnabled?: boolean;
	authorizeEnabled?: boolean;
	minPurchaseEuros?: number | null;
};

export function useStaffRouletteScanContext(): {
	unlockEnabled: boolean;
	authorizeEnabled: boolean;
	minPurchaseEuros: number | null;
	loading: boolean;
} {
	const [unlockEnabled, setUnlockEnabled] = useState(false);
	const [authorizeEnabled, setAuthorizeEnabled] = useState(false);
	const [minPurchaseEuros, setMinPurchaseEuros] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);

		try {
			const response = await fetch("/api/loyalty/games/ruleta/scan-context", {
				credentials: "include",
			});

			if (!response.ok) {
				setUnlockEnabled(false);
				setAuthorizeEnabled(false);
				setMinPurchaseEuros(null);

				return;
			}

			const data = (await response.json()) as ScanContextResponse;
			setUnlockEnabled(data.unlockEnabled === true);
			setAuthorizeEnabled(data.authorizeEnabled === true);
			setMinPurchaseEuros(
				typeof data.minPurchaseEuros === "number" ? data.minPurchaseEuros : null,
			);
		} catch {
			setUnlockEnabled(false);
			setAuthorizeEnabled(false);
			setMinPurchaseEuros(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	return { unlockEnabled, authorizeEnabled, minPurchaseEuros, loading };
}
