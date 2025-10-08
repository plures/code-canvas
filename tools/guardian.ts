#!/usr/bin/env -S deno run -A
import { join } from "jsr:@std/path@^1.0/join";
import { expandGlob } from "jsr:@std/fs@^1.0/expand-glob";
import * as yaml from "jsr:@std/yaml@^1.0";

const root = Deno.cwd();
const readYaml = async (p: string) => yaml.parse(await Deno.readTextFile(p));

type State = {
  id: string;
  allowedPaths?: string[];
  requiredChores?: { whenAnyMatches: string[]; mustAlsoChange: string[] }[];
};

const life = await readYaml("sot/lifecycle.yaml") as any;
const activityDoc = await readYaml("sot/state/activity.yaml") as any;
const current = String(activityDoc.activity ?? life.initial);

const state: State | undefined = (life.states as any[]).find(s => s.id === current);
if (!state) {
  console.error(`Invalid current activity: ${current}`);
  Deno.exit(2);
}

const run = (cmd: string[]) => new Deno.Command(cmd[0], { args: cmd.slice(1) }).outputSync();
const out = run(["git", "diff", "--cached", "--name-only"]);
const staged = new TextDecoder().decode(out.stdout).trim().split("\n").filter(Boolean);

const matchers = async (patterns: string[]) => {
  const matched = new Set<string>();
  for (const pattern of patterns) {
    for await (const e of expandGlob(pattern, { root })) {
      // Normalize path separators to forward slash for cross-platform compatibility
      const relativePath = e.path.replace(root, "").replace(/^[\\\/]/, "").replace(/\\/g, "/");
      matched.add(relativePath);
    }
  }
  return matched;
};

// 1) Allowed path check
const allowed = new Set<string>(await matchers(state.allowedPaths ?? ["**/*"]));
const invalid = staged.filter(f => !allowed.size || !allowed.has(f));

if (invalid.length) {
  console.error(`REFUSAL: files not allowed in activity '${current}':\n` + invalid.map(x=>" - "+x).join("\n"));
  console.error("Switch activity in sot/state/activity.yaml or adjust lifecycle allowedPaths.");
  Deno.exit(1);
}

// 2) Chores check
for (const chore of (state.requiredChores ?? [])) {
  const whenSet = new Set(await matchers(chore.whenAnyMatches));
  const mustSet = new Set(await matchers(chore.mustAlsoChange));
  const touchedWhen = staged.some(f => whenSet.has(f));
  if (touchedWhen) {
    const missing = chore.mustAlsoChange.filter(glob => {
      const m = Array.from(mustSet);
      return !staged.some(f => m.includes(f));
    });
    if (missing.length) {
      console.error(`REFUSAL: required chores missing for activity '${current}'.\nWhen any of ${chore.whenAnyMatches} change, also change: ${chore.mustAlsoChange}`);
      Deno.exit(1);
    }
  }
}

// 3) Version bump requires changelog (simple heuristic)
if (staged.includes("package.json")) {
  if (!staged.includes("CHANGELOG.md")) {
    console.error("REFUSAL: package.json changed but CHANGELOG.md not staged.");
    Deno.exit(1);
  }
}

console.log(`guardian: OK for activity '${current}'.`);
Deno.exit(0);
