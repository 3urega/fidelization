"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm(): React.ReactElement {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const res = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name, email, password }),
		});
		setLoading(false);
		if (!res.ok) {
			const data = (await res.json()) as { error?: { description?: string } };
			setError(data.error?.description ?? "Error al registrarse");

			return;
		}
		router.push("/profile");
	}

	return (
		<form
			onSubmit={(e) => {
				void submit(e);
			}}
			style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
		>
			<label>
				Nombre
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					style={{ display: "block", width: "100%", padding: "0.5rem" }}
				/>
			</label>
			<label>
				Email
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					style={{ display: "block", width: "100%", padding: "0.5rem" }}
				/>
			</label>
			<label>
				Contraseña
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					minLength={8}
					style={{ display: "block", width: "100%", padding: "0.5rem" }}
				/>
			</label>
			{error ? <p style={{ color: "crimson" }}>{error}</p> : null}
			<button type="submit" disabled={loading}>
				{loading ? "..." : "Crear cuenta"}
			</button>
			<p>
				¿Ya tienes cuenta? <Link href="/login">Login</Link>
			</p>
		</form>
	);
}
