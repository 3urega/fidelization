"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformGameResponse } from "../../../lib/platform/games";
import { tenantHasFeature } from "../shell/planFeatures";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Card } from "../ui/Card";

type GamesResponse = {
	games?: PlatformGameResponse[];
	error?: { description?: string };
};

function statusBadge(status: PlatformGameResponse["status"]): ReactElement | null {
	if (status === "beta") {
		return (
			<span className="inline-flex rounded-theme bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
				Beta
			</span>
		);
	}

	return null;
}

export function GamificationGamesPanel(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [games, setGames] = useState<PlatformGameResponse[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [listError, setListError] = useState<string | null>(null);

	const hasGamificationFeature = session ? tenantHasFeature(session, "gamification") : false;

	const loadGames = useCallback(async (): Promise<void> => {
		setListLoading(true);
		setListError(null);

		try {
			const response = await fetch("/api/loyalty/games", { credentials: "include" });
			const body = (await response.json()) as GamesResponse;

			if (!response.ok) {
				setListError(body.error?.description ?? "No se pudo cargar los juegos");
				setGames([]);

				return;
			}

			setGames(body.games ?? []);
		} catch {
			setListError("No se pudo conectar con el servidor");
			setGames([]);
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner" || !hasGamificationFeature) {
			setListLoading(false);

			return;
		}

		void loadGames();
	}, [session, hasGamificationFeature, loadGames]);

	if (loading) {
		return (
			<Card>
				<p className="text-sm text-muted">Cargando sesión…</p>
			</Card>
		);
	}

	if (error || !session) {
		return (
			<Card>
				<p className="text-sm text-destructive">{error ?? "Sesión no disponible"}</p>
			</Card>
		);
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">Solo el propietario del negocio puede ver los juegos.</p>
			</Card>
		);
	}

	if (!hasGamificationFeature) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Plan Premium requerido</h2>
				<p className="mt-2 text-sm text-muted">
					La gamificación está disponible en el plan Premium. Actualiza tu plan para acceder a juegos
					como ruleta, rasca y caja misteriosa.
				</p>
				<Link
					href="/onboarding/plan"
					className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
				>
					Ver planes y actualizar →
				</Link>
			</Card>
		);
	}

	if (listLoading) {
		return (
			<Card>
				<p className="text-sm text-muted">Cargando juegos…</p>
			</Card>
		);
	}

	if (listError) {
		return (
			<Card>
				<p className="text-sm text-destructive">{listError}</p>
			</Card>
		);
	}

	if (games.length === 0) {
		return (
			<Card>
				<p className="text-sm text-muted">
					No hay juegos disponibles en este momento. Vuelve pronto: la biblioteca se ampliará desde
					la plataforma.
				</p>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{games.map((game) => (
				<Card key={game.id}>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-medium text-foreground">{game.label}</h2>
						{statusBadge(game.status)}
					</div>
					{game.description ? (
						<p className="mt-2 text-sm text-muted">{game.description}</p>
					) : null}
					{game.slug === "ruleta" ? (
						<Link
							href="/settings/games/ruleta"
							className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
						>
							Configurar ruleta →
						</Link>
					) : (
						<>
							<p className="mt-4 text-sm font-medium text-muted">Próximamente</p>
							<p className="mt-1 text-xs text-muted">
								El motor de juego estará disponible en una próxima actualización.
							</p>
						</>
					)}
				</Card>
			))}
		</div>
	);
}
