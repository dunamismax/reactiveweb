import { spawn } from "node:child_process";
import { resolve } from "node:path";

function runCommand(command: string, args: string[], options?: { cwd?: string }) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options?.cwd ? resolve(options.cwd) : undefined,
      env: process.env,
      stdio: "inherit",
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
  const dbPackageDir = resolve("packages/db");
  const drizzleKitBin = resolve(dbPackageDir, "node_modules/drizzle-kit/bin.cjs");
  const drizzleConfig = resolve(dbPackageDir, "drizzle.config.ts");

  await runCommand("node", [drizzleKitBin, "migrate", "--config", drizzleConfig], {
    cwd: dbPackageDir,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
