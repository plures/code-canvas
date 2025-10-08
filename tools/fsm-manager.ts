import { parse as parseYaml, stringify as stringifyYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

interface ActivityState {
  activity: string;
  actor: string;
  note: string;
  since: string;
}

interface LifecycleState {
  id: string;
  label: string;
  allowedPaths: string[];
  requiredChores?: Array<{
    whenAnyMatches: string[];
    mustAlsoChange: string[];
  }>;
  guards?: Array<{
    condition: string;
    message: string;
  }>;
}

interface Lifecycle {
  initial: string;
  states: LifecycleState[];
  transitions?: Array<{
    from: string;
    to: string;
    guards?: string[];
    effects?: string[];
  }>;
}

interface TransitionHistory {
  timestamp: string;
  from: string;
  to: string;
  actor: string;
  note: string;
  success: boolean;
  error?: string;
}

export class FSMManager {
  private lifecyclePath: string;
  private activityPath: string;
  private historyPath: string;
  
  constructor(basePath = ".") {
    this.lifecyclePath = join(basePath, "sot", "lifecycle.yaml");
    this.activityPath = join(basePath, "sot", "state", "activity.yaml");
    this.historyPath = join(basePath, "sot", "state", "history.yaml");
  }

  async loadLifecycle(): Promise<Lifecycle> {
    const content = await Deno.readTextFile(this.lifecyclePath);
    return parseYaml(content) as Lifecycle;
  }

  async loadCurrentActivity(): Promise<ActivityState> {
    const content = await Deno.readTextFile(this.activityPath);
    return parseYaml(content) as ActivityState;
  }

  async loadHistory(): Promise<TransitionHistory[]> {
    if (!await exists(this.historyPath)) {
      return [];
    }
    const content = await Deno.readTextFile(this.historyPath);
    const data = parseYaml(content);
    return (data as { history: TransitionHistory[] }).history || [];
  }

  async saveHistory(history: TransitionHistory[]): Promise<void> {
    const content = stringifyYaml({ history });
    await Deno.writeTextFile(this.historyPath, content);
  }

  async validateTransition(from: string, to: string): Promise<{ valid: boolean; errors: string[] }> {
    const lifecycle = await this.loadLifecycle();
    const errors: string[] = [];

    // Check if target state exists
    const targetState = lifecycle.states.find(s => s.id === to);
    if (!targetState) {
      errors.push(`Target state '${to}' does not exist in lifecycle`);
      return { valid: false, errors };
    }

    // Check if transition is defined
    const transition = lifecycle.transitions?.find(t => t.from === from && t.to === to);
    if (lifecycle.transitions && !transition) {
      errors.push(`Transition from '${from}' to '${to}' is not allowed by lifecycle configuration`);
    }

    // Evaluate guard conditions for the target state
    if (targetState.guards) {
      for (const guard of targetState.guards) {
        const guardResult = await this.evaluateGuard(guard.condition);
        if (!guardResult.success) {
          errors.push(`Guard condition failed: ${guard.message} (${guard.condition})`);
        }
      }
    }

    // Evaluate transition-specific guards
    if (transition?.guards) {
      for (const guardCondition of transition.guards) {
        const guardResult = await this.evaluateGuard(guardCondition);
        if (!guardResult.success) {
          errors.push(`Transition guard failed: ${guardCondition}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async evaluateGuard(condition: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple guard condition evaluation
      // Format: "file:path/exists" | "not:file:path" | "git:clean" | "git:staged"
      
      if (condition.startsWith("file:")) {
        const filePath = condition.substring(5);
        const fileExists = await exists(filePath);
        return { success: fileExists };
      }
      
      if (condition.startsWith("not:file:")) {
        const filePath = condition.substring(9);
        const fileExists = await exists(filePath);
        return { success: !fileExists };
      }
      
      if (condition === "git:clean") {
        const gitStatus = await new Deno.Command("git", {
          args: ["status", "--porcelain"],
          stdout: "piped",
          stderr: "piped"
        }).output();
        const output = new TextDecoder().decode(gitStatus.stdout).trim();
        return { success: output === "" };
      }
      
      if (condition === "git:staged") {
        const gitStatus = await new Deno.Command("git", {
          args: ["diff", "--cached", "--name-only"],
          stdout: "piped",
          stderr: "piped"
        }).output();
        const output = new TextDecoder().decode(gitStatus.stdout).trim();
        return { success: output !== "" };
      }
      
      // Default: unknown condition fails
      return { success: false, error: `Unknown guard condition: ${condition}` };
      
    } catch (error) {
      return { success: false, error: `Guard evaluation failed: ${error.message}` };
    }
  }

  async transitionTo(newActivity: string, actor: string, note: string): Promise<{ success: boolean; errors: string[] }> {
    const current = await this.loadCurrentActivity();
    const validation = await this.validateTransition(current.activity, newActivity);
    
    if (!validation.valid) {
      // Log failed transition
      const history = await this.loadHistory();
      history.push({
        timestamp: new Date().toISOString(),
        from: current.activity,
        to: newActivity,
        actor,
        note,
        success: false,
        error: validation.errors.join("; ")
      });
      await this.saveHistory(history);
      
      return { success: false, errors: validation.errors };
    }

    try {
      // Execute transition effects
      const lifecycle = await this.loadLifecycle();
      const transition = lifecycle.transitions?.find(t => t.from === current.activity && t.to === newActivity);
      
      if (transition?.effects) {
        for (const effect of transition.effects) {
          await this.executeEffect(effect);
        }
      }

      // Update activity state
      const newState: ActivityState = {
        activity: newActivity,
        actor,
        note,
        since: new Date().toISOString()
      };
      
      const content = stringifyYaml(newState);
      await Deno.writeTextFile(this.activityPath, content);

      // Log successful transition
      const history = await this.loadHistory();
      history.push({
        timestamp: new Date().toISOString(),
        from: current.activity,
        to: newActivity,
        actor,
        note,
        success: true
      });
      await this.saveHistory(history);

      return { success: true, errors: [] };
      
    } catch (error) {
      return { success: false, errors: [`Transition failed: ${error.message}`] };
    }
  }

  private async executeEffect(_effect: string): Promise<void> {
    // Placeholder for transition effects
    // Could include: creating directories, updating files, running commands
    // Format: "create:dir:path" | "run:command" | "update:file:path"
    console.log(`Executing transition effect: ${_effect}`);
  }

  async rollback(): Promise<{ success: boolean; error?: string }> {
    try {
      const history = await this.loadHistory();
      if (history.length < 2) {
        return { success: false, error: "No previous state to rollback to" };
      }

      // Find the last successful transition
      const lastSuccessful = history.slice().reverse().find(h => h.success && h.to !== history[history.length - 1]?.from);
      
      if (!lastSuccessful) {
        return { success: false, error: "No valid previous state found" };
      }

      // Rollback to previous state
      const current = await this.loadCurrentActivity();
      const rollbackState: ActivityState = {
        activity: lastSuccessful.to,
        actor: current.actor,
        note: `Rollback from ${current.activity}`,
        since: new Date().toISOString()
      };

      const content = stringifyYaml(rollbackState);
      await Deno.writeTextFile(this.activityPath, content);

      // Log rollback
      history.push({
        timestamp: new Date().toISOString(),
        from: current.activity,
        to: lastSuccessful.to,
        actor: current.actor,
        note: "Rollback operation",
        success: true
      });
      await this.saveHistory(history);

      return { success: true };
      
    } catch (error) {
      return { success: false, error: `Rollback failed: ${error.message}` };
    }
  }

  async getTransitionHistory(): Promise<TransitionHistory[]> {
    return await this.loadHistory();
  }

  async getCurrentState(): Promise<{ activity: ActivityState; valid: boolean; errors: string[] }> {
    const activity = await this.loadCurrentActivity();
    const lifecycle = await this.loadLifecycle();
    
    const currentState = lifecycle.states.find(s => s.id === activity.activity);
    if (!currentState) {
      return {
        activity,
        valid: false,
        errors: [`Current activity '${activity.activity}' is not defined in lifecycle`]
      };
    }

    // Validate current state guards
    const errors: string[] = [];
    if (currentState.guards) {
      for (const guard of currentState.guards) {
        const result = await this.evaluateGuard(guard.condition);
        if (!result.success) {
          errors.push(`State guard violation: ${guard.message}`);
        }
      }
    }

    return {
      activity,
      valid: errors.length === 0,
      errors
    };
  }
}

// CLI Interface
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["to", "actor", "note"],
    boolean: ["rollback", "status", "history", "help"],
    alias: { h: "help" }
  });

  if (args.help) {
    console.log(`
🔄 FSM Manager - Finite State Machine for Project Lifecycle

Usage:
  deno run -A tools/fsm-manager.ts --to <activity> --actor <name> --note <description>
  deno run -A tools/fsm-manager.ts --status
  deno run -A tools/fsm-manager.ts --history
  deno run -A tools/fsm-manager.ts --rollback

Options:
  --to <activity>    Transition to the specified activity
  --actor <name>     Name of the person making the transition
  --note <text>      Description of why the transition is being made
  --status           Show current state and validation
  --history          Show transition history
  --rollback         Rollback to previous state
  --help, -h         Show this help message

Examples:
  deno run -A tools/fsm-manager.ts --status
  deno run -A tools/fsm-manager.ts --to implementation --actor john --note "Starting development"
  deno run -A tools/fsm-manager.ts --rollback
`);
    Deno.exit(0);
  }

  const fsm = new FSMManager();

  if (args.status) {
    const state = await fsm.getCurrentState();
    console.log(`📍 Current Activity: ${state.activity.activity}`);
    console.log(`👤 Actor: ${state.activity.actor}`);
    console.log(`📝 Note: ${state.activity.note}`);
    console.log(`⏰ Since: ${state.activity.since}`);
    console.log(`✅ Valid: ${state.valid ? "Yes" : "No"}`);
    if (state.errors.length > 0) {
      console.log(`❌ Issues:`);
      state.errors.forEach(error => console.log(`   • ${error}`));
    }
  } else if (args.history) {
    const history = await fsm.getTransitionHistory();
    console.log(`📜 Transition History (${history.length} entries):`);
    history.slice(-10).forEach(entry => {
      const status = entry.success ? "✅" : "❌";
      console.log(`${status} ${entry.timestamp}: ${entry.from} → ${entry.to} (${entry.actor})`);
      console.log(`   ${entry.note}`);
      if (entry.error) console.log(`   Error: ${entry.error}`);
    });
  } else if (args.rollback) {
    const result = await fsm.rollback();
    if (result.success) {
      console.log("✅ Successfully rolled back to previous state");
    } else {
      console.error(`❌ Rollback failed: ${result.error}`);
      Deno.exit(1);
    }
  } else if (args.to) {
    if (!args.actor || !args.note) {
      console.error("❌ --actor and --note are required for transitions");
      Deno.exit(1);
    }
    
    const result = await fsm.transitionTo(args.to, args.actor, args.note);
    if (result.success) {
      console.log(`✅ Successfully transitioned to: ${args.to}`);
    } else {
      console.error(`❌ Transition failed:`);
      result.errors.forEach(error => console.error(`   • ${error}`));
      Deno.exit(1);
    }
  } else {
    console.error("❌ Please specify an action. Use --help for usage information.");
    Deno.exit(1);
  }
}