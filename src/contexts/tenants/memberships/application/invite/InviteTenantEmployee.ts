import { Service } from "diod";

import { UserRegistrar } from "../../../../identity/users/application/register/UserRegistrar";
import { TenantAccessSuspended } from "../../../tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/domain/TenantRepository";
import { TenantStatus } from "../../../tenants/domain/TenantStatus";
import { TenantEmployee } from "../../domain/TenantEmployee";
import { TenantEmployeesForbidden } from "../../domain/TenantEmployeesForbidden";
import { TenantMembershipRepository } from "../../domain/TenantMembershipRepository";
import { TenantRole } from "../../domain/TenantRole";

export type InviteTenantEmployeeParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		name?: string;
		email?: string;
		password?: string;
	};
};

@Service()
export class InviteTenantEmployee {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly membershipRepository: TenantMembershipRepository,
		private readonly userRegistrar: UserRegistrar,
	) {}

	async execute(params: InviteTenantEmployeeParams): Promise<TenantEmployee> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantEmployeesForbidden(params.role);
		}

		await this.assertTenantActive(params.tenantId);

		const name = params.input.name?.trim();
		const email = params.input.email?.trim();
		const password = params.input.password;

		if (!name || !email || !password) {
			throw new Error("name, email and password are required");
		}

		const user = await this.userRegistrar.register({ name, email, password });
		const { membershipId } = await this.membershipRepository.createStaffMembership({
			tenantId: params.tenantId,
			userId: user.id.value,
			role: TenantRole.Employee,
		});

		return {
			membershipId,
			userId: user.id.value,
			name: user.name.value,
			email: user.email.value,
			role: TenantRole.Employee,
		};
	}

	private async assertTenantActive(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
