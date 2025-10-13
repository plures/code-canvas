// File System Integration for Code Generation
// Handles writing generated code to actual files in the SvelteKit project

import type { CodeGeneration, GeneratedFile } from './codeGenerator.js';

export interface FileSystemOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  backup?: string;
}

export class FileSystemIntegration {
  private projectRoot: string = '/src';
  private operationHistory: FileSystemOperation[] = [];

  /**
   * Apply code generation results to the file system
   */
  async applyCodeGeneration(codeGen: CodeGeneration): Promise<boolean> {
    try {
      // Create directories if they don't exist
      await this.ensureDirectories(codeGen.files);
      
      // Write all generated files
      for (const file of codeGen.files) {
        await this.writeGeneratedFile(file);
      }
      
      // Update routing configuration
      await this.updateRouteConfig(codeGen.routes);
      
      // Update store exports
      await this.updateStoreExports(codeGen.stores);
      
      // Update API routes
      await this.updateApiRoutes(codeGen.apis);
      
      console.log(`✅ Applied ${codeGen.files.length} file changes`);
      return true;
      
    } catch (error) {
      console.error('❌ Code generation failed:', error);
      await this.rollbackChanges();
      return false;
    }
  }

  /**
   * Write a single generated file to disk
   */
  private async writeGeneratedFile(file: GeneratedFile): Promise<void> {
    try {
      // In a real implementation, this would write to the actual file system
      // For now, we'll simulate and log the operation
      
      const operation: FileSystemOperation = {
        type: await this.fileExists(file.path) ? 'update' : 'create',
        path: file.path,
        content: file.content,
        backup: await this.readExistingFile(file.path)
      };
      
      this.operationHistory.push(operation);
      
      // Simulate file write
      console.log(`📝 ${operation.type.toUpperCase()}: ${file.path}`);
      console.log(`   Content length: ${file.content.length} chars`);
      
      // In browser environment, we can't write files directly
      // This would need a backend service or file system API
      // For now, we'll trigger a download or show in UI
      
      this.showGeneratedFile(file);
      
    } catch (error) {
      console.error(`Failed to write file ${file.path}:`, error);
      throw error;
    }
  }

  /**
   * Show generated file content in the UI (since we can't write files in browser)
   */
  private showGeneratedFile(file: GeneratedFile): void {
    // Create a blob URL for the file content
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Log the file info
    console.group(`📄 Generated File: ${file.path}`);
    console.log('Content:', file.content.substring(0, 200) + '...');
    console.log('Download URL:', url);
    console.groupEnd();
    
    // In a real implementation, this could:
    // 1. Send to a backend service to write files
    // 2. Use File System Access API (if available)
    // 3. Show in a code editor panel for manual copy/paste
    // 4. Generate a zip file with all changes
  }

  /**
   * Ensure all necessary directories exist
   */
  private async ensureDirectories(files: GeneratedFile[]): Promise<void> {
    const directories = new Set<string>();
    
    for (const file of files) {
      const dir = this.getDirectoryPath(file.path);
      directories.add(dir);
    }
    
    for (const dir of directories) {
      console.log(`📁 Ensuring directory: ${dir}`);
      // In real implementation, create directory if it doesn't exist
    }
  }

  /**
   * Update routing configuration
   */
  private async updateRouteConfig(routes: any[]): Promise<void> {
    if (routes.length === 0) return;
    
    console.log(`🛣️  Updating route configuration for ${routes.length} routes`);
    
    // Generate route manifest
    const routeManifest = {
      routes: routes.map(route => ({
        path: route.path,
        component: route.component,
        guards: route.guards || []
      })),
      generated: new Date().toISOString(),
      generatedBy: 'FSM Canvas'
    };
    
    const manifestFile: GeneratedFile = {
      path: 'src/lib/generated/routes.json',
      content: JSON.stringify(routeManifest, null, 2),
      type: 'json',
      nodeId: 'route-manifest'
    };
    
    await this.writeGeneratedFile(manifestFile);
  }

  /**
   * Update store exports
   */
  private async updateStoreExports(stores: any[]): Promise<void> {
    if (stores.length === 0) return;
    
    console.log(`🏪 Updating store exports for ${stores.length} stores`);
    
    const storeExports = stores.map(store => 
      `export { ${store.name} } from './stores/${store.name}.js';`
    ).join('\n');
    
    const exportsFile: GeneratedFile = {
      path: 'src/lib/generated/stores.ts',
      content: `// Generated store exports\n// DO NOT EDIT - Generated by FSM Canvas\n\n${storeExports}\n`,
      type: 'typescript',
      nodeId: 'store-exports'
    };
    
    await this.writeGeneratedFile(exportsFile);
  }

  /**
   * Update API routes
   */
  private async updateApiRoutes(apis: any[]): Promise<void> {
    if (apis.length === 0) return;
    
    console.log(`🔌 Updating API routes for ${apis.length} endpoints`);
    
    // Generate API index file
    const apiIndex = apis.map(api => ({
      endpoint: api.endpoint,
      method: api.method,
      handler: api.handler
    }));
    
    const apiFile: GeneratedFile = {
      path: 'src/lib/generated/api.json',
      content: JSON.stringify(apiIndex, null, 2),
      type: 'json',
      nodeId: 'api-index'
    };
    
    await this.writeGeneratedFile(apiFile);
  }

  /**
   * Rollback changes if something goes wrong
   */
  private async rollbackChanges(): Promise<void> {
    console.log(`🔄 Rolling back ${this.operationHistory.length} operations`);
    
    // Reverse the operations
    for (let i = this.operationHistory.length - 1; i >= 0; i--) {
      const op = this.operationHistory[i];
      
      try {
        if (op.type === 'create') {
          // Delete the created file
          console.log(`🗑️  Rollback: Delete ${op.path}`);
        } else if (op.type === 'update' && op.backup) {
          // Restore the backup
          console.log(`🔄 Rollback: Restore ${op.path}`);
        }
      } catch (error) {
        console.error(`Failed to rollback operation on ${op.path}:`, error);
      }
    }
    
    this.operationHistory = [];
  }

  /**
   * Utility methods
   */
  private async fileExists(path: string): Promise<boolean> {
    // In real implementation, check if file exists
    return false; // Assume files don't exist for now
  }

  private async readExistingFile(path: string): Promise<string | undefined> {
    // In real implementation, read existing file content for backup
    return undefined;
  }

  private getDirectoryPath(filePath: string): string {
    return filePath.substring(0, filePath.lastIndexOf('/'));
  }

  /**
   * Get current operation history for debugging
   */
  getOperationHistory(): FileSystemOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
  }
}

// Export singleton instance
export const fileSystemIntegration = new FileSystemIntegration();