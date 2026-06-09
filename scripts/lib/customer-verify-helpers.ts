import http from "node:http";
import https from "node:https";

import { formatTenantHost } from "../../src/lib/tenant/formatTenantHost";
import { DEMO_TENANT_ID } from "../../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../../src/lib/prisma";

export const DEMO_CUSTOMER_SEED_ID = "00000000-0000-4000-8000-000000000005";

export const apexBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(
	/\/$/,
	"",
);

export const tenantSlug = process.env.CUSTOMER_VERIFY_TENANT_SLUG ?? "cafe-demo";
export const tenantId = process.env.CUSTOMER_VERIFY_TENANT_ID ?? DEMO_TENANT_ID;

export type TenantFetchResponse = {
	status: number;
	headers: Headers;
	text: () => Promise<string>;
	json: () => Promise<unknown>;
};

export function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

export async function ensureDemoTenantActive(): Promise<void> {
	await prisma.tenant.updateMany({
		where: { id: DEMO_TENANT_ID },
		data: { status: "active" },
	});
}

/** Subdomain host for middleware/API tenant resolution (e.g. cafe-demo.localhost:3001). */
export function resolveTenantHostHeader(): string {
	const parsed = new URL(apexBaseUrl);
	const appDomain = process.env.APP_DOMAIN?.trim() || "localhost";
	const host = formatTenantHost({
		slug: tenantSlug,
		appDomain,
		port: parsed.port || undefined,
	});

	if (!host) {
		throw new Error("Could not build tenant host — set APP_DOMAIN (e.g. localhost)");
	}

	return host;
}

/**
 * HTTP fetch on loopback with explicit Host header — Node fetch forbids Host override (Windows *.localhost DNS).
 */
export function tenantFetch(
	path: string,
	init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<TenantFetchResponse> {
	const parsed = new URL(apexBaseUrl);
	const tenantHost = resolveTenantHostHeader();
	const isHttps = parsed.protocol === "https:";
	const requestModule = isHttps ? https : http;

	return new Promise((resolve, reject) => {
		const req = requestModule.request(
			{
				hostname: "127.0.0.1",
				port: parsed.port || (isHttps ? 443 : 80),
				path,
				method: init.method ?? "GET",
				headers: {
					Host: tenantHost,
					...init.headers,
				},
			},
			(res) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk: Buffer) => chunks.push(chunk));
				res.on("end", () => {
					const body = Buffer.concat(chunks).toString("utf8");
					const headers = new Headers();
					for (const [key, value] of Object.entries(res.headers)) {
						if (value === undefined) {
							continue;
						}
						if (Array.isArray(value)) {
							headers.set(key, value.join(", "));
						} else {
							headers.set(key, value);
						}
					}

					resolve({
						status: res.statusCode ?? 0,
						headers,
						text: async () => body,
						json: async () => JSON.parse(body) as unknown,
					});
				});
			},
		);

		req.on("error", reject);

		if (init.body) {
			req.write(init.body);
		}

		req.end();
	});
}
