import { ProfilePanel } from "../../_components/ProfilePanel";
import { PageHeader } from "../../_components/shell/PageHeader";

export default function ProfilePage(): React.ReactElement {
	return (
		<>
			<PageHeader title="Perfil" description="Tu cuenta y opciones de facturación demo" />
			<ProfilePanel />
		</>
	);
}
