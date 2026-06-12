"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

const ELASTIC_MAX_PX = 72;
const ELASTIC_THRESHOLD_PX = 48;
const ELASTIC_RESISTANCE = 0.45;
const SCROLL_EDGE_PX = 16;

type UseDiscoverGridElasticLoadParams = {
	enabled: boolean;
	onLoadMore: () => void;
	rootRef: RefObject<HTMLElement | null>;
};

type UseDiscoverGridElasticLoadResult = {
	elasticOffset: number;
	elasticTransition: string;
	showElasticHint: boolean;
};

export function useDiscoverGridElasticLoad({
	enabled,
	onLoadMore,
	rootRef,
}: UseDiscoverGridElasticLoadParams): UseDiscoverGridElasticLoadResult {
	const [elasticOffset, setElasticOffset] = useState(0);
	const [elasticTransition, setElasticTransition] = useState("none");
	const [showElasticHint, setShowElasticHint] = useState(false);
	const [canElasticPull, setCanElasticPull] = useState(false);

	const touchStartYRef = useRef<number | null>(null);
	const pullRef = useRef(0);
	const wheelPullRef = useRef(0);
	const wheelResetTimerRef = useRef<number | null>(null);

	const updateCanElasticPull = useCallback((): void => {
		const scrollHeight = document.documentElement.scrollHeight;
		const fitsOnScreen = scrollHeight <= window.innerHeight + SCROLL_EDGE_PX;
		const atScrollBottom =
			window.scrollY + window.innerHeight >= scrollHeight - SCROLL_EDGE_PX;

		setCanElasticPull(fitsOnScreen || atScrollBottom);
	}, []);

	useEffect(() => {
		updateCanElasticPull();
		window.addEventListener("scroll", updateCanElasticPull, { passive: true });
		window.addEventListener("resize", updateCanElasticPull);

		return () => {
			window.removeEventListener("scroll", updateCanElasticPull);
			window.removeEventListener("resize", updateCanElasticPull);
		};
	}, [enabled, updateCanElasticPull]);

	const resetPullVisual = useCallback((animate: boolean): void => {
		setElasticTransition(
			animate ? "transform 320ms cubic-bezier(0.34, 1.4, 0.64, 1)" : "none",
		);
		setElasticOffset(0);
		setShowElasticHint(false);
		pullRef.current = 0;
		wheelPullRef.current = 0;
	}, []);

	const applyPull = useCallback((rawPull: number): void => {
		const pull = Math.max(0, Math.min(ELASTIC_MAX_PX, rawPull * ELASTIC_RESISTANCE));
		pullRef.current = pull;
		setElasticTransition("none");
		setElasticOffset(pull);
		setShowElasticHint(pull >= ELASTIC_THRESHOLD_PX * 0.5);
	}, []);

	const commitPull = useCallback((): void => {
		const shouldLoad = pullRef.current >= ELASTIC_THRESHOLD_PX;
		resetPullVisual(true);

		if (shouldLoad && enabled) {
			onLoadMore();
		}
	}, [enabled, onLoadMore, resetPullVisual]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || !enabled) {
			return;
		}

		function onTouchStart(event: TouchEvent): void {
			if (!canElasticPull || event.touches.length !== 1) {
				touchStartYRef.current = null;

				return;
			}

			touchStartYRef.current = event.touches[0]?.clientY ?? null;
		}

		function onTouchMove(event: TouchEvent): void {
			if (touchStartYRef.current === null || !canElasticPull) {
				return;
			}

			const currentY = event.touches[0]?.clientY;
			if (currentY === undefined) {
				return;
			}

			const delta = touchStartYRef.current - currentY;
			if (delta <= 0) {
				resetPullVisual(false);

				return;
			}

			event.preventDefault();
			applyPull(delta);
		}

		function onTouchEnd(): void {
			if (touchStartYRef.current === null) {
				return;
			}

			touchStartYRef.current = null;
			commitPull();
		}

		function onWheel(event: WheelEvent): void {
			if (!canElasticPull || event.deltaY <= 0) {
				return;
			}

			const atBottom =
				window.scrollY + window.innerHeight >=
				document.documentElement.scrollHeight - SCROLL_EDGE_PX;
			const fitsOnScreen =
				document.documentElement.scrollHeight <= window.innerHeight + SCROLL_EDGE_PX;

			if (!atBottom && !fitsOnScreen) {
				return;
			}

			event.preventDefault();
			wheelPullRef.current = Math.min(
				ELASTIC_MAX_PX / ELASTIC_RESISTANCE,
				wheelPullRef.current + event.deltaY * 0.35,
			);
			applyPull(wheelPullRef.current);

			if (wheelResetTimerRef.current !== null) {
				window.clearTimeout(wheelResetTimerRef.current);
			}

			wheelResetTimerRef.current = window.setTimeout(() => {
				commitPull();
				wheelResetTimerRef.current = null;
			}, 180);
		}

		root.addEventListener("touchstart", onTouchStart, { passive: true });
		root.addEventListener("touchmove", onTouchMove, { passive: false });
		root.addEventListener("touchend", onTouchEnd);
		root.addEventListener("touchcancel", onTouchEnd);
		root.addEventListener("wheel", onWheel, { passive: false });

		return () => {
			root.removeEventListener("touchstart", onTouchStart);
			root.removeEventListener("touchmove", onTouchMove);
			root.removeEventListener("touchend", onTouchEnd);
			root.removeEventListener("touchcancel", onTouchEnd);
			root.removeEventListener("wheel", onWheel);

			if (wheelResetTimerRef.current !== null) {
				window.clearTimeout(wheelResetTimerRef.current);
			}
		};
	}, [applyPull, canElasticPull, commitPull, enabled, resetPullVisual, rootRef]);

	useEffect(() => {
		if (!enabled) {
			resetPullVisual(false);
		}
	}, [enabled, resetPullVisual]);

	return {
		elasticOffset,
		elasticTransition,
		showElasticHint,
	};
}
