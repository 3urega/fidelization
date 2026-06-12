"use client";

import { type ReactElement } from "react";

import {
	TENANT_DISCOVERY_TAG_OPTIONS,
	TENANT_DISCOVERY_TAGS_MAX,
	type TenantDiscoveryTagId,
} from "../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";

type TenantDiscoveryTagsPickerProps = {
	value: TenantDiscoveryTagId[];
	onChange: (tags: TenantDiscoveryTagId[]) => void;
};

export function TenantDiscoveryTagsPicker({
	value,
	onChange,
}: TenantDiscoveryTagsPickerProps): ReactElement {
	function toggleTag(tagId: TenantDiscoveryTagId): void {
		if (value.includes(tagId)) {
			onChange(value.filter((id) => id !== tagId));

			return;
		}

		if (value.length >= TENANT_DISCOVERY_TAGS_MAX) {
			return;
		}

		onChange([...value, tagId]);
	}

	return (
		<div className="flex flex-col gap-2">
			<ul className="flex flex-wrap gap-2">
				{TENANT_DISCOVERY_TAG_OPTIONS.map((tag) => {
					const selected = value.includes(tag.id);

					return (
						<li key={tag.id}>
							<button
								type="button"
								onClick={() => toggleTag(tag.id)}
								className={[
									"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
									selected
										? "border-primary bg-primary/10 text-primary"
										: "border-border bg-surface text-muted hover:text-foreground",
								].join(" ")}
								aria-pressed={selected}
							>
								{tag.label}
							</button>
						</li>
					);
				})}
			</ul>
			<p className="text-xs text-muted">
				Selecciona hasta {TENANT_DISCOVERY_TAGS_MAX} tags. Aparecerán en el grid de exploración.
			</p>
		</div>
	);
}
