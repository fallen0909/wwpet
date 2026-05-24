import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";

const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    ...options
  });
  children.push(child);
  child.on("exit", (code) => {
    if (code && !options.allowExit) {
      shutdown(code);
    }
  });
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("npm", ["run", "dev:renderer"]);
run("npx", ["wait-on", "tcp:5173"], { allowExit: true }).on("exit", (code) => {
  if (code === 0) {
    run("npx", ["electron", "."], {
      allowExit: true,
      env: {
        ...process.env,
        DESKTOP_PET_DEV: "1"
      }
    });
  }
});
