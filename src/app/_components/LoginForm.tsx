"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm(): React.ReactElement {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});
		setLoading(false);
		if (!res.ok) {
			const data = (await res.json()) as { error?: { description?: string } };
			setError(data.error?.description ?? "Error al iniciar sesión");

			return;
		}
		router.push("/profile");
	}

	async function demo(): Promise<void> {
		setLoading(true);
		setError(null);
		const res = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
		setLoading(false);
		if (!res.ok) {
			setError("No se pudo entrar como demo (¿Postgres y seed?)");

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
					style={{ display: "block", width: "100%", padding: "0.5rem" }}
				/>
			</label>
			{error ? <p style={{ color: "crimson" }}>{error}</p> : null}
			<button type="submit" disabled={loading}>
				{loading ? "..." : "Entrar"}
			</button>
			<button type="button" onClick={() => void demo()} disabled={loading}>
				Entrar como demo
			</button>
			<p>
				¿Sin cuenta? <Link href="/register">Regístrate</Link>
			</p>
		</form>
	);
}
