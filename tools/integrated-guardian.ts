#!/usr/bin/env -S deno run -A
/**
 * Integrated Guardian using State-Docs and ADP modules
 * 
 * This tool demonstrates how to use both modules together.
 */

import { Guardian } from "../modules/adp/mod.ts";
import { StateDocsManager } from "../modules/state-docs/mod.ts";

async function main() {
  const args = Deno.args;
  const command = args[0] || "validate";

  const stateManager = new StateDocsManager("./sot");
  const guardian = new Guardian(stateManager);

  switch (command) {
    case "validate": {
      // Get staged files or all changed files
      const files = args.slice(1);
      
      if (files.length === 0) {
        console.log("Usage: deno run -A tools/integrated-guardian.ts validate <file1> <file2> ...");
        console.log("Or use git to get staged files:");
        console.log("  git diff --cached --name-only | xargs deno run -A tools/integrated-guardian.ts validate");
        Deno.exit(1);
      }

      console.log("🔍 Validating files with ADP Guardian...\n");
      const result = await guardian.validate(files);

      if (result.errors.length > 0) {
        console.log("❌ Validation failed:\n");
        for (const error of result.errors) {
          console.log(`  • ${error}`);
        }
        console.log();
      }

      if (result.warnings.length > 0) {
        console.log("⚠️  Warnings:\n");
        for (const warning of result.warnings) {
          console.log(`  • ${warning}`);
        }
        console.log();
      }

      if (result.valid) {
        console.log("✅ All validations passed!");
      } else {
        Deno.exit(1);
      }
      break;
    }

    case "activity": {
      const activity = await stateManager.getCurrentActivity();
      console.log("📌 Current Activity:");
      console.log(`  State: ${activity.activity}`);
      console.log(`  Actor: ${activity.actor}`);
      console.log(`  Note: ${activity.note}`);
      console.log(`  Since: ${activity.since}`);
      break;
    }

    case "lifecycle": {
      const lifecycle = await stateManager.getLifecycle();
      console.log("🔄 Lifecycle States:");
      for (const state of lifecycle.states) {
        console.log(`\n  ${state.id} (${state.label})`);
        console.log(`    Allowed paths: ${state.allowedPaths.join(", ")}`);
      }
      break;
    }

    case "check-path": {
      const path = args[1];
      if (!path) {
        console.log("Usage: deno run -A tools/integrated-guardian.ts check-path <path>");
        Deno.exit(1);
      }

      const allowed = await stateManager.isPathAllowed(path);
      const activity = await stateManager.getCurrentActivity();
      
      if (allowed) {
        console.log(`✅ Path '${path}' is allowed in activity '${activity.activity}'`);
      } else {
        console.log(`❌ Path '${path}' is NOT allowed in activity '${activity.activity}'`);
      }
      break;
    }

    case "help": {
      console.log("Integrated Guardian - State-Docs + ADP\n");
      console.log("Commands:");
      console.log("  validate <files...>  - Validate file changes");
      console.log("  activity             - Show current activity");
      console.log("  lifecycle            - Show lifecycle states");
      console.log("  check-path <path>    - Check if path is allowed");
      console.log("  help                 - Show this help");
      break;
    }

    default: {
      console.log(`Unknown command: ${command}`);
      console.log("Run with 'help' to see available commands");
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  main();
}
