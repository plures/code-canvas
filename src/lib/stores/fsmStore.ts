import { writable, derived } from 'svelte/store';
import { createMachine, interpret } from 'robot3';
import type { FsmConfig, FsmState, FsmTransition, RobotMachine } from '../types/fsm.js';

// FSM execution event
interface FsmEvent {
  id: string;
  type: string;
  timestamp: number;
  fromState: string;
  toState?: string;
  status: 'pending' | 'executed' | 'failed';
}

// FSM store state
interface FsmStoreState {
  currentMachine?: any; // Robot3 machine
  interpreter?: any; // Robot3 interpreter service
  fsmConfig?: FsmConfig;
  isRunning: boolean;
  currentState?: string;
  history: string[];
  eventQueue: FsmEvent[];
  availableEvents: string[];
}

const initialState: FsmStoreState = {
  currentMachine: undefined,
  interpreter: undefined,
  fsmConfig: undefined,
  isRunning: false,
  currentState: undefined,
  history: [],
  eventQueue: [],
  availableEvents: []
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
        // Simple state machine implementation for now
        // We'll create our own execution engine that's compatible with our FSM format
        const machine = {
          states: fsmConfig.states,
          transitions: fsmConfig.transitions,
          initial: fsmConfig.initial,
          current: fsmConfig.initial
        };
        
        // Simple interpreter that we can control
        const interpreter = {
          machine,
          send: (eventType: string) => {
            const currentState = machine.current;
            const transition = fsmConfig.transitions.find(
              t => t.from === currentState && (t.event || 'advance') === eventType
            );
            
            if (transition) {
              machine.current = transition.to;
              return { success: true, newState: transition.to };
            }
            return { success: false, newState: currentState };
          }
        };

        // Get available events for current state
        const getAvailableEvents = () => {
          const currentStateId = machine.current;
          return fsmConfig.transitions
            .filter(t => t.from === currentStateId)
            .map(t => t.event || 'advance');
        };

        update(state => ({
          ...state,
          currentMachine: machine,
          interpreter,
          fsmConfig,
          currentState: fsmConfig.initial,
          isRunning: false,
          history: [fsmConfig.initial],
          eventQueue: [],
          availableEvents: getAvailableEvents()
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
      if (!state.interpreter || !state.isRunning) return state;

      try {
        // Use our simple interpreter to send an event
        const eventType = event || 'advance';
        const result = state.interpreter.send(eventType);
        
        if (result.success) {
          // Update available events for new state
          const newAvailableEvents = state.fsmConfig?.transitions
            .filter(t => t.from === result.newState)
            .map(t => t.event || 'advance') || [];

          return {
            ...state,
            currentState: result.newState,
            availableEvents: newAvailableEvents,
            history: [...state.history, result.newState]
          };
        }

        return state;
      } catch (error) {
        console.error('FSM step error:', error);
        return state;
      }
    }),

    sendEvent: (eventType: string) => update(state => {
      if (!state.interpreter) return state;

      const availableEvents = state.availableEvents;
      if (!availableEvents.includes(eventType)) {
        console.warn(`Event ${eventType} not available in current state`);
        return state;
      }

      // Send event to our simple interpreter
      const result = state.interpreter.send(eventType);
      
      const fsmEvent: FsmEvent = {
        id: `evt_${Date.now()}`,
        type: eventType,
        timestamp: Date.now(),
        fromState: state.currentState || '',
        toState: result.success ? result.newState : undefined,
        status: result.success ? 'executed' : 'failed'
      };
      
      if (result.success) {
        // Update available events for new state
        const newAvailableEvents = state.fsmConfig?.transitions
          .filter(t => t.from === result.newState)
          .map(t => t.event || 'advance') || [];

        return {
          ...state,
          currentState: result.newState,
          availableEvents: newAvailableEvents,
          history: [...state.history, result.newState],
          eventQueue: [...state.eventQueue, fsmEvent]
        };
      }

      return {
        ...state,
        eventQueue: [...state.eventQueue, fsmEvent]
      };
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
export const fsmAvailableEvents = derived(fsmStore, $fsm => $fsm.availableEvents);
export const fsmEventQueue = derived(fsmStore, $fsm => $fsm.eventQueue);