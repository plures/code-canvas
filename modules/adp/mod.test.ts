/**
 * Tests for ADP module
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { Guardian, FSMManager, RulesEngine } from "./mod.ts";
import { StateDocsManager } from "../state-docs/mod.ts";

Deno.test("Guardian - checkActivity", async () => {
  const stateManager = new StateDocsManager("../../sot");
  const guardian = new Guardian(stateManager);
  
  // Test with allowed files in implementation
  const result = await guardian.checkActivity(["tests/example.test.ts"]);
  
  assertExists(result);
  assertEquals(typeof result.valid, "boolean");
  assertEquals(Array.isArray(result.errors), true);
});

Deno.test("Guardian - checkChores", async () => {
  const stateManager = new StateDocsManager("../../sot");
  const guardian = new Guardian(stateManager);
  
  const result = await guardian.checkChores(["src/app.ts", "tests/app.test.ts"]);
  
  assertExists(result);
  assertEquals(typeof result.valid, "boolean");
});

Deno.test("FSMManager - getCurrentActivity", async () => {
  const stateManager = new StateDocsManager("../../sot");
  const fsmManager = new FSMManager(stateManager);
  
  const activity = await fsmManager.getCurrentActivity();
  
  assertExists(activity);
  assertExists(activity.activity);
});

Deno.test("FSMManager - getAvailableTransitions", async () => {
  const stateManager = new StateDocsManager("../../sot");
  const fsmManager = new FSMManager(stateManager);
  
  const transitions = await fsmManager.getAvailableTransitions();
  
  assertEquals(Array.isArray(transitions), true);
});

Deno.test("RulesEngine - matchPattern", () => {
  const result1 = RulesEngine.matchPattern("src/**", "src/app.ts");
  const result2 = RulesEngine.matchPattern("src/**", "tests/app.test.ts");
  const result3 = RulesEngine.matchPattern("tests/*.test.ts", "tests/app.test.ts");
  
  assertEquals(result1, true);
  assertEquals(result2, false);
  assertEquals(result3, true);
});

Deno.test("RulesEngine - matchesAny", () => {
  const patterns = ["src/**", "tests/**"];
  const files = ["src/app.ts", "docs/readme.md"];
  
  const result = RulesEngine.matchesAny(patterns, files);
  assertEquals(result, true);
});

Deno.test("RulesEngine - getMatches", () => {
  const files = ["src/app.ts", "src/util.ts", "tests/app.test.ts"];
  const matches = RulesEngine.getMatches("src/**", files);
  
  assertEquals(matches.length, 2);
  assertEquals(matches.includes("src/app.ts"), true);
  assertEquals(matches.includes("src/util.ts"), true);
});
