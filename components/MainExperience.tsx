"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Player = "red" | "black";
type GameMode = "single" | "local" | "online";
type GameStatus = "playing" | "finished" | "waiting-online";
type ThemeMode = "dark" | "light";
type BoardStyle = "classic" | "modern" | "minimal";

type Piece = {
  player: Player;
  king: boolean;
};

type Cell = Piece | null;
type Board = Cell[][];

type Move = {
  from: { r: number; c: number };
  to: { r: number; c: number };
  captured?: { r: number; c: number };
  promotes: boolean;
};

type MatchHistory = {
  id: string;
  playedAt: string;
  mode: GameMode;
  difficulty: number;
  winner: Player | "draw";
  moves: number;
  durationSec: number;
};

type PlayerStats = {
  gamesPlayed: number;
  winsRed: number;
  winsBlack: number;
  draws: number;
  rankPoints: number;
  streak: number;
  bestStreak: number;
  history: MatchHistory[];
};

const BOARD_SIZE = 8;
const FILES = "abcdefgh";
const STATS_KEY = "checkers_stats_v1";

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  winsRed: 0,
  winsBlack: 0,
  draws: 0,
  rankPoints: 120,
  streak: 0,
  bestStreak: 0,
  history: [],
};

function inBounds(r: number, c: number) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function initialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "black", king: false };
    }
  }

  for (let r = 5; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "red", king: false };
    }
  }

  return board;
}

function dirsFor(piece: Piece): Array<[number, number]> {
  if (piece.king) return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  return piece.player === "red" ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
}

function shouldPromote(piece: Piece, row: number) {
  return !piece.king && ((piece.player === "red" && row === 0) || (piece.player === "black" && row === 7));
}

function movesForPiece(board: Board, r: number, c: number): { captures: Move[]; normals: Move[] } {
  const piece = board[r][c];
  if (!piece) return { captures: [], normals: [] };

  const captures: Move[] = [];
  const normals: Move[] = [];

  for (const [dr, dc] of dirsFor(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    const jr = r + dr * 2;
    const jc = c + dc * 2;

    if (inBounds(nr, nc) && !board[nr][nc]) {
      normals.push({
        from: { r, c },
        to: { r: nr, c: nc },
        promotes: shouldPromote(piece, nr),
      });
    }

    if (inBounds(jr, jc) && inBounds(nr, nc) && board[nr][nc] && board[nr][nc]?.player !== piece.player && !board[jr][jc]) {
      captures.push({
        from: { r, c },
        to: { r: jr, c: jc },
        captured: { r: nr, c: nc },
        promotes: shouldPromote(piece, jr),
      });
    }
  }

  return { captures, normals };
}

function allLegalMoves(board: Board, player: Player, forcedFrom: { r: number; c: number } | null = null): Move[] {
  const captures: Move[] = [];
  const normals: Move[] = [];

  const iterateCells = forcedFrom ? [forcedFrom] : Array.from({ length: 64 }, (_, i) => ({ r: Math.floor(i / 8), c: i % 8 }));

  for (const { r, c } of iterateCells) {
    const piece = board[r][c];
    if (!piece || piece.player !== player) continue;
    const moves = movesForPiece(board, r, c);
    captures.push(...moves.captures);
    normals.push(...moves.normals);
  }

  return captures.length > 0 ? captures : normals;
}

function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  const piece = next[move.from.r][move.from.c];
  if (!piece) return next;

  next[move.from.r][move.from.c] = null;
  if (move.captured) next[move.captured.r][move.captured.c] = null;

  next[move.to.r][move.to.c] = {
    player: piece.player,
    king: piece.king || move.promotes,
  };

  return next;
}

function countPieces(board: Board, player: Player) {
  let count = 0;
  let kings = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell?.player === player) {
        count += 1;
        if (cell.king) kings += 1;
      }
    }
  }

  return { count, kings };
}

