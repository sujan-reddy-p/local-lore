import { spawnSync } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "../lib/discovery/publisher.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LABEL = "com.local-lore.discovery";
const DIRECTORY = resolve(homedir(), "Library/LaunchAgents");
const PLIST = resolve(DIRECTORY, `${LABEL}.plist`);
const TARGET = `gui/${process.getuid()}/${LABEL}`;
const xml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

async function main() {
  const command = process.argv[2] ?? "status";
  if (command === "--help") {
    console.log("Usage: npm run catalog:schedule -- install|remove|status\nmacOS launchd; default 08:17 local time, configurable in data/discovery-config.json. Install from a durable checkout (not /tmp); reinstall after changing schedule. RunAtLoad is disabled. Credentials stay in your local OMP configuration.");
    return;
  }
  if (!["install", "remove", "status"].includes(command)) throw new Error(`Unknown schedule command: ${command}`);
  if (process.platform !== "darwin") throw new Error("This scheduler uses macOS launchd; catalog:daily can be invoked by another local scheduler on other systems");
  if (command === "status") {
    const result = spawnSync("launchctl", ["print", TARGET], { encoding: "utf8" });
    if (result.status === 0) process.stdout.write(result.stdout);
    else console.log(JSON.stringify({ status: "not_installed", plist: PLIST }, null, 2));
    return;
  }
  const existing = await readFile(PLIST, "utf8").catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (existing && !existing.includes(xml(resolve(ROOT, "scripts/daily-discovery.mjs")))) throw new Error("Another checkout owns this launch agent; remove its schedule from that checkout before installing here");
  if (command === "remove") {
    spawnSync("launchctl", ["bootout", TARGET], { encoding: "utf8" });
    await unlink(PLIST).catch(error => { if (error.code !== "ENOENT") throw error; });
    console.log(JSON.stringify({ status: "removed", plist: PLIST }, null, 2));
    return;
  }
  if (/^\/(?:private\/)?(?:tmp|var\/folders)(?:\/|$)/.test(ROOT)) throw new Error("Daily scheduling needs a durable checkout. This repository is under /tmp; clone the pushed baseline into ~/Projects/local-lore, install dependencies there, then run catalog:schedule -- install");
  const config = await readJson(resolve(ROOT, "data/discovery-config.json"));
  const { hour, minute } = config.schedule;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("Schedule hour/minute must be valid local calendar values");
  const omp = spawnSync("omp", ["--version"], { encoding: "utf8" });
  if (omp.status !== 0) throw new Error("Install OMP and configure local credentials before installing the schedule");
  await mkdir(DIRECTORY, { recursive: true });
  await mkdir(resolve(ROOT, "outputs"), { recursive: true });
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>${LABEL}</string>\n<key>ProgramArguments</key><array><string>/usr/bin/env</string><string>node</string><string>${xml(resolve(ROOT, "scripts/daily-discovery.mjs"))}</string></array>\n<key>WorkingDirectory</key><string>${xml(ROOT)}</string>\n<key>EnvironmentVariables</key><dict><key>HOME</key><string>${xml(homedir())}</string><key>PATH</key><string>${xml(process.env.PATH ?? "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin")}</string></dict>\n<key>StartCalendarInterval</key><dict><key>Hour</key><integer>${hour}</integer><key>Minute</key><integer>${minute}</integer></dict>\n<key>RunAtLoad</key><false/>\n<key>StandardOutPath</key><string>${xml(resolve(ROOT, "outputs/discovery-daily.log"))}</string>\n<key>StandardErrorPath</key><string>${xml(resolve(ROOT, "outputs/discovery-daily-error.log"))}</string>\n</dict></plist>\n`;
  await writeFile(PLIST, content, { mode: 0o600 });
  const lint = spawnSync("plutil", ["-lint", PLIST], { encoding: "utf8" });
  if (lint.status !== 0) throw new Error(lint.stderr || lint.stdout || "Generated launch agent plist is invalid");
  if (existing) spawnSync("launchctl", ["bootout", TARGET], { encoding: "utf8" });
  const loaded = spawnSync("launchctl", ["bootstrap", `gui/${process.getuid()}`, PLIST], { encoding: "utf8" });
  if (loaded.status !== 0) throw new Error(loaded.stderr || "launchctl could not load the schedule");
  console.log(JSON.stringify({ status: "installed", hour, minute, timezone: "local", plist: PLIST, message: "Runs at the next calendar time, not immediately. Missed runs while asleep are coalesced on wake." }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
