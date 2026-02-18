import { readdir } from "node:fs/promises";
import { join } from "node:path";

const APPS_DIR = new URL("../apps", import.meta.url);

async function getApps() {
  const entries = await readdir(APPS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function runInApp(app: string, script: string) {
  const proc = Bun.spawn(["bun", "run", script], {
    cwd: join(new URL("../apps", import.meta.url).pathname, app),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const code = await proc.exited;
  if (code !== 0) {
    process.exit(code);
  }
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
    console.error("Usage: bun run scripts/cli.ts <dev|build|typecheck|list> [app|all]");
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
