import type { ReactElement } from "react";
import { Suspense } from "react";

import { PlatformFeaturesPanel } from "../../../_components/platform/PlatformFeaturesPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformFeaturesPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Feature flags"
				description="Módulos por plan (Basic/Pro/Premium) y overrides por comercio."
			/>
			<Suspense
				fallback={
					<p className="text-sm text-muted">Cargando Feature flags Por plan y Por comercio…</p>
				}
			>
				<PlatformFeaturesPanel />
			</Suspense>
		</div>
	);
}
