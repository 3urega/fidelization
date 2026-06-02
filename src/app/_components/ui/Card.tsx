import type { ReactElement, ReactNode } from "react";

type CardProps = {
	children: ReactNode;
	className?: string;
};

export function Card({ children, className = "" }: CardProps): ReactElement {
	return (
		<div className={`rounded-theme border border-border bg-background p-6 shadow-sm ${className}`}>
			{children}
		</div>
	);
}
