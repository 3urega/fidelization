import { type ReactElement } from "react";

export function MapCenterPin(): ReactElement {
	return (
		<div
			className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"
			aria-hidden
		>
			<svg
				width="28"
				height="36"
				viewBox="0 0 28 36"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="drop-shadow-sm"
			>
				<path
					d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0Z"
					fill="var(--color-primary)"
				/>
				<circle cx="14" cy="14" r="5" fill="var(--color-background)" />
			</svg>
		</div>
	);
}
