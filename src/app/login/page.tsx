import { LoginForm } from "../_components/LoginForm";

export default function LoginPage(): React.ReactElement {
	return (
		<main style={{ maxWidth: "24rem", margin: "2rem auto", padding: "0 1rem" }}>
			<h1>Login</h1>
			<LoginForm />
		</main>
	);
}
