#!/usr/bin/env -S deno run -A
import { join } from "jsr:@std/path@^1.0/join";
import { expandGlob } from "jsr:@std/fs@^1.0/expand-glob";
import * as yaml from "jsr:@std/yaml@^1.0";

const root = Deno.cwd();
const readYaml = async (p: string) => yaml.parse(await Deno.readTextFile(p));

// Types for rules engine
type RuleInvariant = {
  id: string;
  description: string;
  check: {
    type: "file_size" | "yaml_syntax" | "commit_size" | "pattern_match";
    patterns?: string[];
    max_lines?: number;
    max_chars?: number;
    max_files?: number;
    max_additions?: number;
    regex?: string;
  };
};

type RuleChore = {
  id: string;
  description: string;
  when: {
    patterns?: string[];
    content_matches?: string[];
  };
  then: {
    must_change?: string[];
    must_also_change?: string[];
  };
};

type RuleConstraint = {
  id: string;
  description: string;
  applies_to_activity?: string;
  forbidden_patterns?: string[];
  allowed_exceptions?: string[];
  when?: {
    patterns?: string[];
  };
  then?: {
    must_also_change?: string[];
  };
};

type Rules = {
  invariants?: RuleInvariant[];
  chores?: RuleChore[];
  constraints?: RuleConstraint[];
};

type State = {
  id: string;
  allowedPaths?: string[];
  requiredChores?: { whenAnyMatches: string[]; mustAlsoChange: string[] }[];
};

// Load configuration files
const life = await readYaml("sot/lifecycle.yaml") as any;
const activityDoc = await readYaml("sot/state/activity.yaml") as any;
const rules = await readYaml("sot/rules.yaml") as Rules;
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

// Rules engine functions
const checkInvariants = async (invariants: RuleInvariant[], stagedFiles: string[]) => {
  for (const invariant of invariants) {
    switch (invariant.check.type) {
      case "file_size":
        await checkFileSize(invariant, stagedFiles);
        break;
      case "yaml_syntax":
        await checkYamlSyntax(invariant, stagedFiles);
        break;
      case "commit_size":
        checkCommitSize(invariant, stagedFiles);
        break;
      case "pattern_match":
        await checkPatternMatch(invariant, stagedFiles);
        break;
    }
  }
};

const checkFileSize = async (invariant: RuleInvariant, stagedFiles: string[]) => {
  if (!invariant.check.patterns) return;
  
  const matchedFiles = new Set<string>();
  for (const pattern of invariant.check.patterns) {
    const matches = await matchers([pattern]);
    matches.forEach(f => matchedFiles.add(f));
  }
  
  const filesToCheck = stagedFiles.filter(f => matchedFiles.has(f));
  
  for (const file of filesToCheck) {
    try {
      const content = await Deno.readTextFile(file);
      const lines = content.split('\n').length;
      const chars = content.length;
      
      if (invariant.check.max_lines && lines > invariant.check.max_lines) {
        console.error(`REFUSAL: ${invariant.description}`);
        console.error(`File ${file} has ${lines} lines, max allowed: ${invariant.check.max_lines}`);
        Deno.exit(1);
      }
      
      if (invariant.check.max_chars && chars > invariant.check.max_chars) {
        console.error(`REFUSAL: ${invariant.description}`);
        console.error(`File ${file} has ${chars} characters, max allowed: ${invariant.check.max_chars}`);
        Deno.exit(1);
      }
    } catch (error) {
      // File might be deleted or binary, skip size check
    }
  }
};

const checkYamlSyntax = async (invariant: RuleInvariant, stagedFiles: string[]) => {
  if (!invariant.check.patterns) return;
  
  const matchedFiles = new Set<string>();
  for (const pattern of invariant.check.patterns) {
    const matches = await matchers([pattern]);
    matches.forEach(f => matchedFiles.add(f));
  }
  
  const yamlFiles = stagedFiles.filter(f => matchedFiles.has(f));
  
  for (const file of yamlFiles) {
    try {
      const content = await Deno.readTextFile(file);
      yaml.parse(content); // Will throw if invalid YAML
    } catch (error) {
      console.error(`REFUSAL: ${invariant.description}`);
      console.error(`Invalid YAML in ${file}: ${error.message}`);
      Deno.exit(1);
    }
  }
};

