/**
 * State-Docs Module
 * 
 * Provides structured state management for AI-assisted projects.
 * Manages lifecycle, rules, history, and canvas-based documentation.
 * 
 * Note: This module uses a simplified YAML reader that focuses on
 * the specific structure of State-Docs files. For production use,
 * consider using a full YAML parser library.
 */

function joinPath(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}

/**
 * Parse activity YAML (simple key-value format)
 */
function parseActivity(content: string): any {
  const result: any = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!line.includes(':')) continue;
    
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
    result[key.trim()] = value;
  }
  
  return result;
}

/**
 * Parse lifecycle YAML (states and transitions)
 */
function parseLifecycle(content: string): any {
  const lines = content.split('\n');
  const result: any = { states: [], transitions: [] };
  let currentState: any = null;
  let currentTransition: any = null;
  let currentSection: 'states' | 'transitions' | null = null;
  let inAllowedPaths = false;
  let inRequiredChores = false;
  let currentChore: any = null;
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    
    // Top-level keys
    if (trimmed.startsWith('initial:')) {
      result.initial = trimmed.split(':')[1].trim();
      continue;
    }
    
    if (trimmed === 'states:') {
      currentSection = 'states';
      continue;
    }
    
    if (trimmed === 'transitions:') {
      currentSection = 'transitions';
      continue;
    }
    
    // States section
    if (currentSection === 'states' && trimmed.startsWith('- id:')) {
      if (currentState) result.states.push(currentState);
      currentState = { id: trimmed.split(':')[1].trim(), allowedPaths: [], requiredChores: [] };
      inAllowedPaths = false;
      inRequiredChores = false;
    } else if (currentState) {
      if (trimmed.startsWith('label:')) {
        currentState.label = trimmed.split(':')[1].trim();
      } else if (trimmed === 'allowedPaths:') {
        inAllowedPaths = true;
        inRequiredChores = false;
      } else if (trimmed === 'requiredChores:') {
        inRequiredChores = true;
        inAllowedPaths = false;
      } else if (inAllowedPaths && trimmed.startsWith('- ')) {
        currentState.allowedPaths.push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
      } else if (inRequiredChores) {
        if (trimmed.startsWith('- whenAnyMatches:')) {
          if (currentChore) currentState.requiredChores.push(currentChore);
          currentChore = { whenAnyMatches: [], mustAlsoChange: [], currentArray: 'whenAnyMatches' };
        } else if (trimmed.startsWith('whenAnyMatches:')) {
          if (currentChore) currentState.requiredChores.push(currentChore);
          currentChore = { whenAnyMatches: [], mustAlsoChange: [], currentArray: 'whenAnyMatches' };
        } else if (currentChore) {
          if (trimmed.startsWith('mustAlsoChange:')) {
            // Switch to mustAlsoChange array
            currentChore.currentArray = 'mustAlsoChange';
          } else if (trimmed.startsWith('- ') && indent > 4) {
            const value = trimmed.substring(2).replace(/^["']|["']$/g, '');
            // Add to current array based on context
            if (currentChore.currentArray === 'whenAnyMatches') {
              currentChore.whenAnyMatches.push(value);
            } else {
              currentChore.mustAlsoChange.push(value);
            }
          }
        }
      }
    }
    
    // Transitions section
    if (currentSection === 'transitions' && trimmed.startsWith('- from:')) {
      if (currentTransition) result.transitions.push(currentTransition);
      currentTransition = { from: trimmed.split(':')[1].trim() };
    } else if (currentTransition) {
      if (trimmed.startsWith('to:')) {
        currentTransition.to = trimmed.split(':')[1].trim();
      } else if (trimmed.startsWith('guard:')) {
        currentTransition.guard = trimmed.substring(trimmed.indexOf(':') + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  
  if (currentState) result.states.push(currentState);
  if (currentChore && currentState) currentState.requiredChores.push(currentChore);
  if (currentTransition) result.transitions.push(currentTransition);
  
  return result;
}

/**
 * Parse rules YAML
 */
function parseRules(content: string): any {
  const lines = content.split('\n');
  const result: any = { invariants: [], chores: [], constraints: [] };
  let currentSection: 'invariants' | 'chores' | 'constraints' | null = null;
  let currentItem: any = null;
  let inCheck = false;
  let inWhen = false;
  let inThen = false;
  let currentArrayKey: string | null = null;
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    const trimmed = line.trim();
    
    if (trimmed === 'invariants:') {
      currentSection = 'invariants';
      continue;
    }
    if (trimmed === 'chores:') {
      currentSection = 'chores';
      continue;
    }
    if (trimmed === 'constraints:') {
      currentSection = 'constraints';
      continue;
    }
    
    if (trimmed.startsWith('- id:')) {
      if (currentItem && currentSection) {
        result[currentSection].push(currentItem);
      }
      currentItem = { id: trimmed.split(':')[1].trim() };
      inCheck = false;
      inWhen = false;
      inThen = false;
      currentArrayKey = null;
    } else if (currentItem) {
      if (trimmed.startsWith('description:')) {
        currentItem.description = trimmed.substring(trimmed.indexOf(':') + 1).trim().replace(/^["']|["']$/g, '');
      } else if (trimmed === 'check:') {
        currentItem.check = {};
        inCheck = true;
        currentArrayKey = null;
      } else if (trimmed === 'when:') {
        currentItem.when = {};
        inWhen = true;
        currentArrayKey = null;
      } else if (trimmed === 'then:') {
        currentItem.then = {};
        inThen = true;
        currentArrayKey = null;
      } else if (inCheck && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        if (key.trim() === 'patterns' || key.trim() === 'forbidden_patterns' || key.trim() === 'allowed_exceptions') {
          currentItem.check[key.trim()] = [];
          currentArrayKey = key.trim();
        } else if (trimmed.startsWith('- ')) {
          // Array item - add to current array context
          if (currentArrayKey && currentItem.check[currentArrayKey]) {
            currentItem.check[currentArrayKey].push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
          }
        } else {
          currentItem.check[key.trim()] = isNaN(Number(value)) ? value.replace(/^["']|["']$/g, '') : Number(value);
          currentArrayKey = null;
        }
      }
    }
  }
  
  if (currentItem && currentSection) {
    result[currentSection].push(currentItem);
  }
  
  return result;
}

/**
 * Parse history YAML
 */
function parseHistory(content: string): any {
  // Simple parser for history format
  // For now, return empty if parsing is complex
  // This would need proper implementation for production use
  return { history: [] };
}

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
    const path = joinPath(this.sotPath, "state", "activity.yaml");
    const content = await Deno.readTextFile(path);
    return parseActivity(content) as Activity;
  }

  /**
   * Get lifecycle FSM definition
   */
  async getLifecycle(): Promise<Lifecycle> {
    const path = joinPath(this.sotPath, "lifecycle.yaml");
    const content = await Deno.readTextFile(path);
    return parseLifecycle(content) as Lifecycle;
  }

  /**
   * Get validation rules
   */
  async getRules(): Promise<Rules> {
    const path = joinPath(this.sotPath, "rules.yaml");
    const content = await Deno.readTextFile(path);
    return parseRules(content) as Rules;
  }

  /**
   * Get activity history
   */
  async getHistory(): Promise<HistoryEntry[]> {
    const path = joinPath(this.sotPath, "state", "history.yaml");
    try {
      const content = await Deno.readTextFile(path);
      const data = parseHistory(content) as { history: HistoryEntry[] };
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
    const activityPath = joinPath(this.sotPath, "state", "activity.yaml");
    await Deno.writeTextFile(activityPath, activityContent);

    // Append to history
    const historyEntry: HistoryEntry = {
      timestamp,
      activity,
      actor,
      note,
      previousActivity: current.activity,
    };

    const historyPath = joinPath(this.sotPath, "state", "history.yaml");
    let history: HistoryEntry[] = [];
    try {
      const historyContent = await Deno.readTextFile(historyPath);
      const historyData = parseHistory(historyContent) as { history: HistoryEntry[] };
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
      // Try to parse with our parsers
      if (path.includes('activity.yaml')) {
        parseActivity(content);
      } else if (path.includes('lifecycle.yaml')) {
        parseLifecycle(content);
      } else if (path.includes('rules.yaml')) {
        parseRules(content);
      }
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
