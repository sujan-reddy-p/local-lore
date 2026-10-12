import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { atomicJsonWrite, readJson, withLock } from "../lib/discovery/publisher.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MANAGED = ["data/source-catalog.json", "data/discovery-state.json"];
const OUTPUTS = resolve(ROOT, "outputs");
const LOCAL_STATE = resolve(OUTPUTS, "discovery-state.json");

async function run(command, args, cwd = ROOT, quiet = false) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let text = "";
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.stdout.on("data", chunk => { text += chunk; if (!quiet) process.stdout.write(chunk); });
    child.stderr.on("data", chunk => { if (!quiet) process.stderr.write(chunk); });
    child.on("error", reject);
    child.on("close", code => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      if (code === 0) resolveRun(text.trim());
      else reject(new Error(`${command} ${args[0] ?? ""} failed (${code ?? "signal"}); nothing published`));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log("Usage: npm run catalog:daily -- [--limit 1..80] [--model MODEL]\nRequires a clean committed checkout, installed dependencies, authenticated local OMP, and an up-to-date origin branch. Research, checks and builds run in an isolated temporary worktree; only processed catalog/state can be committed and pushed.");
    return;
  }
  const researchArgs = [];
  for (let i = 0; i < argv.length; i += 2) {
    if (!["--limit", "--model"].includes(argv[i]) || !argv[i + 1]) throw new Error(`Unsupported daily option: ${argv[i]}`);
    researchArgs.push(argv[i], argv[i + 1]);
  }
  await mkdir(OUTPUTS, { recursive: true });
  await withLock(resolve(OUTPUTS, "daily.lock"), async () => {
    if (await run("git", ["status", "--porcelain"], ROOT, true)) throw new Error("Checkout is dirty; commit or finish existing work before automatic publication");
    const branch = await run("git", ["symbolic-ref", "--short", "HEAD"], ROOT, true);
    const head = await run("git", ["rev-parse", "HEAD"], ROOT, true);
    await run("git", ["fetch", "origin", branch]);
    const remote = await run("git", ["rev-parse", `origin/${branch}`], ROOT, true);
    if (head !== remote) throw new Error("Local and remote branch differ; synchronize deliberately before the next daily run");
    const work = await mkdtemp(resolve(OUTPUTS, "daily-"));
    const workspace = resolve(work, "checkout");
    let worktreeAdded = false;
    try {
      await run("git", ["worktree", "add", "--detach", workspace, head]);
      worktreeAdded = true;
      await symlink(resolve(ROOT, "node_modules"), resolve(workspace, "node_modules"), "dir");
      const statePath = resolve(workspace, MANAGED[1]);
      const localState = await readJson(LOCAL_STATE).catch(error => { if (error.code === "ENOENT") return null; throw error; });
      if (localState) await atomicJsonWrite(statePath, localState);
      const catalogPath = resolve(workspace, MANAGED[0]);
      const proposalPath = resolve(work, "proposal.json");
      const runner = resolve(workspace, "scripts/discover-catalog.mjs");
      const snapshotArgs = ["--catalog", catalogPath, "--state", statePath];
      await run(process.execPath, [runner, "research", ...snapshotArgs, "--output", proposalPath, ...researchArgs], workspace);
      await run(process.execPath, [runner, "stage", "--proposal", proposalPath], workspace);
      await run(process.execPath, [runner, "apply", "--proposal", proposalPath, ...snapshotArgs], workspace);
      await run("npm", ["run", "catalog:validate"], workspace);
      const state = await readJson(statePath);
      await atomicJsonWrite(LOCAL_STATE, state);
      const before = await readFile(resolve(ROOT, MANAGED[0]), "utf8");
      const after = await readFile(catalogPath, "utf8");
      if (JSON.stringify(JSON.parse(before)) === JSON.stringify(JSON.parse(after))) {
        console.log(JSON.stringify({ status: "noop", records: JSON.parse(after).recordCount, proposal: proposalPath, message: "No catalog changes; local rotation/check state retained, Git untouched" }, null, 2));
        return;
      }
      await run("npm", ["run", "lint"], workspace);
      await run("npx", ["tsc", "--noEmit", "--incremental", "false"], workspace);
      await run("npm", ["test"], workspace);
      if (await run("git", ["status", "--porcelain"], ROOT, true) || await run("git", ["rev-parse", "HEAD"], ROOT, true) !== head) throw new Error("Checkout changed during research; prepared results retained locally, not published");
      const oldState = await readFile(resolve(ROOT, MANAGED[1]), "utf8");
      let committed = false;
      try {
        await writeFile(resolve(ROOT, MANAGED[0]), after);
        await atomicJsonWrite(resolve(ROOT, MANAGED[1]), state);
        await run("git", ["commit", "--only", "-m", `Refresh local catalog (${digest})`, "--", ...MANAGED]);
        committed = true;
      } finally {
        if (!committed) {
          await writeFile(resolve(ROOT, MANAGED[0]), before);
          await writeFile(resolve(ROOT, MANAGED[1]), oldState);
          await run("git", ["reset", "--", ...MANAGED], ROOT, true);
        }
      }
      await run("git", ["push", "origin", branch]);
      console.log(JSON.stringify({ status: "published", records: JSON.parse(after).recordCount, commit: await run("git", ["rev-parse", "--short", "HEAD"], ROOT, true), proposal: proposalPath }, null, 2));
    } finally {
      if (worktreeAdded) await run("git", ["worktree", "remove", "--force", workspace], ROOT, true);
    }
  });
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
