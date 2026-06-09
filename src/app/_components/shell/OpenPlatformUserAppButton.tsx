"use client";

import { type ReactElement, useState } from "react";

import { resolvePlatformApiUrl } from "../../../lib/platform/apiUrl";

export function OpenPlatformUserAppButton(): ReactElement {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-1">
			<button
				type="button"
				disabled={loading}
				onClick={() => {
					void (async () => {
						setLoading(true);
						setError(null);

						const response = await fetch(resolvePlatformApiUrl("/api/user/enter"), {
							method: "POST",
							credentials: "include",
						});
						const data = (await response.json()) as {
							redirectUrl?: string;
							error?: { description?: string };
						};

						if (!response.ok || !data.redirectUrl) {
							setError(data.error?.description ?? "No se pudo abrir la app personal");
							setLoading(false);

							return;
						}

						window.location.assign(data.redirectUrl);
					})();
				}}
				className={[
					"flex w-full items-center gap-3 rounded-theme px-3 py-2 text-sm font-medium transition-colors",
					"text-muted hover:bg-border/40 hover:text-foreground disabled:opacity-60",
				].join(" ")}
			>
				<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
					/>
				</svg>
				{loading ? "Abriendo…" : "App personal"}
			</button>
			{error ? <p className="px-3 text-xs text-error">{error}</p> : null}
		</div>
	);
}
