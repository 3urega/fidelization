import { clearSessionCookie } from "../../../../lib/auth/session";

export function POST(): Response {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": clearSessionCookie(),
		},
	});
}
