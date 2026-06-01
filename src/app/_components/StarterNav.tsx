import Link from "next/link";

export function StarterNav(): React.ReactElement {
	return (
		<nav
			style={{
				display: "flex",
				gap: "1rem",
				padding: "1rem 2rem",
				borderBottom: "1px solid #ddd",
				alignItems: "center",
			}}
		>
			<strong style={{ marginRight: "auto" }}>Next.js Starter</strong>
			<Link href="/">Inicio</Link>
			<Link href="/login">Login</Link>
			<Link href="/register">Registro</Link>
			<Link href="/profile">Perfil</Link>
		</nav>
	);
}
