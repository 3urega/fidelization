import { TenantBrandingForm } from "../../../_components/branding/TenantBrandingForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function BrandingSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Branding"
				description="Logo y colores de tu negocio. Los cambios se aplican al instante en el panel."
			/>
			<TenantBrandingForm />
		</>
	);
}
