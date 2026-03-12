export type PieceColor = "red" | "black";

export interface Piece {
  id: string;
  color: PieceColor;
  king: boolean;
}

export type Cell = Piece | null;
export type Board = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export interface CheckersMove {
  from: Position;
  to: Position;
  captures: Position[];
  promotion?: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface LeaderboardEntry {
  id: string;
  name: string;
  wins: number;
  losses: number;
  streak: number;
  elo: number;
}

export interface MatchHistoryItem {
  id: string;
  playedAt: string;
  winner: PieceColor | "draw";
  turns: number;
  durationSec: number;
  mode: "solo" | "local" | "online";
}

export interface StatsSnapshot {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  longestStreak: number;
  averageGameSeconds: number;
}

export interface SavedGameState {
  board: Board;
  turn: PieceColor;
  selected?: Position | null;
  difficulty?: Difficulty;
  history?: CheckersMove[];
  timestamp: string;
}

export const BOARD_SIZE = 8;
export const STORAGE_KEY_GAME = "checkers:active-game";
export const STORAGE_KEY_STATS = "checkers:stats";

const SCORE_WEIGHTS = {
  piece: 10,
  king: 16,
  centerControl: 1,
  mobility: 0.2,
};

const darkSquare = (row: number, col: number): boolean => (row + col) % 2 === 1;
const inside = (row: number, col: number): boolean => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export function oppositeColor(color: PieceColor): PieceColor {
  return color === "red" ? "black" : "red";
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (darkSquare(row, col)) {
        board[row][col] = { id: `b-${row}-${col}`, color: "black", king: false };
      }
    }
  }

  for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (darkSquare(row, col)) {
        board[row][col] = { id: `r-${row}-${col}`, color: "red", king: false };
      }
    }
  }

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function pieceAt(board: Board, pos: Position): Piece | null {
  if (!inside(pos.row, pos.col)) return null;
  return board[pos.row][pos.col];
}

export function createPositionKey(pos: Position): string {
  return `${pos.row}:${pos.col}`;
}

function directionalSteps(piece: Piece): Array<[number, number]> {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.color === "red" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function getPieceMoves(board: Board, from: Position): CheckersMove[] {
  const piece = pieceAt(board, from);
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  for (const [dr, dc] of directionalSteps(piece)) {
    const nextRow = from.row + dr;
    const nextCol = from.col + dc;

    if (!inside(nextRow, nextCol)) continue;

    const nextCell = board[nextRow][nextCol];
    if (!nextCell) {
      moves.push({
        from,
        to: { row: nextRow, col: nextCol },
        captures: [],
      });
      continue;
    }

    if (nextCell.color === piece.color) continue;

    const jumpRow = nextRow + dr;
    const jumpCol = nextCol + dc;
    if (inside(jumpRow, jumpCol) && board[jumpRow][jumpCol] === null) {
      moves.push({
        from,
        to: { row: jumpRow, col: jumpCol },
        captures: [{ row: nextRow, col: nextCol }],
      });
    }
  }

  return moves;
}

export function getLegalMovesForPiece(board: Board, from: Position, mustCapture = false): CheckersMove[] {
  const piece = pieceAt(board, from);
  if (!piece) return [];

  const allMoves = getPieceMoves(board, from);
  if (mustCapture) {
    const captures = allMoves.filter((move) => move.captures.length > 0);
    return captures;
  }

  return allMoves;
}

export function getAllLegalMoves(board: Board, color: PieceColor, enforceCapture = true): CheckersMove[] {
  const aggregate: CheckersMove[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      aggregate.push(...getPieceMoves(board, { row, col }));
    }
  }

  if (!enforceCapture) return aggregate;

  const captures = aggregate.filter((move) => move.captures.length > 0);
  return captures.length > 0 ? captures : aggregate;
}

