"use client";

import { useEffect, useMemo, useState } from "react";

type Player = "red" | "black";
type GameMode = "ai" | "local" | "online";
type Difficulty = "easy" | "medium" | "hard";
type ThemeName = "wood" | "minimal" | "modern" | "dark";
type MatchStatus = "idle" | "searching" | "connected";

type Piece = {
  id: number;
  row: number;
  col: number;
  player: Player;
  king: boolean;
};

type Move = {
  pieceId: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  capture?: {
    row: number;
    col: number;
    pieceId: number;
  };
};

type Snapshot = {
  pieces: Piece[];
  turn: Player;
  note: string;
  createdAt: string;
};

type Stats = {
  gamesPlayed: number;
  redWins: number;
  blackWins: number;
  capturesRed: number;
  capturesBlack: number;
  currentStreak: number;
  bestStreak: number;
  xp: number;
  level: number;
};

const BOARD_SIZE = 8;

const themeStyles: Record<
  ThemeName,
  {
    light: string;
    dark: string;
    board: string;
    accent: string;
    chip: string;
  }
> = {
  wood: {
    light: "bg-amber-100",
    dark: "bg-amber-700",
    board: "from-amber-900/70 to-amber-800/70",
    accent: "text-amber-300",
    chip: "border-amber-500/50 bg-amber-500/20 text-amber-100",
  },
  minimal: {
    light: "bg-zinc-100",
    dark: "bg-zinc-700",
    board: "from-zinc-800/80 to-zinc-900/80",
    accent: "text-cyan-300",
    chip: "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
  },
  modern: {
    light: "bg-fuchsia-100",
    dark: "bg-indigo-700",
    board: "from-indigo-900/80 to-fuchsia-900/80",
    accent: "text-fuchsia-300",
    chip: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100",
  },
  dark: {
    light: "bg-slate-500",
    dark: "bg-slate-900",
    board: "from-slate-800/90 to-black",
    accent: "text-emerald-300",
    chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  },
};

const leaderboard = [
  { rank: 1, name: "NovaKing", winRate: "82%", streak: 14 },
  { rank: 2, name: "RookRider", winRate: "78%", streak: 10 },
  { rank: 3, name: "You", winRate: "73%", streak: 6 },
  { rank: 4, name: "CheckerM8", winRate: "71%", streak: 4 },
];

function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((piece) => ({ ...piece }));
}

function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 1;

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if ((row + col) % 2 === 1) {
        pieces.push({ id: idCounter++, row, col, player: "black", king: false });
      }
    }
  }

  for (let row = 5; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if ((row + col) % 2 === 1) {
        pieces.push({ id: idCounter++, row, col, player: "red", king: false });
      }
    }
  }

  return pieces;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getPieceAt(pieces: Piece[], row: number, col: number): Piece | undefined {
  return pieces.find((piece) => piece.row === row && piece.col === col);
}

