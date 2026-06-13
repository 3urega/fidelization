import { PageHeader } from "../../_components/shell/PageHeader";
import { Card } from "../../_components/ui/Card";

export default function CustomersPage(): React.ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Clientes"
				description="Conoce a tus clientes fieles, detecta riesgo de abandono y quién está cerca de una recompensa."
			/>
			<Card>
				<p className="text-sm text-muted">
					Próximamente: insights, clientes destacados, en riesgo y tabla completa.
				</p>
			</Card>
		</div>
	);
}
