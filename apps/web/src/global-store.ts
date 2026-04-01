import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

export type AttackEvent = {
  vector: string;
  sessionID: string;
  timestamp: string;
};

export type GlobalState = {
  sessionID: string | null;
  isConnected: boolean;
  healthOk: boolean | null;
  events: AttackEvent[];
  lastEvent: AttackEvent | null;
  error: string | null;
};

export type GlobalActions = {
  setSessionID: (sessionID: string) => void;
  setConnected: (value: boolean) => void;
  setHealthOk: (value: boolean) => void;
  addEvent: (event: AttackEvent) => void;
  setError: (message: string | null) => void;
  clearEvents: () => void;
  reset: () => void;
};

export type GlobalStore = GlobalState & GlobalActions;

const initialState: GlobalState = {
  sessionID: null,
  isConnected: false,
  healthOk: null,
  events: [],
  lastEvent: null,
  error: null,
};

export const globalStore = createStore<GlobalStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSessionID: (sessionID) => set({ sessionID }),
      setConnected: (value) => set({ isConnected: value }),
      setHealthOk: (value) => set({ healthOk: value }),
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
          lastEvent: event,
        })),
      setError: (message) => set({ error: message }),
      clearEvents: () =>
        set({
          events: [],
          lastEvent: null,
        }),
      reset: () => set(initialState),
    }),
    {
      name: "can-i-hack-you-global-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
