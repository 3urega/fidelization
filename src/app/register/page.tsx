import { RegisterForm } from "../_components/RegisterForm";

export default function RegisterPage(): React.ReactElement {
	return (
		<main style={{ maxWidth: "24rem", margin: "2rem auto", padding: "0 1rem" }}>
			<h1>Registro</h1>
			<RegisterForm />
		</main>
	);
}