const checkCommitSize = (invariant: RuleInvariant, stagedFiles: string[]) => {
  if (invariant.check.max_files && stagedFiles.length > invariant.check.max_files) {
    console.error(`REFUSAL: ${invariant.description}`);
    console.error(`Commit has ${stagedFiles.length} files, max allowed: ${invariant.check.max_files}`);
    Deno.exit(1);
  }
  
  // For max_additions, we'd need git diff --stat, simplified for now
  if (invariant.check.max_additions) {
    const diffCmd = new Deno.Command("git", { args: ["diff", "--cached", "--numstat"] });
    const diffOut = diffCmd.outputSync();
    const diffText = new TextDecoder().decode(diffOut.stdout);
    const totalAdditions = diffText.split('\n')
      .filter(Boolean)
      .map(line => parseInt(line.split('\t')[0]) || 0)
      .reduce((sum, additions) => sum + additions, 0);
      
    if (totalAdditions > invariant.check.max_additions) {
      console.error(`REFUSAL: ${invariant.description}`);
      console.error(`Commit has ${totalAdditions} additions, max allowed: ${invariant.check.max_additions}`);
      Deno.exit(1);
    }
  }
};

const checkPatternMatch = async (invariant: RuleInvariant, stagedFiles: string[]) => {
  if (!invariant.check.patterns || !invariant.check.regex) return;
  
  const matchedFiles = new Set<string>();
  for (const pattern of invariant.check.patterns) {
    const matches = await matchers([pattern]);
    matches.forEach(f => matchedFiles.add(f));
  }
  
  const filesToCheck = stagedFiles.filter(f => matchedFiles.has(f));
  const regex = new RegExp(invariant.check.regex);
  
  for (const file of filesToCheck) {
    try {
      const content = await Deno.readTextFile(file);
      if (!regex.test(content)) {
        console.error(`REFUSAL: ${invariant.description}`);
        console.error(`File ${file} does not match required pattern: ${invariant.check.regex}`);
        Deno.exit(1);
      }
    } catch (error) {
      // File might be deleted or binary, skip pattern check
    }
  }
};

const checkRuleChores = async (chores: RuleChore[], stagedFiles: string[]) => {
  for (const chore of chores) {
    let shouldTrigger = false;
    
    // Check if any trigger patterns match
    if (chore.when.patterns) {
      const triggerFiles = new Set<string>();
      for (const pattern of chore.when.patterns) {
        const matches = await matchers([pattern]);
        matches.forEach(f => triggerFiles.add(f));
      }
      
      if (stagedFiles.some(f => triggerFiles.has(f))) {
        shouldTrigger = true;
      }
    }
    
    // Check content matches if specified
    if (chore.when.content_matches && chore.when.patterns) {
      for (const file of stagedFiles) {
        if (chore.when.patterns.some(pattern => {
          // Simple glob-to-regex conversion for basic matching
          const regexPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
          return new RegExp(regexPattern).test(file);
        })) {
          try {
            const content = await Deno.readTextFile(file);
            const hasContentMatch = chore.when.content_matches.some(match => {
              const regex = new RegExp(match);
              return regex.test(content);
            });
            
            if (hasContentMatch) {
              shouldTrigger = true;
              break;
            }
          } catch (error) {
            // File might be deleted, skip content check
          }
        }
      }
    }
    
    if (shouldTrigger) {
      // Check if required changes are present
      const requiredPatterns = [
        ...(chore.then.must_change || []),
        ...(chore.then.must_also_change || [])
      ];
      
      const requiredFiles = new Set<string>();
      for (const pattern of requiredPatterns) {
        const matches = await matchers([pattern]);
        matches.forEach(f => requiredFiles.add(f));
      }
      
      const missingRequired = requiredPatterns.filter(pattern => {
        const matches = Array.from(requiredFiles);
        return !stagedFiles.some(f => matches.includes(f));
      });
      
      if (missingRequired.length > 0) {
        console.error(`REFUSAL: ${chore.description}`);
        console.error(`Missing required changes: ${missingRequired.join(", ")}`);
        Deno.exit(1);
      }
    }
  }
};

