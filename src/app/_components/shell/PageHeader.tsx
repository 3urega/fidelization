import type { ReactElement, ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	description?: string;
	children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps): ReactElement {
	return (
		<div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
				{description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
			</div>
			{children ? <div className="flex shrink-0 gap-2">{children}</div> : null}
		</div>
	);
}
