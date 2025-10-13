<script lang="ts">
  import { windowManagerStore } from '../stores/windowManagerStore';

  let panelMenuOpen = false;

  function togglePanelMenu() {
    panelMenuOpen = !panelMenuOpen;
  }

  function showPanel(panelId: string) {
    windowManagerStore.showPanel(panelId);
    panelMenuOpen = false;
  }
</script>

<div class="application-toolbar">
  <div class="toolbar-content">
    <h3>Canvas Editor</h3>
    
    <div class="toolbar-actions">
      <button class="btn-panels" on:click={togglePanelMenu}>
        Panels ▾
      </button>
      
      {#if panelMenuOpen}
        <div class="panel-menu">
          <button on:click={() => showPanel('canvasToolbar')}>Canvas Tools</button>
          <button on:click={() => showPanel('propertiesPanel')}>Properties</button>
          <button on:click={() => showPanel('developmentPanel')}>Development</button>
          <button on:click={() => showPanel('projectManager')}>Project Manager</button>
          <button on:click={() => showPanel('todoArchitecture')}>Todo App Designer</button>
          <button on:click={() => showPanel('modelDrivenInfo')}>Model Info</button>
          <button on:click={() => showPanel('fsmExecutionPanel')}>FSM Execution</button>
          <button on:click={() => showPanel('fsmValidationPanel')}>FSM Validation</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .application-toolbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .toolbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .toolbar-actions {
    position: relative;
  }

  .btn-panels {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
  }

  .btn-panels:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .panel-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px;
    min-width: 200px;
    z-index: 1000;
  }

  .panel-menu button {
    display: block;
    width: 100%;
    padding: 8px 12px;
    margin: 2px 0;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    color: #333;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
  }

  .panel-menu button:hover {
    background: #f0f0f0;
  }
</style>