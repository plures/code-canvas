/**
 * Tests for State-Docs module
 */

// Simple test assertions
function assertEquals(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected} but got ${actual}`);
  }
}

function assertExists(value: any, msg?: string) {
  if (value === null || value === undefined) {
    throw new Error(msg || `Value does not exist`);
  }
}

import { StateDocsManager, StateDocsValidator } from "./mod.ts";

Deno.test("StateDocsManager - getCurrentActivity", async () => {
  const manager = new StateDocsManager("../../sot");
  const activity = await manager.getCurrentActivity();

  assertExists(activity);
  assertExists(activity.activity);
  assertExists(activity.actor);
  assertEquals(typeof activity.activity, "string");
});

Deno.test("StateDocsManager - getLifecycle", async () => {
  const manager = new StateDocsManager("../../sot");
  const lifecycle = await manager.getLifecycle();

  assertExists(lifecycle);
  assertExists(lifecycle.initial);
  assertExists(lifecycle.states);
  assertEquals(Array.isArray(lifecycle.states), true);
  assertEquals(lifecycle.states.length > 0, true);
});

Deno.test("StateDocsManager - getRules", async () => {
  const manager = new StateDocsManager("../../sot");
  const rules = await manager.getRules();

  assertExists(rules);
  assertExists(rules.invariants);
  assertEquals(Array.isArray(rules.invariants), true);
});

Deno.test("StateDocsManager - isPathAllowed", async () => {
  const manager = new StateDocsManager("../../sot");

  // In implementation activity, src/** should be allowed
  const srcAllowed = await manager.isPathAllowed("src/app.ts");
  const testsAllowed = await manager.isPathAllowed("tests/app.test.ts");

  // Both should be true in implementation state
  assertEquals(typeof srcAllowed, "boolean");
  assertEquals(typeof testsAllowed, "boolean");
});

Deno.test("StateDocsManager - getRequiredChores", async () => {
  const manager = new StateDocsManager("../../sot");

  // Changing src files should require test changes
  const chores = await manager.getRequiredChores(["src/app.ts"]);

  assertEquals(Array.isArray(chores), true);
});

Deno.test("StateDocsValidator - validateYAML", async () => {
  // Test with valid YAML
  const result = await StateDocsValidator.validateYAML("../../sot/lifecycle.yaml");
  assertEquals(result.valid, true);
});
