import { spawn } from "node:child_process";

function runCommand(args: string[]) {
  const packageManagerExec = process.env.npm_execpath;
  const runner = packageManagerExec?.includes("pnpm")
    ? { command: process.execPath, args: [packageManagerExec] }
    : { command: "corepack", args: ["pnpm"] };

  return new Promise<void>((resolve, reject) => {
    const proc = spawn(runner.command, [...runner.args, ...args], {
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
  await runCommand(["--filter", "@reactiveweb/db", "run", "db:migrate"]);
  await runCommand(["run", "demo:seed"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
