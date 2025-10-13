<script lang="ts">
  import { appDevelopmentEngine, applicationState, developmentMetrics, canGenerate } from '../codegen/appDevelopmentEngine.js';
  
  // Subscribe to application development state
  $: appState = $applicationState;
  $: metrics = $developmentMetrics;
  $: canGen = $canGenerate;
  
  let showPreview = false;
  let previewGeneration: any = null;

  // Generate application from current FSM
  async function generateApplication() {
    const success = await appDevelopmentEngine.generateApplication();
    if (success) {
      console.log('🎉 Application generated successfully!');
    }
  }

  // Preview what would be generated
  function previewCode() {
    previewGeneration = appDevelopmentEngine.previewGeneration();
    showPreview = true;
  }

  // Auto-generate (for testing)
  async function autoGenerate() {
    await appDevelopmentEngine.autoGenerate();
  }

  // Clear errors
  function clearErrors() {
    appDevelopmentEngine.clearErrors();
  }

  // Export configuration
  function exportConfig() {
    const config = appDevelopmentEngine.exportApplicationConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>
  <!-- Development Status -->
  <div class="status-section">
        <h4>📊 Development Status</h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">Nodes:</span>
            <span class="value">{metrics.totalNodes}</span>
          </div>
          <div class="status-item">
            <span class="label">Edges:</span>
            <span class="value">{metrics.totalEdges}</span>
          </div>
          <div class="status-item">
            <span class="label">Generated Files:</span>
            <span class="value">{metrics.generatedFiles}</span>
          </div>
          <div class="status-item">
            <span class="label">Routes:</span>
            <span class="value">{metrics.generatedRoutes}</span>
          </div>
          <div class="status-item">
            <span class="label">Stores:</span>
            <span class="value">{metrics.generatedStores}</span>
          </div>
          <div class="status-item">
            <span class="label">APIs:</span>
            <span class="value">{metrics.generatedApis}</span>
          </div>
        </div>

        <!-- Status Indicators -->
        <div class="status-indicators">
          <div class="indicator" class:active={appState.isDirty}>
            <span class="dot" class:dirty={appState.isDirty}></span>
            {appState.isDirty ? 'Changes pending' : 'Up to date'}
          </div>
          <div class="indicator" class:active={appState.isGenerating}>
            <span class="dot" class:generating={appState.isGenerating}></span>
            {appState.isGenerating ? 'Generating...' : 'Ready'}
          </div>
        </div>
      </div>

      <!-- Generation Controls -->
      <div class="controls-section">
        <h4>⚡ Generation Controls</h4>
        <div class="control-buttons">
          <button 
            on:click={generateApplication} 
            disabled={!canGen || appState.isGenerating}
            class="btn btn-primary"
          >
            {#if appState.isGenerating}
              🔄 Generating...
            {:else}
              🚀 Generate Application
            {/if}
          </button>

          <button 
            on:click={previewCode}
            disabled={appState.isGenerating}
            class="btn btn-secondary"
          >
            👁️ Preview Code
          </button>

          <button 
            on:click={autoGenerate}
            disabled={appState.isGenerating}
            class="btn btn-tertiary"
          >
            🔄 Auto Generate
          </button>

          <button 
            on:click={exportConfig}
            class="btn btn-quaternary"
          >
            📤 Export Config
          </button>
        </div>
      </div>

      <!-- Errors Section -->
      {#if appState.errors.length > 0}
        <div class="errors-section">
          <div class="error-header">
            <h4>❌ Generation Errors</h4>
            <button on:click={clearErrors} class="btn btn-small">Clear</button>
          </div>
          <div class="error-list">
            {#each appState.errors as error}
              <div class="error-item">
                <span class="error-icon">⚠️</span>
                <span class="error-text">{error}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Generation History -->
      {#if appState.generationHistory.length > 0}
        <div class="history-section">
          <h4>📜 Generation History</h4>
          <div class="history-list">
            {#each appState.generationHistory.slice(-5) as generation, index}
              <div class="history-item">
                <span class="history-number">#{appState.generationHistory.length - index}</span>
                <span class="history-info">
                  {generation.files.length} files, 
                  {generation.routes.length} routes
                </span>
                <span class="history-time">
                  {metrics.lastGeneratedAt?.toLocaleTimeString() || 'Unknown'}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Architecture Info -->
      <div class="architecture-section">
        <h4>🏗️ Application Architecture</h4>
        <div class="architecture-info">
          <p><strong>Framework:</strong> SvelteKit + TypeScript</p>
          <p><strong>Pattern:</strong> FSM-Driven Development</p>
          <p><strong>Source:</strong> Canvas Visual Model</p>
          <p><strong>Generation:</strong> Automatic Code Scaffolding</p>
        </div>
      </div>

<!-- Code Preview Modal -->
{#if showPreview && previewGeneration}
  <div class="preview-modal" on:click={() => showPreview = false}>
    <div class="preview-content" on:click={(e) => e.stopPropagation()}>
      <div class="preview-header">
        <h3>📄 Generated Code Preview</h3>
        <button on:click={() => showPreview = false} class="close-btn">✕</button>
      </div>
      
      <div class="preview-body">
        <div class="preview-summary">
          <p><strong>Files to generate:</strong> {previewGeneration.files.length}</p>
          <p><strong>Routes:</strong> {previewGeneration.routes.length}</p>
          <p><strong>Stores:</strong> {previewGeneration.stores.length}</p>
          <p><strong>APIs:</strong> {previewGeneration.apis.length}</p>
        </div>

        <div class="file-list">
          {#each previewGeneration.files as file}
            <details class="file-preview">
              <summary class="file-header">
                <span class="file-path">{file.path}</span>
                <span class="file-type">{file.type}</span>
              </summary>
              <pre class="file-content"><code>{file.content}</code></pre>
            </details>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .development-panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }

  .development-panel.collapsed {
    opacity: 0.8;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    user-select: none;
  }

  .panel-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  .toggle-icon {
    transition: transform 0.2s ease;
  }

  .toggle-icon.collapsed {
    transform: rotate(-90deg);
  }

  .panel-content {
    padding: 1rem;
  }

  .status-section,
  .controls-section,
  .errors-section,
  .history-section,
  .architecture-section {
    margin-bottom: 1.5rem;
  }

  .status-section h4,
  .controls-section h4,
  .errors-section h4,
  .history-section h4,
  .architecture-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #4b5563;
    font-weight: 600;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
  }

  .status-item .label {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .status-item .value {
    font-weight: 600;
    color: #1f2937;
  }

  .status-indicators {
    display: flex;
    gap: 1rem;
  }

  .indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
  }

  .dot.dirty {
    background: #f59e0b;
    animation: pulse 2s infinite;
  }

  .dot.generating {
    background: #3b82f6;
    animation: spin 1s linear infinite;
  }

  .control-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-tertiary {
    background: #f59e0b;
    color: white;
  }

  .btn-tertiary:hover:not(:disabled) {
    background: #d97706;
  }

  .btn-quaternary {
    background: #10b981;
    color: white;
  }

  .btn-quaternary:hover:not(:disabled) {
    background: #059669;
  }

  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.625rem;
  }

  .error-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .error-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .error-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    margin-bottom: 0.25rem;
  }

  .error-text {
    flex: 1;
    font-size: 0.75rem;
    color: #dc2626;
  }

  .history-list {
    max-height: 150px;
    overflow-y: auto;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.75rem;
  }

  .history-item:last-child {
    border-bottom: none;
  }

  .history-number {
    font-weight: 600;
    color: #3b82f6;
  }

  .history-info {
    color: #4b5563;
  }

  .history-time {
    color: #9ca3af;
  }

  .architecture-info {
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .architecture-info p {
    margin: 0.25rem 0;
    color: #4b5563;
  }

  /* Preview Modal Styles */
  .preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .preview-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    height: 90%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-header h3 {
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
  }

  .close-btn:hover {
    color: #374151;
  }

  .preview-body {
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }

  .preview-summary {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .preview-summary p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
  }

  .file-preview {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f8fafc;
    cursor: pointer;
  }

  .file-path {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.75rem;
    color: #1f2937;
  }

  .file-type {
    font-size: 0.625rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
  }

  .file-content {
    margin: 0;
    padding: 1rem;
    background: #1f2937;
    color: #f9fafb;
    font-size: 0.75rem;
    line-height: 1.4;
    overflow-x: auto;
  }

  /* Animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>