// Application Development Engine
// Orchestrates FSM canvas changes into live code generation and application updates

import { writable, derived } from 'svelte/store';
import { canvasStore } from '../stores/canvasStore.js';
import { fsmStore } from '../stores/fsmStore.js';
import { codeGenerator, type CodeGeneration } from './codeGenerator.js';
import { fileSystemIntegration } from './fileSystemIntegration.js';
import type { CanvasNode, CanvasEdge } from '../types/canvas.js';
import type { FsmConfig } from '../types/fsm.js';

export interface ApplicationState {
  isGenerating: boolean;
  lastGeneration?: CodeGeneration;
  generationHistory: CodeGeneration[];
  errors: string[];
  isDirty: boolean; // Canvas has changes not yet generated
}

export interface DevelopmentMetrics {
  totalNodes: number;
  totalEdges: number;
  generatedFiles: number;
  generatedRoutes: number;
  generatedStores: number;
  generatedApis: number;
  lastGeneratedAt?: Date;
}

/**
 * Main Application Development Engine
 * Transforms FSM canvas into living SvelteKit application
 */
class ApplicationDevelopmentEngine {
  private state = writable<ApplicationState>({
    isGenerating: false,
    generationHistory: [],
    errors: [],
    isDirty: false
  });

  // Derived stores for UI
  public readonly applicationState = { subscribe: this.state.subscribe };
  
  public readonly developmentMetrics = derived(
    [canvasStore, this.state], 
    ([canvas, appState]) => this.calculateMetrics(canvas, appState)
  );

  public readonly canGenerate = derived(
    [this.state], 
    ([appState]) => !appState.isGenerating && appState.isDirty
  );

  private canvas: { nodes: CanvasNode[], edges: CanvasEdge[] } = { nodes: [], edges: [] };
  private fsmConfig?: FsmConfig;

  constructor() {
    this.initializeWatchers();
  }

  /**
   * Initialize watchers for FSM and canvas changes
   */
  private initializeWatchers(): void {
    // Watch for canvas changes
    canvasStore.subscribe(canvas => {
      this.canvas = canvas;
      this.markDirty();
    });

    // Watch for FSM changes
    fsmStore.subscribe(fsm => {
      this.fsmConfig = fsm.fsmConfig;
      if (this.fsmConfig) {
        this.markDirty();
      }
    });

    console.log('🎯 Application Development Engine initialized');
    console.log('   Watching for FSM and canvas changes...');
  }

  /**
   * Mark application as having uncommitted changes
   */
  private markDirty(): void {
    this.state.update(state => ({
      ...state,
      isDirty: true
    }));
  }

  /**
   * Generate application code from current FSM state
   */
  async generateApplication(): Promise<boolean> {
    console.log('🚀 Starting application generation...');
    
    this.state.update(state => ({
      ...state,
      isGenerating: true,
      errors: []
    }));

    try {
      // Load current canvas and FSM into code generator
      codeGenerator.loadApplication(this.canvas.nodes, this.canvas.edges, this.fsmConfig);
      
      // Generate all application code
      const codeGeneration = codeGenerator.generateApplication();
      
      console.log('📦 Generated code structure:', {
        files: codeGeneration.files.length,
        routes: codeGeneration.routes.length,
        stores: codeGeneration.stores.length,
        apis: codeGeneration.apis.length
      });

      // Apply code generation to file system
      const success = await fileSystemIntegration.applyCodeGeneration(codeGeneration);

      if (success) {
        this.state.update(state => ({
          ...state,
          isGenerating: false,
          isDirty: false,
          lastGeneration: codeGeneration,
          generationHistory: [...state.generationHistory, codeGeneration]
        }));

        console.log('✅ Application generation completed successfully');
        return true;
      } else {
        throw new Error('File system integration failed');
      }

    } catch (error) {
      console.error('❌ Application generation failed:', error);
      
      this.state.update(state => ({
        ...state,
        isGenerating: false,
        errors: [...state.errors, error instanceof Error ? error.message : String(error)]
      }));

      return false;
    }
  }

