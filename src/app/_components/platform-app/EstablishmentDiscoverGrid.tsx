"use client";

import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";

import {
	type TenantDiscoveryTagId,
} from "../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";
import { platformFetch } from "../../../lib/platform/apiUrl";
import { DiscoverTagFilterBar } from "./DiscoverTagFilterBar";
import {
	EstablishmentDiscoverCard,
	type DiscoverEstablishment,
} from "./EstablishmentDiscoverCard";
import { useDiscoverGridElasticLoad } from "./useDiscoverGridElasticLoad";

type DiscoverResponse = {
	establishments?: DiscoverEstablishment[];
	hasMore?: boolean;
	error?: { description?: string };
};

const INITIAL_LIMIT = 6;
const LOAD_MORE_LIMIT = 4;
const MIN_LOAD_MORE_DELAY_MS = 1000;

async function waitAtLeast(ms: number, startedAt: number): Promise<void> {
	const remaining = ms - (Date.now() - startedAt);

	if (remaining > 0) {
		await new Promise<void>((resolve) => {
			setTimeout(resolve, remaining);
		});
	}
}

type EstablishmentDiscoverGridProps = {
	/** When true, shows a compact heading; omit on dedicated discover page. */
	showHeading?: boolean;
};

function DiscoverGridLoadingIndicator({ label }: { label: string }): ReactElement {
	return (
		<div className="flex items-center justify-center gap-2 py-2" role="status" aria-live="polite">
			<span
				className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"
				aria-hidden
			/>
			<p className="text-sm text-muted">{label}</p>
		</div>
	);
}

export function EstablishmentDiscoverGrid({
	showHeading = true,
}: EstablishmentDiscoverGridProps): ReactElement {
	const [items, setItems] = useState<DiscoverEstablishment[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedFilterTags, setSelectedFilterTags] = useState<TenantDiscoveryTagId[]>([]);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const elasticRootRef = useRef<HTMLDivElement | null>(null);
	const fetchingRef = useRef(false);
	const offsetRef = useRef(0);
	const wasIntersectingRef = useRef(false);

	const loadBatch = useCallback(async (
		offset: number,
		limit: number,
		append: boolean,
		filterTags: TenantDiscoveryTagId[],
	): Promise<void> => {
		if (fetchingRef.current) {
			return;
		}

		fetchingRef.current = true;
		const startedAt = Date.now();

		if (append) {
			setLoadingMore(true);
		} else {
			setLoading(true);
		}

		setError(null);

		try {
			const tagsQuery =
				filterTags.length > 0
					? `&tags=${encodeURIComponent(filterTags.join(","))}`
					: "";
			const response = await platformFetch(
				`/api/user/establishments?offset=${offset}&limit=${limit}${tagsQuery}`,
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
			if (append) {
				await waitAtLeast(MIN_LOAD_MORE_DELAY_MS, startedAt);
			}

			setLoading(false);
			setLoadingMore(false);
			fetchingRef.current = false;
		}
	}, []);

	const loadMore = useCallback((): void => {
		if (fetchingRef.current || !hasMore) {
			return;
		}

		void loadBatch(offsetRef.current, LOAD_MORE_LIMIT, true, selectedFilterTags);
	}, [hasMore, loadBatch, selectedFilterTags]);

	const elasticEnabled = hasMore && !loading && !loadingMore;
	const { elasticOffset, elasticTransition, showElasticHint } = useDiscoverGridElasticLoad({
		enabled: elasticEnabled,
		onLoadMore: loadMore,
		rootRef: elasticRootRef,
	});

	useEffect(() => {
		offsetRef.current = 0;
		wasIntersectingRef.current = false;
		void loadBatch(0, INITIAL_LIMIT, false, selectedFilterTags);
	}, [loadBatch, selectedFilterTags]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasMore || loading || loadingMore) {
			return;
		}

		let bootstrapped = false;

		const observer = new IntersectionObserver(
			(entries) => {
				const isIntersecting = entries.some((entry) => entry.isIntersecting);

				if (!bootstrapped) {
					bootstrapped = true;
					wasIntersectingRef.current = isIntersecting;

					return;
				}

				if (isIntersecting && !wasIntersectingRef.current && !fetchingRef.current) {
					void loadBatch(offsetRef.current, LOAD_MORE_LIMIT, true, selectedFilterTags);
				}

				wasIntersectingRef.current = isIntersecting;
			},
			{ rootMargin: "80px" },
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [hasMore, loadBatch, loading, loadingMore, selectedFilterTags]);

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

			<DiscoverTagFilterBar value={selectedFilterTags} onChange={setSelectedFilterTags} />

			{loading ? <DiscoverGridLoadingIndicator label="Cargando locales…" /> : null}
			{error ? <p className="text-sm text-error">{error}</p> : null}

			{!loading && items.length === 0 && !error && selectedFilterTags.length === 0 ? (
				<p className="text-sm text-muted">Aún no hay locales disponibles.</p>
			) : null}

			{!loading && items.length === 0 && !error && selectedFilterTags.length > 0 ? (
				<div className="flex flex-col items-center gap-2 py-4 text-center">
					<p className="text-sm text-muted">Ningún local coincide con estos filtros.</p>
					<button
						type="button"
						onClick={() => setSelectedFilterTags([])}
						className="text-sm font-medium text-primary hover:opacity-80"
					>
						Quitar filtros
					</button>
				</div>
			) : null}

			<div ref={elasticRootRef} className="touch-pan-y">
				<div
					className="flex flex-col gap-4"
					style={{
						transform: elasticOffset > 0 ? `translateY(-${elasticOffset}px)` : undefined,
						transition: elasticTransition,
					}}
				>
					<ul className="grid grid-cols-2 gap-3">
						{items.map((establishment) => (
							<li key={establishment.id}>
								<EstablishmentDiscoverCard establishment={establishment} />
							</li>
						))}
					</ul>

					{showElasticHint && !loadingMore ? (
						<p className="text-center text-xs text-muted">Suelta para cargar más locales</p>
					) : null}

					{loadingMore ? <DiscoverGridLoadingIndicator label="Cargando más…" /> : null}

					<div ref={sentinelRef} className="h-1 w-full" aria-hidden />
				</div>
			</div>
		</div>
	);
}
