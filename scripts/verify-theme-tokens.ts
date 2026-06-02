import { readFileSync } from "node:fs";
import { join } from "node:path";

import { applyThemeToDocument } from "../src/app/_components/theme/applyTheme";

const tokensPath = join(process.cwd(), "src/app/theme/tokens.css");
const tokensCss = readFileSync(tokensPath, "utf8");

const requiredTokens = [
	"--color-primary",
	"--color-secondary",
	"--color-background",
	"--color-foreground",
	"--color-muted",
	"--border-radius",
	"--font-family",
];

for (const token of requiredTokens) {
	if (!tokensCss.includes(token)) {
		console.error(`❌ Missing token in tokens.css: ${token}`);
		process.exit(1);
	}
}

const setProperties = new Map<string, string>();
const documentElement = {
	style: {
		setProperty(name: string, value: string): void {
			setProperties.set(name, value);
		},
	},
};

// @ts-expect-error minimal DOM mock for runtime theme application
globalThis.document = { documentElement };

applyThemeToDocument({ primaryColor: "#112233", secondaryColor: "#445566" });

if (setProperties.get("--color-primary") !== "#112233") {
	console.error("❌ applyTheme did not set --color-primary");
	process.exit(1);
}

if (setProperties.get("--color-secondary") !== "#445566") {
	console.error("❌ applyTheme did not set --color-secondary");
	process.exit(1);
}

console.log("✅ tokens.css contains required variables");
console.log("✅ applyThemeToDocument updates documentElement CSS vars");
