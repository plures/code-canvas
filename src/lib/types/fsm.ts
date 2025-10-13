// FSM types using Robot3

export interface FsmState {
  id: string;
  label: string;
  allowedPaths?: string[];
  requiredChores?: Array<{
    whenAnyMatches: string[];
    mustAlsoChange: string[];
  }>;
}

export interface FsmTransition {
  from: string;
  to: string;
  guard: string;
  event?: string;
}

export interface FsmConfig {
  initial: string;
  states: FsmState[];
  transitions: FsmTransition[];
  context?: Record<string, unknown>;
}

// Robot3 machine types
export interface RobotState {
  name: string;
  [key: string]: unknown;
}

export interface RobotTransition {
  event: string;
  target: string;
  guard?: (context: unknown, event: unknown) => boolean;
  action?: (context: unknown, event: unknown) => unknown;
}

export interface RobotMachine {
  current: string;
  states: Map<string, RobotState>;
  context: unknown;
}

// FSM visualization
export interface StatePosition {
  id: string;
  x: number;
  y: number;
  radius?: number;
}

export interface TransitionPath {
  from: string;
  to: string;
  path: string;
  label?: string;
  guard?: string;
}