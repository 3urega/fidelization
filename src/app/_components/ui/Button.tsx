import type { ButtonHTMLAttributes, ReactElement } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
	secondary:
		"border border-border bg-background text-foreground hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50",
	ghost: "text-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50",
};

export function Button({
	variant = "primary",
	className = "",
	...props
}: ButtonProps): ReactElement {
	return (
		<button
			className={`rounded-theme px-4 py-2 text-sm font-medium transition-opacity ${variantClasses[variant]} ${className}`}
			{...props}
		/>
	);
}
