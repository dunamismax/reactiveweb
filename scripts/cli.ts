import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptsDir);
const appsDir = join(rootDir, "apps");
const configuredBun =
  process.env.BUN_BIN ?? (process.env.HOME ? `${process.env.HOME}/.bun/bin/bun` : "bun");
const bunBin = existsSync(configuredBun) ? configuredBun : "bun";

async function getApps() {
  const entries = await readdir(appsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runInApp(app: string, script: string) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(bunBin, ["run", script], {
      cwd: join(appsDir, app),
      stdio: "inherit",
      env: process.env,
    });

    proc.on("error", reject);
    proc.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`Command terminated by signal ${signal}`));
        return;
      }

      if (code && code !== 0) {
        process.exit(code);
      }

      resolve();
    });
  });
}

async function main() {
  const [command, target] = process.argv.slice(2);
  const apps = await getApps();

  if (command === "list") {
    for (const app of apps) {
      console.log(app);
    }
    return;
  }

  if (!command) {
    console.error("Usage: bun run scripts/cli.ts <dev|build|typecheck|test|list> [app|all]");
    process.exit(1);
  }

  if (!target) {
    console.error("Specify target app name or 'all'.");
    process.exit(1);
  }

  if (target === "all") {
    for (const app of apps) {
      console.log(`\n==> ${app} (${command})`);
      await runInApp(app, command);
    }
    return;
  }

  if (!apps.includes(target)) {
    console.error(`Unknown app: ${target}`);
    process.exit(1);
  }

  await runInApp(target, command);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
