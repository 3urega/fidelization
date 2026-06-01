const isCapacitorStatic = process.env.CAPACITOR_STATIC === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
		serverComponentsExternalPackages: ["googleapis", "postgres", "bcryptjs"],
	},
};

module.exports = nextConfig;
