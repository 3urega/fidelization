"use client";

import { useCallback, useEffect, useState } from "react";

type ScanContextResponse = {
	unlockEnabled?: boolean;
};

export function useStaffRouletteScanContext(): {
	unlockEnabled: boolean;
	loading: boolean;
} {
	const [unlockEnabled, setUnlockEnabled] = useState(false);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);

		try {
			const response = await fetch("/api/loyalty/games/ruleta/scan-context", {
				credentials: "include",
			});

			if (!response.ok) {
				setUnlockEnabled(false);

				return;
			}

			const data = (await response.json()) as ScanContextResponse;
			setUnlockEnabled(data.unlockEnabled === true);
		} catch {
			setUnlockEnabled(false);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	return { unlockEnabled, loading };
}
