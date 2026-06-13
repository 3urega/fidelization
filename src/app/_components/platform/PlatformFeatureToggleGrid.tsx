import type { ReactElement } from "react";

import type { SubscriptionPlanFeatures } from "../../../contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import type { TenantPlanFeature } from "../../../contexts/billing/subscriptions/domain/TenantPlanFeature";
import type { PlatformFeatureCatalogEntry } from "../../../lib/platform/featureCatalog";

type PlatformFeatureToggleGridProps = {
	catalog: PlatformFeatureCatalogEntry[];
	values: SubscriptionPlanFeatures;
	onChange: (key: TenantPlanFeature, enabled: boolean) => void;
	disabled?: boolean;
	inheritanceHints?: Partial<Record<TenantPlanFeature, "plan" | "override">>;
};

export function PlatformFeatureToggleGrid({
	catalog,
	values,
	onChange,
	disabled = false,
	inheritanceHints,
}: PlatformFeatureToggleGridProps): ReactElement {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{catalog.map((entry) => {
				const hint = inheritanceHints?.[entry.key];

				return (
					<label
						key={entry.key}
						className="flex flex-col gap-1 rounded-theme border border-border bg-background p-3 text-sm"
					>
						<span className="flex items-center gap-2 font-medium text-foreground">
							<input
								type="checkbox"
								checked={values[entry.key]}
								disabled={disabled}
								onChange={(event) => onChange(entry.key, event.target.checked)}
							/>
							{entry.label}
						</span>
						<span className="text-xs text-muted">{entry.description}</span>
						{entry.enforced ? (
							<span className="text-xs text-muted">Enforcement activo</span>
						) : null}
						{hint === "override" ? (
							<span className="text-xs text-accent">Override tenant</span>
						) : hint === "plan" ? (
							<span className="text-xs text-muted">Heredado del plan</span>
						) : null}
					</label>
				);
			})}
		</div>
	);
}
