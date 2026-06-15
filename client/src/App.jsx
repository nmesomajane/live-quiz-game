import { Routes, Route, Navigate } from "react-router-dom";
import Home  from "./pages/Home.jsx";
import Lobby from "./pages/Lobby.jsx";
import Game  from "./pages/game.jsx";
import { useSocket } from "./hooks/useSocket.js";


export default function App() {
  useSocket();

  return (
    <Routes>
      <Route path="/"      element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game"  element={<Game />} />
      <Route path="*"      element={<Navigate to="/" replace />} />
    </Routes>
  );
}