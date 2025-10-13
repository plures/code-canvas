// Code Generation Engine
// Transforms FSM canvas into SvelteKit application code

import type { CanvasNode, CanvasEdge } from '../types/canvas.js';
import type { FsmConfig, FsmState, FsmTransition } from '../types/fsm.js';

export interface ApplicationNode extends CanvasNode {
  appType: 'route' | 'component' | 'store' | 'api' | 'layout';
  filePath?: string;
  generatedCode?: string;
  dependencies?: string[];
}

export interface ApplicationEdge extends CanvasEdge {
  flowType: 'navigation' | 'data' | 'event' | 'api' | 'dependency';
  implementation?: string;
}

export interface CodeGeneration {
  files: GeneratedFile[];
  routes: RouteDefinition[];
  stores: StoreDefinition[];
  apis: ApiDefinition[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'svelte' | 'typescript' | 'javascript' | 'json';
  nodeId: string;
}

export interface RouteDefinition {
  path: string;
  component: string;
  layout?: string;
  guards?: string[];
}

export interface StoreDefinition {
  name: string;
  type: 'writable' | 'readable' | 'derived';
  initialValue?: unknown;
  actions?: string[];
}

export interface ApiDefinition {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  middleware?: string[];
}

/**
 * Main Code Generation Engine
 * Transforms FSM canvas into runnable SvelteKit application
 */
export class CodeGenerator {
  private nodes: ApplicationNode[] = [];
  private edges: ApplicationEdge[] = [];
  private fsmConfig?: FsmConfig;

  constructor() {
    // Initialize code generation templates
  }

  /**
   * Load FSM configuration and canvas data for code generation
   */
  loadApplication(nodes: CanvasNode[], edges: CanvasEdge[], fsmConfig?: FsmConfig) {
    this.nodes = nodes.map(node => this.enhanceNodeForCodeGen(node));
    this.edges = edges.map(edge => this.enhanceEdgeForCodeGen(edge));
    this.fsmConfig = fsmConfig;
  }

  /**
   * Generate complete application code from current FSM state
   */
  generateApplication(): CodeGeneration {
    const files: GeneratedFile[] = [];
    const routes: RouteDefinition[] = [];
    const stores: StoreDefinition[] = [];
    const apis: ApiDefinition[] = [];

    // Generate files for each application node
    for (const node of this.nodes) {
      switch (node.appType) {
        case 'route':
          const routeFiles = this.generateRoute(node);
          files.push(...routeFiles);
          routes.push(this.generateRouteDefinition(node));
          break;
          
        case 'component':
          const componentFiles = this.generateComponent(node);
          files.push(...componentFiles);
          break;
          
        case 'store':
          const storeFiles = this.generateStore(node);
          files.push(...storeFiles);
          stores.push(this.generateStoreDefinition(node));
          break;
          
        case 'api':
          const apiFiles = this.generateApi(node);
          files.push(...apiFiles);
          apis.push(this.generateApiDefinition(node));
          break;
          
        case 'layout':
          const layoutFiles = this.generateLayout(node);
          files.push(...layoutFiles);
          break;
      }
    }

    // Generate connection logic (navigation, data flow, events)
    const connectionFiles = this.generateConnections();
    files.push(...connectionFiles);

    return { files, routes, stores, apis };
  }

  /**
   * Generate incremental updates when FSM changes
   */
  generateIncrementalUpdate(changedNodes: ApplicationNode[], changedEdges: ApplicationEdge[]): CodeGeneration {
    // Only regenerate files for changed nodes and their dependencies
    const files: GeneratedFile[] = [];
    
    for (const node of changedNodes) {
      // Regenerate files for this node
      const nodeFiles = this.generateNodeFiles(node);
      files.push(...nodeFiles);
      
      // Regenerate dependent files
      const dependentFiles = this.generateDependentFiles(node);
      files.push(...dependentFiles);
    }

    return { files, routes: [], stores: [], apis: [] };
  }

  /**
   * Enhance canvas node with application-specific properties
   */
  private enhanceNodeForCodeGen(node: CanvasNode): ApplicationNode {
    // Determine application type based on node properties
    let appType: ApplicationNode['appType'] = 'component';
    
    if (node.type === 'fsm' && node.props?.fsmType === 'state') {
      appType = 'route'; // FSM states become routes
    } else if (node.type === 'database') {
      appType = 'store'; // Database nodes become stores
    } else if (node.type === 'link' && node.url?.startsWith('/api/')) {
      appType = 'api'; // API links become endpoints
    }

    return {
      ...node,
      appType,
      filePath: this.generateFilePath(node, appType),
      dependencies: []
    };
  }

  /**
   * Enhance canvas edge with flow-specific properties
   */
  private enhanceEdgeForCodeGen(edge: CanvasEdge): ApplicationEdge {
    let flowType: ApplicationEdge['flowType'] = 'dependency';
    
    if (edge.kind === 'triggers') {
      flowType = 'navigation';
    } else if (edge.kind === 'implements') {
      flowType = 'data';
    }

    return {
      ...edge,
      flowType
    };
  }

  /**
   * Generate file path based on node type and application structure
   */
  private generateFilePath(node: CanvasNode, appType: ApplicationNode['appType']): string {
    const baseName = this.sanitizeFileName(node.label || node.id);
    
    switch (appType) {
      case 'route':
        return `src/routes/${baseName}/+page.svelte`;
      case 'component':
        return `src/lib/components/${baseName}.svelte`;
      case 'store':
        return `src/lib/stores/${baseName}Store.ts`;
      case 'api':
        return `src/routes/api/${baseName}/+server.ts`;
      case 'layout':
        return `src/routes/${baseName}/+layout.svelte`;
      default:
        return `src/lib/${baseName}.ts`;
    }
  }

