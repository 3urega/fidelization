"use client";

import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformGameResponse } from "../../../lib/platform/games";
import { PLATFORM_PLAN_FEATURE_CATALOG } from "../../../lib/platform/featureCatalog";
import type { PlatformGameStatus } from "../../../contexts/platform/domain/PlatformGameStatus";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type GamesResponse = {
	games?: PlatformGameResponse[];
	error?: { description?: string };
};

type GameFormState = {
	slug: string;
	label: string;
	description: string;
	status: PlatformGameStatus;
	requiredFeature: string;
	sortOrder: string;
};

const TEXTAREA_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60 min-h-[4rem] resize-y";

const SELECT_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60";

const STATUS_OPTIONS: { value: PlatformGameStatus; label: string }[] = [
	{ value: "draft", label: "Borrador" },
	{ value: "active", label: "Activo" },
	{ value: "beta", label: "Beta" },
];

function emptyForm(): GameFormState {
	return {
		slug: "",
		label: "",
		description: "",
		status: "draft",
		requiredFeature: "gamification",
		sortOrder: "",
	};
}

function gameToForm(game: PlatformGameResponse): GameFormState {
	return {
		slug: game.slug,
		label: game.label,
		description: game.description,
		status: game.status,
		requiredFeature: game.requiredFeature,
		sortOrder: String(game.sortOrder),
	};
}

function statusLabel(status: PlatformGameStatus): string {
	return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function featureLabel(key: string): string {
	return PLATFORM_PLAN_FEATURE_CATALOG.find((entry) => entry.key === key)?.label ?? key;
}

function GameFormFields({
	form,
	onChange,
	slugReadOnly,
}: {
	form: GameFormState;
	onChange: (patch: Partial<GameFormState>) => void;
	slugReadOnly?: boolean;
}): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<Field label="Slug">
				<Input
					id="game-slug"
					value={form.slug}
					onChange={(event) => onChange({ slug: event.target.value })}
					placeholder="ruleta"
					disabled={slugReadOnly}
				/>
			</Field>
			<Field label="Nombre">
				<Input
					id="game-label"
					value={form.label}
					onChange={(event) => onChange({ label: event.target.value })}
					placeholder="Ruleta"
				/>
			</Field>
			<Field label="Descripción">
				<textarea
					id="game-description"
					className={TEXTAREA_CLASS}
					value={form.description}
					onChange={(event) => onChange({ description: event.target.value })}
					placeholder="Descripción orientativa para comerciantes"
				/>
			</Field>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Estado">
					<select
						id="game-status"
						className={SELECT_CLASS}
						value={form.status}
						onChange={(event) => onChange({ status: event.target.value as PlatformGameStatus })}
					>
						{STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Feature flag requerida">
					<select
						id="game-feature"
						className={SELECT_CLASS}
						value={form.requiredFeature}
						onChange={(event) => onChange({ requiredFeature: event.target.value })}
					>
						{PLATFORM_PLAN_FEATURE_CATALOG.map((entry) => (
							<option key={entry.key} value={entry.key}>
								{entry.label} ({entry.key})
							</option>
						))}
					</select>
				</Field>
			</div>
			<Field label="Orden (opcional)">
				<Input
					id="game-sort"
					type="number"
					min={0}
					value={form.sortOrder}
					onChange={(event) => onChange({ sortOrder: event.target.value })}
					placeholder="Auto"
				/>
			</Field>
		</div>
	);
}

