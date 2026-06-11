"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type StampTypePayload = {
	id: string;
	label: string;
	slug: string;
	sortOrder: number;
	isActive: boolean;
};

type StampTypesResponse = {
	types?: StampTypePayload[];
	stampType?: StampTypePayload;
	error?: {
		description?: string;
	};
};

type StampTypesFormProps = {
	onTypesChanged?: () => void;
};

export function StampTypesForm({ onTypesChanged }: StampTypesFormProps): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [types, setTypes] = useState<StampTypePayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [label, setLabel] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

	const loadTypes = useCallback(async (): Promise<void> => {
		setListLoading(true);

		try {
			const response = await fetch("/api/loyalty/stamp-types", {
				credentials: "include",
			});
			const body = (await response.json()) as StampTypesResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudieron cargar los tipos.");
				setTypes([]);

				return;
			}

			setTypes(body.types ?? []);
			onTypesChanged?.();
		} catch {
			setSubmitError("Error de red al cargar los tipos.");
			setTypes([]);
		} finally {
			setListLoading(false);
		}
	}, [onTypesChanged]);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			return;
		}

		void loadTypes();
	}, [session, loadTypes]);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">
					Solo el propietario del negocio puede configurar tipos de consumición.
				</p>
			</Card>
		);
	}

	const labelValid = label.trim().length > 0;

	async function handleCreate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);

		if (!labelValid) {
			setSubmitError("Introduce una etiqueta para el tipo.");

			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/loyalty/stamp-types", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ label: label.trim() }),
			});

			const body = (await response.json()) as StampTypesResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo crear el tipo.");

				return;
			}

			if (body.stampType) {
				setSuccess(
					`Tipo creado: «${body.stampType.label}». Configura su campaña en la pestaña Campañas.`,
				);
				setLabel("");
				await loadTypes();
				onTypesChanged?.();
			}
		} catch {
			setSubmitError("Error de red al crear el tipo.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(stampTypeId: string): Promise<void> {
		setSubmitError(null);
		setSuccess(null);
		setDeactivatingId(stampTypeId);

		try {
			const response = await fetch(`/api/loyalty/stamp-types/${stampTypeId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: false }),
			});

			const body = (await response.json()) as StampTypesResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo desactivar el tipo.");

				return;
			}

			setSuccess("Tipo desactivado.");
			await loadTypes();
			onTypesChanged?.();
		} catch {
			setSubmitError("Error de red al desactivar el tipo.");
		} finally {
			setDeactivatingId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<h2 className="font-medium text-foreground">Tipos de consumición</h2>
				<p className="mt-1 text-sm text-muted">
					Cada tipo crea un botón para el empleado al escanear (p. ej. Café, Cóctail). La
					tarjeta de sellos se configura en la pestaña Campañas.
				</p>
				{listLoading ? (
					<p className="mt-3 text-sm text-muted">Cargando tipos…</p>
				) : types.length === 0 ? (
					<p className="mt-3 text-sm text-muted">
						Crea el primer tipo abajo. Sin tipos no podrás añadir campañas de sellos.
					</p>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{types.map((stampType) => (
							<li
								key={stampType.id}
								className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="text-sm font-medium text-foreground">{stampType.label}</p>
									<p className="text-xs text-muted">{stampType.slug}</p>
								</div>
								<div className="flex items-center gap-3">
									<span
										className={[
											"rounded-full px-2 py-0.5 text-xs font-medium",
											stampType.isActive
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
										].join(" ")}
									>
										{stampType.isActive ? "Activo" : "Inactivo"}
									</span>
									{stampType.isActive ? (
										<Button
											type="button"
											variant="secondary"
											disabled={deactivatingId === stampType.id}
											onClick={() => void handleDeactivate(stampType.id)}
											className="shrink-0"
										>
											{deactivatingId === stampType.id ? "Desactivando…" : "Desactivar"}
										</Button>
									) : null}
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>

			<Card>
				<h2 className="font-medium text-foreground">Nuevo tipo</h2>
				<form className="mt-4 flex flex-col gap-5" onSubmit={(event) => void handleCreate(event)}>
					<Field label="Etiqueta visible para el empleado">
						<Input
							type="text"
							name="label"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							placeholder="Café"
							autoComplete="off"
							maxLength={40}
						/>
					</Field>

					{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
					{success ? <p className="text-sm text-foreground">{success}</p> : null}

					<Button
						type="submit"
						disabled={saving || !labelValid}
						className="w-full sm:w-auto"
					>
						{saving ? "Creando…" : "Crear tipo"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
