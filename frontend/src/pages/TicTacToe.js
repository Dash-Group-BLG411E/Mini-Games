import { useState } from "react";

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  function handleClick(i) {
    if (board[i] || calculateWinner(board)) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  const winner = calculateWinner(board);

  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <h2>Tic Tac Toe</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "8px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
                width: 100,
                height: 100,
                fontSize: 40,
                fontWeight: "bold",
                color: cell === "X" ? "#e63946" : "#1d3557", // red for X, blue for O
                background: "#ffffff",
                borderRadius: "10px",
                border: "2px solid #ccc",
                cursor: "pointer",
                transition: "background 0.2s, transform 0.1s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#f1f1f1")}
            onMouseLeave={(e) => (e.target.style.background = "#ffffff")}
            >
            {cell}
            </button>

        ))}
      </div>

      <h3 style={{ marginTop: "20px" }}>
        {winner
          ? `🏆 Winner: ${winner}`
          : `Next player: ${xIsNext ? "X" : "O"}`}
      </h3>
    </div>
  );
}

function calculateWinner(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b_, c] of lines) {
    if (b[a] && b[a] === b[b_] && b[a] === b[c]) return b[a];
  }
  return null;
}