function getDirections(piece: Piece): Array<[number, number]> {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.player === "red" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function getLegalMovesForPiece(pieces: Piece[], piece: Piece, forceCapture: boolean): Move[] {
  const captures: Move[] = [];
  const normals: Move[] = [];
  const dirs = getDirections(piece);

  for (const [dr, dc] of dirs) {
    const nextRow = piece.row + dr;
    const nextCol = piece.col + dc;

    if (!inBounds(nextRow, nextCol)) continue;

    const adjacent = getPieceAt(pieces, nextRow, nextCol);

    if (!adjacent) {
      normals.push({
        pieceId: piece.id,
        fromRow: piece.row,
        fromCol: piece.col,
        toRow: nextRow,
        toCol: nextCol,
      });
      continue;
    }

    if (adjacent.player !== piece.player) {
      const jumpRow = nextRow + dr;
      const jumpCol = nextCol + dc;
      if (inBounds(jumpRow, jumpCol) && !getPieceAt(pieces, jumpRow, jumpCol)) {
        captures.push({
          pieceId: piece.id,
          fromRow: piece.row,
          fromCol: piece.col,
          toRow: jumpRow,
          toCol: jumpCol,
          capture: { row: nextRow, col: nextCol, pieceId: adjacent.id },
        });
      }
    }
  }

  return forceCapture ? captures : [...captures, ...normals];
}

function getAllLegalMovesForPlayer(pieces: Piece[], player: Player): Move[] {
  const ownPieces = pieces.filter((piece) => piece.player === player);
  const captures: Move[] = [];

  for (const piece of ownPieces) {
    captures.push(...getLegalMovesForPiece(pieces, piece, true));
  }

  if (captures.length > 0) return captures;

  const normals: Move[] = [];
  for (const piece of ownPieces) {
    normals.push(...getLegalMovesForPiece(pieces, piece, false));
  }

  return normals;
}

function formatTurn(player: Player): string {
  return player === "red" ? "Red" : "Black";
}

function chooseAiMove(moves: Move[], pieces: Piece[], difficulty: Difficulty): Move {
  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === "medium") {
    const captures = moves.filter((move) => Boolean(move.capture));
    const pool = captures.length > 0 ? captures : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    let score = 0;
    if (move.capture) score += 5;

    const movedPiece = pieces.find((piece) => piece.id === move.pieceId);
    if (movedPiece && !movedPiece.king && movedPiece.player === "black" && move.toRow === BOARD_SIZE - 1) {
      score += 4;
    }

    score += Math.random();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

const defaultStats: Stats = {
  gamesPlayed: 0,
  redWins: 0,
  blackWins: 0,
  capturesRed: 0,
  capturesBlack: 0,
  currentStreak: 0,
  bestStreak: 0,
  xp: 0,
  level: 1,
};

export default function MainExperience() {
  const [mode, setMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [theme, setTheme] = useState<ThemeName>("wood");

  const [pieces, setPieces] = useState<Piece[]>(() => createInitialPieces());
  const [turn, setTurn] = useState<Player>("red");
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [thinking, setThinking] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("idle");

  const [history, setHistory] = useState<Snapshot[]>(() => [
    {
      pieces: createInitialPieces(),
      turn: "red",
      note: "Match started",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats>(defaultStats);

  const currentTheme = themeStyles[theme];

  useEffect(() => {
    const raw = window.localStorage.getItem("checkers-fun-stats");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Stats;
      setStats({ ...defaultStats, ...parsed });
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("checkers-fun-stats", JSON.stringify(stats));
  }, [stats]);

  const displaySnapshot = useMemo(() => {
    if (replayIndex === null) {
      return { pieces, turn, note: "Live", createdAt: new Date().toISOString() };
    }
    return history[replayIndex];
  }, [history, pieces, replayIndex, turn]);

  const canControlCurrentTurn =
    replayIndex === null &&
    !winner &&
    !thinking &&
    ((mode === "local" && matchStatus !== "searching") ||
      (mode !== "local" && turn === "red" && matchStatus !== "searching"));

  function addSnapshot(nextPieces: Piece[], nextTurn: Player, note: string) {
    setHistory((prev) => [
      ...prev,
      {
        pieces: clonePieces(nextPieces),
        turn: nextTurn,
        note,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function resetGame(nextMode: GameMode = mode) {
    const initial = createInitialPieces();
    setPieces(initial);
    setTurn("red");
    setSelectedPieceId(null);
    setLegalMoves([]);
    setWinner(null);
    setThinking(false);
    setReplayIndex(null);
    setHistory([
      {
        pieces: clonePieces(initial),
        turn: "red",
        note: "Match started",
        createdAt: new Date().toISOString(),
      },
    ]);

    if (nextMode === "online") {
      setMatchStatus("searching");
      window.setTimeout(() => setMatchStatus("connected"), 1400);
    } else {
      setMatchStatus("connected");
    }
  }

  useEffect(() => {
    resetGame(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function finalizeWinner(foundWinner: Player, finalPieces: Piece[]) {
    setWinner(foundWinner);
    addSnapshot(finalPieces, foundWinner, `${formatTurn(foundWinner)} wins the match`);

    setStats((prev) => {
      const gamesPlayed = prev.gamesPlayed + 1;
      const redWins = prev.redWins + (foundWinner === "red" ? 1 : 0);
      const blackWins = prev.blackWins + (foundWinner === "black" ? 1 : 0);
      const currentStreak = foundWinner === "red" ? prev.currentStreak + 1 : 0;
      const bestStreak = Math.max(prev.bestStreak, currentStreak);
      const gainedXp = foundWinner === "red" ? 40 : 20;
      const xp = prev.xp + gainedXp;
      const level = Math.floor(xp / 120) + 1;

      return {
        ...prev,
        gamesPlayed,
        redWins,
        blackWins,
        currentStreak,
        bestStreak,
        xp,
        level,
      };
    });
  }

  function executeMove(move: Move, actingPlayer: Player) {
    if (winner) return;

    const movingPiece = pieces.find((piece) => piece.id === move.pieceId);
    if (!movingPiece) return;

    let nextPieces = pieces
      .filter((piece) => !move.capture || piece.id !== move.capture.pieceId)
      .map((piece) => {
        if (piece.id !== move.pieceId) return piece;

        const becameKing =
          piece.king || (piece.player === "red" && move.toRow === 0) || (piece.player === "black" && move.toRow === BOARD_SIZE - 1);

        return {
          ...piece,
          row: move.toRow,
          col: move.toCol,
          king: becameKing,
        };
      });

    if (move.capture) {
      setStats((prev) => ({
        ...prev,
        capturesRed: prev.capturesRed + (actingPlayer === "red" ? 1 : 0),
        capturesBlack: prev.capturesBlack + (actingPlayer === "black" ? 1 : 0),
      }));
    }

    const moved = nextPieces.find((piece) => piece.id === move.pieceId);
    const continuingCaptures = moved ? getLegalMovesForPiece(nextPieces, moved, true) : [];

    const note = `${formatTurn(actingPlayer)}: ${move.fromRow + 1},${move.fromCol + 1} → ${move.toRow + 1},${move.toCol + 1}${
      move.capture ? " (capture)" : ""
    }`;

    if (move.capture && continuingCaptures.length > 0) {
      setPieces(nextPieces);
      setSelectedPieceId(move.pieceId);
      setLegalMoves(continuingCaptures);
      addSnapshot(nextPieces, actingPlayer, `${note} | combo continues`);
      return;
    }

    const nextTurn: Player = actingPlayer === "red" ? "black" : "red";
    const nextMoves = getAllLegalMovesForPlayer(nextPieces, nextTurn);

    setPieces(nextPieces);
    setTurn(nextTurn);
    setSelectedPieceId(null);
    setLegalMoves([]);
    addSnapshot(nextPieces, nextTurn, note);

    const redCount = nextPieces.filter((piece) => piece.player === "red").length;
    const blackCount = nextPieces.filter((piece) => piece.player === "black").length;

    if (redCount === 0) {
      finalizeWinner("black", nextPieces);
      return;
    }
    if (blackCount === 0) {
      finalizeWinner("red", nextPieces);
      return;
    }
    if (nextMoves.length === 0) {
      finalizeWinner(actingPlayer, nextPieces);
    }
  }

  useEffect(() => {
    if (replayIndex !== null || winner || thinking) return;
    if (mode === "local") return;
    if (turn !== "black") return;
    if (matchStatus === "searching") return;

    const legal = getAllLegalMovesForPlayer(pieces, "black");
    if (legal.length === 0) {
      finalizeWinner("red", pieces);
      return;
    }

    setThinking(true);
    const delay = mode === "online" ? 1000 : 550;

    const timer = window.setTimeout(() => {
      const picked = chooseAiMove(legal, pieces, difficulty);
      executeMove(picked, "black");
      setThinking(false);
    }, delay);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode, difficulty, matchStatus, replayIndex, winner, pieces, thinking]);

  function handleSquareClick(row: number, col: number) {
    if (!canControlCurrentTurn) return;

    const targetMove = legalMoves.find((move) => move.toRow === row && move.toCol === col);
    if (selectedPieceId !== null && targetMove) {
      executeMove(targetMove, turn);
      return;
    }

    const piece = getPieceAt(pieces, row, col);
    if (!piece || piece.player !== turn) {
      setSelectedPieceId(null);
      setLegalMoves([]);
      return;
    }

    const allMoves = getAllLegalMovesForPlayer(pieces, turn);
    const forceCapture = allMoves.some((move) => Boolean(move.capture));
    const pieceMoves = getLegalMovesForPiece(pieces, piece, forceCapture);

    if (pieceMoves.length === 0) {
      setSelectedPieceId(null);
      setLegalMoves([]);
      return;
    }

    setSelectedPieceId(piece.id);
    setLegalMoves(pieceMoves);
  }

  const redCount = displaySnapshot.pieces.filter((piece) => piece.player === "red").length;
  const blackCount = displaySnapshot.pieces.filter((piece) => piece.player === "black").length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${currentTheme.accent}`}>Daily Match Arena</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Checkers Pulse</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Fast matches, satisfying captures, and progression you can feel. Switch between AI, local hot-seat,
              and online-style duels with replay and leaderboard momentum.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className={`rounded-xl border px-3 py-2 ${currentTheme.chip}`}>
              <p className="text-xs opacity-80">Level</p>
              <p className="text-lg font-bold">{stats.level}</p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${currentTheme.chip}`}>
              <p className="text-xs opacity-80">XP</p>
              <p className="text-lg font-bold">{stats.xp}</p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${currentTheme.chip}`}>
              <p className="text-xs opacity-80">Best Streak</p>
              <p className="text-lg font-bold">{stats.bestStreak}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              <p className="text-sm text-slate-200">
                {winner
                  ? `${formatTurn(winner)} won this match`
                  : matchStatus === "searching"
                    ? "Finding an online opponent..."
                    : thinking
                      ? "Opponent is thinking..."
                      : `${formatTurn(displaySnapshot.turn)} to move`}
              </p>
            </div>
            {replayIndex !== null && (
              <button
                onClick={() => setReplayIndex(null)}
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Resume Live
              </button>
            )}
          </div>

          <div className={`rounded-2xl border border-white/10 bg-gradient-to-br p-3 ${currentTheme.board}`}>
            <div className="mx-auto grid aspect-square w-full max-w-[640px] grid-cols-8 overflow-hidden rounded-xl border border-black/40 shadow-2xl">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
                const row = Math.floor(index / BOARD_SIZE);
                const col = index % BOARD_SIZE;
                const isDark = (row + col) % 2 === 1;
                const piece = getPieceAt(displaySnapshot.pieces, row, col);
                const selected = piece?.id === selectedPieceId && replayIndex === null;
                const isMoveTarget = legalMoves.some((move) => move.toRow === row && move.toCol === col) && replayIndex === null;

                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => handleSquareClick(row, col)}
                    className={`relative flex items-center justify-center transition ${
                      isDark ? currentTheme.dark : currentTheme.light
                    } ${isMoveTarget ? "ring-2 ring-emerald-400 ring-inset" : ""}`}
                    aria-label={`Square ${row + 1}, ${col + 1}`}
                    disabled={!isDark || !canControlCurrentTurn}
                  >
                    {piece && (
                      <span
                        className={`relative flex h-[72%] w-[72%] items-center justify-center rounded-full border-2 text-sm font-extrabold shadow-md transition-transform ${
                          piece.player === "red"
                            ? "border-rose-900 bg-gradient-to-b from-rose-400 to-rose-700 text-white"
                            : "border-slate-800 bg-gradient-to-b from-slate-200 to-slate-500 text-slate-900"
                        } ${selected ? "scale-110 ring-2 ring-cyan-300" : ""}`}
                      >
                        {piece.king ? "♔" : ""}
                      </span>
                    )}
                    {isMoveTarget && !piece && <span className="h-3 w-3 rounded-full bg-emerald-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-xs text-rose-100/80">Red pieces</p>
              <p className="text-xl font-bold text-rose-100">{redCount}</p>
            </div>
            <div className="rounded-xl border border-slate-300/30 bg-slate-500/10 p-3">
              <p className="text-xs text-slate-200/80">Black pieces</p>
              <p className="text-xl font-bold text-slate-100">{blackCount}</p>
            </div>
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
              <p className="text-xs text-cyan-100/80">Moves</p>
              <p className="text-xl font-bold text-cyan-100">{Math.max(history.length - 1, 0)}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-100/80">Streak</p>
              <p className="text-xl font-bold text-emerald-100">{stats.currentStreak}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Game History & Replay</h2>
              <p className="text-xs text-slate-400">{history.length} snapshots</p>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(history.length - 1, 0)}
              value={replayIndex ?? history.length - 1}
              onChange={(event) => setReplayIndex(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="mt-2 max-h-36 space-y-1 overflow-auto pr-1 text-xs text-slate-300">
              {history.map((step, index) => (
                <button
                  key={`${step.createdAt}-${index}`}
                  onClick={() => setReplayIndex(index)}
                  className={`block w-full rounded-md px-2 py-1 text-left transition hover:bg-white/10 ${
                    replayIndex === index ? "bg-white/15 text-white" : ""
                  }`}
                >
                  #{index}: {step.note}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <h2 className="mb-3 text-lg font-semibold">Match Setup</h2>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-slate-300">Mode</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as GameMode)}
                  className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400/40 focus:ring"
                >
                  <option value="ai">Single-player vs AI</option>
                  <option value="local">Two-player local (hot-seat)</option>
                  <option value="online">Online multiplayer (simulated)</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-slate-300">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  disabled={mode === "local"}
                  className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400/40 focus:ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-slate-300">Theme</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ThemeName)}
                  className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400/40 focus:ring"
                >
                  <option value="wood">Classic wooden board</option>
                  <option value="minimal">Minimalist flat</option>
                  <option value="modern">Modern bold colors</option>
                  <option value="dark">Dark mode</option>
                </select>
              </label>

              <button
                onClick={() => resetGame(mode)}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Start Fresh Match
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <h2 className="mb-3 text-lg font-semibold">Progress & Stats</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Games</p>
                <p className="text-lg font-bold">{stats.gamesPlayed}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Red Wins</p>
                <p className="text-lg font-bold">{stats.redWins}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Black Wins</p>
                <p className="text-lg font-bold">{stats.blackWins}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Captures</p>
                <p className="text-lg font-bold">{stats.capturesRed + stats.capturesBlack}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-300">
                <span>Level {stats.level}</span>
                <span>{stats.xp % 120}/120 XP</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-cyan-400" style={{ width: `${((stats.xp % 120) / 120) * 100}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <h2 className="mb-3 text-lg font-semibold">Leaderboard Pulse</h2>
            <div className="space-y-2 text-sm">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div>
                    <p className="font-semibold">#{entry.rank} {entry.name}</p>
                    <p className="text-xs text-slate-400">Win rate {entry.winRate}</p>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">🔥 {entry.streak}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
