import { jsonWithClearSessionCookie } from "../../../../lib/auth/session";

export function POST(): Response {
	return jsonWithClearSessionCookie({ ok: true });
}