function posLabel(r: number, c: number) {
  return `${FILES[c]}${BOARD_SIZE - r}`;
}

function boardKey(board: Board) {
  return board
    .map((row) =>
      row
        .map((cell) => {
          if (!cell) return ".";
          if (cell.player === "red") return cell.king ? "R" : "r";
          return cell.king ? "B" : "b";
        })
        .join("")
    )
    .join("/");
}

export default function MainExperience() {
  const [mode, setMode] = useState<GameMode>("single");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [boardStyle, setBoardStyle] = useState<BoardStyle>("classic");

  const [board, setBoard] = useState<Board>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [forcedFrom, setForcedFrom] = useState<{ r: number; c: number } | null>(null);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [info, setInfo] = useState("Capture to score big. Kings dominate the late game.");
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [frames, setFrames] = useState<Board[]>([initialBoard()]);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [replayRunning, setReplayRunning] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [queueJoined, setQueueJoined] = useState(false);

  const [stats, setStats] = useState<PlayerStats>(defaultStats);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) setStats({ ...defaultStats, ...JSON.parse(saved) });
    } catch {
      setStats(defaultStats);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (replayIndex === null || !replayRunning) return;
    const id = window.setInterval(() => {
      setReplayIndex((prev) => {
        if (prev === null) return prev;
        if (prev >= frames.length - 1) {
          setReplayRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 550);

    return () => window.clearInterval(id);
  }, [replayIndex, replayRunning, frames.length]);

  const displayedBoard = replayIndex === null ? board : frames[Math.min(replayIndex, frames.length - 1)];

  const legalMoves = useMemo(() => {
    if (status !== "playing") return [] as Move[];
    return allLegalMoves(board, currentPlayer, forcedFrom);
  }, [board, currentPlayer, forcedFrom, status]);

  const selectedMoves = useMemo(() => {
    if (!selected || replayIndex !== null || status !== "playing") return [] as Move[];
    return legalMoves.filter((m) => m.from.r === selected.r && m.from.c === selected.c);
  }, [selected, legalMoves, replayIndex, status]);

  const selectedTargets = useMemo(() => new Set(selectedMoves.map((m) => `${m.to.r}-${m.to.c}`)), [selectedMoves]);

  const freshMatch = useCallback(() => {
    const b = initialBoard();
    setBoard(b);
    setCurrentPlayer("red");
    setSelected(null);
    setForcedFrom(null);
    setStatus(mode === "online" ? "waiting-online" : "playing");
    setWinner(null);
    setMoveLog([]);
    setFrames([b]);
    setReplayIndex(null);
    setReplayRunning(false);
    setAiThinking(false);
    setStartedAt(Date.now());
    setInfo(mode === "online" ? "Online queue enabled. Local online matches arrive in a later step." : "New match started. Red moves first.");
  }, [mode]);

  const finalize = useCallback(
    (resolvedWinner: Player | "draw") => {
      setWinner(resolvedWinner);
      setStatus("finished");
      setInfo(resolvedWinner === "draw" ? "Draw! Try a sharper opening this round." : `${resolvedWinner === "red" ? "Red" : "Black"} wins!`);

      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      setStats((prev) => {
        const next = { ...prev };
        next.gamesPlayed += 1;

        if (resolvedWinner === "red") {
          next.winsRed += 1;
          next.streak += 1;
          next.bestStreak = Math.max(next.bestStreak, next.streak);
          next.rankPoints += 18 + (mode === "single" ? difficulty * 2 : 0);
        } else if (resolvedWinner === "black") {
          next.winsBlack += 1;
          next.streak = 0;
          next.rankPoints = Math.max(0, next.rankPoints - 8);
        } else {
          next.draws += 1;
          next.rankPoints += 4;
        }

        const entry: MatchHistory = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          playedAt: new Date().toISOString(),
          mode,
          difficulty,
          winner: resolvedWinner,
          moves: moveLog.length,
          durationSec,
        };

        next.history = [entry, ...next.history].slice(0, 16);
        return next;
      });
    },
    [startedAt, mode, difficulty, moveLog.length]
  );

  const afterTurnChecks = useCallback(
    (nextBoard: Board, nextPlayer: Player, chain: { r: number; c: number } | null) => {
      const red = countPieces(nextBoard, "red").count;
      const black = countPieces(nextBoard, "black").count;

      if (red === 0) return finalize("black");
      if (black === 0) return finalize("red");

      const moves = allLegalMoves(nextBoard, nextPlayer, chain);
      if (moves.length === 0) {
        finalize(nextPlayer === "red" ? "black" : "red");
      }
    },
    [finalize]
  );

  const playMove = useCallback(
    (move: Move, actor: "human" | "ai") => {
      const nextBoard = applyMove(board, move);

      const mover = currentPlayer;
      const note = `${mover === "red" ? "Red" : "Black"}: ${posLabel(move.from.r, move.from.c)} → ${posLabel(move.to.r, move.to.c)}${move.captured ? " ×" : ""}${move.promotes ? " 👑" : ""}`;

      setBoard(nextBoard);
      setMoveLog((prev) => [...prev, note]);
      setFrames((prev) => [...prev, cloneBoard(nextBoard)]);
      setSelected(null);

      const piece = nextBoard[move.to.r][move.to.c];
      const nextCaptures = piece ? movesForPiece(nextBoard, move.to.r, move.to.c).captures : [];
      const chainContinues = Boolean(move.captured && nextCaptures.length > 0);

      if (chainContinues) {
        setForcedFrom({ r: move.to.r, c: move.to.c });
        setCurrentPlayer(mover);
        setSelected({ r: move.to.r, c: move.to.c });
        setInfo(`${mover === "red" ? "Red" : "Black"} must continue capturing.`);
        afterTurnChecks(nextBoard, mover, { r: move.to.r, c: move.to.c });
      } else {
        const nextPlayer: Player = mover === "red" ? "black" : "red";
        setForcedFrom(null);
        setCurrentPlayer(nextPlayer);
        setInfo(actor === "ai" ? "Your turn. Find a tactical capture." : `${nextPlayer === "red" ? "Red" : "Black"} to move.`);
        afterTurnChecks(nextBoard, nextPlayer, null);
      }
    },
    [board, currentPlayer, afterTurnChecks]
  );

  const evalBoard = (b: Board) => {
    const red = countPieces(b, "red");
    const black = countPieces(b, "black");
    return (black.count - red.count) * 10 + (black.kings - red.kings) * 5;
  };

  const chooseAiMove = useCallback((): Move | null => {
    const moves = allLegalMoves(board, "black", forcedFrom);
    if (moves.length === 0) return null;

    if (difficulty <= 1) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const scored = moves.map((move) => {
      const b1 = applyMove(board, move);
      let score = evalBoard(b1);
      if (move.captured) score += 12;
      if (move.promotes) score += 18;

      if (difficulty >= 3) {
        const redResponses = allLegalMoves(b1, "red", null);
        const redCaptureThreat = redResponses.filter((m) => Boolean(m.captured)).length;
        score -= redCaptureThreat * 4;
      }

      if (difficulty >= 4) {
        const redResponses = allLegalMoves(b1, "red", null);
        if (redResponses.length > 0) {
          const worstForBlack = Math.min(
            ...redResponses.map((rm) => {
              const b2 = applyMove(b1, rm);
              return evalBoard(b2);
            })
          );
          score += worstForBlack * 0.6;
        }
      }

      if (difficulty >= 5) {
        const redResponses = allLegalMoves(b1, "red", null);
        if (redResponses.length > 0) {
          const pessimistic = Math.min(
            ...redResponses.map((rm) => {
              const b2 = applyMove(b1, rm);
              const blackReplies = allLegalMoves(b2, "black", null);
              if (blackReplies.length === 0) return evalBoard(b2) - 25;
              const bestReply = Math.max(...blackReplies.map((br) => evalBoard(applyMove(b2, br))));
              return bestReply;
            })
          );
          score += pessimistic * 0.45;
        }
      }

      return { move, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(1, Math.min(3, scored.length)));
    return top[Math.floor(Math.random() * top.length)].move;
  }, [board, difficulty, forcedFrom]);

  useEffect(() => {
    if (mode !== "single" || currentPlayer !== "black" || status !== "playing" || replayIndex !== null) return;

    setAiThinking(true);
    const id = window.setTimeout(() => {
      const move = chooseAiMove();
      setAiThinking(false);
      if (!move) {
        finalize("red");
        return;
      }
      playMove(move, "ai");
    }, 420 + difficulty * 120);

    return () => window.clearTimeout(id);
  }, [mode, currentPlayer, status, replayIndex, chooseAiMove, playMove, difficulty, finalize]);

  useEffect(() => {
    if (mode === "online") {
      setStatus("waiting-online");
      setInfo("Online matchmaking is in beta. You can still explore replays, stats, and style presets.");
    } else if (status === "waiting-online") {
      setStatus("playing");
      setInfo("Mode switched. New match ready.");
    }
  }, [mode, status]);

  const onCellClick = (r: number, c: number) => {
    if ((r + c) % 2 === 0) return;
    if (replayIndex !== null) return setInfo("Exit replay mode to continue playing.");
    if (mode === "online") return setInfo("Online queue is not live yet in this step. Try Single Player or Local.");
    if (status !== "playing") return;
    if (aiThinking && mode === "single" && currentPlayer === "black") return;

    const piece = board[r][c];
    const isCurrentPlayers = piece?.player === currentPlayer;

    if (forcedFrom && (r !== forcedFrom.r || c !== forcedFrom.c) && isCurrentPlayers) {
      setInfo("Capture chain active: continue with the highlighted piece.");
      return;
    }

    if (selected) {
      const move = selectedMoves.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        playMove(move, "human");
        return;
      }
    }

    if (!isCurrentPlayers) {
      setInfo("Select one of your pieces.");
      return;
    }

    const hasMove = legalMoves.some((m) => m.from.r === r && m.from.c === c);
    if (!hasMove) {
      setInfo("That piece is blocked. Try another lane.");
      return;
    }

    setSelected({ r, c });
  };

  const winRate = stats.gamesPlayed ? Math.round((stats.winsRed / stats.gamesPlayed) * 100) : 0;
  const recentToday = stats.history.filter((h) => h.playedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  const tone = theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  const card = theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200";

  const darkSquareClass =
    boardStyle === "classic"
      ? "bg-gradient-to-br from-amber-800 to-amber-700"
      : boardStyle === "modern"
      ? "bg-gradient-to-br from-fuchsia-600 to-violet-700"
      : "bg-slate-700";

  const lightSquareClass =
    boardStyle === "classic"
      ? "bg-gradient-to-br from-amber-200 to-amber-100"
      : boardStyle === "modern"
      ? "bg-gradient-to-br from-cyan-200 to-indigo-100"
      : "bg-slate-200";

  return (
    <main className={`min-h-screen w-full ${tone}`}>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className={`rounded-2xl border p-5 md:p-6 ${card}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Daily Checkers Arena</p>
              <h1 className="text-2xl font-bold md:text-3xl">Fast matches. Satisfying captures. Come back tomorrow stronger.</h1>
              <p className="mt-1 text-sm text-slate-400">Modes: AI, local hot-seat, and online beta flow. Includes 5 AI levels, replay, and progression tracking.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/20"
              >
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>
              <button
                onClick={freshMatch}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
              >
                New Match
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`rounded-2xl border p-4 md:p-5 ${card}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Current turn: {currentPlayer === "red" ? "Red" : "Black"}</p>
                <p className="text-xs text-slate-400">{status === "finished" ? "Game over" : info}</p>
              </div>
              <div className="text-xs text-slate-400">Moves: {moveLog.length}</div>
            </div>

            <div className="mx-auto grid w-full max-w-[680px] grid-cols-8 overflow-hidden rounded-xl border border-slate-700/50 shadow-2xl">
              {displayedBoard.map((row, r) =>
                row.map((cell, c) => {
                  const dark = (r + c) % 2 === 1;
                  const isSelected = selected?.r === r && selected?.c === c && replayIndex === null;
                  const isTarget = selectedTargets.has(`${r}-${c}`) && replayIndex === null;
                  const forced = forcedFrom?.r === r && forcedFrom?.c === c && replayIndex === null;

                  return (
                    <button
                      key={`${r}-${c}-${boardKey(displayedBoard)}`}
                      onClick={() => onCellClick(r, c)}
                      className={`relative aspect-square select-none ${dark ? darkSquareClass : lightSquareClass} ${dark ? "cursor-pointer" : "cursor-default"} ${isSelected ? "ring-4 ring-yellow-300/80" : ""}`}
                      aria-label={`cell ${r}-${c}`}
                    >
                      {isTarget && <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300 shadow-lg" />}
                      {forced && <span className="absolute inset-1 animate-pulse rounded-md border-2 border-yellow-300/90" />}

                      {cell && (
                        <span
                          className={`absolute left-1/2 top-1/2 block h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg transition-transform duration-150 ${
                            cell.player === "red"
                              ? "border-rose-300 bg-gradient-to-b from-rose-500 to-rose-700"
                              : "border-slate-300 bg-gradient-to-b from-slate-700 to-slate-900"
                          } ${isSelected ? "scale-105" : ""}`}
                        >
                          {cell.king && (
                            <span className="absolute inset-0 grid place-items-center text-lg font-bold text-yellow-200 drop-shadow">♛</span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-md bg-slate-800/60 px-2 py-1">Red = You</span>
              <span className="rounded-md bg-slate-800/60 px-2 py-1">Mandatory captures enabled</span>
              <span className="rounded-md bg-slate-800/60 px-2 py-1">Kings move both directions</span>
              {aiThinking && <span className="rounded-md bg-indigo-600/20 px-2 py-1 text-indigo-300">AI is thinking…</span>}
            </div>
          </section>

          <aside className="space-y-4">
            <section className={`rounded-2xl border p-4 ${card}`}>
              <h2 className="text-sm font-semibold">Match Setup</h2>
              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "single", label: "Single vs AI" },
                    { id: "local", label: "Local 2P" },
                    { id: "online", label: "Online Beta" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as GameMode)}
                      className={`rounded-lg border px-2 py-2 ${mode === m.id ? "border-sky-400 bg-sky-500/20 text-sky-200" : "border-slate-600 text-slate-300 hover:bg-slate-800/40"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <label className="mt-2 text-xs text-slate-400">AI Difficulty: {difficulty}/5</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={difficulty}
                  disabled={mode !== "single"}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-sky-400 disabled:opacity-40"
                />

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(["classic", "modern", "minimal"] as BoardStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBoardStyle(style)}
                      className={`rounded-lg border px-2 py-2 capitalize ${boardStyle === style ? "border-amber-400 bg-amber-500/20 text-amber-100" : "border-slate-600 text-slate-300 hover:bg-slate-800/40"}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {mode === "online" && (
                  <div className="mt-2 rounded-lg border border-violet-500/40 bg-violet-500/10 p-3 text-xs text-violet-200">
                    <p className="font-medium">Online queue state</p>
                    <p className="mt-1 text-violet-200/80">Multiplayer transport is staged for a later step. This panel shows edge-state behavior.</p>
                    <button
                      onClick={() => setQueueJoined((q) => !q)}
                      className="mt-2 rounded-md border border-violet-300/40 px-2 py-1 hover:bg-violet-400/20"
                    >
                      {queueJoined ? "Leave Queue" : "Join Queue"}
                    </button>
                  </div>
                )}

                {winner && (
                  <div className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    Result: {winner === "draw" ? "Draw" : `${winner === "red" ? "Red" : "Black"} wins`}
                  </div>
                )}
              </div>
            </section>

            <section className={`rounded-2xl border p-4 ${card}`}>
              <h2 className="text-sm font-semibold">Replay & Move History</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => {
                    setReplayIndex(0);
                    setReplayRunning(false);
                  }}
                  disabled={frames.length < 2}
                  className="rounded-md border border-slate-600 px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40"
                >
                  Start Replay
                </button>
                <button
                  onClick={() => setReplayRunning((p) => !p)}
                  disabled={replayIndex === null}
                  className="rounded-md border border-slate-600 px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40"
                >
                  {replayRunning ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => setReplayIndex((i) => (i === null ? null : Math.max(0, i - 1)))}
                  disabled={replayIndex === null}
                  className="rounded-md border border-slate-600 px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40"
                >
                  ◀
                </button>
                <button
                  onClick={() => setReplayIndex((i) => (i === null ? null : Math.min(frames.length - 1, i + 1)))}
                  disabled={replayIndex === null}
                  className="rounded-md border border-slate-600 px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40"
                >
                  ▶
                </button>
                <button
                  onClick={() => {
                    setReplayIndex(null);
                    setReplayRunning(false);
                  }}
                  disabled={replayIndex === null}
                  className="rounded-md border border-rose-500/40 px-2 py-1 text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
                >
                  Exit Replay
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">Frame: {replayIndex === null ? "Live" : `${replayIndex + 1}/${frames.length}`}</p>

              <div className="mt-3 max-h-44 overflow-auto rounded-lg border border-slate-700/60 p-2 text-xs">
                {moveLog.length === 0 ? (
                  <p className="text-slate-500">No moves yet.</p>
                ) : (
                  <ol className="space-y-1">
                    {moveLog.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-center justify-between rounded-md px-1 py-0.5 hover:bg-slate-800/40">
                        <span>{idx + 1}. {item}</span>
                        <button
                          onClick={() => {
                            setReplayIndex(idx + 1);
                            setReplayRunning(false);
                          }}
                          className="text-[10px] text-sky-300"
                        >
                          jump
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>

            <section className={`rounded-2xl border p-4 ${card}`}>
              <h2 className="text-sm font-semibold">Progression & Stats</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-700 p-2">Games: <strong>{stats.gamesPlayed}</strong></div>
                <div className="rounded-lg border border-slate-700 p-2">Win rate: <strong>{winRate}%</strong></div>
                <div className="rounded-lg border border-slate-700 p-2">Streak: <strong>{stats.streak}</strong></div>
                <div className="rounded-lg border border-slate-700 p-2">Rank: <strong>{stats.rankPoints}</strong></div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-slate-400">Daily missions</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li className="rounded-md border border-slate-700 px-2 py-1">
                    Play 3 matches today: {Math.min(3, recentToday)}/3 {recentToday >= 3 ? "✅" : "⏳"}
                  </li>
                  <li className="rounded-md border border-slate-700 px-2 py-1">
                    Reach 150 rank points: {Math.min(stats.rankPoints, 150)}/150 {stats.rankPoints >= 150 ? "✅" : "⏳"}
                  </li>
                </ul>
              </div>

              <div className="mt-3 max-h-28 overflow-auto rounded-lg border border-slate-700 p-2 text-xs">
                {stats.history.length === 0 ? (
                  <p className="text-slate-500">No completed games yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {stats.history.slice(0, 6).map((h) => (
                      <li key={h.id} className="rounded-md px-1 py-0.5 hover:bg-slate-800/40">
                        {new Date(h.playedAt).toLocaleDateString()} • {h.mode} • {h.winner} • {h.moves} moves
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
