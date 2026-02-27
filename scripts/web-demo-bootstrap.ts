import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const configuredBun =
  process.env.BUN_BIN ?? (process.env.HOME ? `${process.env.HOME}/.bun/bin/bun` : "bun");
const bunBin = existsSync(configuredBun) ? configuredBun : "bun";

function runBunCommand(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(bunBin, args, {
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
  await runBunCommand(["run", "db:migrate"]);
  await runBunCommand(["run", "demo:seed"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
