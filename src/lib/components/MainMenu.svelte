<script lang="ts">
  import { onMount } from 'svelte';
  import { viewportStore, zoomLevel } from '../stores/viewportStore.js';
  import { selectionStore, hasSelection } from '../stores/selectionStore.js';
  import { canvasStore } from '../stores/canvasStore.js';
  import { windowManagerStore } from '../stores/windowManagerStore.js';
  import { fsmStore } from '../stores/fsmStore.js';
  import { PROJECT_TEMPLATES } from '../templates/projectTemplates.js';
  import type { ProjectTemplate } from '../templates/projectTemplates.js';
  import { themePreference, currentTheme, initializeTheme } from '../stores/themeStore.js';

  let menuOpen = false;
  let activeSubmenu: string | null = null;
  let showCreateProject = false;
  let selectedTemplate: ProjectTemplate | null = null;
  let projectName = '';

  // Canvas store data
  $: nodes = $canvasStore.nodes;
  $: edges = $canvasStore.edges;
  $: zoomPercentage = Math.round($zoomLevel * 100);

  // Toggle main menu
  function toggleMenu() {
    menuOpen = !menuOpen;
    if (!menuOpen) {
      activeSubmenu = null;
    }
  }

  // Handle submenu navigation
  function toggleSubmenu(submenu: string) {
    activeSubmenu = activeSubmenu === submenu ? null : submenu;
  }

  // Close menu when clicking outside
  function closeMenu() {
    menuOpen = false;
    activeSubmenu = null;
  }

  // Canvas Actions
  function addNode(type: string, label: string) {
    const x = Math.random() * 400 + 100;
    const y = Math.random() * 300 + 100;
    canvasStore.addNode({
      id: `${type}-${Date.now()}`,
      type,
      label,
      x,
      y,
      w: 140,
      h: 90
    });
    closeMenu();
  }

  // Zoom Actions
  function zoomIn() {
    viewportStore.zoomIn();
    closeMenu();
  }

  function zoomOut() {
    viewportStore.zoomOut();
    closeMenu();
  }

  function resetZoom() {
    viewportStore.resetZoom();
    viewportStore.centerPan();
    closeMenu();
  }

  function fitToContent() {
    if (nodes.length > 0) {
      viewportStore.fitToContent(nodes);
    }
    closeMenu();
  }

  // Selection Actions
  function selectAll() {
    selectionStore.selectAll(nodes, edges);
    closeMenu();
  }

  function deleteSelected() {
    if (!$hasSelection) return;
    
    const confirmDelete = confirm(`Delete ${$selectionStore.nodes.size + $selectionStore.edges.size} selected item(s)?`);
    if (confirmDelete) {
      Array.from($selectionStore.nodes).forEach(nodeId => canvasStore.removeNode(nodeId));
      Array.from($selectionStore.edges).forEach(edgeId => canvasStore.removeEdge(edgeId));
      selectionStore.clearSelection();
    }
    closeMenu();
  }

  // File Actions
  function saveCanvas() {
    canvasStore.saveCanvas();
    closeMenu();
  }

  function loadCanvas() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            canvasStore.loadCanvas(data);
          } catch (error) {
            alert('Error loading file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    closeMenu();
  }

  function newCanvas() {
    if (confirm('Create new canvas? This will clear current work.')) {
      canvasStore.clear();
    }
    closeMenu();
  }

  // Project Template Actions
  function openCreateProject() {
    showCreateProject = true;
    closeMenu();
  }

  function selectTemplate(template: ProjectTemplate) {
    selectedTemplate = template;
  }

  function createProject() {
    if (!selectedTemplate || !projectName.trim()) return;

    // Clear canvas and apply template
    canvasStore.clear();
    
    // Add template nodes and edges
    selectedTemplate.initialNodes.forEach(node => {
      canvasStore.addNode(node);
    });
    
    selectedTemplate.initialEdges.forEach(edge => {
      canvasStore.addEdge(edge);
    });

    // Save project with metadata
    canvasStore.saveCanvas(projectName, {
      template: selectedTemplate.id,
      fileStructure: selectedTemplate.fileStructure,
      dependencies: selectedTemplate.dependencies,
      scripts: selectedTemplate.scripts,
      devDependencies: selectedTemplate.devDependencies
    });

    // Reset form
    showCreateProject = false;
    selectedTemplate = null;
    projectName = '';
  }

  // Panel Actions
  function showPanel(panelId: string) {
    windowManagerStore.showPanel(panelId);
    closeMenu();
  }

  // Development Actions
  function generateCode() {
    // TODO: Implement code generation
    alert('Code generation coming soon!');
    closeMenu();
  }

  function runProject() {
    // TODO: Implement project running
    alert('Project execution coming soon!');
    closeMenu();
  }

  // Theme actions
  function setTheme(theme: 'light' | 'dark' | 'system') {
    themePreference.set(theme);
    closeMenu();
  }

  // Close menu on outside click
  onMount(() => {
    initializeTheme();
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.main-menu')) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<div class="main-menu">
  <!-- Main Menu Button -->
  <button class="menu-button" on:click={toggleMenu} class:active={menuOpen}>
    ☰ Menu
  </button>

  <!-- Dropdown Menu -->
  {#if menuOpen}
    <div class="menu-dropdown">
      
      <!-- File Section -->
      <div class="menu-section">
        <div class="section-header" on:click={() => toggleSubmenu('file')}>
          📁 File {activeSubmenu === 'file' ? '▾' : '▸'}
        </div>
        {#if activeSubmenu === 'file'}
          <div class="submenu">
            <button on:click={newCanvas}>🆕 New Canvas</button>
            <button on:click={saveCanvas}>💾 Save Canvas</button>
            <button on:click={loadCanvas}>📂 Load Canvas</button>
            <hr>
            <button on:click={openCreateProject}>🎯 New Project</button>
          </div>
        {/if}
      </div>

      <!-- Canvas Tools Section -->
      <div class="menu-section">
        <div class="section-header" on:click={() => toggleSubmenu('canvas')}>
          🎨 Canvas {activeSubmenu === 'canvas' ? '▾' : '▸'}
        </div>
        {#if activeSubmenu === 'canvas'}
          <div class="submenu">
            <!-- Add Nodes -->
            <div class="submenu-group">
              <div class="submenu-label">Add Nodes:</div>
              <button on:click={() => addNode('route', 'New Route')}>🌐 Route</button>
              <button on:click={() => addNode('component', 'New Component')}>🧩 Component</button>
              <button on:click={() => addNode('service', 'New Service')}>⚙️ Service</button>
              <button on:click={() => addNode('database', 'New Database')}>🗄️ Database</button>
            </div>
            
            <hr>
            
            <!-- Zoom Controls -->
            <div class="submenu-group">
              <div class="submenu-label">Zoom ({zoomPercentage}%):</div>
              <button on:click={zoomIn}>🔍+ Zoom In</button>
              <button on:click={zoomOut}>🔍− Zoom Out</button>
              <button on:click={resetZoom}>🎯 Reset Zoom</button>
              <button on:click={fitToContent}>📐 Fit to Content</button>
            </div>
            
            <hr>
            
            <!-- Selection -->
            <div class="submenu-group">
              <div class="submenu-label">Selection:</div>
              <button on:click={selectAll}>☑️ Select All</button>
              <button on:click={deleteSelected} disabled={!$hasSelection}>
                🗑️ Delete Selected
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- View Section -->
      <div class="menu-section">
        <div class="section-header" on:click={() => toggleSubmenu('view')}>
          👁️ View {activeSubmenu === 'view' ? '▾' : '▸'}
        </div>
        {#if activeSubmenu === 'view'}
          <div class="submenu">
            <!-- Theme Controls -->
            <div class="submenu-group">
              <div class="submenu-label">Theme ({$currentTheme}):</div>
              <button on:click={() => setTheme('light')} class:selected={$themePreference === 'light'}>
                ☀️ Light Theme
              </button>
              <button on:click={() => setTheme('dark')} class:selected={$themePreference === 'dark'}>
                🌙 Dark Theme  
              </button>
              <button on:click={() => setTheme('system')} class:selected={$themePreference === 'system'}>
                🖥️ System Theme
              </button>
            </div>
            
            <hr>
            
            <!-- Panels -->
            <div class="submenu-group">
              <div class="submenu-label">Panels:</div>
              <button on:click={() => showPanel('propertiesPanel')}>⚙️ Properties Panel</button>
              <button on:click={() => showPanel('modelDrivenInfo')}>🏗️ Model Info</button>
              <button on:click={() => showPanel('fsmExecutionPanel')}>🔄 FSM Execution</button>
              <button on:click={() => showPanel('fsmValidationPanel')}>✅ FSM Validation</button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Development Section -->
      <div class="menu-section">
        <div class="section-header" on:click={() => toggleSubmenu('dev')}>
          🚀 Development {activeSubmenu === 'dev' ? '▾' : '▸'}
        </div>
        {#if activeSubmenu === 'dev'}
          <div class="submenu">
            <button on:click={generateCode}>🔧 Generate Code</button>
            <button on:click={runProject}>▶️ Run Project</button>
            <hr>
            <button on:click={() => console.log('Canvas state:', $canvasStore)}>
              🐛 Debug Canvas
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Project Creation Modal -->
{#if showCreateProject}
  <div class="modal-overlay" on:click={() => showCreateProject = false}>
    <div class="modal" on:click|stopPropagation>
      <h3>Create New Project</h3>
      
      <div class="project-form">
        <label>
          Project Name:
          <input type="text" bind:value={projectName} placeholder="My Project" />
        </label>
        
        <div class="template-grid">
          {#each PROJECT_TEMPLATES as template}
            <div 
              class="template-card"
              class:selected={selectedTemplate?.id === template.id}
              on:click={() => selectTemplate(template)}
            >
              <div class="template-icon">{template.icon}</div>
              <div class="template-name">{template.name}</div>
              <div class="template-desc">{template.description}</div>
            </div>
          {/each}
        </div>
        
        <div class="modal-actions">
          <button on:click={() => showCreateProject = false}>Cancel</button>
          <button 
            on:click={createProject}
            disabled={!selectedTemplate || !projectName.trim()}
            class="primary"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .main-menu {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
  }

  .menu-button {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px var(--shadow);
    transition: all 0.2s ease;
  }

  .menu-button:hover,
  .menu-button.active {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--shadow);
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    min-width: 280px;
    background: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 8px 32px var(--shadow);
    border: 1px solid var(--border-color);
    overflow: hidden;
    animation: menuSlideDown 0.2s ease;
  }

  @keyframes menuSlideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-section {
    border-bottom: 1px solid var(--border-color);
  }

  .menu-section:last-child {
    border-bottom: none;
  }

  .section-header {
    padding: 12px 16px;
    font-weight: 500;
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
  }

  .section-header:hover {
    background: var(--bg-tertiary);
  }

  .submenu {
    padding: 8px 0;
    background: var(--bg-primary);
  }

  .submenu button {
    display: block;
    width: 100%;
    padding: 8px 20px;
    border: none;
    background: none;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s ease;
  }

  .submenu button:hover:not(:disabled) {
    background: var(--bg-tertiary);
  }

  .submenu button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submenu button.selected {
    background: var(--accent-color);
    color: white;
  }

  .submenu button.selected:hover {
    background: var(--accent-hover);
  }

  .submenu hr {
    margin: 8px 16px;
    border: none;
    border-top: 1px solid var(--border-color);
  }

  .submenu-group {
    padding: 4px 0;
  }

  .submenu-label {
    padding: 4px 20px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 20px 60px var(--shadow);
    border: 1px solid var(--border-color);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal h3 {
    margin: 0 0 20px 0;
    font-size: 20px;
    color: #1e293b;
  }

  .project-form label {
    display: block;
    margin-bottom: 16px;
    font-weight: 500;
    color: #374151;
  }

  .project-form input {
    display: block;
    width: 100%;
    padding: 8px 12px;
    margin-top: 4px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 20px 0;
  }

  .template-card {
    padding: 16px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    background: var(--bg-secondary);
  }

  .template-card:hover {
    border-color: var(--accent-color);
    background: var(--bg-tertiary);
  }

  .template-card.selected {
    border-color: var(--accent-color);
    background: var(--accent-color);
    color: white;
  }

  .template-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .template-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: #1f2937;
  }

  .template-desc {
    font-size: 12px;
    color: #6b7280;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .modal-actions button {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
  }

  .modal-actions button:hover:not(:disabled) {
    background: var(--bg-tertiary);
  }

  .modal-actions button.primary {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
  }

  .modal-actions button.primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .modal-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>