  /**
   * Generate SvelteKit route from FSM state
   */
  private generateRoute(node: ApplicationNode): GeneratedFile[] {
    const routeName = this.sanitizeFileName(node.label || node.id);
    const componentName = this.toPascalCase(routeName);
    
    const pageContent = `<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fsmStore } from '$lib/stores/fsmStore.js';
  
  // Route: ${node.label || node.id}
  // Generated from FSM state: ${node.id}
  
  let pageData = {};
  
  onMount(() => {
    // Initialize page state
    console.log('Route ${routeName} mounted');
  });
  
  // Navigation handlers (generated from FSM transitions)
  ${this.generateNavigationHandlers(node)}
</script>

<div class="page-container" data-fsm-state="${node.id}">
  <h1>${node.label || componentName}</h1>
  
  <!-- Page content based on FSM state -->
  <div class="page-content">
    <p>This page represents FSM state: <code>${node.id}</code></p>
    
    <!-- Navigation buttons (generated from FSM transitions) -->
    ${this.generateNavigationButtons(node)}
  </div>
</div>

<style>
  .page-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-content {
    margin-top: 2rem;
  }
  
  /* FSM-generated styles */
  [data-fsm-state="${node.id}"] {
    /* State-specific styling */
  }
</style>`;

    return [{
      path: node.filePath || `src/routes/${routeName}/+page.svelte`,
      content: pageContent,
      type: 'svelte',
      nodeId: node.id
    }];
  }

  /**
   * Generate navigation handlers based on FSM transitions
   */
  private generateNavigationHandlers(node: ApplicationNode): string {
    if (!this.fsmConfig) return '';
    
    const transitions = this.fsmConfig.transitions.filter(t => t.from === node.id);
    
    return transitions.map(transition => {
      const eventName = transition.event || 'advance';
      const handlerName = `handle${this.toPascalCase(eventName)}`;
      
      return `
  function ${handlerName}() {
    // Guard condition: ${transition.guard || 'none'}
    ${transition.guard ? `if (!(${transition.guard})) return;` : ''}
    
    // Navigate to: ${transition.to}
    fsmStore.sendEvent('${eventName}');
    goto('/${this.sanitizeFileName(transition.to)}');
  }`;
    }).join('\n');
  }

  /**
   * Generate navigation buttons based on FSM transitions
   */
  private generateNavigationButtons(node: ApplicationNode): string {
    if (!this.fsmConfig) return '';
    
    const transitions = this.fsmConfig.transitions.filter(t => t.from === node.id);
    
    return transitions.map(transition => {
      const eventName = transition.event || 'advance';
      const handlerName = `handle${this.toPascalCase(eventName)}`;
      const targetState = this.fsmConfig?.states.find(s => s.id === transition.to);
      
      return `
    <button on:click={${handlerName}} class="nav-button">
      Go to ${targetState?.label || transition.to}
      ${transition.guard ? `<small>(${transition.guard})</small>` : ''}
    </button>`;
    }).join('\n');
  }

  private generateComponent(node: ApplicationNode): GeneratedFile[] {
    // Implementation for component generation
    return [];
  }

  private generateStore(node: ApplicationNode): GeneratedFile[] {
    // Implementation for store generation
    return [];
  }

  private generateApi(node: ApplicationNode): GeneratedFile[] {
    // Implementation for API generation
    return [];
  }

  private generateLayout(node: ApplicationNode): GeneratedFile[] {
    // Implementation for layout generation
    return [];
  }

  private generateConnections(): GeneratedFile[] {
    // Implementation for connection logic generation
    return [];
  }

  private generateNodeFiles(node: ApplicationNode): GeneratedFile[] {
    switch (node.appType) {
      case 'route': return this.generateRoute(node);
      case 'component': return this.generateComponent(node);
      case 'store': return this.generateStore(node);
      case 'api': return this.generateApi(node);
      case 'layout': return this.generateLayout(node);
      default: return [];
    }
  }

  private generateDependentFiles(node: ApplicationNode): GeneratedFile[] {
    // Find and regenerate files that depend on this node
    return [];
  }

  private generateRouteDefinition(node: ApplicationNode): RouteDefinition {
    return {
      path: `/${this.sanitizeFileName(node.label || node.id)}`,
      component: node.filePath || '',
      guards: []
    };
  }

  private generateStoreDefinition(node: ApplicationNode): StoreDefinition {
    return {
      name: `${this.sanitizeFileName(node.label || node.id)}Store`,
      type: 'writable',
      actions: []
    };
  }

  private generateApiDefinition(node: ApplicationNode): ApiDefinition {
    return {
      endpoint: `/api/${this.sanitizeFileName(node.label || node.id)}`,
      method: 'GET',
      handler: node.filePath || ''
    };
  }

  /**
   * Utility methods
   */
  private sanitizeFileName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private toPascalCase(str: string): string {
    return str.replace(/(-|_|\s)+(.)/g, (_, __, char) => char.toUpperCase())
      .replace(/^(.)/, char => char.toUpperCase());
  }
}

// Export singleton instance
export const codeGenerator = new CodeGenerator();