import type { CapacitorConfig } from "@capacitor/cli";

const appId = process.env.CAPACITOR_APP_ID ?? "com.eurega.fidelization";
const appName = process.env.CAPACITOR_APP_NAME ?? "3urega";
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
	appId,
	appName,
	webDir: "out",
	server: {
		androidScheme: "https",
		...(serverUrl ? { url: serverUrl, cleartext: serverUrl.startsWith("http://") } : {}),
	},
	android: {
		allowMixedContent: Boolean(serverUrl?.startsWith("http://")),
	},
};

export default config;
