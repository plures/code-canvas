/**
 * State-Docs Module
 * 
 * Provides structured state management for AI-assisted projects.
 * Manages lifecycle, rules, history, and canvas-based documentation.
 */

import { parse as parseYAML } from "jsr:@std/yaml";
import { join } from "jsr:@std/path";

export interface Activity {
  activity: string;
  actor: string;
  note: string;
  since: string;
}

export interface LifecycleState {
  id: string;
  label: string;
  allowedPaths: string[];
  requiredChores?: Array<{
    whenAnyMatches: string[];
    mustAlsoChange: string[];
  }>;
}

export interface Lifecycle {
  initial: string;
  states: LifecycleState[];
  transitions: Array<{
    from: string;
    to: string;
    guard: string;
  }>;
}

export interface Rules {
  invariants: Array<{
    id: string;
    description: string;
    check: Record<string, any>;
  }>;
  chores: Array<{
    id: string;
    description: string;
    when: Record<string, any>;
    then: Record<string, any>;
  }>;
  constraints?: Array<{
    id: string;
    description: string;
    applies_to_activity: string;
    forbidden_patterns?: string[];
    allowed_exceptions?: string[];
    when?: Record<string, any>;
    then?: Record<string, any>;
  }>;
}

export interface HistoryEntry {
  timestamp: string;
  activity: string;
  actor: string;
  note: string;
  previousActivity?: string;
}

/**
 * StateDocsManager - Main interface for state-docs functionality
 */
export class StateDocsManager {
  private sotPath: string;

  constructor(sotPath: string = "./sot") {
    this.sotPath = sotPath;
  }

  /**
   * Get current activity state
   */
  async getCurrentActivity(): Promise<Activity> {
    const path = join(this.sotPath, "state", "activity.yaml");
    const content = await Deno.readTextFile(path);
    return parseYAML(content) as Activity;
  }

  /**
   * Get lifecycle FSM definition
   */
  async getLifecycle(): Promise<Lifecycle> {
    const path = join(this.sotPath, "lifecycle.yaml");
    const content = await Deno.readTextFile(path);
    return parseYAML(content) as Lifecycle;
  }

  /**
   * Get validation rules
   */
  async getRules(): Promise<Rules> {
    const path = join(this.sotPath, "rules.yaml");
    const content = await Deno.readTextFile(path);
    return parseYAML(content) as Rules;
  }

  /**
   * Get activity history
   */
  async getHistory(): Promise<HistoryEntry[]> {
    const path = join(this.sotPath, "state", "history.yaml");
    try {
      const content = await Deno.readTextFile(path);
      const data = parseYAML(content) as { history: HistoryEntry[] };
      return data.history || [];
    } catch {
      return [];
    }
  }

  /**
   * Record new activity
   */
  async recordActivity(activity: string, actor: string, note: string): Promise<void> {
    const current = await this.getCurrentActivity();
    const timestamp = new Date().toISOString();

    // Update activity file
    const activityContent = `activity: ${activity}\nactor: ${actor}\nnote: "${note}"\nsince: "${timestamp}"\n`;
    const activityPath = join(this.sotPath, "state", "activity.yaml");
    await Deno.writeTextFile(activityPath, activityContent);

    // Append to history
    const historyEntry: HistoryEntry = {
      timestamp,
      activity,
      actor,
      note,
      previousActivity: current.activity,
    };

    const historyPath = join(this.sotPath, "state", "history.yaml");
    let history: HistoryEntry[] = [];
    try {
      const historyContent = await Deno.readTextFile(historyPath);
      const historyData = parseYAML(historyContent) as { history: HistoryEntry[] };
      history = historyData.history || [];
    } catch {
      // File doesn't exist yet
    }

    history.push(historyEntry);
    const historyYAML = `history:\n${history.map(h => 
      `  - timestamp: "${h.timestamp}"\n` +
      `    activity: ${h.activity}\n` +
      `    actor: ${h.actor}\n` +
      `    note: "${h.note}"\n` +
      (h.previousActivity ? `    previousActivity: ${h.previousActivity}\n` : '')
    ).join('')}`;
    
    await Deno.writeTextFile(historyPath, historyYAML);
  }

  /**
   * Validate if transition is allowed
   */
  async validateTransition(from: string, to: string): Promise<{ valid: boolean; reason?: string }> {
    const lifecycle = await this.getLifecycle();
    const transition = lifecycle.transitions.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      return {
        valid: false,
        reason: `No transition defined from ${from} to ${to}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if path is allowed in current activity
   */
  async isPathAllowed(path: string): Promise<boolean> {
    const activity = await this.getCurrentActivity();
    const lifecycle = await this.getLifecycle();
    const state = lifecycle.states.find(s => s.id === activity.activity);

    if (!state) {
      return false;
    }

    return state.allowedPaths.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(path);
    });
  }

  /**
   * Get required chores for changed files
   */
  async getRequiredChores(changedFiles: string[]): Promise<string[]> {
    const activity = await this.getCurrentActivity();
    const lifecycle = await this.getLifecycle();
    const state = lifecycle.states.find(s => s.id === activity.activity);

    if (!state || !state.requiredChores) {
      return [];
    }

    const required: string[] = [];
    for (const chore of state.requiredChores) {
      const matches = changedFiles.some(file =>
        chore.whenAnyMatches.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(file);
        })
      );

      if (matches) {
        required.push(...chore.mustAlsoChange);
      }
    }

    return [...new Set(required)];
  }
}

/**
 * Validation utilities
 */
export class StateDocsValidator {
  /**
   * Validate YAML syntax
   */
  static async validateYAML(path: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const content = await Deno.readTextFile(path);
      parseYAML(content);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check file size constraints
   */
  static async checkFileSize(
    path: string,
    maxLines: number,
    maxChars: number
  ): Promise<{ valid: boolean; lines?: number; chars?: number }> {
    const content = await Deno.readTextFile(path);
    const lines = content.split('\n').length;
    const chars = content.length;

    return {
      valid: lines <= maxLines && chars <= maxChars,
      lines,
      chars,
    };
  }
}
