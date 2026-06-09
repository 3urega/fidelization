import { PromotionsForm } from "../../../_components/loyalty/PromotionsForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PromotionSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Promociones"
				description="Crea ofertas para tus clientes fidelizados. Visible en la app cuando esté activa."
			/>
			<PromotionsForm />
		</>
	);
}
