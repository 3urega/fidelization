import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: process.env.CAPACITOR_APP_ID ?? "com.example.starter",
	appName: process.env.CAPACITOR_APP_NAME ?? "Starter",
	webDir: "out",
	server: {
		androidScheme: "https",
	},
};

export default config;
