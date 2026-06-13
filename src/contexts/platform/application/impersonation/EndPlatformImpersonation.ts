import { Service } from "diod";

@Service()
export class EndPlatformImpersonation {
	execute(): { redirectUrl: string } {
		return { redirectUrl: "/platform/login" };
	}
}
