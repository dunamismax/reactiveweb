async function runCommand(cmd: string[]) {
  const proc = Bun.spawn(cmd, {
    env: process.env,
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
  await runCommand(["bun", "run", "--cwd", "packages/db", "db:migrate"]);
  await runCommand(["bun", "run", "scripts/web-demo-seed.ts"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
