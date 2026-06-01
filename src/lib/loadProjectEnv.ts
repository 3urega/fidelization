import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function applyEnvFromFileContent(content: string, override: boolean): void {
	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const eq = line.indexOf("=");
		if (eq === -1) {
			continue;
		}

		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1).replace(/\\n/g, "\n");
		}

		if (override || process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

export function loadProjectEnv(): void {
	const root = process.cwd();
	const files = [".env", ".env.development", ".env.dev", ".env.local"];

	for (const name of files) {
		const filePath = join(root, name);
		if (!existsSync(filePath)) {
			continue;
		}

		applyEnvFromFileContent(readFileSync(filePath, "utf8"), true);
	}
}
