import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Lobby from "./pages/Lobby.jsx";
import Game from "./pages/Game.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/"      element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game"  element={<Game />} />
      <Route path="*"      element={<Navigate to="/" replace />} />
    </Routes>
  );
}