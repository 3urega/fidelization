import type { ReactElement, ReactNode } from "react";

import { Card } from "./Card";

type AppShellProps = {
	title: string;
	description?: string;
	children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps): ReactElement {
	return (
		<main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col px-4 py-8">
			<Card>
				<div className="mb-6 flex flex-col gap-2">
					<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
					{description ? <p className="text-sm text-muted">{description}</p> : null}
				</div>
				{children}
			</Card>
		</main>
	);
}
