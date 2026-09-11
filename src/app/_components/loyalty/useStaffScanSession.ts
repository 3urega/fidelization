"use client";

import { useCallback, useState } from "react";

import type { StaffScanSessionData, StaffScanSessionError } from "./staffScanSessionTypes";

type SessionApiResponse = StaffScanSessionData & {
	error?: { description?: string; type?: string };
};

async function fetchSession(query: Record<string, string>): Promise<{
	ok: boolean;
	status: number;
	body: SessionApiResponse;
}> {
	const params = new URLSearchParams(query);
	const response = await fetch(`/api/loyalty/scan/session?${params.toString()}`, {
		credentials: "include",
	});
	const body = (await response.json()) as SessionApiResponse;

	return { ok: response.ok, status: response.status, body };
}

function toError(status: number, body: SessionApiResponse): StaffScanSessionError {
	return {
		status,
		message: body.error?.description ?? "No se pudo cargar la sesión del cliente.",
	};
}

export function useStaffScanSessionState(): {
	session: StaffScanSessionData | null;
	loading: boolean;
	error: StaffScanSessionError | null;
	pendingQrValue: string | null;
	loadByQr: (qrValue: string) => Promise<StaffScanSessionData | null>;
	loadByCustomerId: (customerId: string) => Promise<StaffScanSessionData | null>;
	refetch: () => Promise<StaffScanSessionData | null>;
	clearSession: () => void;
} {
	const [session, setSession] = useState<StaffScanSessionData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<StaffScanSessionError | null>(null);
	const [pendingQrValue, setPendingQrValue] = useState<string | null>(null);
	const [lastCustomerId, setLastCustomerId] = useState<string | null>(null);

	const applyResult = useCallback(
		(
			result: { ok: boolean; status: number; body: SessionApiResponse },
			qrValue: string | null,
		): StaffScanSessionData | null => {
			if (!result.ok || !result.body.customer?.id) {
				setError(toError(result.status, result.body));
				setSession(null);

				return null;
			}

			const data: StaffScanSessionData = {
				customer: result.body.customer,
				tenantCapabilities: result.body.tenantCapabilities,
				stampCards: result.body.stampCards ?? [],
				promotions: result.body.promotions ?? [],
				roulette: result.body.roulette ?? null,
			};

			setSession(data);
			setLastCustomerId(data.customer.id);
			setError(null);

			if (qrValue !== null) {
				setPendingQrValue(qrValue);
			}

			return data;
		},
		[],
	);

	const loadByQr = useCallback(
		async (qrValue: string): Promise<StaffScanSessionData | null> => {
			const trimmed = qrValue.trim();

			if (!trimmed) {
				setError({ status: 400, message: "Introduce el código QR del cliente." });

				return null;
			}

			setLoading(true);
			setError(null);

			try {
				const result = await fetchSession({ qrValue: trimmed });

				return applyResult(result, trimmed);
			} catch {
				setError({ status: 0, message: "Error de red al identificar al cliente." });
				setSession(null);

				return null;
			} finally {
				setLoading(false);
			}
		},
		[applyResult],
	);

	const loadByCustomerId = useCallback(
		async (customerId: string): Promise<StaffScanSessionData | null> => {
			const trimmed = customerId.trim();

			if (!trimmed) {
				setError({ status: 400, message: "Cliente no válido." });

				return null;
			}

			setLoading(true);
			setError(null);

			try {
				const result = await fetchSession({ customerId: trimmed });

				return applyResult(result, null);
			} catch {
				setError({ status: 0, message: "Error de red al cargar la sesión." });
				setSession(null);

				return null;
			} finally {
				setLoading(false);
			}
		},
		[applyResult],
	);

	const refetch = useCallback(async (): Promise<StaffScanSessionData | null> => {
		const id = lastCustomerId ?? session?.customer.id;

		if (!id) {
			return null;
		}

		return loadByCustomerId(id);
	}, [lastCustomerId, session?.customer.id, loadByCustomerId]);

	const clearSession = useCallback((): void => {
		setSession(null);
		setError(null);
		setPendingQrValue(null);
		setLastCustomerId(null);
	}, []);

	return {
		session,
		loading,
		error,
		pendingQrValue,
		loadByQr,
		loadByCustomerId,
		refetch,
		clearSession,
	};
}
