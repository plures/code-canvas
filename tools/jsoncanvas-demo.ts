#!/usr/bin/env -S deno run -A
/**
 * JSON Canvas Compatibility Demo
 * 
 * Tests conversion between formats and renders examples showing all supported features.
 */

import * as yaml from "jsr:@std/yaml";
import { 
  CodeCanvas, 
  JSONCanvas,
  ExtendedCanvas,
  codeCanvasToJSONCanvas, 
  jsonCanvasToCodeCanvas,
  normalizeCanvas,
  isJSONCanvasFormat,
  isCodeCanvasFormat
} from "./jsoncanvas-compat.ts";
import { EnhancedCanvasRenderer } from "./enhanced-canvas-renderer.ts";

async function loadCanvas(path: string): Promise<ExtendedCanvas> {
  const content = await Deno.readTextFile(path);
  const parsed = yaml.parse(content);
  return normalizeCanvas(parsed);
}

async function saveCanvas(canvas: any, path: string, format: "yaml" | "json" = "yaml"): Promise<void> {
  const content = format === "json" 
    ? JSON.stringify(canvas, null, 2)
    : yaml.stringify(canvas);
  await Deno.writeTextFile(path, content);
}

async function main() {
  console.log("🎨 JSON Canvas Compatibility Demo\n");
  
  try {
    // 1. Load and analyze existing canvas
    console.log("📄 Loading demo canvas...");
    const demoCanvas = await loadCanvas("sot/canvas/demo.canvas.yaml");
    
    console.log(`   Format: ${isCodeCanvasFormat(demoCanvas) ? 'Code Canvas' : 'JSON Canvas'}`);
    console.log(`   Nodes: ${demoCanvas.nodes.length}, Edges: ${demoCanvas.edges.length}`);
    
    // 2. Convert to JSON Canvas format
    console.log("\n🔄 Converting to JSON Canvas format...");
    const jsonCanvas = codeCanvasToJSONCanvas(demoCanvas as CodeCanvas);
    await saveCanvas(jsonCanvas, "output/demo.jsoncanvas.json", "json");
    
    console.log(`   ✅ Saved to output/demo.jsoncanvas.json`);
    console.log(`   Nodes: ${jsonCanvas.nodes.length}, Edges: ${jsonCanvas.edges.length}`);
    
    // 3. Convert back to Code Canvas
    console.log("\n⏪ Converting back to Code Canvas...");
    const backConverted = jsonCanvasToCodeCanvas(jsonCanvas);
    await saveCanvas(backConverted, "output/demo.converted.yaml", "yaml");
    
    console.log(`   ✅ Saved to output/demo.converted.yaml`);
    
    // 4. Load extended demo with JSON Canvas features
    console.log("\n🚀 Loading JSON Canvas demo with extended features...");
    const extendedDemo = await loadCanvas("sot/canvas/jsoncanvas-demo.canvas.yaml");
    
    console.log(`   Nodes: ${extendedDemo.nodes.length}, Edges: ${extendedDemo.edges.length}`);
    console.log(`   Types: ${extendedDemo.nodes.map(n => n.type).join(", ")}`);
    
    // 5. Render enhanced canvas
    console.log("\n🎨 Rendering enhanced canvas...");
    const renderer = new EnhancedCanvasRenderer(extendedDemo);
    
    const svg = renderer.renderSVG();
    await Deno.writeTextFile("output/jsoncanvas-demo.svg", svg);
    
    const html = renderer.renderHTML("JSON Canvas Demo - Code Canvas Extended");
    await Deno.writeTextFile("output/jsoncanvas-demo.html", html);
    
    console.log(`   ✅ Rendered SVG: output/jsoncanvas-demo.svg`);
    console.log(`   ✅ Rendered HTML: output/jsoncanvas-demo.html`);
    
    // 6. Feature analysis
    console.log("\n📊 Feature Analysis:");
    
    const nodeTypes = new Set(extendedDemo.nodes.map(n => n.type));
    console.log(`   Node types: ${Array.from(nodeTypes).join(", ")}`);
    
    const hasColors = extendedDemo.nodes.some(n => n.color) || extendedDemo.edges.some(e => e.color);
    console.log(`   Color support: ${hasColors ? "✅" : "❌"}`);
    
    const hasPositioning = extendedDemo.edges.some(e => e.fromSide || e.toSide);
    console.log(`   Edge positioning: ${hasPositioning ? "✅" : "❌"}`);
    
    const hasTextNodes = extendedDemo.nodes.some(n => n.type === "text");
    console.log(`   Text nodes: ${hasTextNodes ? "✅" : "❌"}`);
    
    const hasFileNodes = extendedDemo.nodes.some(n => n.type === "file");
    console.log(`   File nodes: ${hasFileNodes ? "✅" : "❌"}`);
    
    const hasLinkNodes = extendedDemo.nodes.some(n => n.type === "link");
    console.log(`   Link nodes: ${hasLinkNodes ? "✅" : "❌"}`);
    
    const hasGroupNodes = extendedDemo.nodes.some(n => n.type === "group");
    console.log(`   Group nodes: ${hasGroupNodes ? "✅" : "❌"}`);
    
    const hasSemanticEdges = extendedDemo.edges.some(e => e.kind);
    console.log(`   Semantic edges: ${hasSemanticEdges ? "✅" : "❌"}`);
    
    console.log("\n✨ JSON Canvas compatibility layer complete!");
    console.log("\nOpen output/jsoncanvas-demo.html in your browser to see the results!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  // Ensure output directory exists
  try {
    await Deno.mkdir("output", { recursive: true });
  } catch {
    // Directory might already exist
  }
  
  await main();
}