const checkConstraints = async (constraints: RuleConstraint[], stagedFiles: string[], currentActivity: string) => {
  for (const constraint of constraints) {
    // Skip constraints that don't apply to current activity
    if (constraint.applies_to_activity && constraint.applies_to_activity !== currentActivity) {
      continue;
    }
    
    // Check forbidden patterns
    if (constraint.forbidden_patterns) {
      const forbiddenFiles = new Set<string>();
      const allowedFiles = new Set<string>();
      
      for (const pattern of constraint.forbidden_patterns) {
        const matches = await matchers([pattern]);
        matches.forEach(f => forbiddenFiles.add(f));
      }
      
      if (constraint.allowed_exceptions) {
        for (const pattern of constraint.allowed_exceptions) {
          const matches = await matchers([pattern]);
          matches.forEach(f => allowedFiles.add(f));
        }
      }
      
      const violations = stagedFiles.filter(f => forbiddenFiles.has(f) && !allowedFiles.has(f));
      
      if (violations.length > 0) {
        console.error(`REFUSAL: ${constraint.description}`);
        console.error(`Forbidden files in activity '${currentActivity}': ${violations.join(", ")}`);
        Deno.exit(1);
      }
    }
    
    // Check conditional constraints
    if (constraint.when && constraint.then) {
      let shouldTrigger = false;
      
      if (constraint.when.patterns) {
        const triggerFiles = new Set<string>();
        for (const pattern of constraint.when.patterns) {
          const matches = await matchers([pattern]);
          matches.forEach(f => triggerFiles.add(f));
        }
        
        if (stagedFiles.some(f => triggerFiles.has(f))) {
          shouldTrigger = true;
        }
      }
      
      if (shouldTrigger && constraint.then.must_also_change) {
        const requiredFiles = new Set<string>();
        for (const pattern of constraint.then.must_also_change) {
          const matches = await matchers([pattern]);
          matches.forEach(f => requiredFiles.add(f));
        }
        
        const hasRequired = constraint.then.must_also_change.some(pattern => {
          const matches = Array.from(requiredFiles);
          return stagedFiles.some(f => matches.includes(f));
        });
        
        if (!hasRequired) {
          console.error(`REFUSAL: ${constraint.description}`);
          console.error(`Must also change: ${constraint.then.must_also_change.join(", ")}`);
          Deno.exit(1);
        }
      }
    }
  }
};

// === RULES ENGINE VALIDATION ===

// 1) Check invariants
if (rules.invariants) {
  await checkInvariants(rules.invariants, staged);
}

// 2) Check constraints (includes activity-specific rules)  
if (rules.constraints) {
  await checkConstraints(rules.constraints, staged, current);
}

// 3) Check rule-based chores
if (rules.chores) {
  await checkRuleChores(rules.chores, staged);
}

// === LIFECYCLE VALIDATION ===

// 4) Allowed path check from lifecycle FSM
const allowed = new Set<string>(await matchers(state.allowedPaths ?? ["**/*"]));
const invalid = staged.filter(f => !allowed.size || !allowed.has(f));

if (invalid.length) {
  console.error(`REFUSAL: files not allowed in activity '${current}':\n` + invalid.map(x=>" - "+x).join("\n"));
  console.error("Switch activity in sot/state/activity.yaml or adjust lifecycle allowedPaths.");
  Deno.exit(1);
}

// 5) Lifecycle-based chores check  
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

console.log(`guardian: OK for activity '${current}'. All rules passed.`);
Deno.exit(0);
