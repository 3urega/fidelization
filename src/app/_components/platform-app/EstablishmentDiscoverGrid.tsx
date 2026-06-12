"use client";

import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import {
	EstablishmentDiscoverCard,
	type DiscoverEstablishment,
} from "./EstablishmentDiscoverCard";

type DiscoverResponse = {
	establishments?: DiscoverEstablishment[];
	hasMore?: boolean;
	error?: { description?: string };
};

const INITIAL_LIMIT = 6;
const LOAD_MORE_LIMIT = 4;

type EstablishmentDiscoverGridProps = {
	/** When true, shows a compact heading; omit on dedicated discover page. */
	showHeading?: boolean;
};

export function EstablishmentDiscoverGrid({
	showHeading = true,
}: EstablishmentDiscoverGridProps): ReactElement {
	const [items, setItems] = useState<DiscoverEstablishment[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const fetchingRef = useRef(false);
	const offsetRef = useRef(0);

	const loadBatch = useCallback(async (offset: number, limit: number, append: boolean): Promise<void> => {
		if (fetchingRef.current) {
			return;
		}

		fetchingRef.current = true;

		if (append) {
			setLoadingMore(true);
		} else {
			setLoading(true);
		}

		setError(null);

		try {
			const response = await platformFetch(
				`/api/user/establishments?offset=${offset}&limit=${limit}`,
			);
			const body = (await response.json()) as DiscoverResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudieron cargar los locales.");
				if (!append) {
					setItems([]);
				}
				setHasMore(false);

				return;
			}

			const batch = body.establishments ?? [];
			setItems((current) => (append ? [...current, ...batch] : batch));
			setHasMore(body.hasMore === true);
			offsetRef.current = append ? offset + batch.length : batch.length;
		} catch {
			setError("Error de red al cargar los locales.");
			if (!append) {
				setItems([]);
			}
			setHasMore(false);
		} finally {
			setLoading(false);
			setLoadingMore(false);
			fetchingRef.current = false;
		}
	}, []);

	useEffect(() => {
		offsetRef.current = 0;
		void loadBatch(0, INITIAL_LIMIT, false);
	}, [loadBatch]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasMore || loading || loadingMore) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					void loadBatch(offsetRef.current, LOAD_MORE_LIMIT, true);
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [hasMore, loadBatch, loading, loadingMore]);

	return (
		<div className="flex flex-col gap-4">
			{showHeading ? (
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold text-foreground">Explorar locales</h2>
					<p className="text-sm text-muted">
						Todos los establecimientos dados de alta en la plataforma.
					</p>
				</div>
			) : null}

			{loading ? <p className="text-sm text-muted">Cargando locales…</p> : null}
			{error ? <p className="text-sm text-error">{error}</p> : null}

			{!loading && items.length === 0 && !error ? (
				<p className="text-sm text-muted">Aún no hay locales disponibles.</p>
			) : null}

			<ul className="grid grid-cols-2 gap-3">
				{items.map((establishment) => (
					<li key={establishment.id}>
						<EstablishmentDiscoverCard establishment={establishment} />
					</li>
				))}
			</ul>

			{loadingMore ? <p className="text-center text-sm text-muted">Cargando más…</p> : null}

			<div ref={sentinelRef} className="h-1 w-full" aria-hidden />
		</div>
	);
}
