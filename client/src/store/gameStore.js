

import { create } from "zustand";

const useGameStore = create((set, get) => ({
  //  Identity 
  playerName:  "",
  playerId:    null,

  // Session 
  session: null,

  //  Chat / Game Feed 
  messages: [],

  //  Timer 
  timeLeft: 60,

  //  UI State 
  isConnected: false,
  error:       null,
  winnerInfo:  null,   

  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId:   (id)   => set({ playerId: id }),
  setConnected:  (val)  => set({ isConnected: val }),
  setError:      (msg)  => set({ error: msg }),
  clearError:    ()     => set({ error: null }),

  
  setSession: (session) => set({ session }),

 
  setTimeLeft: (timeLeft) => set({ timeLeft }),

  
  setWinnerInfo: (info) => set({ winnerInfo: info }),
  clearWinnerInfo: ()   => set({ winnerInfo: null }),

  /**
   * ADD MESSAGE
  
   *
   * @param {object} msg - { type, text, playerName?, correct? }
   */
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages.slice(-199), // keep last 199 + new one = 200 max
        {
          ...msg,
          id:        crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  /**
   * CLEAR MESSAGES
  
   */
  clearMessages: () => set({ messages: [] }),

  /**
   * RESET SESSION
te.
   */
  resetSession: () =>
    set({
      session:     null,
      messages:    [],
      timeLeft:    60,
      error:       null,
      winnerInfo:  null,
    }),

  // Derived helpers (not state, just computed values) 

  /**
    * IS MASTER 
   */
  isMaster: () => {
    const { session, playerId } = get();
    return session?.masterId === playerId;
  },

  /**
   * MY PLAYER .
   */
  myPlayer: () => {
    const { session, playerId } = get();
    return session?.players?.find((p) => p.id === playerId) ?? null;
  },
}));

export default useGameStore;