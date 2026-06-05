"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type RegisterResponse = {
	customer?: {
		id: string;
		name: string;
		pointsBalance: number;
	};
	error?: {
		description?: string;
	};
};

export function CustomerWelcomeForm(): ReactElement {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);

		const trimmedName = name.trim();
		if (!trimmedName) {
			setError("El nombre es obligatorio.");

			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/loyalty/customers/register", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: trimmedName,
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
				}),
			});

			const body = (await response.json()) as RegisterResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo crear tu tarjeta.");

				return;
			}

			router.push("/app/card");
			router.refresh();
		} catch {
			setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form className="mt-6 flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
			<Field label="Nombre">
				<Input
					type="text"
					name="name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Tu nombre"
					autoComplete="name"
					required
				/>
			</Field>

			<Field label="Email (opcional)">
				<Input
					type="email"
					name="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="tu@email.com"
					autoComplete="email"
				/>
			</Field>

			<Field label="Teléfono (opcional)">
				<Input
					type="tel"
					name="phone"
					value={phone}
					onChange={(event) => setPhone(event.target.value)}
					placeholder="+34 600 000 000"
					autoComplete="tel"
				/>
			</Field>

			{error ? <p className="text-sm text-error">{error}</p> : null}

			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Creando tarjeta…" : "Obtener mi tarjeta"}
			</Button>
		</form>
	);
}
