import "dotenv/config";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
const ownerEmail = process.env.OWNER_VERIFY_EMAIL?.trim();
const ownerPassword = process.env.OWNER_VERIFY_PASSWORD;

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function platformLogin(): Promise<string> {
	const response = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: superadminEmail, password: superadminPassword }),
	});

	const session = parseSessionCookie(response.headers.get("set-cookie"));
	if (!response.ok || !session) {
		console.error("❌ platform login failed", response.status);
		process.exit(1);
	}

	return session;
}

async function main(): Promise<void> {
	const session = await platformLogin();
	const cookieHeader = { cookie: `session=${session}` };

	const list = await fetch(`${baseUrl}/api/platform/tenants`, { headers: cookieHeader });
	const listBody = (await list.json()) as {
		tenants?: { id: string; slug: string; status: string }[];
	};

	if (!list.ok || !listBody.tenants?.length) {
		console.error("❌ GET /api/platform/tenants", list.status);
		process.exit(1);
	}

	console.log(`✅ GET /api/platform/tenants (${listBody.tenants.length} rows)`);

	const target =
		listBody.tenants.find((t) => t.slug === "cafe-demo") ?? listBody.tenants[0];
	const originalStatus = target.status;
	const toggleTo = originalStatus === "active" ? "suspended" : "active";

	const patch = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/status`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ status: toggleTo }),
	});
	const patchBody = (await patch.json()) as { tenant?: { status: string } };

	if (!patch.ok || patchBody.tenant?.status !== toggleTo) {
		console.error("❌ PATCH status", patch.status, patchBody);
		process.exit(1);
	}

	console.log(`✅ PATCH tenant ${target.slug} → ${toggleTo}`);

	if (ownerEmail && ownerPassword && toggleTo === "suspended") {
		const ownerLogin = await fetch(`${baseUrl}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
		});
		const ownerBody = (await ownerLogin.json()) as { error?: { type?: string } };

		if (ownerLogin.status !== 403 || ownerBody.error?.type !== "TenantAccessSuspended") {
			console.error(
				"❌ owner login on suspended tenant should be 403 TenantAccessSuspended",
				ownerLogin.status,
				ownerBody.error?.type,
			);
			process.exit(1);
		}

		console.log("✅ tenant login blocked when suspended (OWNER_VERIFY_*)");
	}

	const restore = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/status`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ status: originalStatus }),
	});

	if (!restore.ok) {
		console.error("❌ restore tenant status", restore.status);
		process.exit(1);
	}

	console.log(`✅ restored tenant ${target.slug} → ${originalStatus}`);
}

void main();
