#!/usr/bin/env -S deno run -A
/**
 * Code Canvas CLI - Enhanced version with JSON Canvas support
 * 
 * Provides intuitive commands for all Code Canvas operations:
 * - canvas: Render and manage visual documentation  
 * - activity: Switch and manage FSM states
 * - validate: Check and auto-fix project rules
 * - init: Initialize new projects
 */

/// <reference path="./types.d.ts" />

import { parseArgs } from "jsr:@std/cli/parse-args";

const VERSION = "0.3.0";

interface CLIArgs {
  help?: boolean;
  version?: boolean;
  enhanced?: boolean;
  all?: boolean;
  file?: string;
  output?: string;
  format?: string;
  [key: string]: any;
}

// Main canvas render function using enhanced renderer
async function canvasRenderEnhanced(args: CLIArgs): Promise<number> {
  const cmd = ["deno", "run", "-A", "tools/canvas-render.ts"];
  
  if (args.all) cmd.push("--all");
  if (args.file) cmd.push("--file", args.file);
  if (args.output) cmd.push("--output", args.output);
  if (args.format) cmd.push("--format", args.format);
  
  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdin: "inherit",
      stdout: "inherit", 
      stderr: "inherit",
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to run enhanced renderer:", (error as Error).message);
    return 1;
  }
}

// Legacy canvas render function
async function canvasRenderLegacy(args: CLIArgs): Promise<number> {
  const cmd = ["deno", "run", "-A", "tools/canvas-renderer.ts"];
  
  if (args.all) cmd.push("--all");
  if (args.file) cmd.push("--file", args.file);
  if (args.output) cmd.push("--output", args.output);
  
  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to run legacy renderer:", (error as Error).message);
    return 1;
  }
}

async function canvasRender(cmdArgs: string[]): Promise<number> {
  const parsed = parseArgs(cmdArgs, {
    boolean: ["all", "help", "enhanced", "jsoncanvas"],
    string: ["file", "output", "format"],
    alias: { h: "help", o: "output", f: "file", e: "enhanced", j: "jsoncanvas" },
    default: { format: "svg" },
  }) as CLIArgs;

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
  canvas render --all --enhanced
  canvas render --file sot/canvas/demo.canvas.yaml --enhanced
  canvas render -f demo.canvas.yaml -o dist/ --format html
  canvas render --file demo.yaml --jsoncanvas --format json
`);
    return 0;
  }

  // Use enhanced renderer by default or if specifically requested
  const useEnhanced = parsed.enhanced || parsed.jsoncanvas || parsed.format === "html" || parsed.format === "json";
  
  if (useEnhanced) {
    return await canvasRenderEnhanced(parsed);
  } else {
    return await canvasRenderLegacy(parsed);
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
    console.error("❌ Error reading canvas directory:", (error as Error).message);
    return 1;
  }
}

async function canvasServe(cmdArgs: string[]): Promise<number> {
  const parsed = parseArgs(cmdArgs, {
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
  canvas serve --file auth-example.canvas.yaml --port 3000
  canvas serve -f demo.canvas.yaml -p 8090
`);
    return 0;
  }

  const cmd = ["deno", "run", "-A", "tools/canvas-server-v2.ts"];
  if (parsed.file) cmd.push("--file", parsed.file);
  if (parsed.port) cmd.push("--port", parsed.port);
  if (!parsed.watch) cmd.push("--no-watch");

  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to start canvas server:", (error as Error).message);
    return 1;
  }
}

// Activity management commands
async function activitySwitch(cmdArgs: string[]): Promise<number> {
  const parsed = parseArgs(cmdArgs, {
    boolean: ["help"],
    string: [],
    alias: { h: "help" },
  });

  if (parsed.help || parsed._.length === 0) {
    console.log(`
Usage: activity switch <activity-name>

Switch to a different FSM activity state.

Examples:
  activity switch designing
  activity switch implementing  
  activity switch testing
`);
    return parsed.help ? 0 : 1;
  }

  const cmd = ["deno", "run", "-A", "tools/fsm-manager.ts", "switch", ...parsed._];
  
  try {
    const process = new Deno.Command(cmd[0], { args: cmd.slice(1) });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to switch activity:", (error as Error).message);
    return 1;
  }
}

