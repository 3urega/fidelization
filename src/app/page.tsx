import Link from "next/link";

export default function HomePage(): React.ReactElement {
	return (
		<main style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
			<h1>Next.js + Capacitor Starter</h1>
			<p style={{ lineHeight: 1.6, color: "#333" }}>
				Plantilla para apps <strong>web + Android</strong> con backend Next.js (hexagonal / DDD),
				autenticación JWT, billing de ejemplo y código legacy RAG como referencia.
			</p>

			<section style={{ marginTop: "2rem" }}>
				<h2>Qué incluye</h2>
				<ul style={{ lineHeight: 1.8 }}>
					<li>
						<code>src/contexts/identity/</code> — usuarios, registro, login, perfil
					</li>
					<li>
						<code>src/contexts/billing/</code> — Google Play verify/sync + demo plan
					</li>
					<li>
						<code>src/contexts/shared/</code> — Postgres, DI (diod), HTTP helpers
					</li>
					<li>
						<code>src/contexts/legacy/</code> — MOOC / Femturisme RAG (solo referencia, sin DI)
					</li>
					<li>Capacitor + export estático para Android</li>
				</ul>
			</section>

			<section style={{ marginTop: "2rem" }}>
				<h2>Probar el starter</h2>
				<ol style={{ lineHeight: 1.8 }}>
					<li>
						<code>docker compose up -d</code> y <code>npm run dev</code>
					</li>
					<li>
						Copia <code>.env.example</code> → <code>.env.local</code> (AUTH_SECRET,
						ALLOW_DEMO_BILLING=1)
					</li>
					<li>
						<Link href="/register">Regístrate</Link> o <Link href="/login">login</Link> (botón demo
						incluido)
					</li>
					<li>
						En <Link href="/profile">/profile</Link>: edita perfil y prueba billing demo
						FREE/PREMIUM
					</li>
				</ol>
			</section>

			<section style={{ marginTop: "2rem" }}>
				<h2>Build Android</h2>
				<pre
					style={{
						background: "#f5f5f5",
						padding: "1rem",
						borderRadius: "4px",
						overflow: "auto",
					}}
				>
					{`# Backend desplegado; en build móvil:
NEXT_PUBLIC_API_URL=https://tu-api.example.com
npm run build:capacitor`}
				</pre>
			</section>

			<section style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
				<p>
					Documentación de convenciones en <code>docs/</code> y comandos en <code>README.md</code>.
				</p>
			</section>
		</main>
	);
}
