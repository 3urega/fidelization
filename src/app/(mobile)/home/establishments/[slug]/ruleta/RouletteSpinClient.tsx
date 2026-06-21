"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { RouletteResultScreen, type RouletteSpinResultView } from "../../../../../_components/loyalty/games/RouletteResultScreen";
import { RouletteWheel } from "../../../../../_components/loyalty/games/RouletteWheel";
import { ROULETTE_WHEEL_ASSETS } from "../../../../../_components/loyalty/games/rouletteAssets";
import { Button } from "../../../../../_components/ui/Button";
import { Card } from "../../../../../_components/ui/Card";
import { platformFetch } from "../../../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../../../lib/platform/routes";

type RoulettePublicState = {
	isEnabled: boolean;
	canSpin: boolean;
	segments: { id: string; label: string; color?: string }[];
	rules: { maxSpinsPerDay: number; maxSpinsPerWeek: number };
	error?: { description?: string };
};

type EstablishmentDetailResponse = {
	tenant: { name: string; primaryColor: string | null };
	error?: { description?: string };
};

type SpinResponse = RouletteSpinResultView & {
	spinId: string;
	segmentIndex: number;
	error?: { description?: string };
};

type ViewPhase = "loading" | "disabled" | "locked" | "ready" | "spinning" | "result";

export function RouletteSpinClient(): ReactElement {
	const params = useParams();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [phase, setPhase] = useState<ViewPhase>("loading");
	const [error, setError] = useState<string | null>(null);
	const [state, setState] = useState<RoulettePublicState | null>(null);
	const [tenantName, setTenantName] = useState("");
	const [tenantPrimaryColor, setTenantPrimaryColor] = useState<string | null>(null);
	const [spinResult, setSpinResult] = useState<SpinResponse | null>(null);
	const [targetSegmentIndex, setTargetSegmentIndex] = useState<number | null>(null);
	const [spinBusy, setSpinBusy] = useState(false);

	const load = useCallback(async (): Promise<void> => {
		if (!slug) {
			setError("Local no válido");
			setPhase("disabled");
			return;
		}

		setError(null);

		const [stateResponse, detailResponse] = await Promise.all([
			platformFetch(`/api/user/establishments/${encodeURIComponent(slug)}/games/ruleta`),
			platformFetch(`/api/user/establishments/${encodeURIComponent(slug)}`),
		]);

		const stateBody = (await stateResponse.json()) as RoulettePublicState;
		const detailBody = (await detailResponse.json()) as EstablishmentDetailResponse;

		if (!stateResponse.ok) {
			setError(stateBody.error?.description ?? "No se pudo cargar la ruleta");
			setPhase("disabled");
			return;
		}

		if (!detailResponse.ok) {
			setError(detailBody.error?.description ?? "No se pudo cargar el local");
			setPhase("disabled");
			return;
		}

		setState(stateBody);
		setTenantName(detailBody.tenant.name);
		setTenantPrimaryColor(detailBody.tenant.primaryColor);

		if (!stateBody.isEnabled) {
			setPhase("disabled");
			return;
		}

		if (!stateBody.canSpin) {
			setPhase("locked");
			return;
		}

		setPhase("ready");
	}, [slug]);

	useEffect(() => {
		void load();
	}, [load]);

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
				setPhase("locked");
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

			{phase === "locked" ? (
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
						<h2 className="text-lg font-semibold text-foreground">Ruleta no disponible</h2>
						<p className="mt-2 text-sm text-muted">
							{state?.rules
								? `Has alcanzado el límite de giros (máx. ${state.rules.maxSpinsPerDay} al día). Vuelve más tarde.`
								: "No puedes girar la ruleta en este momento."}
						</p>
					</div>
					<Link href={platformRoutes.homeEstablishment(slug)} className="w-full">
						<Button type="button" variant="secondary" className="w-full">
							Volver al local
						</Button>
					</Link>
				</Card>
			) : null}

			{phase === "ready" || phase === "spinning" ? (
				<div className="flex flex-col items-center gap-6">
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
				</div>
			) : null}

			{phase === "result" && spinResult ? (
				<RouletteResultScreen slug={slug} result={spinResult} />
			) : null}
		</main>
	);
}
