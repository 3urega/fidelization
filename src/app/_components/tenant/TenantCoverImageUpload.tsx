"use client";

import { type ChangeEvent, type ReactElement, useRef, useState } from "react";

import {
	DEFAULT_TENANT_COVER_IMAGE_URL,
	resolveTenantCoverImageUrl,
} from "../../../lib/platform/tenantDiscoveryAssets";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CoverUploadResponse = {
	tenant?: { coverImageUrl?: string };
	error?: { description?: string };
};

export function TenantCoverImageUpload(): ReactElement {
	const { session, refresh } = useTenantSession();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [uploading, setUploading] = useState(false);
	const [removing, setRemoving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	if (!session) {
		return <p className="text-sm text-muted">Sesión no disponible.</p>;
	}

	const previewUrl = resolveTenantCoverImageUrl(session.tenant.coverImageUrl);
	const hasCustomCover = Boolean(session.tenant.coverImageUrl?.trim());

	async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		if (!ALLOWED_MIME_TYPES.has(file.type)) {
			setError("Formato no válido. Usa JPG, PNG o WebP.");
			setSuccess(null);

			return;
		}

		if (file.size > MAX_FILE_BYTES) {
			setError("La imagen no puede superar 5 MB.");
			setSuccess(null);

			return;
		}

		setUploading(true);
		setError(null);
		setSuccess(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/tenant/discovery/cover", {
				method: "POST",
				credentials: "include",
				body: formData,
			});
			const body = (await response.json()) as CoverUploadResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo subir la imagen.");

				return;
			}

			await refresh();
			setSuccess("Imagen de portada actualizada.");
		} catch {
			setError("Error de red al subir la imagen.");
		} finally {
			setUploading(false);
		}
	}

	async function handleRemove(): Promise<void> {
		setRemoving(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/tenant/discovery/cover", {
				method: "DELETE",
				credentials: "include",
			});
			const body = (await response.json()) as CoverUploadResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo quitar la imagen.");

				return;
			}

			await refresh();
			setSuccess("Se usará la imagen genérica en el grid.");
		} catch {
			setError("Error de red al quitar la imagen.");
		} finally {
			setRemoving(false);
		}
	}

	return (
		<Field label="Imagen del local (grid)">
			<div className="flex flex-col gap-3">
				<div className="overflow-hidden rounded-theme border border-border">
					<img
						src={previewUrl}
						alt="Vista previa de la portada del local"
						className="aspect-square w-full object-cover"
					/>
				</div>
				<p className="text-xs text-muted">
					Esta foto aparece en el grid de exploración. Si no subes ninguna, usamos la imagen
					genérica.
				</p>
				<div className="flex flex-wrap gap-2">
					<input
						ref={inputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={(event) => void handleFileChange(event)}
					/>
					<Button
						type="button"
						variant="secondary"
						disabled={uploading || removing}
						onClick={() => inputRef.current?.click()}
					>
						{uploading ? "Subiendo…" : "Subir imagen"}
					</Button>
					{hasCustomCover ? (
						<Button
							type="button"
							variant="secondary"
							disabled={uploading || removing}
							onClick={() => void handleRemove()}
						>
							{removing ? "Quitando…" : "Usar imagen genérica"}
						</Button>
					) : null}
				</div>
				{previewUrl === DEFAULT_TENANT_COVER_IMAGE_URL && !hasCustomCover ? (
					<p className="text-xs text-muted">Imagen por defecto: café genérico.</p>
				) : null}
				{error ? <p className="text-sm text-error">{error}</p> : null}
				{success ? <p className="text-sm text-foreground">{success}</p> : null}
			</div>
		</Field>
	);
}