export function applyMove(board: Board, move: CheckersMove): { board: Board; becameKing: boolean } {
  const next = cloneBoard(board);
  const piece = next[move.from.row][move.from.col];

  if (!piece) {
    return { board: next, becameKing: false };
  }

  next[move.from.row][move.from.col] = null;

  for (const capture of move.captures) {
    if (inside(capture.row, capture.col)) {
      next[capture.row][capture.col] = null;
    }
  }

  const promotionRow = piece.color === "red" ? 0 : BOARD_SIZE - 1;
  const becameKing = !piece.king && move.to.row === promotionRow;

  next[move.to.row][move.to.col] = {
    ...piece,
    king: piece.king || becameKing,
  };

  return { board: next, becameKing };
}

export function canContinueCapture(board: Board, at: Position): boolean {
  const piece = pieceAt(board, at);
  if (!piece) return false;

  return getPieceMoves(board, at).some((move) => move.captures.length > 0);
}

export function getWinner(board: Board, currentTurn: PieceColor): PieceColor | "draw" | null {
  const redMoves = getAllLegalMoves(board, "red", true).length;
  const blackMoves = getAllLegalMoves(board, "black", true).length;

  const redPieces = countPieces(board, "red");
  const blackPieces = countPieces(board, "black");

  if (redPieces.total === 0) return "black";
  if (blackPieces.total === 0) return "red";

  if (redMoves === 0 && blackMoves === 0) return "draw";

  if (currentTurn === "red" && redMoves === 0) return "black";
  if (currentTurn === "black" && blackMoves === 0) return "red";

  return null;
}

export function countPieces(board: Board, color: PieceColor): { total: number; kings: number } {
  let total = 0;
  let kings = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      total += 1;
      if (piece.king) kings += 1;
    }
  }

  return { total, kings };
}

export function evaluateBoard(board: Board, perspective: PieceColor): number {
  let score = 0;
  const centerMin = 2;
  const centerMax = 5;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;

      const sign = piece.color === perspective ? 1 : -1;
      score += SCORE_WEIGHTS.piece * sign;
      if (piece.king) score += SCORE_WEIGHTS.king * sign;

      if (row >= centerMin && row <= centerMax && col >= centerMin && col <= centerMax) {
        score += SCORE_WEIGHTS.centerControl * sign;
      }
    }
  }

  const ownMobility = getAllLegalMoves(board, perspective, true).length;
  const oppMobility = getAllLegalMoves(board, oppositeColor(perspective), true).length;
  score += (ownMobility - oppMobility) * SCORE_WEIGHTS.mobility;

  return score;
}

function chooseRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

function minimax(board: Board, turn: PieceColor, depth: number, perspective: PieceColor, alpha: number, beta: number): number {
  const winner = getWinner(board, turn);
  if (winner) {
    if (winner === "draw") return 0;
    return winner === perspective ? 999 : -999;
  }

  if (depth === 0) return evaluateBoard(board, perspective);

  const moves = getAllLegalMoves(board, turn, true);
  if (moves.length === 0) {
    return turn === perspective ? -999 : 999;
  }

  const maximizing = turn === perspective;
  let bestScore = maximizing ? -Infinity : Infinity;
  let localAlpha = alpha;
  let localBeta = beta;

  for (const move of moves) {
    const applied = applyMove(board, move).board;
    const score = minimax(applied, oppositeColor(turn), depth - 1, perspective, localAlpha, localBeta);

    if (maximizing) {
      bestScore = Math.max(bestScore, score);
      localAlpha = Math.max(localAlpha, bestScore);
      if (localBeta <= localAlpha) break;
    } else {
      bestScore = Math.min(bestScore, score);
      localBeta = Math.min(localBeta, bestScore);
      if (localBeta <= localAlpha) break;
    }
  }

  return bestScore;
}

