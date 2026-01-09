import { OrionState, OrionSettings } from './types';

export const DEFAULT_SETTINGS: OrionSettings = {
  personality: 'professional',
  visualIntensity: 'balanced',
  voiceEnabled: false,
};

// Colors for the Orb based on state
export const ORB_COLORS = {
  [OrionState.Idle]: '#38bdf8', // Sky Blue
  [OrionState.Listening]: '#34d399', // Emerald
  [OrionState.Thinking]: '#c084fc', // Purple
  [OrionState.Responding]: '#818cf8', // Indigo
  [OrionState.Error]: '#f87171', // Red
};

export const INITIAL_GREETING = "Orion systems online. Physiological and environmental sensors calibrated. How may I assist you today?";
