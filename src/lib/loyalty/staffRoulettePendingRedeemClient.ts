export type StaffPendingRouletteSpin = {
	spinId: string;
	segmentLabel: string;
	prizeDescription: string | null;
	createdAt: string;
};

type PendingResponse = {
	customerId?: string;
	customerName?: string;
	pendingSpins?: StaffPendingRouletteSpin[];
	error?: { description?: string };
};

type RedeemResponse = {
	spinId?: string;
	status?: string;
	redeemedAt?: string;
	error?: { type?: string; description?: string };
};

export type LoadPendingRouletteSpinsResult =
	| {
			ok: true;
			customerName: string | null;
			pendingSpins: StaffPendingRouletteSpin[];
	  }
	| { ok: false; errorMessage: string };

export async function loadPendingRouletteSpinsForStaff(
	qrValue: string,
): Promise<LoadPendingRouletteSpinsResult> {
	const trimmed = qrValue.trim();

	if (!trimmed) {
		return { ok: false, errorMessage: "Falta el código QR del cliente." };
	}

	try {
		const response = await fetch(
			`/api/loyalty/games/ruleta/spins/pending?qrValue=${encodeURIComponent(trimmed)}`,
			{ credentials: "include" },
		);
		const body = (await response.json()) as PendingResponse;

		if (!response.ok) {
			return {
				ok: false,
				errorMessage: body.error?.description ?? "No se pudieron cargar los premios pendientes.",
			};
		}

		return {
			ok: true,
			customerName: body.customerName ?? null,
			pendingSpins: body.pendingSpins ?? [],
		};
	} catch {
		return { ok: false, errorMessage: "Error de red al cargar premios pendientes." };
	}
}

export type RedeemRouletteSpinResult =
	| { ok: true; spinId: string }
	| { ok: false; errorMessage: string; statusCode?: number };

export async function redeemRouletteSpinForStaff(spinId: string): Promise<RedeemRouletteSpinResult> {
	try {
		const response = await fetch(`/api/loyalty/games/ruleta/spins/${spinId}/redeem`, {
			method: "POST",
			credentials: "include",
		});
		const body = (await response.json()) as RedeemResponse;

		if (!response.ok || body.status !== "applied") {
			return {
				ok: false,
				errorMessage: body.error?.description ?? "No se pudo marcar el premio como canjeado.",
				statusCode: response.status,
			};
		}

		return { ok: true, spinId: body.spinId ?? spinId };
	} catch {
		return { ok: false, errorMessage: "Error de red al canjear el premio." };
	}
}
