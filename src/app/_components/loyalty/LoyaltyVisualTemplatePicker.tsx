import type { ReactElement } from "react";

import { LoyaltyProgress } from "./LoyaltyProgress";
import {
	LOYALTY_VISUAL_TEMPLATES,
	type LoyaltyVisualTemplate,
} from "./loyaltyVisualTemplates";

type LoyaltyVisualTemplatePickerProps = {
	value: LoyaltyVisualTemplate;
	onChange: (template: LoyaltyVisualTemplate) => void;
	previewRequired?: number;
	previewCurrent?: number;
};

export function LoyaltyVisualTemplatePicker({
	value,
	onChange,
	previewRequired = 10,
	previewCurrent = 3,
}: LoyaltyVisualTemplatePickerProps): ReactElement {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
			{LOYALTY_VISUAL_TEMPLATES.map((template) => {
				const selected = value === template.id;

				return (
					<button
						key={template.id}
						type="button"
						onClick={() => onChange(template.id)}
						className={[
							"flex flex-col items-center gap-2 rounded-lg border p-2 transition-colors",
							selected
								? "border-primary bg-primary/5 ring-2 ring-primary/20"
								: "border-border bg-surface hover:border-primary/40",
						].join(" ")}
					>
						<LoyaltyProgress
							template={template.id}
							current={previewCurrent}
							required={previewRequired}
							className="pointer-events-none scale-75"
						/>
						<span className="text-xs font-medium text-foreground">{template.label}</span>
					</button>
				);
			})}
		</div>
	);
}
