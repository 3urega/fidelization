import { slugifyBusinessName } from "../../../../lib/tenant/slugifyBusinessName";
import { StampTypeRepository } from "../../domain/StampTypeRepository";

export async function resolveUniqueStampTypeSlug(
	repository: StampTypeRepository,
	tenantId: string,
	label: string,
): Promise<string> {
	const baseSlug = slugifyBusinessName(label);
	let slug = baseSlug;
	let suffix = 2;

	while (await repository.searchBySlug(tenantId, slug)) {
		slug = `${baseSlug}-${suffix}`;
		suffix += 1;
	}

	return slug;
}
