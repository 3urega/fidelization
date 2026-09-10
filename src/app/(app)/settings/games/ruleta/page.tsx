"use client";

import { type ReactElement, useState } from "react";

import { RouletteActivityDashboard } from "../../../_components/loyalty/games/RouletteActivityDashboard";
import { RouletteConfigEditor } from "../../../_components/loyalty/RouletteConfigEditor";
import { PageHeader } from "../../../_components/shell/PageHeader";
import { Button } from "../../../_components/ui/Button";

type RouletteSettingsTab = "config" | "activity";

export default function RouletteSettingsPage(): ReactElement {
	const [tab, setTab] = useState<RouletteSettingsTab>("config");

	return (
		<>
			<PageHeader
				title="Ruleta"
				description="Configura premios, cuotas de participación y consulta la actividad diaria."
			/>
			<div className="mb-6 flex flex-wrap gap-2">
				<Button
					type="button"
					variant={tab === "config" ? "primary" : "secondary"}
					onClick={() => setTab("config")}
				>
					Configuración
				</Button>
				<Button
					type="button"
					variant={tab === "activity" ? "primary" : "secondary"}
					onClick={() => setTab("activity")}
				>
					Actividad
				</Button>
			</div>
			{tab === "config" ? <RouletteConfigEditor /> : <RouletteActivityDashboard />}
		</>
	);
}
