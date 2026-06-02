import type { InputHTMLAttributes, ReactElement } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps): ReactElement {
	return (
		<input
			className={`block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary ${className}`}
			{...props}
		/>
	);
}
