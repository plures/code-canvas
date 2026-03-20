#!/usr/bin/env -S deno run -A
/**
 * Code Canvas CLI - Unified command-line interface
 *
 * Provides intuitive commands for all Code Canvas operations:
 * - canvas: Render and manage visual documentation
 * - activity: Switch and manage FSM states
 * - validate: Check and auto-fix project rules
 * - init: Initialize new projects
 */

import { parseArgs } from "jsr:@std/cli/parse-args";

const VERSION = "0.2.0";

interface Command {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  action: (args: string[]) => Promise<number>;
}

// Canvas commands
async function canvasRender(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["all", "help", "enhanced", "jsoncanvas"],
    string: ["file", "output", "format"],
    alias: { h: "help", o: "output", f: "file", e: "enhanced", j: "jsoncanvas" },
    default: { format: "svg" },
  });

  if (parsed.help) {
    console.log(`
Usage: canvas render [OPTIONS]

Render canvas files to SVG/HTML output with JSON Canvas support.

Options:
  --all               Render all canvas files
  --file, -f <path>   Render specific canvas file
  --output, -o <dir>  Output directory (default: output/)
  --format <fmt>      Output format (svg, html, json)
  --enhanced, -e      Use enhanced renderer with JSON Canvas support
  --jsoncanvas, -j    Convert to JSON Canvas format
  --help, -h          Show this help

Examples:
  canvas render --all
  canvas render --file sot/canvas/demo.canvas.yaml --enhanced
  canvas render -f demo.canvas.yaml -o dist/ --format html
  canvas render --file demo.yaml --jsoncanvas --format json
`);
    return 0;
  }

  // Use enhanced renderer if requested or if format requires it
  const useEnhanced = parsed.enhanced || parsed.jsoncanvas || parsed.format === "html";

  if (useEnhanced) {
    // Use enhanced renderer with JSON Canvas support
    const cmd = ["deno", "run", "-A", "tools/canvas-render.ts"];
    if (parsed.all) cmd.push("--all");
    if (parsed.file) cmd.push("--file", parsed.file);
    if (parsed.output) cmd.push("--output", parsed.output);
    if (parsed.format) cmd.push("--format", parsed.format);

    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const { code } = await process.output();
    return code;
  } else {
    // Use original renderer
    const cmd = ["deno", "run", "-A", "tools/canvas-renderer.ts"];
    if (parsed.all) cmd.push("--all");
    if (parsed.file) cmd.push("--file", parsed.file);
    if (parsed.output) cmd.push("--output", parsed.output);

    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
    });
    const { code } = await process.output();
    return code;
  }
}

async function canvasList(): Promise<number> {
  console.log("📄 Canvas files:\n");

  try {
    for await (const entry of Deno.readDir("sot/canvas")) {
      if (entry.isFile && entry.name.endsWith(".canvas.yaml")) {
        console.log(`  - ${entry.name}`);
      }
    }
    return 0;
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error reading canvas directory:", err.message);
    return 1;
  }
}

async function canvasServe(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["help", "watch"],
    string: ["file", "port"],
    alias: { h: "help", f: "file", p: "port", w: "watch" },
    default: { watch: true, port: "8080" },
  });

  if (parsed.help) {
    console.log(`
Usage: canvas serve [OPTIONS]

Start interactive canvas server with live preview.

Options:
  --file, -f <path>  Canvas file to serve (default: demo.canvas.yaml)
  --port, -p <port>  Port to listen on (default: 8080)
  --watch, -w        Enable auto-reload (default: true)
  --help, -h         Show this help

Examples:
  canvas serve
  canvas serve --file auth-example.canvas.yaml
  canvas serve --port 3000
`);
    return 0;
  }

  const cmd = ["deno", "run", "-A", "tools/canvas-server-v2.ts"];
  if (parsed.file) cmd.push("--file", parsed.file);
  if (parsed.port) cmd.push("--port", parsed.port);
  if (!parsed.watch) cmd.push("--no-watch");

  const process = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await process.output();
  return code;
}

// Activity commands
async function activitySwitch(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    string: ["to", "actor", "note"],
    boolean: ["help"],
    alias: { h: "help" },
  });

  if (parsed.help || !parsed.to) {
    console.log(`
Usage: activity switch --to <activity> [OPTIONS]

Switch FSM activity state.

Options:
  --to <activity>    Target activity (design, implementation, release)
  --actor <name>     Actor name (default: human)
  --note <text>      Transition note
  --help, -h         Show this help

Examples:
  activity switch --to implementation
  activity switch --to design --actor alice --note "Starting new feature"
`);
    return parsed.help ? 0 : 1;
  }

  const cmd = [
    "deno",
    "run",
    "-A",
    "tools/fsm-manager.ts",
    "--to",
    parsed.to,
  ];
  if (parsed.actor) cmd.push("--actor", parsed.actor);
  if (parsed.note) cmd.push("--note", parsed.note);

  const process = new Deno.Command(cmd[0], { args: cmd.slice(1) });
  const { code } = await process.output();
  return code;
}

async function activityStatus(): Promise<number> {
  const process = new Deno.Command("deno", {
    args: ["run", "-A", "tools/fsm-manager.ts", "--status"],
  });
  const { code } = await process.output();
  return code;
}

async function activityHistory(): Promise<number> {
  const process = new Deno.Command("deno", {
    args: ["run", "-A", "tools/fsm-manager.ts", "--history"],
  });
  const { code } = await process.output();
  return code;
}

