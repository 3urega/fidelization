import { useCallback, useEffect, useRef, useState } from "react";

type UseSwipeableTabsOptions = {
	activeIndex: number;
	tabCount: number;
	onIndexChange: (index: number) => void;
	thresholdPx?: number;
};

export function useSwipeableTabs({
	activeIndex,
	tabCount,
	onIndexChange,
	thresholdPx = 50,
}: UseSwipeableTabsOptions): (node: HTMLElement | null) => void {
	const [container, setContainer] = useState<HTMLElement | null>(null);
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const activeIndexRef = useRef(activeIndex);
	const tabCountRef = useRef(tabCount);
	const onIndexChangeRef = useRef(onIndexChange);

	activeIndexRef.current = activeIndex;
	tabCountRef.current = tabCount;
	onIndexChangeRef.current = onIndexChange;

	const ref = useCallback((node: HTMLElement | null) => {
		setContainer(node);
	}, []);

	useEffect(() => {
		if (!container) {
			return;
		}

		function onTouchStart(event: TouchEvent): void {
			const touch = event.touches[0];

			if (!touch) {
				return;
			}

			touchStartRef.current = { x: touch.clientX, y: touch.clientY };
		}

		function onTouchEnd(event: TouchEvent): void {
			const start = touchStartRef.current;
			touchStartRef.current = null;

			if (!start || tabCountRef.current <= 1) {
				return;
			}

			const touch = event.changedTouches[0];

			if (!touch) {
				return;
			}

			const deltaX = touch.clientX - start.x;
			const deltaY = touch.clientY - start.y;

			if (Math.abs(deltaX) < thresholdPx || Math.abs(deltaX) <= Math.abs(deltaY)) {
				return;
			}

			const index = activeIndexRef.current;

			if (deltaX < 0 && index < tabCountRef.current - 1) {
				onIndexChangeRef.current(index + 1);
			} else if (deltaX > 0 && index > 0) {
				onIndexChangeRef.current(index - 1);
			}
		}

		container.addEventListener("touchstart", onTouchStart, { passive: true });
		container.addEventListener("touchend", onTouchEnd, { passive: true });

		return () => {
			container.removeEventListener("touchstart", onTouchStart);
			container.removeEventListener("touchend", onTouchEnd);
		};
	}, [container, thresholdPx]);

	return ref;
}
