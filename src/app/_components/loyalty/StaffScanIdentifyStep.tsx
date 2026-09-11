"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { useStaffScanSession } from "./StaffScanSessionProvider";

export function StaffScanIdentifyStep(): ReactElement {
	const router = useRouter();
	const { loadByQr, loading, error } = useStaffScanSession();
	const [qrValue, setQrValue] = useState("");
	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();

		const data = await loadByQr(qrValue);

		if (data) {
			router.push(`/scan/session?c=${encodeURIComponent(data.customer.id)}`);
		}
	}

	const displayError = error?.message;

	return (
		<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
			<Field label="Código QR del cliente">
				<Input
					type="text"
					name="qrValue"
					value={qrValue}
					onChange={(event) => setQrValue(event.target.value)}
					placeholder="Pega el código o escanéalo"
					autoComplete="off"
					spellCheck={false}
					disabled={loading}
				/>
				<p className="mt-1 text-xs text-muted">
					MVP: introduce el valor del QR manualmente. La cámara llegará en una fase posterior.
				</p>
			</Field>

			{displayError ? <p className="text-sm text-error">{displayError}</p> : null}

			<Button type="submit" disabled={loading || qrValue.trim() === ""} className="w-full sm:w-auto">
				{loading ? "Identificando…" : "Continuar"}
			</Button>
		</form>
	);
}
