/**
 * useSocket — Custom Hook: Socket Event Wiring
 *
 * This hook is the bridge between Socket.io events and Zustand state.
 * It lives in one place so event listeners are never accidentally duplicated.
 *
 * PATTERN EXPLAINED:
 * We register socket.on("event", handler) inside useEffect.
 * The cleanup function (return () => socket.off(...)) removes them when
 * the component unmounts — critical to avoid duplicate listeners if the
 * component re-mounts (which React StrictMode does in dev).
 *
 * This hook is called ONCE at the top level of the Game and Lobby pages.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";

export function useSocket() {
  const navigate   = useNavigate();
  const {
    setSession,
    setTimeLeft,
    setConnected,
    setWinnerInfo,
    addMessage,
    clearMessages,
    
  } = useGameStore();

  useEffect(() => {
    //  Connection lifecycle 

    const onConnect = () => {
      setConnected(true);
      addMessage({ type: "system", text: "Connected to server." });
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      addMessage({ type: "system", text: `Disconnected: ${reason}` });
    };

    //  Lobby events 

    const onPlayerJoined = ({ session, message }) => {
      setSession(session);
      addMessage({ type: "system", text: message });
    };

    const onPlayerLeft = ({ session, message }) => {
      setSession(session);
      addMessage({ type: "system", text: message });
    };

    const onMasterChanged = ({ session, message }) => {
      setSession(session);
      addMessage({ type: "system", text: message });
    };

    //  Game events 

    const onQuestionSet = ({ question, message }) => {
     
      useGameStore.setState((state) => ({
        session: state.session ? { ...state.session, question } : state.session,
      }));
      addMessage({ type: "info", text: message });
    };

    const onGameStarted = ({ session, message }) => {
      setSession(session);
      setTimeLeft(60);
      clearMessages();
      addMessage({ type: "system", text: message });
      navigate("/game");
    };

    const onTimerTick = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };

    const onGuessSubmitted = ({ playerName, guess, correct, attemptsLeft, message }) => {
      addMessage({
        type:        "guess",
        text:        message,
        playerName,
        guess,
        correct,
        attemptsLeft,
      });
    };

    const onGameWon = ({ winnerId, winnerName, answer, session, message }) => {
      setSession(session);
      setWinnerInfo({ winnerId, winnerName, answer });
      addMessage({ type: "win", text: message });
    };

    const onGameExpired = ({ answer, session, message }) => {
      setSession(session);
      setWinnerInfo({ winnerId: null, winnerName: null, answer });
      addMessage({ type: "expired", text: message });
    };

    const onRoundReset = ({ session, message }) => {
      setSession(session);
      setTimeLeft(60);
      setWinnerInfo(null);
      addMessage({ type: "system", text: message });
      // Stay on /game — the game page handles both "waiting" and "active" status
    };

    const onWaitingForPlayers = ({ message }) => {
      addMessage({ type: "system", text: message });
    };

    //  Register all listeners 

    socket.on("connect",             onConnect);
    socket.on("disconnect",          onDisconnect);
    socket.on("player-joined",       onPlayerJoined);
    socket.on("player-left",         onPlayerLeft);
    socket.on("master-changed",      onMasterChanged);
    socket.on("question-set",        onQuestionSet);
    socket.on("game-started",        onGameStarted);
    socket.on("timer-tick",          onTimerTick);
    socket.on("guess-submitted",     onGuessSubmitted);
    socket.on("game-won",            onGameWon);
    socket.on("game-expired",        onGameExpired);
    socket.on("round-reset",         onRoundReset);
    socket.on("waiting-for-players", onWaitingForPlayers);

    //  remove listeners when hook unmounts 
    
    return () => {
      socket.off("connect",             onConnect);
      socket.off("disconnect",          onDisconnect);
      socket.off("player-joined",       onPlayerJoined);
      socket.off("player-left",         onPlayerLeft);
      socket.off("master-changed",      onMasterChanged);
      socket.off("question-set",        onQuestionSet);
      socket.off("game-started",        onGameStarted);
      socket.off("timer-tick",          onTimerTick);
      socket.off("guess-submitted",     onGuessSubmitted);
      socket.off("game-won",            onGameWon);
      socket.off("game-expired",        onGameExpired);
      socket.off("round-reset",         onRoundReset);
      socket.off("waiting-for-players", onWaitingForPlayers);
    };
  }, []); 
}