import { writable, derived } from 'svelte/store';
import { createMachine } from 'robot3';
import type { FsmConfig, FsmState, FsmTransition, RobotMachine } from '../types/fsm.js';

// FSM store state
interface FsmStoreState {
  currentMachine?: RobotMachine;
  fsmConfig?: FsmConfig;
  isRunning: boolean;
  currentState?: string;
  history: string[];
}

const initialState: FsmStoreState = {
  currentMachine: undefined,
  fsmConfig: undefined,
  isRunning: false,
  currentState: undefined,
  history: []
};

function createFsmStore() {
  const { subscribe, set, update } = writable<FsmStoreState>(initialState);

  return {
    subscribe,
    set,
    update,

    // Load FSM configuration and create Robot machine
    loadFsm: (fsmConfig: FsmConfig) => {
      try {
        // Convert our FSM config to Robot3 format
        const robotStates: Record<string, any> = {};
        
        // Create states
        fsmConfig.states.forEach(state => {
          robotStates[state.id] = {
            // Add transitions for this state
            ...fsmConfig.transitions
              .filter(t => t.from === state.id)
              .reduce((acc, transition) => {
                acc[transition.event || 'advance'] = transition.to;
                return acc;
              }, {} as Record<string, string>)
          };
        });

        // Create the machine
        const machine = createMachine(robotStates, (current: any) => {
          return current;
        });

        update(state => ({
          ...state,
          currentMachine: machine as unknown as RobotMachine,
          fsmConfig,
          currentState: fsmConfig.initial,
          isRunning: false,
          history: [fsmConfig.initial]
        }));
      } catch (error) {
        console.error('Failed to load FSM:', error);
      }
    },

    // FSM execution
    start: () => update(state => ({
      ...state,
      isRunning: true
    })),

    stop: () => update(state => ({
      ...state,
      isRunning: false
    })),

    step: (event?: string) => update(state => {
      if (!state.currentMachine || !state.isRunning) return state;

      try {
        // Send event to machine (Robot3 syntax)
        const newMachine = state.currentMachine; // Robot3 handles transitions differently
        const newState = newMachine.current;

        return {
          ...state,
          currentState: newState,
          history: [...state.history, newState]
        };
      } catch (error) {
        console.error('FSM step error:', error);
        return state;
      }
    }),

    reset: () => update(state => ({
      ...state,
      currentState: state.fsmConfig?.initial,
      history: state.fsmConfig?.initial ? [state.fsmConfig.initial] : [],
      isRunning: false
    })),

    // FSM editing
    addState: (state: FsmState) => update(store => {
      if (!store.fsmConfig) return store;
      
      const updatedConfig = {
        ...store.fsmConfig,
        states: [...store.fsmConfig.states, state]
      };

      return {
        ...store,
        fsmConfig: updatedConfig
      };
    }),

    removeState: (stateId: string) => update(store => {
      if (!store.fsmConfig) return store;

      const updatedConfig = {
        ...store.fsmConfig,
        states: store.fsmConfig.states.filter(s => s.id !== stateId),
        transitions: store.fsmConfig.transitions.filter(t => t.from !== stateId && t.to !== stateId),
        initial: store.fsmConfig.initial === stateId ? 
          (store.fsmConfig.states.find(s => s.id !== stateId)?.id || '') : 
          store.fsmConfig.initial
      };

      return {
        ...store,
        fsmConfig: updatedConfig
      };
    }),

    addTransition: (transition: FsmTransition) => update(store => {
      if (!store.fsmConfig) return store;

      const updatedConfig = {
        ...store.fsmConfig,
        transitions: [...store.fsmConfig.transitions, transition]
      };

      return {
        ...store,
        fsmConfig: updatedConfig
      };
    }),

    removeTransition: (from: string, to: string) => update(store => {
      if (!store.fsmConfig) return store;

      const updatedConfig = {
        ...store.fsmConfig,
        transitions: store.fsmConfig.transitions.filter(t => !(t.from === from && t.to === to))
      };

      return {
        ...store,
        fsmConfig: updatedConfig
      };
    }),

    clear: () => set(initialState)
  };
}

export const fsmStore = createFsmStore();

// Derived stores
export const currentFsmState = derived(fsmStore, $fsm => $fsm.currentState);
export const fsmHistory = derived(fsmStore, $fsm => $fsm.history);
export const fsmConfig = derived(fsmStore, $fsm => $fsm.fsmConfig);
export const fsmIsRunning = derived(fsmStore, $fsm => $fsm.isRunning);