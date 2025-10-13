<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { windowManagerStore } from '../stores/windowManagerStore.js';
  import type { DockZone, PanelState } from '../stores/windowManagerStore.js';

  export let panelId: string;
  export let title: string;
  export let defaultDockZone: DockZone = 'floating';
  export let allowResize: boolean = true;
  export let allowDock: boolean = true;
  export let allowMinimize: boolean = true;

  const dispatch = createEventDispatcher();

  let panelElement: HTMLElement;
  let headerElement: HTMLElement;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let isResizing = false;
  let resizeHandle = '';

  // Subscribe to panel state
  $: panelState = $windowManagerStore.panels[panelId];
  $: isVisible = panelState?.isVisible ?? true;
  $: isMinimized = panelState?.isMinimized ?? false;
  $: dockZone = panelState?.dockZone ?? defaultDockZone;
  $: position = panelState?.position ?? { x: 20, y: 20 };
  $: size = panelState?.size ?? { width: 300, height: 400 };
  $: zIndex = panelState?.zIndex ?? 1;
  


  // Panel state tracking (debug logging removed for performance)

  // Initialize panel in store if it doesn't exist
  onMount(() => {
    if (!panelState) {
      // Panel doesn't exist in store, add it
      windowManagerStore.initializePanel(panelId, title, defaultDockZone);
    }
  });

  // Panel positioning styles - make reactive to position changes
  $: panelStyle = getPanelStyle(position, dockZone, size, zIndex, isVisible, isMinimized);

  function getPanelStyle(pos?: any, dock?: any, sz?: any, z?: any, visible?: any, minimized?: any): string {
    // Use parameters or fallback to component variables
    const currentPos = pos || position;
    const currentDock = dock || dockZone;
    const currentSize = sz || size;
    const currentZ = z || zIndex;
    const currentVisible = visible !== undefined ? visible : isVisible;
    const currentMinimized = minimized !== undefined ? minimized : isMinimized;
    
    if (!currentVisible) return 'display: none;';
    
    if (currentDock === 'floating') {
      return `
        position: fixed;
        left: ${currentPos.x}px;
        top: ${currentPos.y}px;
        width: ${currentSize.width}px;
        height: ${currentMinimized ? 'auto' : currentSize.height + 'px'};
        z-index: ${currentZ};
      `;
    } else if (dockZone === 'left') {
      return `
        position: fixed;
        left: 0;
        top: 0;
        width: ${size.width}px;
        height: 100vh;
        z-index: ${zIndex};
      `;
    } else if (dockZone === 'right') {
      return `
        position: fixed;
        right: 0;
        top: 0;
        width: ${size.width}px;
        height: 100vh;
        z-index: ${zIndex};
      `;
    } else if (dockZone === 'bottom') {
      return `
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: ${size.height}px;
        z-index: ${zIndex};
      `;
    } else if (dockZone === 'top') {
      return `
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        height: ${size.height}px;
        z-index: ${zIndex};
      `;
    }
    
    return '';
  }

  // Drag handling
  function handleMouseDown(event: MouseEvent) {
    if (!headerElement) {
      return;
    }
    
    if (!headerElement.contains(event.target as Node)) {
      return;
    }
    
    if ((event.target as HTMLElement).classList.contains('panel-control')) {
      return;
    }
    
    // Allow dragging for all dock zones, not just floating
    isDragging = true;
    dragOffset.x = event.clientX - position.x;
    dragOffset.y = event.clientY - position.y;

    windowManagerStore.startDragging(panelId);
    windowManagerStore.focusPanel(panelId);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;

    // If panel is currently docked, undock it when dragging
    if (dockZone !== 'floating') {
      windowManagerStore.dockPanel(panelId, 'floating');
    }

    // Constrain to viewport
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - 100; // Leave room for header

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    windowManagerStore.movePanel(panelId, { 
      x: constrainedX, 
      y: constrainedY 
    });

    // Check for docking zones if enabled
    if (allowDock && $windowManagerStore.dockingEnabled) {
      checkDockingZones(event.clientX, event.clientY);
    }
  }

  function handleMouseUp() {
    isDragging = false;
    windowManagerStore.stopDragging(panelId);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function checkDockingZones(x: number, y: number) {
    const threshold = $windowManagerStore.snapThreshold;
    
    if (x < threshold) {
      // Left dock zone
      showDockPreview('left');
    } else if (x > window.innerWidth - threshold) {
      // Right dock zone
      showDockPreview('right');
    } else if (y < threshold) {
      // Top dock zone
      showDockPreview('top');
    } else if (y > window.innerHeight - threshold) {
      // Bottom dock zone
      showDockPreview('bottom');
    } else {
      hideDockPreview();
    }
  }

  function showDockPreview(zone: DockZone) {
    // Visual feedback for docking (implement if needed)
    console.log('Dock preview:', zone);
  }

  function hideDockPreview() {
    // Hide visual feedback
  }

  // Panel controls
  function handleMinimize() {
    windowManagerStore.toggleMinimized(panelId);
  }

  function handleClose() {
    windowManagerStore.hidePanel(panelId);
    dispatch('close');
  }

  function handleDock(zone: DockZone) {
    windowManagerStore.dockPanel(panelId, zone);
  }

  function handleFocus() {
    windowManagerStore.focusPanel(panelId);
  }

  // Resize handling
  function handleResizeStart(event: MouseEvent, handle: string) {
    if (!allowResize) return;
    
    isResizing = true;
    resizeHandle = handle;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    event.preventDefault();
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return;

    const rect = panelElement.getBoundingClientRect();
    let newWidth = size.width;
    let newHeight = size.height;

    if (resizeHandle.includes('right')) {
      newWidth = event.clientX - rect.left;
    }
    if (resizeHandle.includes('bottom')) {
      newHeight = event.clientY - rect.top;
    }

    // Minimum size constraints
    newWidth = Math.max(200, newWidth);
    newHeight = Math.max(150, newHeight);

    windowManagerStore.resizePanel(panelId, { 
      width: newWidth, 
      height: newHeight 
    });
  }

  function handleResizeEnd() {
    isResizing = false;
    resizeHandle = '';
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }
</script>

{#if isVisible}
  <div
    bind:this={panelElement}
    class="draggable-panel"
    class:docked-left={dockZone === 'left'}
    class:docked-right={dockZone === 'right'}
    class:docked-bottom={dockZone === 'bottom'}
    class:docked-top={dockZone === 'top'}
    class:floating={dockZone === 'floating'}
    class:minimized={isMinimized}
    class:dragging={isDragging}
    style={panelStyle}
    on:mousedown={handleFocus}
  >
    <!-- Panel Header -->
    <div
      bind:this={headerElement}
      class="panel-header"
      on:mousedown={handleMouseDown}
      title="Drag to move panel"
      style="cursor: move;"
    >
      <div class="panel-title">
        <span class="title-text">{title}</span>
        <small style="opacity: 0.7; font-size: 0.7em;">({position.x}, {position.y})</small>
      </div>
      
      <div class="panel-controls">
        {#if allowDock && dockZone === 'floating'}
          <button 
            class="panel-control dock-control" 
            on:click={() => handleDock('left')}
            title="Dock Left"
          >
            ⬅️
          </button>
          <button 
            class="panel-control dock-control" 
            on:click={() => handleDock('right')}
            title="Dock Right"
          >
            ➡️
          </button>
          <button 
            class="panel-control dock-control" 
            on:click={() => handleDock('bottom')}
            title="Dock Bottom"
          >
            ⬇️
          </button>
        {:else if dockZone !== 'floating'}
          <button 
            class="panel-control float-control" 
            on:click={() => handleDock('floating')}
            title="Float Panel"
          >
            🔓
          </button>
        {/if}
        
        {#if allowMinimize}
          <button 
            class="panel-control minimize-control" 
            on:click={handleMinimize}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '🔼' : '🔽'}
          </button>
        {/if}
        
        <button 
          class="panel-control close-control" 
          on:click={handleClose}
          title="Close Panel"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Panel Content -->
    {#if !isMinimized}
      <div class="panel-content">
        <slot />
      </div>

      <!-- Resize Handles -->
      {#if allowResize && dockZone === 'floating'}
        <div
          class="resize-handle resize-right"
          on:mousedown={(e) => handleResizeStart(e, 'right')}
        ></div>
        <div
          class="resize-handle resize-bottom"
          on:mousedown={(e) => handleResizeStart(e, 'bottom')}
        ></div>
        <div
          class="resize-handle resize-corner"
          on:mousedown={(e) => handleResizeStart(e, 'right-bottom')}
        ></div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .draggable-panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .draggable-panel:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .dragging {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    transform: rotate(1deg);
    transition: none;
  }

  .floating {
    border-radius: 8px;
  }

  .docked-left,
  .docked-right {
    border-radius: 0;
    height: 100vh !important;
  }

  .docked-bottom {
    border-radius: 0;
    border-bottom: none;
  }

  .docked-top {
    border-radius: 0;
    border-top: none;
  }

  .minimized {
    height: auto !important;
  }

  .panel-header {
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-bottom: 1px solid #e5e7eb;
    padding: 0.75rem 1rem;
    cursor: move;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 44px;
    position: relative;
    z-index: 100;
  }
  
  .panel-header:hover {
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .title-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }

  .panel-controls {
    display: flex;
    gap: 0.25rem;
  }

  .panel-control {
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    transition: all 0.2s ease;
    color: #6b7280;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .panel-control:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  .close-control:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    position: relative;
  }

  /* Resize Handles */
  .resize-handle {
    position: absolute;
    background: rgba(59, 130, 246, 0.1);
    transition: all 0.2s ease;
    z-index: 10;
  }

  .resize-right {
    right: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
  }

  .resize-bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    cursor: ns-resize;
  }

  .resize-corner {
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nw-resize;
    background: rgba(59, 130, 246, 0.2);
  }

  .resize-handle:hover {
    background: rgba(59, 130, 246, 0.4);
  }

  /* Dock zone indicators */
  .dock-control {
    font-size: 0.625rem !important;
  }

  .float-control {
    color: #3b82f6 !important;
  }

  .minimize-control {
    font-size: 0.625rem !important;
  }

  /* Animation for docked panels */
  .docked-left,
  .docked-right,
  .docked-bottom,
  .docked-top {
    transition: all 0.3s ease;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .panel-controls {
      gap: 0.125rem;
    }

    .panel-control {
      min-width: 24px;
      height: 24px;
      font-size: 0.625rem;
    }

    .title-text {
      font-size: 0.75rem;
    }
  }
</style>