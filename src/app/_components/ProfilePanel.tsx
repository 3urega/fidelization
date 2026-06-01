"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type UserJson = {
	id: string;
	name: string;
	email: string;
	profilePicture: string;
	plan: string;
};

export function ProfilePanel(): React.ReactElement {
	const router = useRouter();
	const [user, setUser] = useState<UserJson | null>(null);
	const [name, setName] = useState("");
	const [profilePicture, setProfilePicture] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loadMe = useCallback(async () => {
		const res = await fetch("/api/me", { credentials: "include" });
		if (res.status === 401) {
			router.push("/login");

			return;
		}
		if (!res.ok) {
			setError("No se pudo cargar el perfil");

			return;
		}
		const data = (await res.json()) as { user: UserJson };
		setUser(data.user);
		setName(data.user.name);
		setProfilePicture(data.user.profilePicture);
	}, [router]);

	useEffect(() => {
		void loadMe();
	}, [loadMe]);

	async function saveProfile(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setMessage(null);
		const res = await fetch("/api/me", {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, profilePicture }),
		});
		if (!res.ok) {
			setError("Error al guardar");

			return;
		}
		const data = (await res.json()) as { user: UserJson };
		setUser(data.user);
		setMessage("Perfil actualizado");
	}

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		router.push("/login");
	}

	async function syncPlan(): Promise<void> {
		setMessage(null);
		const res = await fetch("/api/billing/google-play/sync", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		const data = (await res.json()) as { plan?: string; error?: { description?: string } };
		if (!res.ok) {
			setError(data.error?.description ?? "Sync falló (¿Google Play configurado?)");

			return;
		}
		setMessage(`Sync OK — plan: ${data.plan ?? "?"}`);
		void loadMe();
	}

	async function setDemoPlan(plan: "FREE" | "PREMIUM"): Promise<void> {
		setMessage(null);
		const res = await fetch("/api/billing/demo/set-plan", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ plan }),
		});
		const data = (await res.json()) as { plan?: string; error?: { description?: string } };
		if (!res.ok) {
			setError(data.error?.description ?? "Demo billing desactivado");

			return;
		}
		setMessage(`Plan demo: ${data.plan}`);
		void loadMe();
	}

	if (!user) {
		return <p>Cargando…</p>;
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
			<section>
				<h2>Tu perfil</h2>
				<p>
					<strong>Plan:</strong>{" "}
					<span
						style={{
							padding: "0.2rem 0.5rem",
							borderRadius: "4px",
							background: user.plan === "PREMIUM" ? "#e8f5e9" : "#f5f5f5",
						}}
					>
						{user.plan}
					</span>
				</p>
				<p>
					<strong>Email:</strong> {user.email}
				</p>
				<p>
					<strong>Id:</strong> <code>{user.id}</code>
				</p>
			</section>

			<form
				onSubmit={(e) => {
					void saveProfile(e);
				}}
				style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
			>
				<h3>Editar perfil</h3>
				<label>
					Nombre
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{ display: "block", width: "100%", padding: "0.5rem" }}
					/>
				</label>
				<label>
					Avatar (URL)
					<input
						value={profilePicture}
						onChange={(e) => setProfilePicture(e.target.value)}
						placeholder="https://..."
						style={{ display: "block", width: "100%", padding: "0.5rem" }}
					/>
				</label>
				<button type="submit">Guardar</button>
			</form>

			<section style={{ borderTop: "1px solid #ddd", paddingTop: "1rem" }}>
				<h3>Billing de ejemplo</h3>
				<p style={{ fontSize: "0.9rem", color: "#555" }}>
					Verify real requiere Google Play. En local usa los botones demo con{" "}
					<code>ALLOW_DEMO_BILLING=1</code>.
				</p>
				<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
					<button type="button" onClick={() => void syncPlan()}>
						Sync plan (Google)
					</button>
					<button type="button" onClick={() => void setDemoPlan("FREE")}>
						Demo → FREE
					</button>
					<button type="button" onClick={() => void setDemoPlan("PREMIUM")}>
						Demo → PREMIUM
					</button>
				</div>
			</section>

			<button type="button" onClick={() => void logout()}>
				Cerrar sesión
			</button>

			{message ? <p style={{ color: "green" }}>{message}</p> : null}
			{error ? <p style={{ color: "crimson" }}>{error}</p> : null}
		</div>
	);
}
