<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { canvasStore } from '../stores/canvasStore.js';
  import { 
    saveCanvas, 
    loadCanvas, 
    getProjectList, 
    deleteCanvas, 
    exportCanvas,
    importCanvas,
    type ProjectMetadata 
  } from '../utils/persistence.js';

  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let projectName = 'My FSM Canvas';
  let projects: ProjectMetadata[] = [];
  let showImportModal = false;
  let importText = '';
  
  // Get current canvas state
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];
  
  const unsubscribe = canvasStore.subscribe(state => {
    currentNodes = state.nodes;
    currentEdges = state.edges;
  });

  function openModal() {
    isOpen = true;
    loadProjects();
  }

  function closeModal() {
    isOpen = false;
    showImportModal = false;
  }

  function loadProjects() {
    projects = getProjectList().sort((a, b) => b.timestamp - a.timestamp);
  }

  function handleSave() {
    if (projectName.trim()) {
      const canvasId = saveCanvas(currentNodes, currentEdges, projectName.trim());
      loadProjects(); // Refresh the list
      dispatch('saved', { canvasId, name: projectName });
    }
  }

  function handleLoad(project: ProjectMetadata) {
    const canvasData = loadCanvas(project.id);
    if (canvasData) {
      canvasStore.loadCanvas(canvasData);
      dispatch('loaded', { project });
      closeModal();
    }
  }

  function handleDelete(project: ProjectMetadata) {
    if (confirm(`Delete "${project.name}"?`)) {
      deleteCanvas(project.id);
      loadProjects();
    }
  }

  function handleExport() {
    const exportData = exportCanvas(currentNodes, currentEdges, projectName);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    if (importText.trim()) {
      const importedData = importCanvas(importText.trim());
      if (importedData) {
        canvasStore.loadCanvas(importedData);
        projectName = importedData.name;
        dispatch('imported', importedData);
        closeModal();
      } else {
        alert('Invalid JSON format');
      }
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Cleanup subscription
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<button 
  class="save-button" 
  on:click={openModal}
  title="Save/Load Projects"
>
  💾 Projects
</button>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>📁 Project Manager</h3>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      
      <div class="modal-content">
        {#if !showImportModal}
          <!-- Save Section -->
          <div class="section">
            <h4>💾 Save Current Canvas</h4>
            <div class="save-form">
              <input
                bind:value={projectName}
                placeholder="Project name..."
                class="project-input"
              />
              <button on:click={handleSave} class="btn primary">Save</button>
              <button on:click={handleExport} class="btn secondary">Export JSON</button>
              <button on:click={() => showImportModal = true} class="btn secondary">Import JSON</button>
            </div>
          </div>

          <!-- Load Section -->
          <div class="section">
            <h4>📂 Saved Projects ({projects.length})</h4>
            <div class="project-list">
              {#each projects as project (project.id)}
                <div class="project-item">
                  <div class="project-info">
                    <div class="project-name">{project.name}</div>
                    <div class="project-meta">
                      {project.nodeCount} nodes, {project.edgeCount} edges
                      <br>
                      <small>{formatDate(project.timestamp)}</small>
                    </div>
                  </div>
                  <div class="project-actions">
                    <button on:click={() => handleLoad(project)} class="btn small primary">
                      Load
                    </button>
                    <button on:click={() => handleDelete(project)} class="btn small danger">
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
              {#if projects.length === 0}
                <div class="empty-state">No saved projects yet</div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Import Modal -->
          <div class="section">
            <h4>📥 Import Canvas JSON</h4>
            <textarea
              bind:value={importText}
              placeholder="Paste JSON data here..."
              class="import-textarea"
            ></textarea>
            <div class="import-actions">
              <button on:click={handleImport} class="btn primary">Import</button>
              <button on:click={() => showImportModal = false} class="btn secondary">Cancel</button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .save-button {
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .save-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
  }

  .modal-header h3 {
    margin: 0;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: #f0f0f0;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h4 {
    margin: 0 0 1rem 0;
    color: #555;
    font-size: 1.1rem;
  }

  .save-form {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .project-input {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn.primary {
    background: #2196f3;
    color: white;
  }

  .btn.secondary {
    background: #f0f0f0;
    color: #333;
  }

  .btn.danger {
    background: #f44336;
    color: white;
  }

  .btn.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .project-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .project-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    background: #fafafa;
  }

  .project-info {
    flex: 1;
  }

  .project-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .project-meta {
    font-size: 0.85rem;
    color: #666;
  }

  .project-actions {
    display: flex;
    gap: 0.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  .import-textarea {
    width: 100%;
    min-height: 200px;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.85rem;
    resize: vertical;
    margin-bottom: 1rem;
  }

  .import-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>