export function PlatformGamesPanel(): ReactElement {
	const [games, setGames] = useState<PlatformGameResponse[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [createForm, setCreateForm] = useState<GameFormState>(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<GameFormState>(emptyForm);
	const [savingCreate, setSavingCreate] = useState(false);
	const [savingEditId, setSavingEditId] = useState<string | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/games", { credentials: "include" });
			const body = (await response.json()) as GamesResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo cargar los juegos");
				setGames(null);

				return;
			}

			setGames(body.games ?? []);
		} catch {
			setError("No se pudo conectar con el servidor");
			setGames(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setActionError(null);
		setSuccess(null);
		setSavingCreate(true);

		try {
			const sortOrder = createForm.sortOrder.trim()
				? Number.parseInt(createForm.sortOrder, 10)
				: undefined;

			const response = await fetch("/api/platform/games", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slug: createForm.slug,
					label: createForm.label,
					description: createForm.description,
					status: createForm.status,
					requiredFeature: createForm.requiredFeature,
					...(sortOrder !== undefined ? { sortOrder } : {}),
				}),
			});
			const body = (await response.json()) as GamesResponse & { game?: PlatformGameResponse };

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo crear el juego");

				return;
			}

			setCreateForm(emptyForm());
			setSuccess(`Juego «${body.game?.label ?? createForm.label}» creado`);
			await load();
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSavingCreate(false);
		}
	}

	function startEdit(game: PlatformGameResponse): void {
		setEditingId(game.id);
		setEditForm(gameToForm(game));
		setActionError(null);
		setSuccess(null);
	}

	function cancelEdit(): void {
		setEditingId(null);
		setEditForm(emptyForm());
	}

	async function handleSaveEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();

		if (!editingId) {
			return;
		}

		setActionError(null);
		setSuccess(null);
		setSavingEditId(editingId);

		try {
			const sortOrder = editForm.sortOrder.trim()
				? Number.parseInt(editForm.sortOrder, 10)
				: undefined;

			const response = await fetch(`/api/platform/games/${editingId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					label: editForm.label,
					description: editForm.description,
					status: editForm.status,
					requiredFeature: editForm.requiredFeature,
					...(sortOrder !== undefined ? { sortOrder } : {}),
				}),
			});
			const body = (await response.json()) as GamesResponse & { game?: PlatformGameResponse };

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo guardar el juego");

				return;
			}

			setEditingId(null);
			setSuccess(`Juego «${body.game?.label ?? editForm.label}» actualizado`);
			await load();
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSavingEditId(null);
		}
	}

	async function handleDeactivate(game: PlatformGameResponse): Promise<void> {
		setActionError(null);
		setSuccess(null);
		setTogglingId(game.id);

		try {
			const response = await fetch(`/api/platform/games/${game.id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "draft" }),
			});
			const body = (await response.json()) as GamesResponse;

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo desactivar el juego");

				return;
			}

			setSuccess(`Juego «${game.label}» pasado a borrador`);
			await load();
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setTogglingId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			{error ? (
				<Card>
					<p className="text-sm text-destructive">{error}</p>
				</Card>
			) : null}

			{actionError ? (
				<Card>
					<p className="text-sm text-destructive">{actionError}</p>
				</Card>
			) : null}

			{success ? (
				<Card>
					<p className="text-sm text-primary">{success}</p>
				</Card>
			) : null}

			<Card>
				<h2 className="font-medium text-foreground">Nuevo juego</h2>
				<form className="mt-4 flex flex-col gap-4" onSubmit={handleCreate}>
					<GameFormFields form={createForm} onChange={(patch) => setCreateForm({ ...createForm, ...patch })} />
					<Button type="submit" disabled={savingCreate || !createForm.slug.trim() || !createForm.label.trim()}>
						{savingCreate ? "Creando…" : "Crear juego"}
					</Button>
				</form>
			</Card>

			<Card>
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<h2 className="font-medium text-foreground">Biblioteca global</h2>
					<p className="text-sm text-muted">
						{games?.length ?? 0} {(games?.length ?? 0) === 1 ? "juego" : "juegos"}
					</p>
				</div>

				{loading ? (
					<p className="mt-4 text-sm text-muted">Cargando…</p>
				) : !games || games.length === 0 ? (
					<p className="mt-4 text-sm text-muted">No hay juegos en la biblioteca.</p>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="py-2 pr-4 font-medium">Juego</th>
									<th className="py-2 pr-4 font-medium">Estado</th>
									<th className="py-2 pr-4 font-medium">Feature</th>
									<th className="py-2 font-medium">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{games.map((game) => (
									<tr key={game.id} className="border-b border-border align-top">
										<td className="py-3 pr-4">
											<p className="font-medium text-foreground">{game.label}</p>
											<p className="text-xs text-muted">{game.slug}</p>
											{game.description ? (
												<p className="mt-1 text-xs text-muted">{game.description}</p>
											) : null}
										</td>
										<td className="py-3 pr-4 text-muted">{statusLabel(game.status)}</td>
										<td className="py-3 pr-4 text-muted">{featureLabel(game.requiredFeature)}</td>
										<td className="py-3">
											<div className="flex flex-wrap gap-2">
												<Button type="button" variant="secondary" onClick={() => startEdit(game)}>
													Editar
												</Button>
												{game.status !== "draft" ? (
													<Button
														type="button"
														variant="secondary"
														disabled={togglingId === game.id}
														onClick={() => void handleDeactivate(game)}
													>
														{togglingId === game.id ? "Desactivando…" : "Desactivar"}
													</Button>
												) : null}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			{editingId ? (
				<Card>
					<h2 className="font-medium text-foreground">Editar juego</h2>
					<form className="mt-4 flex flex-col gap-4" onSubmit={handleSaveEdit}>
						<GameFormFields
							form={editForm}
							onChange={(patch) => setEditForm({ ...editForm, ...patch })}
							slugReadOnly
						/>
						<div className="flex flex-wrap gap-2">
							<Button type="submit" disabled={savingEditId === editingId || !editForm.label.trim()}>
								{savingEditId === editingId ? "Guardando…" : "Guardar cambios"}
							</Button>
							<Button type="button" variant="secondary" onClick={cancelEdit}>
								Cancelar
							</Button>
						</div>
					</form>
				</Card>
			) : null}
		</div>
	);
}
