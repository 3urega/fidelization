import { ProfilePanel } from "../../_components/ProfilePanel";

export default function ProfilePage(): React.ReactElement {
	return (
		<main className="mx-auto w-full max-w-md px-4 py-8">
			<h1 className="mb-6 text-2xl font-semibold text-foreground">Perfil</h1>
			<ProfilePanel />
		</main>
	);
}
