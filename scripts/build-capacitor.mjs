#!/usr/bin/env node
/* eslint-disable no-console -- CLI build script */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "src/app/api");
const stashDir = join(root, ".capacitor-api-stash");

function run(command, args, env) {
	const result = spawnSync(command, args, {
		cwd: root,
		stdio: "inherit",
		env,
		shell: process.platform === "win32",
	});

	return result.status ?? 1;
}

function restoreApi() {
	if (existsSync(stashDir) && !existsSync(apiDir)) {
		console.log("Restaurando src/app/api...");
		renameSync(stashDir, apiDir);
	}
}

if (!existsSync(apiDir)) {
	console.error(`No existe ${apiDir}; abortando.`);
	process.exit(1);
}

console.log("Moviendo API fuera del árbol para export estático...");
rmSync(stashDir, { recursive: true, force: true });
renameSync(apiDir, stashDir);

process.on("exit", restoreApi);
process.on("SIGINT", () => {
	restoreApi();
	process.exit(130);
});
process.on("SIGTERM", () => {
	restoreApi();
	process.exit(143);
});

const buildEnv = {
	...process.env,
	CAPACITOR_STATIC: "1",
	NEXT_PUBLIC_CAPACITOR_STATIC: "1",
};

if (run("npm", ["run", "build"], buildEnv) !== 0) {
	restoreApi();
	process.exit(1);
}

console.log("Sincronizando Capacitor (android)...");
if (run("npx", ["cap", "sync", "android"], process.env) !== 0) {
	restoreApi();
	process.exit(1);
}

restoreApi();
console.log("Listo. Salida en out/ y proyecto android/.");
