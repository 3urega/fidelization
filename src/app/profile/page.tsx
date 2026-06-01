import { ProfilePanel } from "../_components/ProfilePanel";

export default function ProfilePage(): React.ReactElement {
	return (
		<main style={{ maxWidth: "32rem", margin: "2rem auto", padding: "0 1rem" }}>
			<h1>Perfil</h1>
			<ProfilePanel />
		</main>
	);
}
