import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { Service } from "diod";

import { TenantRole } from "../../../memberships/domain/TenantRole";
import { InvalidTenantCoverImage } from "../../domain/InvalidTenantCoverImage";
import { Tenant } from "../../domain/Tenant";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantProfileForbidden } from "../../domain/TenantProfileForbidden";
import { TenantRepository } from "../../domain/TenantRepository";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export type UploadTenantCoverImageParams = {
	tenantId: string;
	role: TenantRole;
	file: File;
};

export type ClearTenantCoverImageParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class UploadTenantCoverImage {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async upload(params: UploadTenantCoverImageParams): Promise<Tenant> {
		this.assertOwner(params.role);

		const extension = ALLOWED_MIME_TO_EXT[params.file.type];
		if (!extension) {
			throw new InvalidTenantCoverImage("Only JPEG, PNG and WebP images are allowed");
		}

		if (params.file.size > MAX_FILE_BYTES) {
			throw new InvalidTenantCoverImage("Image must be at most 5 MB");
		}

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const uploadDir = path.join(process.cwd(), "public", "uploads", "tenants", params.tenantId);
		await mkdir(uploadDir, { recursive: true });
		await this.removeExistingCoverFiles(uploadDir);

		const fileName = `cover.${extension}`;
		const absolutePath = path.join(uploadDir, fileName);
		const buffer = Buffer.from(await params.file.arrayBuffer());
		await writeFile(absolutePath, buffer);

		const publicUrl = `/uploads/tenants/${params.tenantId}/${fileName}`;
		const updated = await this.tenantRepository.updateCoverImageUrl(params.tenantId, publicUrl);
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}

	async clear(params: ClearTenantCoverImageParams): Promise<Tenant> {
		this.assertOwner(params.role);

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const uploadDir = path.join(process.cwd(), "public", "uploads", "tenants", params.tenantId);
		await this.removeExistingCoverFiles(uploadDir);

		const updated = await this.tenantRepository.updateCoverImageUrl(params.tenantId, "");
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}

	private assertOwner(role: TenantRole): void {
		if (role !== TenantRole.Owner) {
			throw new TenantProfileForbidden(role);
		}
	}

	private async removeExistingCoverFiles(uploadDir: string): Promise<void> {
		try {
			const entries = await readdir(uploadDir);
			await Promise.all(
				entries
					.filter((entry) => entry.startsWith("cover."))
					.map((entry) => unlink(path.join(uploadDir, entry))),
			);
		} catch {
			// Directory may not exist yet.
		}
	}
}