  /**
   * Generate incremental updates for specific node changes
   */
  async generateIncrementalUpdate(nodeIds: string[]): Promise<boolean> {
    console.log('⚡ Generating incremental update for nodes:', nodeIds);

    const changedNodes = this.canvas.nodes.filter(node => nodeIds.includes(node.id));
    const changedEdges = this.canvas.edges.filter(edge => 
      nodeIds.includes(edge.from || edge.fromNode || '') || 
      nodeIds.includes(edge.to || edge.toNode || '')
    );

    try {
      const codeGeneration = codeGenerator.generateIncrementalUpdate(
        changedNodes as any[], 
        changedEdges as any[]
      );

      const success = await fileSystemIntegration.applyCodeGeneration(codeGeneration);

      if (success) {
        console.log('✅ Incremental update completed');
        return true;
      } else {
        throw new Error('Incremental update failed');
      }

    } catch (error) {
      console.error('❌ Incremental update failed:', error);
      return false;
    }
  }

  /**
   * Auto-generate when FSM changes (if enabled)
   */
  async autoGenerate(): Promise<void> {
    // Check if auto-generation is enabled
    const shouldAutoGenerate = this.shouldAutoGenerate();
    
    if (shouldAutoGenerate) {
      console.log('🔄 Auto-generating application...');
      await this.generateApplication();
    }
  }

  /**
   * Check if auto-generation should occur
   */
  private shouldAutoGenerate(): boolean {
    // Auto-generate if:
    // 1. Not currently generating
    // 2. Has uncommitted changes
    // 3. FSM configuration is valid
    // 4. Not too many rapid changes
    
    const state = this.getCurrentState();
    return !state.isGenerating && 
           state.isDirty && 
           this.fsmConfig !== undefined &&
           this.canvas.nodes.length > 0;
  }

  /**
   * Preview what would be generated without applying changes
   */
  previewGeneration(): CodeGeneration | null {
    try {
      codeGenerator.loadApplication(this.canvas.nodes, this.canvas.edges, this.fsmConfig);
      return codeGenerator.generateApplication();
    } catch (error) {
      console.error('Preview generation failed:', error);
      return null;
    }
  }

  /**
   * Get current application state
   */
  getCurrentState(): ApplicationState {
    let currentState: ApplicationState = {
      isGenerating: false,
      generationHistory: [],
      errors: [],
      isDirty: false
    };
    
    this.state.subscribe(state => currentState = state)();
    return currentState;
  }

  /**
   * Calculate development metrics
   */
  private calculateMetrics(canvas: any, appState: ApplicationState): DevelopmentMetrics {
    const lastGeneration = appState.lastGeneration;
    
    return {
      totalNodes: canvas.nodes.length,
      totalEdges: canvas.edges.length,
      generatedFiles: lastGeneration?.files.length || 0,
      generatedRoutes: lastGeneration?.routes.length || 0,
      generatedStores: lastGeneration?.stores.length || 0,
      generatedApis: lastGeneration?.apis.length || 0,
      lastGeneratedAt: appState.generationHistory.length > 0 ? new Date() : undefined
    };
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.state.update(state => ({
      ...state,
      errors: []
    }));
  }

  /**
   * Get generation history
   */
  getGenerationHistory(): CodeGeneration[] {
    return this.getCurrentState().generationHistory;
  }

  /**
   * Export current application configuration
   */
  exportApplicationConfig(): any {
    return {
      canvas: this.canvas,
      fsmConfig: this.fsmConfig,
      lastGeneration: this.getCurrentState().lastGeneration,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import application configuration
   */
  importApplicationConfig(config: any): void {
    if (config.canvas) {
      canvasStore.set(config.canvas);
    }
    
    if (config.fsmConfig) {
      fsmStore.loadFsm(config.fsmConfig);
    }
    
    console.log('📥 Imported application configuration');
  }
}

// Create and export singleton instance
export const appDevelopmentEngine = new ApplicationDevelopmentEngine();

// Export store subscriptions for components
export const applicationState = appDevelopmentEngine.applicationState;
export const developmentMetrics = appDevelopmentEngine.developmentMetrics;
export const canGenerate = appDevelopmentEngine.canGenerate;