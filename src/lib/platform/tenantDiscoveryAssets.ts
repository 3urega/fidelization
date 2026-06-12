/** Default grid cover when tenant has no uploaded cover image. */

export const DEFAULT_TENANT_COVER_IMAGE_URL = "/cafe_generico.png";

export function resolveTenantCoverImageUrl(coverImageUrl: string | null | undefined): string {
	const trimmed = coverImageUrl?.trim();

	return trimmed ? trimmed : DEFAULT_TENANT_COVER_IMAGE_URL;
}