export function chooseAIMove(board: Board, color: PieceColor, difficulty: Difficulty): CheckersMove | null {
  const legalMoves = getAllLegalMoves(board, color, true);
  if (legalMoves.length === 0) return null;

  if (difficulty === "easy") {
    return chooseRandom(legalMoves);
  }

  if (difficulty === "medium") {
    const scored = legalMoves.map((move) => {
      const { board: nextBoard, becameKing } = applyMove(board, move);
      let score = evaluateBoard(nextBoard, color);
      if (move.captures.length > 0) score += 7;
      if (becameKing) score += 10;
      return { move, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topBand = scored.slice(0, Math.min(3, scored.length)).map((item) => item.move);
    return chooseRandom(topBand);
  }

  const depth = 4;
  let bestScore = -Infinity;
  let bestMoves: CheckersMove[] = [];

  for (const move of legalMoves) {
    const nextBoard = applyMove(board, move).board;
    const score = minimax(nextBoard, oppositeColor(color), depth - 1, color, -Infinity, Infinity);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return chooseRandom(bestMoves);
}

export function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

export function toPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${Math.round(safe * 100)}%`;
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Intentionally ignored to keep gameplay resilient in restricted environments.
  }
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export const difficultyOptions: Array<{ value: Difficulty; label: string; description: string }> = [
  { value: "easy", label: "Easy", description: "Relaxed pace with playful random choices." },
  { value: "medium", label: "Medium", description: "Smart tactical moves with occasional surprises." },
  { value: "hard", label: "Hard", description: "Competitive minimax strategy for serious matches." },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { id: "p1", name: "NovaKnight", wins: 128, losses: 62, streak: 9, elo: 1640 },
  { id: "p2", name: "BoardBlazer", wins: 104, losses: 55, streak: 4, elo: 1580 },
  { id: "p3", name: "CrownChaser", wins: 93, losses: 58, streak: 2, elo: 1524 },
  { id: "p4", name: "DiagonalDrift", wins: 81, losses: 61, streak: 6, elo: 1491 },
  { id: "p5", name: "CrimsonTempo", wins: 76, losses: 69, streak: 1, elo: 1458 },
];

export const mockHistory: MatchHistoryItem[] = [
  { id: "m-1005", playedAt: "2026-03-05T20:42:00.000Z", winner: "red", turns: 41, durationSec: 452, mode: "solo" },
  { id: "m-1004", playedAt: "2026-03-05T18:08:00.000Z", winner: "black", turns: 38, durationSec: 407, mode: "local" },
  { id: "m-1003", playedAt: "2026-03-04T22:13:00.000Z", winner: "draw", turns: 52, durationSec: 620, mode: "online" },
  { id: "m-1002", playedAt: "2026-03-04T19:11:00.000Z", winner: "red", turns: 29, durationSec: 331, mode: "solo" },
  { id: "m-1001", playedAt: "2026-03-03T21:51:00.000Z", winner: "black", turns: 36, durationSec: 398, mode: "solo" },
];

export const dailyTips: string[] = [
  "Center control in the opening gives your pieces safer routes to promotion.",
  "If a capture is forced, look two turns ahead before committing.",
  "Trade only when it improves your king race or board shape.",
  "Keep at least one back-row defender to prevent quick enemy kinging.",
  "In tight endgames, king activity matters more than piece count.",
];

export function buildStatsFromHistory(history: MatchHistoryItem[]): StatsSnapshot {
  if (history.length === 0) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      longestStreak: 0,
      averageGameSeconds: 0,
    };
  }

  let gamesWon = 0;
  let streak = 0;
  let longestStreak = 0;
  let totalDuration = 0;

  for (const match of history) {
    const won = match.winner === "red";
    if (won) {
      gamesWon += 1;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }

    totalDuration += match.durationSec;
  }

  return {
    gamesPlayed: history.length,
    gamesWon,
    winRate: gamesWon / history.length,
    longestStreak,
    averageGameSeconds: Math.round(totalDuration / history.length),
  };
}
