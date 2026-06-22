"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { RouletteParticipationCard } from "../../../../../_components/loyalty/games/RouletteParticipationCard";
import {
	RouletteResultScreen,
	type RouletteSpinResultView,
} from "../../../../../_components/loyalty/games/RouletteResultScreen";
import { RouletteWheel } from "../../../../../_components/loyalty/games/RouletteWheel";
import { ROULETTE_WHEEL_ASSETS } from "../../../../../_components/loyalty/games/rouletteAssets";
import { Button } from "../../../../../_components/ui/Button";
import { Card } from "../../../../../_components/ui/Card";
import { platformFetch } from "../../../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../../../lib/platform/routes";
import {
	isStaffExplicitRoulette,
	rouletteStatusMessage,
	type RoulettePublicStateResponse,
} from "../../../../../../lib/roulette/roulettePublicStateClient";

type EstablishmentDetailResponse = {
	tenant: { name: string; primaryColor: string | null };
	error?: { description?: string };
};

type SpinResponse = RouletteSpinResultView & {
	spinId: string;
	segmentIndex: number;
	error?: { description?: string };
};

type ViewPhase =
	| "loading"
	| "disabled"
	| "not_enrolled"
	| "locked"
	| "ready"
	| "spinning"
	| "result";

function formatExpiresAt(iso: string): string {
	return new Date(iso).toLocaleString("es-ES", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function resolvePhase(state: RoulettePublicStateResponse): ViewPhase {
	if (!state.isEnabled) {
		return "disabled";
	}

	if (isStaffExplicitRoulette(state)) {
		switch (state.participationStatus) {
			case "not_enrolled":
			case "period_expired":
				return "not_enrolled";
			case "authorized_ready":
				return state.canSpin ? "ready" : "locked";
			case "active":
			case "quota_exhausted":
				return "locked";
			default:
				return "locked";
		}
	}

	return state.canSpin ? "ready" : "locked";
}

function lockedMessage(state: RoulettePublicStateResponse | null): string {
	if (!state) {
		return "No puedes girar la ruleta en este momento.";
	}

	if (isStaffExplicitRoulette(state)) {
		return rouletteStatusMessage(state);
	}

	if (state.eligibility) {
		return `Has alcanzado el límite de giros (máx. ${state.rules.maxSpinsPerDay} al día). Vuelve más tarde.`;
	}

	return "Pide en caja que escaneen tu QR para desbloquear la ruleta.";
}

export function RouletteSpinClient(): ReactElement {
	const params = useParams();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [phase, setPhase] = useState<ViewPhase>("loading");
	const [error, setError] = useState<string | null>(null);
	const [state, setState] = useState<RoulettePublicStateResponse | null>(null);
	const [tenantName, setTenantName] = useState("");
	const [tenantPrimaryColor, setTenantPrimaryColor] = useState<string | null>(null);
	const [spinResult, setSpinResult] = useState<SpinResponse | null>(null);
	const [targetSegmentIndex, setTargetSegmentIndex] = useState<number | null>(null);
	const [spinBusy, setSpinBusy] = useState(false);
	const [enrolling, setEnrolling] = useState(false);

	const load = useCallback(async (): Promise<RoulettePublicStateResponse | null> => {
		if (!slug) {
			setError("Local no válido");
			setPhase("disabled");

			return null;
		}

		setError(null);

		const [stateResponse, detailResponse] = await Promise.all([
			platformFetch(`/api/user/establishments/${encodeURIComponent(slug)}/games/ruleta`),
			platformFetch(`/api/user/establishments/${encodeURIComponent(slug)}`),
		]);

		const stateBody = (await stateResponse.json()) as RoulettePublicStateResponse;
		const detailBody = (await detailResponse.json()) as EstablishmentDetailResponse;

		if (!stateResponse.ok) {
			setError(stateBody.error?.description ?? "No se pudo cargar la ruleta");
			setPhase("disabled");

			return null;
		}

		if (!detailResponse.ok) {
			setError(detailBody.error?.description ?? "No se pudo cargar el local");
			setPhase("disabled");

			return null;
		}

		setState(stateBody);
		setTenantName(detailBody.tenant.name);
		setTenantPrimaryColor(detailBody.tenant.primaryColor);
		setPhase(resolvePhase(stateBody));

		return stateBody;
	}, [slug]);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleEnroll(): Promise<void> {
		setEnrolling(true);
		setError(null);

		const response = await platformFetch(
			`/api/user/establishments/${encodeURIComponent(slug)}/games/ruleta/enroll`,
			{ method: "POST" },
		);

		const body = (await response.json()) as { error?: { description?: string } };

		if (!response.ok) {
			setError(body.error?.description ?? "No se pudo activar la ruleta");
			setEnrolling(false);

			return;
		}

		setEnrolling(false);
		await load();
	}

	async function handleSpinRequest(): Promise<void> {
		if (spinBusy || phase !== "ready" || !state?.canSpin) {
			return;
		}

		setSpinBusy(true);
		setError(null);

		const response = await platformFetch(
			`/api/user/establishments/${encodeURIComponent(slug)}/games/ruleta/spin`,
			{ method: "POST" },
		);
		const body = (await response.json()) as SpinResponse;

		if (!response.ok) {
			setError(body.error?.description ?? "No se pudo girar la ruleta");
			setSpinBusy(false);

			if (response.status === 403) {
				void load();
			}

			return;
		}

		setSpinResult(body);
		setTargetSegmentIndex(body.segmentIndex);
		setPhase("spinning");
		setSpinBusy(false);
	}

	function handleSpinComplete(): void {
		if (spinResult) {
			setPhase("result");
		}
	}

	if (phase === "loading") {
		return <p className="text-sm text-muted">Cargando ruleta…</p>;
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link
				href={platformRoutes.homeEstablishment(slug)}
				className="text-sm font-medium text-primary hover:opacity-80"
			>
				← Volver a {tenantName || "el local"}
			</Link>

			<div>
				<h1 className="text-xl font-semibold text-foreground">Ruleta</h1>
				<p className="mt-1 text-sm text-muted">{tenantName}</p>
			</div>

			{error ? <p className="text-sm text-error">{error}</p> : null}

			{phase === "disabled" ? (
				<Card>
					<p className="text-sm text-muted">
						La ruleta no está disponible en este local ahora mismo.
					</p>
				</Card>
			) : null}

			{phase === "not_enrolled" && state ? (
				<RouletteParticipationCard
					slug={slug}
					state={state}
					enrolling={enrolling}
					onEnroll={handleEnroll}
					showSegments
				/>
			) : null}

			{phase === "locked" && state ? (
				<>
					<Card className="flex flex-col items-center gap-4 text-center">
						<div className="relative h-40 w-40">
							<Image
								src={ROULETTE_WHEEL_ASSETS.stateLocked}
								alt=""
								fill
								className="object-contain opacity-90"
								sizes="160px"
							/>
						</div>
						<div>
							<h2 className="text-lg font-semibold text-foreground">Ruleta bloqueada</h2>
							<p className="mt-2 text-sm text-muted">{lockedMessage(state)}</p>
							{state.eligibility && !isStaffExplicitRoulette(state) ? (
								<p className="mt-1 text-xs text-muted">
									Última elegibilidad hasta {formatExpiresAt(state.eligibility.expiresAt)}
								</p>
							) : null}
							{isStaffExplicitRoulette(state) && state.eligibility ? (
								<p className="mt-1 text-xs text-muted">
									Autorización válida hasta {formatExpiresAt(state.eligibility.expiresAt)}
								</p>
							) : null}
						</div>
						<Link href={platformRoutes.homeEstablishment(slug)} className="w-full">
							<Button type="button" variant="secondary" className="w-full">
								Volver al local
							</Button>
						</Link>
					</Card>
					<RouletteParticipationCard
						slug={slug}
						state={state}
						showSegments
						showHistory
						hideCta
					/>
				</>
			) : null}

			{phase === "ready" || phase === "spinning" ? (
				<div className="flex flex-col items-center gap-6">
					{state?.eligibility ? (
						<p className="text-center text-xs text-muted">
							Giro disponible hasta {formatExpiresAt(state.eligibility.expiresAt)}
						</p>
					) : null}
					<RouletteWheel
						segments={state?.segments ?? []}
						tenantPrimaryColor={tenantPrimaryColor}
						spinning={phase === "spinning"}
						targetSegmentIndex={targetSegmentIndex}
						onSpinComplete={handleSpinComplete}
						disabled={spinBusy || phase === "spinning"}
						onSpinRequest={() => void handleSpinRequest()}
					/>
					{phase === "ready" ? (
						<p className="text-center text-sm text-muted">Pulsa GIRAR en el centro para jugar.</p>
					) : (
						<p className="text-center text-sm text-muted">Girando…</p>
					)}
					{state ? (
						<RouletteParticipationCard slug={slug} state={state} showHistory hideCta />
					) : null}
				</div>
			) : null}

			{phase === "result" && spinResult ? (
				<RouletteResultScreen slug={slug} result={spinResult} />
			) : null}
		</main>
	);
}
