import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptsDir);
const appsDir = join(rootDir, "apps");

async function getApps() {
  const entries = await readdir(appsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runInApp(app: string, script: string) {
  const packageManagerExec = process.env.npm_execpath;
  const runner = packageManagerExec?.includes("pnpm")
    ? { command: process.execPath, args: [packageManagerExec] }
    : { command: "corepack", args: ["pnpm"] };

  return new Promise<void>((resolve, reject) => {
    const proc = spawn(runner.command, [...runner.args, "run", script], {
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
    console.error("Usage: node scripts/cli.ts <dev|build|typecheck|test|list> [app|all]");
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
