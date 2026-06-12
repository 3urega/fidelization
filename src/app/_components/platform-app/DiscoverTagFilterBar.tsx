"use client";

import { type ReactElement } from "react";

import {
	TENANT_DISCOVERY_TAG_OPTIONS,
	type TenantDiscoveryTagId,
} from "../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";

type DiscoverTagFilterBarProps = {
	value: TenantDiscoveryTagId[];
	onChange: (tags: TenantDiscoveryTagId[]) => void;
};

export function DiscoverTagFilterBar({
	value,
	onChange,
}: DiscoverTagFilterBarProps): ReactElement {
	function toggleTag(tagId: TenantDiscoveryTagId): void {
		if (value.includes(tagId)) {
			onChange(value.filter((id) => id !== tagId));

			return;
		}

		onChange([...value, tagId]);
	}

	function clearFilters(): void {
		onChange([]);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium text-foreground">Filtrar por tipo de local</p>
				{value.length > 0 ? (
					<button
						type="button"
						onClick={clearFilters}
						className="text-xs font-medium text-primary hover:opacity-80"
					>
						Quitar filtros
					</button>
				) : null}
			</div>
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
		</div>
	);
}
