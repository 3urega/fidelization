const isCapacitorStatic = process.env.CAPACITOR_STATIC === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	...(isCapacitorStatic
		? {
				output: "export",
				images: {
					unoptimized: true,
				},
			}
		: {}),
	experimental: {
		instrumentationHook: true,
		serverComponentsExternalPackages: ["googleapis", "google-auth-library", "postgres", "bcryptjs"],
	},
};

module.exports = nextConfig;
