import {
	isStaffScanOutcome,
	type StaffScanOutcome,
} from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import {
	ROULETTE_AUTHORIZE_TARGET_ID,
	type StaffScanTargetType,
} from "../../../contexts/loyalty/customers/domain/StaffScanTarget";

type ScanResponse = {
	customer?: {
		name: string;
		pointsBalance: number;
		visitsCount: number;
	};
	outcomes?: unknown[];
	error?: {
		description?: string;
	};
};

export type StaffScanRecordCustomer = {
	name: string;
	pointsBalance: number;
	visitsCount: number;
};

export type StaffScanRecordSuccess = {
	ok: true;
	outcomes: StaffScanOutcome[];
	customer: StaffScanRecordCustomer | null;
};

export type StaffScanRecordFailure = {
	ok: false;
	errorMessage: string;
};

export type StaffScanRecordResult = StaffScanRecordSuccess | StaffScanRecordFailure;

export type RecordStaffScanByTargetParams =
	| {
			qrValue: string;
			targetType: Extract<StaffScanTargetType, "stamp_campaign" | "promotion">;
			targetId: string;
	  }
	| {
			qrValue: string;
			targetType: "roulette_authorize";
			targetId?: string;
			purchaseAmountEuros: number;
	  };

function parseOutcomes(value: unknown[] | undefined): StaffScanOutcome[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isStaffScanOutcome);
}

export async function recordStaffScanByTarget(
	params: RecordStaffScanByTargetParams,
): Promise<StaffScanRecordResult> {
	const trimmedQr = params.qrValue.trim();

	if (!trimmedQr) {
		return { ok: false, errorMessage: "Falta el código QR del cliente. Identifica de nuevo desde Escanear QR." };
	}

	const body: Record<string, unknown> = {
		qrValue: trimmedQr,
		targetType: params.targetType,
	};

	if (params.targetType === "roulette_authorize") {
		body.targetId = params.targetId ?? ROULETTE_AUTHORIZE_TARGET_ID;
		body.purchaseAmountEuros = params.purchaseAmountEuros;
	} else {
		body.targetId = params.targetId;
	}

	try {
		const response = await fetch("/api/loyalty/scan", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		const responseBody = (await response.json()) as ScanResponse;

		if (!response.ok) {
			return {
				ok: false,
				errorMessage: responseBody.error?.description ?? "No se pudo completar el escaneo.",
			};
		}

		return {
			ok: true,
			outcomes: parseOutcomes(responseBody.outcomes),
			customer: responseBody.customer ?? null,
		};
	} catch {
		return { ok: false, errorMessage: "Error de red al registrar el escaneo." };
	}
}
