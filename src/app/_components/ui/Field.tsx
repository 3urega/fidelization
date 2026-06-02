import type { ReactElement, ReactNode } from "react";

type FieldProps = {
	label: string;
	children: ReactNode;
};

export function Field({ label, children }: FieldProps): ReactElement {
	return (
		<label className="flex flex-col gap-1.5 text-sm text-foreground">
			<span>{label}</span>
			{children}
		</label>
	);
}
