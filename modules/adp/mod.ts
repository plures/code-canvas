/**
 * ADP Module - AI Development Pattern
 * 
 * Provides validation and guardrails for AI-assisted development.
 * Integrates with State-Docs for FSM-controlled workflows.
 */

import { StateDocsManager } from "../state-docs/mod.ts";
import { join } from "jsr:@std/path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CommitInfo {
  files: string[];
  additions: number;
  deletions: number;
}

/**
 * Guardian - Core validation engine
 */
export class Guardian {
  private stateManager: StateDocsManager;

  constructor(stateManager: StateDocsManager) {
    this.stateManager = stateManager;
  }

  /**
   * Validate file changes
   */
  async validate(files: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check activity-based file access
    const activityCheck = await this.checkActivity(files);
    errors.push(...activityCheck.errors);
    warnings.push(...activityCheck.warnings);

    // Check required chores
    const choresCheck = await this.checkChores(files);
    errors.push(...choresCheck.errors);
    warnings.push(...choresCheck.warnings);

    // Check invariants
    const invariantsCheck = await this.checkInvariants(files);
    errors.push(...invariantsCheck.errors);
    warnings.push(...invariantsCheck.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if files are allowed in current activity
   */
  async checkActivity(files: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      const allowed = await this.stateManager.isPathAllowed(file);
      if (!allowed) {
        const activity = await this.stateManager.getCurrentActivity();
        errors.push(
          `File '${file}' is not allowed in current activity '${activity.activity}'`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check required chores
   */
  async checkChores(files: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredPatterns = await this.stateManager.getRequiredChores(files);
    
    for (const pattern of requiredPatterns) {
      const hasMatch = files.some(file => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(file);
      });

      if (!hasMatch) {
        errors.push(
          `Required chore not completed: changes must also include files matching '${pattern}'`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check project invariants
   */
  async checkInvariants(files: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rules = await this.stateManager.getRules();

    for (const invariant of rules.invariants) {
      if (invariant.check.type === 'file_size') {
        const patterns = invariant.check.patterns || [];
        const maxLines = invariant.check.max_lines;
        const maxChars = invariant.check.max_chars;

        for (const file of files) {
          const matches = patterns.some((pattern: string) => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
          });

          if (matches) {
            try {
              const content = await Deno.readTextFile(file);
              const lines = content.split('\n').length;
              const chars = content.length;

              if (lines > maxLines || chars > maxChars) {
                errors.push(
                  `File '${file}' exceeds size limits: ${lines} lines (max ${maxLines}), ${chars} chars (max ${maxChars})`
                );
              }
            } catch {
              // File might not exist (deleted), skip
            }
          }
        }
      }

      if (invariant.check.type === 'yaml_syntax') {
        const patterns = invariant.check.patterns || [];

        for (const file of files) {
          const matches = patterns.some((pattern: string) => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
          });

          if (matches && file.endsWith('.yaml')) {
            const result = await this.validateYAML(file);
            if (!result.valid) {
              errors.push(`YAML syntax error in '${file}': ${result.error}`);
            }
          }
        }
      }

      if (invariant.check.type === 'commit_size') {
        // This would be checked by the pre-commit hook with git diff stats
        warnings.push('Commit size check requires git diff information');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate YAML file
   */
  private async validateYAML(path: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const content = await Deno.readTextFile(path);
      const { parse } = await import("jsr:@std/yaml");
      parse(content);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check commit size constraints
   */
  async checkCommitSize(commit: CommitInfo): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rules = await this.stateManager.getRules();
    const sizeInvariant = rules.invariants.find(inv => inv.check.type === 'commit_size');

    if (sizeInvariant) {
      const maxFiles = sizeInvariant.check.max_files;
      const maxAdditions = sizeInvariant.check.max_additions;

      if (commit.files.length > maxFiles) {
        errors.push(
          `Commit has ${commit.files.length} files, exceeds limit of ${maxFiles}`
        );
      }

      if (commit.additions > maxAdditions) {
        errors.push(
          `Commit has ${commit.additions} additions, exceeds limit of ${maxAdditions}`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

/**
 * FSM Manager - Lifecycle state management
 */
export class FSMManager {
  private stateManager: StateDocsManager;

  constructor(stateManager: StateDocsManager) {
    this.stateManager = stateManager;
  }

  /**
   * Get current activity
   */
  async getCurrentActivity() {
    return await this.stateManager.getCurrentActivity();
  }

  /**
   * Get lifecycle definition
   */
  async getLifecycle() {
    return await this.stateManager.getLifecycle();
  }

  /**
   * Transition to new activity
   */
  async transition(newActivity: string, actor: string, note: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const current = await this.stateManager.getCurrentActivity();
    const validation = await this.stateManager.validateTransition(
      current.activity,
      newActivity
    );

    if (!validation.valid) {
      errors.push(validation.reason || 'Transition not allowed');
      return { valid: false, errors, warnings };
    }

    await this.stateManager.recordActivity(newActivity, actor, note);
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Show available transitions
   */
  async getAvailableTransitions(): Promise<string[]> {
    const current = await this.stateManager.getCurrentActivity();
    const lifecycle = await this.stateManager.getLifecycle();

    return lifecycle.transitions
      .filter(t => t.from === current.activity)
      .map(t => t.to);
  }
}

/**
 * Rules Engine - Evaluate validation rules
 */
export class RulesEngine {
  /**
   * Match file path against pattern
   */
  static matchPattern(pattern: string, path: string): boolean {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(path);
  }

  /**
   * Check if files match any pattern
   */
  static matchesAny(patterns: string[], files: string[]): boolean {
    return files.some(file =>
      patterns.some(pattern => this.matchPattern(pattern, file))
    );
  }

  /**
   * Get matching files for pattern
   */
  static getMatches(pattern: string, files: string[]): string[] {
    return files.filter(file => this.matchPattern(pattern, file));
  }
}
