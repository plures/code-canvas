// Window Manager Store
// Manages moveable, dockable panels for better UX

import { writable, derived } from 'svelte/store';

export type DockZone = 'left' | 'right' | 'bottom' | 'top' | 'floating' | 'minimized';

export interface PanelState {
  id: string;
  title: string;
  isVisible: boolean;
  isMinimized: boolean;
  dockZone: DockZone;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isResizable: boolean;
  isDragging: boolean;
}

export interface WindowManagerState {
  panels: Record<string, PanelState>;
  activePanel: string | null;
  maxZIndex: number;
  dockingEnabled: boolean;
  snapThreshold: number;
}

const defaultPanelState: Omit<PanelState, 'id' | 'title'> = {
  isVisible: true,
  isMinimized: false,
  dockZone: 'floating',
  position: { x: 20, y: 20 },
  size: { width: 320, height: 400 },
  zIndex: 1,
  isResizable: true,
  isDragging: false
};

const initialState: WindowManagerState = {
  panels: {
    // Start with empty panels - they'll be initialized by App.svelte as needed
  },
  activePanel: null,
  maxZIndex: 10,
  dockingEnabled: true,
  snapThreshold: 50
};

function createWindowManagerStore() {
  const { subscribe, set, update } = writable<WindowManagerState>(initialState);

  return {
    subscribe,

    // Panel initialization
    initializePanel: (panelId: string, title: string, defaultDockZone: DockZone = 'floating') => update(state => {
      if (state.panels[panelId]) return state; // Already exists
      
      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: {
            id: panelId,
            title: title,
            isVisible: false,  // Initialize as hidden
            isMinimized: false,
            dockZone: defaultDockZone,
            position: { x: 20 + Object.keys(state.panels).length * 30, y: 20 + Object.keys(state.panels).length * 30 },
            size: { width: 300, height: 400 },
            zIndex: Object.keys(state.panels).length + 1,
            isResizable: true,
            isDragging: false
          }
        }
      };
    }),

    // Panel visibility controls
    showPanel: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId] || {
            id: panelId,
            isVisible: true,
            isMinimized: false,
            dockZone: 'floating' as DockZone,
            position: { x: 20, y: 20 },
            size: { width: 300, height: 400 },
            zIndex: 1
          },
          isVisible: true,
          isMinimized: false
        }
      }
    })),

    hidePanel: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isVisible: false
        }
      }
    })),

    togglePanel: (panelId: string) => update(state => {
      const panel = state.panels[panelId];
      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            isVisible: !panel.isVisible,
            isMinimized: panel.isVisible ? false : panel.isMinimized
          }
        }
      };
    }),

    // Minimize/maximize controls
    minimizePanel: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isMinimized: true
        }
      }
    })),

    maximizePanel: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isMinimized: false
        }
      }
    })),

    toggleMinimized: (panelId: string) => update(state => {
      const panel = state.panels[panelId];
      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            isMinimized: !panel.isMinimized
          }
        }
      };
    }),

    // Position and docking
    movePanel: (panelId: string, position: { x: number; y: number }) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          position,
          dockZone: 'floating' // Moving makes it floating
        }
      }
    })),

    dockPanel: (panelId: string, dockZone: DockZone) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          dockZone,
          position: dockZone === 'floating' ? state.panels[panelId].position : { x: 0, y: 0 }
        }
      }
    })),

    resizePanel: (panelId: string, size: { width: number; height: number }) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          size
        }
      }
    })),

    // Focus management
    focusPanel: (panelId: string) => update(state => ({
      ...state,
      activePanel: panelId,
      maxZIndex: state.maxZIndex + 1,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          zIndex: state.maxZIndex + 1
        }
      }
    })),

    // Drag state
    startDragging: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isDragging: true
        }
      }
    })),

    stopDragging: (panelId: string) => update(state => ({
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isDragging: false
        }
      }
    })),

    // Layout presets
    resetLayout: () => set(initialState),

    setLayoutPreset: (preset: 'minimal' | 'development' | 'design') => update(state => {
      const presets = {
        minimal: {
          'model-info': { isVisible: false },
          'app-toolbar': { isVisible: false },
          'properties': { dockZone: 'right' as DockZone, isVisible: true, isMinimized: true },
          'development': { dockZone: 'bottom' as DockZone, isVisible: true, isMinimized: true }
        },
        development: {
          'model-info': { isVisible: false },
          'app-toolbar': { dockZone: 'left' as DockZone, isVisible: true, isMinimized: false },
          'properties': { dockZone: 'right' as DockZone, isVisible: true, isMinimized: false },
          'development': { dockZone: 'bottom' as DockZone, isVisible: true, isMinimized: false }
        },
        design: {
          'model-info': { isVisible: true, dockZone: 'floating' as DockZone },
          'app-toolbar': { dockZone: 'left' as DockZone, isVisible: true, isMinimized: false },
          'properties': { dockZone: 'right' as DockZone, isVisible: true, isMinimized: false },
          'development': { isVisible: false }
        }
      };

      const presetConfig = presets[preset];
      const updatedPanels = { ...state.panels };

      Object.entries(presetConfig).forEach(([panelId, config]) => {
        updatedPanels[panelId] = {
          ...updatedPanels[panelId],
          ...config
        };
      });

      return {
        ...state,
        panels: updatedPanels
      };
    }),

    // Workspace management
    saveWorkspace: () => {
      const state = get(windowManagerStore);
      localStorage.setItem('canvas-workspace', JSON.stringify(state));
    },

    loadWorkspace: () => {
      try {
        const saved = localStorage.getItem('canvas-workspace');
        if (saved) {
          const workspace = JSON.parse(saved);
          set({ ...initialState, ...workspace });
          return true;
        }
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
      return false;
    }
  };
}

// Helper function to get current state
function get(store: any): WindowManagerState {
  let value: WindowManagerState;
  store.subscribe((val: WindowManagerState) => value = val)();
  return value!;
}

export const windowManagerStore = createWindowManagerStore();

// Derived stores for convenience
export const visiblePanels = derived(
  windowManagerStore,
  ($wm) => Object.values($wm.panels).filter(panel => panel.isVisible)
);

export const dockedPanels = derived(
  windowManagerStore,
  ($wm) => Object.values($wm.panels).filter(panel => 
    panel.isVisible && panel.dockZone !== 'floating' && panel.dockZone !== 'minimized'
  )
);

export const floatingPanels = derived(
  windowManagerStore,
  ($wm) => Object.values($wm.panels).filter(panel => 
    panel.isVisible && panel.dockZone === 'floating'
  )
);

export const minimizedPanels = derived(
  windowManagerStore,
  ($wm) => Object.values($wm.panels).filter(panel => panel.isMinimized)
);