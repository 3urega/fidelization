"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactElement, useState } from "react";

import { platformFetch } from "../../../../../lib/platform/apiUrl";
import { Button } from "../../../../_components/ui/Button";
import { Card } from "../../../../_components/ui/Card";

export function PlatformDiscoverJoinForm(): ReactElement {
	const router = useRouter();
	const [slug, setSlug] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const response = await platformFetch("/api/user/establishments/join", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug: slug.trim() }),
		});

		const body = (await response.json()) as { error?: { description?: string } };

		if (!response.ok) {
			setError(body.error?.description ?? "No se pudo unir al local");
			setLoading(false);

			return;
		}

		router.push("/u/home");
	}

	return (
		<Card>
			<form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
				<div className="flex flex-col gap-1">
					<label htmlFor="establishment-slug" className="text-sm font-medium text-foreground">
						Identificador del local
					</label>
					<input
						id="establishment-slug"
						name="slug"
						type="text"
						required
						autoComplete="off"
						placeholder="cafe-demo"
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
						className="rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
					<p className="text-xs text-muted">
						Introduce el slug del negocio (p. ej. el subdominio de su web).
					</p>
				</div>

				{error ? <p className="text-sm text-error">{error}</p> : null}

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Uniéndote…" : "Unirme al local"}
				</Button>
			</form>
		</Card>
	);
}
