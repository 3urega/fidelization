"use client";

import { type ReactElement, useEffect } from "react";

import { Button } from "../ui/Button";
import { PlatformUserQrPanel } from "./PlatformUserQrPanel";

type PlatformUserQrModalProps = {
	open: boolean;
	onClose: () => void;
	name: string;
	qrValue: string | null;
};

export function PlatformUserQrModal({
	open,
	onClose,
	name,
	qrValue,
}: PlatformUserQrModalProps): ReactElement | null {
	useEffect(() => {
		if (!open) {
			return;
		}

		function onKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("keydown", onKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = "";
		};
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
			<button
				type="button"
				className="absolute inset-0 bg-foreground/40"
				aria-label="Cerrar"
				onClick={onClose}
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="platform-user-qr-title"
				className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-theme border border-border bg-background p-6 shadow-lg sm:rounded-theme"
			>
				<div className="flex items-center justify-between gap-3">
					<h2 id="platform-user-qr-title" className="text-lg font-semibold text-foreground">
						Mi QR
					</h2>
					<Button type="button" variant="secondary" onClick={onClose}>
						Cerrar
					</Button>
				</div>

				<PlatformUserQrPanel name={name} qrValue={qrValue} loading={false} />
			</div>
		</div>
	);
}
