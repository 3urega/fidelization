"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { parseJoinDeepLink } from "../../../lib/platform/deepLinks";

/** Routes `fidelization://join/{slug}` → `/u/join/{slug}` on native (issue #45). */
export function PlatformCapacitorDeepLinkListener(): null {
	const router = useRouter();

	useEffect(() => {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		function navigateFromUrl(url: string): void {
			const slug = parseJoinDeepLink(url);
			if (!slug) {
				return;
			}

			router.replace(`/u/join/${encodeURIComponent(slug)}`);
		}

		void App.getLaunchUrl().then((result) => {
			if (result?.url) {
				navigateFromUrl(result.url);
			}
		});

		const listenerPromise = App.addListener("appUrlOpen", (event) => {
			navigateFromUrl(event.url);
		});

		return () => {
			void listenerPromise.then((handle) => handle.remove());
		};
	}, [router]);

	return null;
}
