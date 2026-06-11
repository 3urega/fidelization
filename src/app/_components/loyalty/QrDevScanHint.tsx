"use client";

import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";

type QrDevScanHintProps = {
	qrValue: string;
};

export function QrDevScanHint({ qrValue }: QrDevScanHintProps): ReactElement | null {
	const [copied, setCopied] = useState(false);

	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	async function handleCopy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(qrValue);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<div className="w-full max-w-sm rounded-theme border border-dashed border-border bg-muted/20 p-3">
			<p className="text-xs font-medium text-muted">Dev — pegar en /scan</p>
			<code className="mt-2 block break-all text-xs text-foreground">{qrValue}</code>
			<Button
				type="button"
				variant="ghost"
				className="mt-2 h-8 w-full text-xs"
				onClick={() => void handleCopy()}
			>
				{copied ? "Copiado" : "Copiar valor"}
			</Button>
		</div>
	);
}
