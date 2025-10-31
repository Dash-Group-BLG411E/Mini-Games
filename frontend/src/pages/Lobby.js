import { useState } from "react";
import { Link } from "react-router-dom";

export default function Lobby() {
  const [rooms] = useState([
    { id: 1, name: "Room 1 – Tic Tac Toe", players: 2, game: "TicTacToe" },
    { id: 2, name: "Room 2 – Rock Paper Scissors", players: 1, game: "RPS" },
  ]);

  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <h2>🎮 Game Lobby</h2>
      <p>Select a game to join:</p>

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
        {rooms.map((room) => (
          <div className="card" key={room.id}>
            <h3>{room.name}</h3>
            <p>Players: {room.players}</p>
            {room.game === "TicTacToe" ? (
              <Link to="/tic-tac-toe">
                <button>Join</button>
              </Link>
            ) : (
              <button disabled>Coming soon</button>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => alert("Room creation coming soon!")}>
        + Create New Room
      </button>
    </div>
  );
}
