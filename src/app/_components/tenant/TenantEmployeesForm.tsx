"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type EmployeePayload = {
	id: string;
	userId: string;
	name: string;
	email: string;
	role: string;
};

type EmployeesResponse = {
	employees?: EmployeePayload[];
	employee?: EmployeePayload;
	error?: {
		description?: string;
	};
};

export function TenantEmployeesForm(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [employees, setEmployees] = useState<EmployeePayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const loadEmployees = useCallback(async (): Promise<void> => {
		setListLoading(true);

		try {
			const response = await fetch("/api/tenant/employees", {
				credentials: "include",
			});
			const body = (await response.json()) as EmployeesResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo cargar el equipo.");
				setEmployees([]);

				return;
			}

			setEmployees(body.employees ?? []);
		} catch {
			setSubmitError("Error de red al cargar el equipo.");
			setEmployees([]);
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			return;
		}

		void loadEmployees();
	}, [session, loadEmployees]);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">Solo el propietario del negocio puede gestionar el equipo.</p>
			</Card>
		);
	}

	const nameValid = name.trim().length > 0;
	const emailValid = email.trim().length > 0;
	const passwordValid = password.length > 0;

	async function handleInvite(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);

		if (!nameValid || !emailValid || !passwordValid) {
			setSubmitError("Completa nombre, email y contraseña temporal.");

			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/tenant/employees", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					password,
				}),
			});

			const body = (await response.json()) as EmployeesResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo invitar al empleado.");

				return;
			}

			if (body.employee) {
				setSuccess(`Empleado añadido: ${body.employee.name} (${body.employee.email}).`);
				setName("");
				setEmail("");
				setPassword("");
				await loadEmployees();
			}
		} catch {
			setSubmitError("Error de red al invitar al empleado.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<h2 className="font-medium text-foreground">Tu equipo</h2>
				{listLoading ? (
					<p className="mt-3 text-sm text-muted">Cargando empleados…</p>
				) : employees.length === 0 ? (
					<p className="mt-3 text-sm text-muted">
						Aún no has añadido empleados. Invita al primero abajo.
					</p>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{employees.map((employee) => (
							<li
								key={employee.id}
								className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="text-sm font-medium text-foreground">{employee.name}</p>
									<p className="text-sm text-muted">{employee.email}</p>
								</div>
								<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
									Empleado
								</span>
							</li>
						))}
					</ul>
				)}
			</Card>

			<Card>
				<h2 className="font-medium text-foreground">Invitar empleado</h2>
				<p className="mt-1 text-sm text-muted">
					Comparte la contraseña temporal con tu empleado para que inicie sesión en este negocio.
				</p>
				<form className="mt-4 flex flex-col gap-5" onSubmit={(event) => void handleInvite(event)}>
					<Field label="Nombre">
						<Input
							type="text"
							name="name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="María García"
							autoComplete="name"
							maxLength={120}
						/>
					</Field>

					<Field label="Email">
						<Input
							type="email"
							name="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="maria@cafe.com"
							autoComplete="email"
						/>
					</Field>

					<Field label="Contraseña temporal">
						<Input
							type="password"
							name="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="new-password"
						/>
					</Field>

					{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
					{success ? <p className="text-sm text-foreground">{success}</p> : null}

					<Button
						type="submit"
						disabled={saving || !nameValid || !emailValid || !passwordValid}
						className="w-full sm:w-auto"
					>
						{saving ? "Invitando…" : "Invitar empleado"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
