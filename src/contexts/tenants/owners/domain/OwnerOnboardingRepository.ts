import { User } from "../../../identity/users/domain/User";
import { TenantRole } from "../../memberships/domain/TenantRole";
import { Tenant } from "../../tenants/domain/Tenant";

export type RegisterOwnerParams = {
	name: string;
	email: string;
	password: string;
	businessName: string;
	profilePicture?: string;
};

export type RegisterOwnerResult = {
	user: User;
	tenant: Tenant;
	role: TenantRole;
};

export abstract class OwnerOnboardingRepository {
	abstract register(params: RegisterOwnerParams): Promise<RegisterOwnerResult>;
}
