import { User } from "../../../identity/users/domain/User";
import { TenantRole } from "../../memberships/domain/TenantRole";
import { Tenant } from "../../tenants/domain/Tenant";

export type CreateOwnerBusinessParams = {
	userId: string;
	businessName: string;
	businessType: string;
};

export type CreateOwnerBusinessResult = {
	user: User;
	tenant: Tenant;
	role: TenantRole.Owner;
};

export abstract class OwnerBusinessRepository {
	abstract createForUser(params: CreateOwnerBusinessParams): Promise<CreateOwnerBusinessResult>;
}
