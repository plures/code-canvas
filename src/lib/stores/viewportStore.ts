import { writable, derived } from 'svelte/store';

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
}

function createViewportStore() {
  const { subscribe, set, update } = writable<ViewportState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    viewportWidth: 800,
    viewportHeight: 600
  });

  return {
    subscribe,

    // Zoom operations
    zoomIn: (centerX?: number, centerY?: number) => {
      update(state => {
        const oldZoom = state.zoom;
        const newZoom = Math.min(state.zoom * 1.2, 3); // Max zoom 3x
        
        if (centerX !== undefined && centerY !== undefined) {
          // Zoom towards specific point
          const zoomRatio = newZoom / oldZoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        
        state.zoom = newZoom;
        return state;
      });
    },

    zoomOut: (centerX?: number, centerY?: number) => {
      update(state => {
        const oldZoom = state.zoom;
        const newZoom = Math.max(state.zoom / 1.2, 0.1); // Min zoom 0.1x
        
        if (centerX !== undefined && centerY !== undefined) {
          // Zoom towards specific point
          const zoomRatio = newZoom / oldZoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        
        state.zoom = newZoom;
        return state;
      });
    },

    setZoom: (zoom: number, centerX?: number, centerY?: number) => {
      update(state => {
        const oldZoom = state.zoom;
        const newZoom = Math.max(0.1, Math.min(zoom, 3));
        
        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / oldZoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        
        state.zoom = newZoom;
        return state;
      });
    },

    resetZoom: () => {
      update(state => {
        state.zoom = 1;
        return state;
      });
    },

    // Pan operations
    pan: (deltaX: number, deltaY: number) => {
      update(state => {
        state.panX += deltaX;
        state.panY += deltaY;
        return state;
      });
    },

    setPan: (panX: number, panY: number) => {
      update(state => {
        state.panX = panX;
        state.panY = panY;
        return state;
      });
    },

    centerPan: () => {
      update(state => {
        state.panX = 0;
        state.panY = 0;
        return state;
      });
    },

    // Viewport size
    setViewportSize: (width: number, height: number) => {
      update(state => {
        state.viewportWidth = width;
        state.viewportHeight = height;
        return state;
      });
    },

    // Fit to content
    fitToContent: (nodes: Array<{ x: number; y: number; w?: number; h?: number; width?: number; height?: number }>) => {
      if (nodes.length === 0) return;

      update(state => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
          const width = node.w || node.width || 120;
          const height = node.h || node.height || 80;
          const nodeMinX = node.x - width / 2;
          const nodeMaxX = node.x + width / 2;
          const nodeMinY = node.y - height / 2;
          const nodeMaxY = node.y + height / 2;

          minX = Math.min(minX, nodeMinX);
          maxX = Math.max(maxX, nodeMaxX);
          minY = Math.min(minY, nodeMinY);
          maxY = Math.max(maxY, nodeMaxY);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const padding = 50;

        const scaleX = (state.viewportWidth - padding * 2) / contentWidth;
        const scaleY = (state.viewportHeight - padding * 2) / contentHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x

        state.zoom = scale;
        state.panX = state.viewportWidth / 2 - (minX + contentWidth / 2) * scale;
        state.panY = state.viewportHeight / 2 - (minY + contentHeight / 2) * scale;

        return state;
      });
    },

    // Transform coordinates
    screenToWorld: (screenX: number, screenY: number, viewport: ViewportState) => {
      return {
        x: (screenX - viewport.panX) / viewport.zoom,
        y: (screenY - viewport.panY) / viewport.zoom
      };
    },

    worldToScreen: (worldX: number, worldY: number, viewport: ViewportState) => {
      return {
        x: worldX * viewport.zoom + viewport.panX,
        y: worldY * viewport.zoom + viewport.panY
      };
    }
  };
}

export const viewportStore = createViewportStore();

// Derived stores for convenience
export const zoomLevel = derived(viewportStore, $viewport => $viewport.zoom);
export const panOffset = derived(viewportStore, $viewport => ({ x: $viewport.panX, y: $viewport.panY }));
export const viewportTransform = derived(viewportStore, $viewport => 
  `translate(${$viewport.panX}, ${$viewport.panY}) scale(${$viewport.zoom})`
);

// Utility functions
export function getViewportBounds(viewport: ViewportState) {
  const topLeft = viewportStore.screenToWorld(0, 0, viewport);
  const bottomRight = viewportStore.screenToWorld(viewport.viewportWidth, viewport.viewportHeight, viewport);
  
  return {
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  };
}

export function isNodeVisible(
  node: { x: number; y: number; w?: number; h?: number; width?: number; height?: number },
  viewport: ViewportState
): boolean {
  const bounds = getViewportBounds(viewport);
  const nodeWidth = node.w || node.width || 120;
  const nodeHeight = node.h || node.height || 80;
  
  const nodeLeft = node.x - nodeWidth / 2;
  const nodeRight = node.x + nodeWidth / 2;
  const nodeTop = node.y - nodeHeight / 2;
  const nodeBottom = node.y + nodeHeight / 2;
  
  return !(nodeRight < bounds.left || nodeLeft > bounds.right || 
           nodeBottom < bounds.top || nodeTop > bounds.bottom);
}