async function activityStatus(): Promise<number> {
  try {
    const process = new Deno.Command("deno", {
      args: ["run", "-A", "tools/fsm-manager.ts", "status"]
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to get activity status:", (error as Error).message);
    return 1;
  }
}

async function activityList(): Promise<number> {
  try {
    const process = new Deno.Command("deno", {
      args: ["run", "-A", "tools/fsm-manager.ts", "list"]
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to list activities:", (error as Error).message);
    return 1;
  }
}

// Validation commands
async function validateRules(cmdArgs: string[]): Promise<number> {
  const parsed = parseArgs(cmdArgs, {
    boolean: ["help", "fix"],
    string: [],
    alias: { h: "help", f: "fix" },
  });

  if (parsed.help) {
    console.log(`
Usage: validate [OPTIONS]

Validate project against defined rules and optionally auto-fix.

Options:
  --fix, -f    Attempt to auto-fix violations
  --help, -h   Show this help

Examples:
  validate
  validate --fix
`);
    return 0;
  }

  const cmd = ["deno", "run", "-A", "tools/guardian.ts"];
  if (parsed.fix) cmd.push("--fix");

  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1)
    });
    const { code } = await process.output();
    return code;
  } catch (error) {
    console.error("❌ Failed to run validation:", (error as Error).message);
    return 1;
  }
}

// Project initialization
async function initProject(cmdArgs: string[]): Promise<number> {
  const parsed = parseArgs(cmdArgs, {
    boolean: ["help"],
    string: ["template"],
    alias: { h: "help", t: "template" },
  });

  if (parsed.help) {
    console.log(`
Usage: init [OPTIONS]

Initialize a new Code Canvas project.

Options:
  --template, -t <name>  Use specific template
  --help, -h             Show this help

Examples:
  init
  init --template minimal
  init --template fullstack
`);
    return 0;
  }

  console.log("🚀 Initializing Code Canvas project...\n");

  const directories = [
    "sot/canvas",
    "sot/instructions", 
    "sot/schemas",
    "sot/state",
    "tools",
    "tests"
  ];

  try {
    for (const dir of directories) {
      await Deno.mkdir(dir, { recursive: true });
      console.log(`  ✅ Created ${dir}/`);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      console.error(`  ❌ Failed to create directories:`, (error as Error).message);
      return 1;
    }
  }

  console.log("\n🎉 Project initialized successfully!");
  console.log("\nNext steps:");
  console.log("  1. Create your first canvas: canvas render --help");
  console.log("  2. Start the server: canvas serve");
  console.log("  3. Set up validation: validate --help");

  return 0;
}

// Main command router
async function main() {
  const args = Deno.args;
  
  // Global flags  
  if (args.includes("--version") || args.includes("-v")) {
    console.log(`Code Canvas CLI v${VERSION}`);
    Deno.exit(0);
  }
  
  if (args.length === 0 || (args.includes("--help") && args.length === 1) || (args.includes("-h") && args.length === 1)) {
    console.log(`Code Canvas CLI v${VERSION}

A unified interface for visual software documentation and architecture management.

Usage: cli <command> [subcommand] [options]

Commands:
  canvas <subcommand>     Canvas rendering and management
    render [options]      Render canvas files to SVG/HTML
    list                  List available canvas files
    serve [options]       Start interactive canvas server
    
  activity <subcommand>   FSM activity management  
    switch <name>         Switch to activity state
    status                Show current activity 
    list                  List available activities
    
  validate [options]      Project validation
  init [options]          Initialize new project

Global Options:
  --version, -v          Show version
  --help, -h             Show help

Examples:
  cli canvas render --all --enhanced
  cli canvas serve --port 3000
  cli activity switch implementing
  cli validate --fix
  cli init --template minimal

For detailed help on any command, use: cli <command> --help
`);
    Deno.exit(0);
  }

  const [command, subcommand, ...rest] = args;
  let exitCode = 0;

  try {
    switch (command) {
      case "canvas":
        switch (subcommand) {
          case "render":
            exitCode = await canvasRender(rest);
            break;
          case "list":
            exitCode = await canvasList();
            break;
          case "serve":
            exitCode = await canvasServe(rest);
            break;
          default:
            console.error(`❌ Unknown canvas subcommand: ${subcommand}`);
            console.error("Available subcommands: render, list, serve");
            exitCode = 1;
        }
        break;
        
      case "activity":
        switch (subcommand) {
          case "switch":
            exitCode = await activitySwitch(rest);
            break;
          case "status":
            exitCode = await activityStatus();
            break;
          case "list":
            exitCode = await activityList();
            break;
          default:
            console.error(`❌ Unknown activity subcommand: ${subcommand}`);
            console.error("Available subcommands: switch, status, list");
            exitCode = 1;
        }
        break;
        
      case "validate":
        exitCode = await validateRules([subcommand, ...rest]);
        break;
        
      case "init":
        exitCode = await initProject([subcommand, ...rest]);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error("Available commands: canvas, activity, validate, init");
        exitCode = 1;
    }
  } catch (error) {
    console.error("❌ Unexpected error:", (error as Error).message);
    exitCode = 1;
  }

  Deno.exit(exitCode);
}

if (import.meta.main) {
  main();
}