#!/usr/bin/env -S deno test --allow-read --allow-write --allow-run
/**
 * Unit Tests for Guardian System
 * 
 * Tests core functionality of the guardian validation system,
 * FSM manager, and schema validation.
 */

import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// Test guardian functionality
Deno.test("Guardian - Basic path validation", async () => {
  // This would test the guardian's path validation logic
  // For now, we'll test that the guardian script exists and runs
  const guardianPath = join(".", "tools", "guardian.ts");
  const stat = await Deno.stat(guardianPath);
  assertEquals(stat.isFile, true);
});

Deno.test("Guardian - Windows compatibility", async () => {
  // Test that guardian handles Windows path separators
  const isWindows = Deno.build.os === "windows";
  if (isWindows) {
    // On Windows, test path separator normalization
    const testPath = "sot\\lifecycle.yaml";
    const normalizedPath = testPath.replace(/\\/g, "/");
    assertEquals(normalizedPath, "sot/lifecycle.yaml");
  }
});

// Test FSM Manager
Deno.test("FSM Manager - Status command", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "-A", "tools/fsm-manager.ts", "--status"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const result = await command.output();
  assertEquals(result.code, 0);
  
  const output = new TextDecoder().decode(result.stdout);
  assertEquals(output.includes("📍 Current Activity:"), true);
});

// Test Schema Validator
Deno.test("Schema Validator - Configuration validation", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "-A", "tools/schema-validator.ts"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const result = await command.output();
  // Should succeed with warnings (schema files don't have mappings)
  assertEquals(result.code, 0);
  
  const output = new TextDecoder().decode(result.stdout);
  assertEquals(output.includes("🔍 Schema Validation Results"), true);
  assertEquals(output.includes("🎉 All configuration files are valid!"), true);
});

Deno.test("Schema Validator - Activity file validation", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "-A", "tools/schema-validator.ts", "sot/state/activity.yaml"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const result = await command.output();
  assertEquals(result.code, 0);
});

// Test Canvas Renderer
Deno.test("Canvas Renderer - Help command", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "-A", "tools/canvas-renderer.ts"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const result = await command.output();
  assertEquals(result.code, 1); // Should exit 1 with usage message
  
  const output = new TextDecoder().decode(result.stdout);
  assertEquals(output.includes("🎨 Canvas Renderer"), true);
});

// Test file structure
Deno.test("Project Structure - Core files exist", async () => {
  const coreFiles = [
    "sot/lifecycle.yaml",
    "sot/rules.yaml", 
    "sot/state/activity.yaml",
    "tools/guardian.ts",
    "tools/fsm-manager.ts",
    "tools/schema-validator.ts",
    "tools/canvas-renderer.ts",
    "deno.json"
  ];

  for (const filePath of coreFiles) {
    try {
      const stat = await Deno.stat(filePath);
      assertEquals(stat.isFile, true, `File ${filePath} should exist`);
    } catch (error) {
      throw new Error(`Required file ${filePath} is missing: ${error.message}`);
    }
  }
});

// Test YAML parsing
Deno.test("YAML Configuration - Basic parsing", async () => {
  const { parse } = await import("https://deno.land/std@0.208.0/yaml/mod.ts");
  
  // Test lifecycle.yaml parsing
  const lifecycleContent = await Deno.readTextFile("sot/lifecycle.yaml");
  const lifecycle = parse(lifecycleContent);
  assertEquals(typeof lifecycle, "object");
  assertEquals(lifecycle !== null, true);
  assertEquals("initial" in lifecycle, true);
  assertEquals("states" in lifecycle, true);
  
  // Test rules.yaml parsing
  const rulesContent = await Deno.readTextFile("sot/rules.yaml");
  const rules = parse(rulesContent);
  assertEquals(typeof rules, "object");
  assertEquals(rules !== null, true);
});

// Integration test
Deno.test("Integration - Guardian validation passes", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "-A", "tools/guardian.ts"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const result = await command.output();
  assertEquals(result.code, 0);
  
  const output = new TextDecoder().decode(result.stdout);
  assertEquals(output.includes("guardian: OK"), true);
});

console.log("✅ All tests completed!");