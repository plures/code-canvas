#!/usr/bin/env -S deno run -A
/**
 * Canvas Renderer CLI - Enhanced rendering with JSON Canvas support
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import { EnhancedCanvasRenderer } from "./enhanced-canvas-renderer.ts";
import { codeCanvasToJSONCanvas, detectFormat } from "./jsoncanvas-compat.ts";
import { parse as parseYaml } from "jsr:@std/yaml";

const VERSION = "1.0.0";

async function renderCanvas(filePath: string, outputDir: string = "output") {
  try {
    const content = await Deno.readTextFile(filePath);
    const canvas = parseYaml(content) as any;

    // Detect format and convert if needed
    const format = detectFormat(canvas);
    console.log(`📋 Detected format: ${format}`);

    // Use enhanced renderer
    const renderer = new EnhancedCanvasRenderer(canvas);

    // Ensure output directory exists
    await Deno.mkdir(outputDir, { recursive: true });

    const baseName = filePath.replace(/\.canvas\.yaml$/, "").replace(/.*[\/\\]/, "");

    // Render SVG
    const svgPath = `${outputDir}/${baseName}.svg`;
    const svgOutput = renderer.renderSVG();
    await Deno.writeTextFile(svgPath, svgOutput);
    console.log(`✅ SVG: ${svgPath}`);

    // Render HTML
    const htmlPath = `${outputDir}/${baseName}.html`;
    const htmlOutput = renderer.renderHTML(`Canvas: ${baseName}`);
    await Deno.writeTextFile(htmlPath, htmlOutput);
    console.log(`✅ HTML: ${htmlPath}`);

    // Convert to JSON Canvas if it's Code Canvas format
    if (format === "codecanvas") {
      const jsonCanvas = codeCanvasToJSONCanvas(canvas);
      const jsonPath = `${outputDir}/${baseName}.canvas`;
      await Deno.writeTextFile(jsonPath, JSON.stringify(jsonCanvas, null, 2));
      console.log(`✅ JSON Canvas: ${jsonPath}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error rendering ${filePath}:`, (error as Error).message);
    return false;
  }
}

async function renderAllCanvases(outputDir: string = "output") {
  let success = 0;
  let total = 0;

  try {
    for await (const entry of Deno.readDir("sot/canvas")) {
      if (entry.isFile && entry.name.endsWith(".canvas.yaml")) {
        total++;
        const filePath = `sot/canvas/${entry.name}`;
        console.log(`\n🎨 Rendering ${entry.name}...`);

        if (await renderCanvas(filePath, outputDir)) {
          success++;
        }
      }
    }

    console.log(`\n📊 Rendered ${success}/${total} canvas files`);
    return success === total;
  } catch (error) {
    console.error("❌ Error reading canvas directory:", (error as Error).message);
    return false;
  }
}

async function main() {
  const parsed = parseArgs(Deno.args, {
    boolean: ["all", "help", "version"],
    string: ["file", "output", "format"],
    alias: {
      h: "help",
      v: "version",
      f: "file",
      o: "output",
      a: "all",
    },
    default: {
      output: "output",
      format: "all",
    },
  });

  if (parsed.help) {
    console.log(`Enhanced Canvas Renderer v${VERSION}

Render Code Canvas files with full JSON Canvas standard support.

Usage: canvas-render [OPTIONS]

Options:
  --file, -f <path>    Render specific canvas file
  --output, -o <dir>   Output directory (default: output)
  --all, -a            Render all canvas files in sot/canvas/
  --format <fmt>       Output format: svg, html, json, all (default: all)
  --version, -v        Show version
  --help, -h           Show this help

Examples:
  canvas-render --file demo.canvas.yaml
  canvas-render --all --output dist/
  canvas-render -f sot/canvas/demo.canvas.yaml -o output/
`);
    Deno.exit(0);
  }

  if (parsed.version) {
    console.log(`Enhanced Canvas Renderer v${VERSION}`);
    Deno.exit(0);
  }

  console.log(`🎨 Enhanced Canvas Renderer v${VERSION}`);
  console.log(`📂 Output directory: ${parsed.output}\n`);

  let success = false;

  if (parsed.all) {
    success = await renderAllCanvases(parsed.output);
  } else if (parsed.file) {
    success = await renderCanvas(parsed.file, parsed.output);
  } else {
    // Default: render demo if it exists
    const defaultFile = "sot/canvas/demo.canvas.yaml";
    try {
      await Deno.stat(defaultFile);
      console.log(`🎯 Rendering default file: ${defaultFile}`);
      success = await renderCanvas(defaultFile, parsed.output);
    } catch {
      console.log("🔍 No specific file provided and no demo.canvas.yaml found.");
      console.log("Use --file to specify a canvas file or --all to render all files.");
      console.log("Run with --help for usage information.");
      Deno.exit(1);
    }
  }

  if (success) {
    console.log("\n🎉 Rendering completed successfully!");
    Deno.exit(0);
  } else {
    console.log("\n❌ Rendering failed!");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