// Validate commands
async function validateCheck(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose"],
    alias: { h: "help", v: "verbose" },
  });

  if (parsed.help) {
    console.log(`
Usage: validate check [OPTIONS]

Validate project against guardian rules.

Options:
  --verbose, -v      Show detailed validation output
  --help, -h         Show this help
`);
    return 0;
  }

  const process = new Deno.Command("deno", {
    args: ["run", "-A", "tools/guardian.ts"],
  });
  const { code } = await process.output();
  return code;
}

async function validateFix(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["help", "dry-run"],
    alias: { h: "help" },
  });

  if (parsed.help) {
    console.log(`
Usage: validate fix [OPTIONS]

Auto-fix common validation issues.

Options:
  --dry-run          Show fixes without applying
  --help, -h         Show this help

Note: Auto-fix is currently limited. Manual fixes may be required.
`);
    return 0;
  }

  console.log("🔧 Auto-fix feature coming soon!");
  console.log("   For now, review validation errors and fix manually.");
  return 0;
}

async function validateConfig(): Promise<number> {
  const process = new Deno.Command("deno", {
    args: ["run", "-A", "tools/schema-validator.ts"],
  });
  const { code } = await process.output();
  return code;
}

// Init command
async function initProject(args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["help"],
    string: ["name"],
    alias: { h: "help", n: "name" },
  });

  if (parsed.help) {
    console.log(`
Usage: init [OPTIONS]

Initialize a new Code Canvas project.

Options:
  --name <name>      Project name
  --help, -h         Show this help

Creates:
  - sot/ directory with lifecycle, rules, state files
  - .githooks/ with pre-commit validation
  - docs/ with setup guides
  - tools/ with core utilities
`);
    return 0;
  }

  console.log("🎨 Initializing Code Canvas project...\n");

  // Create directory structure
  const dirs = [
    "sot/canvas",
    "sot/instructions",
    "sot/schemas",
    "sot/state",
    "designs",
    "docs",
    "tests",
    "tools",
    ".githooks",
  ];

  for (const dir of dirs) {
    try {
      await Deno.mkdir(dir, { recursive: true });
      console.log(`  ✅ Created ${dir}/`);
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        console.error(`  ❌ Failed to create ${dir}:`, error.message);
        return 1;
      }
    }
  }

  console.log("\n📝 Project initialized! Next steps:");
  console.log("  1. Run: deno task prepare-hooks");
  console.log("  2. Edit: sot/state/activity.yaml");
  console.log("  3. Validate: canvas validate check");

  return 0;
}

// Command registry
const commands: Record<string, Command> = {
  canvas: {
    name: "canvas",
    description: "Render and manage visual documentation",
    usage: "canvas <command> [options]",
    examples: [
      "canvas render --all",
      "canvas serve --port 8080",
      "canvas list",
    ],
    action: async (args: string[]) => {
      const [subcommand, ...rest] = args;
      switch (subcommand) {
        case "render":
          return await canvasRender(rest);
        case "serve":
          return await canvasServe(rest);
        case "list":
          return await canvasList();
        default:
          console.log("Unknown canvas command. Try: render, serve, list");
          return 1;
      }
    },
  },
  activity: {
    name: "activity",
    description: "Manage FSM activity states",
    usage: "activity <command> [options]",
    examples: [
      "activity switch --to implementation",
      "activity status",
      "activity history",
    ],
    action: async (args: string[]) => {
      const [subcommand, ...rest] = args;
      switch (subcommand) {
        case "switch":
          return await activitySwitch(rest);
        case "status":
          return await activityStatus();
        case "history":
          return await activityHistory();
        default:
          console.log("Unknown activity command. Try: switch, status, history");
          return 1;
      }
    },
  },
  validate: {
    name: "validate",
    description: "Validate and fix project rules",
    usage: "validate <command> [options]",
    examples: [
      "validate check",
      "validate fix",
      "validate config",
    ],
    action: async (args: string[]) => {
      const [subcommand, ...rest] = args;
      switch (subcommand) {
        case "check":
          return await validateCheck(rest);
        case "fix":
          return await validateFix(rest);
        case "config":
          return await validateConfig();
        default:
          console.log("Unknown validate command. Try: check, fix, config");
          return 1;
      }
    },
  },
  init: {
    name: "init",
    description: "Initialize a new Code Canvas project",
    usage: "init [options]",
    examples: [
      "init",
      "init --name my-project",
    ],
    action: initProject,
  },
};

// Help display
function showHelp() {
  console.log(`
🎨 Code Canvas CLI v${VERSION}

Usage: canvas <command> [options]

Commands:
  canvas     Render and manage visual documentation
  activity   Manage FSM activity states
  validate   Validate and fix project rules
  init       Initialize a new project

Options:
  --version, -v      Show version
  --help, -h         Show this help

Examples:
  canvas render --all
  activity switch --to implementation
  validate check
  init --name my-project

For command-specific help:
  canvas <command> --help
`);
}

// Main CLI router
async function main() {
  const args = Deno.args;

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    Deno.exit(0);
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(`Code Canvas CLI v${VERSION}`);
    Deno.exit(0);
  }

  const [command, ...rest] = args;
  const cmd = commands[command];

  if (!cmd) {
    console.error(`❌ Unknown command: ${command}`);
    console.error("Run 'canvas --help' for usage information.");
    Deno.exit(1);
  }

  const exitCode = await cmd.action(rest);
  Deno.exit(exitCode);
}

if (import.meta.main) {
  main();
}
