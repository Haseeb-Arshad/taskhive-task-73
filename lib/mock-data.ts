export type GameMode = 'single_ai' | 'local_two_player' | 'online_multiplayer';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'master' | 'legendary';
export type ThemeOption = 'minimal' | 'classic_wood' | 'modern_bold' | 'dark_mode';
export type MatchResult = 'win' | 'loss' | 'draw';

export type GameHistoryItem = {
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  result: MatchResult;
  turns: number;
  capturedPieces: number;
  kingsEarned: number;
  playedAtIso: string;
  opponentLabel: string;
};

export type LeaderboardEntry = {
  rank: number;
  player: string;
  elo: number;
  streak: number;
  wins: number;
  losses: number;
};

export type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  averageTurns: number;
  kingsCrowned: number;
  captures: number;
};

export type DailyChallenge = {
  id: string;
  title: string;
  objective: string;
  rewardXp: number;
  difficulty: Difficulty;
  recommendedMode: GameMode;
};

export type Achievement = {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

export const GAME_MODES: ReadonlyArray<{ id: GameMode; label: string; subtitle: string }> = [
  {
    id: 'single_ai',
    label: 'Single-player vs AI',
    subtitle: 'Quick, strategic matches with adaptive bot personalities.'
  },
  {
    id: 'local_two_player',
    label: 'Two-player local (hot-seat)',
    subtitle: 'Pass-and-play for fast head-to-head sessions on one device.'
  },
  {
    id: 'online_multiplayer',
    label: 'Online multiplayer',
    subtitle: 'Compete globally, climb rankings, and build your reputation.'
  }
] as const;

export const DIFFICULTIES: ReadonlyArray<{ id: Difficulty; label: string; depth: number }> = [
  { id: 'beginner', label: 'Beginner', depth: 2 },
  { id: 'intermediate', label: 'Intermediate', depth: 4 },
  { id: 'advanced', label: 'Advanced', depth: 6 },
  { id: 'master', label: 'Master', depth: 8 },
  { id: 'legendary', label: 'Legendary', depth: 10 }
] as const;

export const THEMES: ReadonlyArray<{ id: ThemeOption; label: string }> = [
  { id: 'minimal', label: 'Minimalist / Flat' },
  { id: 'classic_wood', label: 'Classic Wooden Board' },
  { id: 'modern_bold', label: 'Modern / Bold' },
  { id: 'dark_mode', label: 'Dark Mode' }
] as const;

export const CHECKERS_TIPS: ReadonlyArray<string> = [
  'Control the center early—diagonals from the middle create more tactical options.',
  'Avoid exposing your back row too soon; it prevents easy king promotions.',
  'Trade pieces when ahead, but avoid symmetrical trades when behind.',
  'Force multi-jumps by baiting with a protected piece.',
  'A king is strongest when supported—don’t send it deep without backup.'
] as const;

export const MOCK_HISTORY: ReadonlyArray<GameHistoryItem> = [
  {
    id: 'match_101',
    mode: 'single_ai',
    difficulty: 'advanced',
    result: 'win',
    turns: 39,
    capturedPieces: 12,
    kingsEarned: 2,
    playedAtIso: '2026-01-08T20:10:00.000Z',
    opponentLabel: 'AI • Rogue Strategist'
  },
  {
    id: 'match_102',
    mode: 'online_multiplayer',
    difficulty: 'master',
    result: 'loss',
    turns: 46,
    capturedPieces: 10,
    kingsEarned: 1,
    playedAtIso: '2026-01-09T18:25:00.000Z',
    opponentLabel: 'NovaKnight'
  },
  {
    id: 'match_103',
    mode: 'local_two_player',
    difficulty: 'intermediate',
    result: 'win',
    turns: 33,
    capturedPieces: 12,
    kingsEarned: 3,
    playedAtIso: '2026-01-10T21:00:00.000Z',
    opponentLabel: 'Local • Friend'
  },
  {
    id: 'match_104',
    mode: 'single_ai',
    difficulty: 'master',
    result: 'draw',
    turns: 58,
    capturedPieces: 11,
    kingsEarned: 2,
    playedAtIso: '2026-01-11T22:10:00.000Z',
    opponentLabel: 'AI • Endgame Specialist'
  },
  {
    id: 'match_105',
    mode: 'online_multiplayer',
    difficulty: 'advanced',
    result: 'win',
    turns: 37,
    capturedPieces: 12,
    kingsEarned: 2,
    playedAtIso: '2026-01-12T19:45:00.000Z',
    opponentLabel: 'PixelWarden'
  }
] as const;

export const MOCK_LEADERBOARD: ReadonlyArray<LeaderboardEntry> = [
  { rank: 1, player: 'ArcTactician', elo: 2284, streak: 9, wins: 192, losses: 41 },
  { rank: 2, player: 'BlitzDiagonal', elo: 2219, streak: 5, wins: 181, losses: 53 },
  { rank: 3, player: 'You', elo: 2176, streak: 4, wins: 74, losses: 22 },
  { rank: 4, player: 'RooklessKing', elo: 2155, streak: 3, wins: 88, losses: 30 },
  { rank: 5, player: 'NeonCheck', elo: 2112, streak: 2, wins: 102, losses: 48 }
] as const;

export const MOCK_DAILY_CHALLENGES: ReadonlyArray<DailyChallenge> = [
  {
    id: 'dc_control_center',
    title: 'Center Control Sprint',
    objective: 'Win a match while occupying at least 2 center squares for 10 turns.',
    rewardXp: 250,
    difficulty: 'intermediate',
    recommendedMode: 'single_ai'
  },
  {
    id: 'dc_king_rush',
    title: 'King Rush',
    objective: 'Crown 2 kings in a single game and still finish with a win.',
    rewardXp: 350,
    difficulty: 'advanced',
    recommendedMode: 'online_multiplayer'
  },
  {
    id: 'dc_clean_finish',
    title: 'Clean Finish',
    objective: 'Win while keeping at least 4 pieces alive.',
    rewardXp: 200,
    difficulty: 'beginner',
    recommendedMode: 'local_two_player'
  }
] as const;

export const MOCK_ACHIEVEMENTS: ReadonlyArray<Achievement> = [
  {
    id: 'ach_first_win',
    label: 'First Blood',
    description: 'Win your first checkers match.',
    unlocked: true,
    progress: 1,
    target: 1
  },
  {
    id: 'ach_streak_7',
    label: 'On Fire',
    description: 'Reach a 7-game winning streak.',
    unlocked: false,
    progress: 4,
    target: 7
  },
  {
    id: 'ach_king_50',
    label: 'Royal Court',
    description: 'Crown 50 kings across all modes.',
    unlocked: false,
    progress: 31,
    target: 50
  }
] as const;

export function getModeLabel(mode: GameMode): string {
  return GAME_MODES.find((item) => item.id === mode)?.label ?? mode;
}

export function getDifficultyWeight(difficulty: Difficulty): number {
  return DIFFICULTIES.find((item) => item.id === difficulty)?.depth ?? 1;
}

export function getResultTone(result: MatchResult): 'positive' | 'negative' | 'neutral' {
  if (result === 'win') return 'positive';
  if (result === 'loss') return 'negative';
  return 'neutral';
}

export function calculateStats(history: ReadonlyArray<GameHistoryItem>): PlayerStats {
  const gamesPlayed = history.length;
  const wins = history.filter((item) => item.result === 'win').length;
  const losses = history.filter((item) => item.result === 'loss').length;
  const draws = history.filter((item) => item.result === 'draw').length;
  const captures = history.reduce((sum, item) => sum + item.capturedPieces, 0);
  const kingsCrowned = history.reduce((sum, item) => sum + item.kingsEarned, 0);
  const averageTurns = gamesPlayed
    ? Math.round((history.reduce((sum, item) => sum + item.turns, 0) / gamesPlayed) * 10) / 10
    : 0;

  let currentStreak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].result !== 'win') break;
    currentStreak += 1;
  }

  let bestStreak = 0;
  let run = 0;
  for (const item of history) {
    if (item.result === 'win') {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    gamesPlayed,
    wins,
    losses,
    draws,
    currentStreak,
    bestStreak,
    averageTurns,
    kingsCrowned,
    captures
  };
}

export function calculateWinRate(stats: Pick<PlayerStats, 'wins' | 'gamesPlayed'>): number {
  if (!stats.gamesPlayed) return 0;
  return Math.round((stats.wins / stats.gamesPlayed) * 1000) / 10;
}

export function getDailyChallengeByDate(dateIso: string): DailyChallenge {
  const date = new Date(dateIso);
  const daySeed = Number.isNaN(date.getTime())
    ? 0
    : Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000;
  const index = Math.abs(daySeed) % MOCK_DAILY_CHALLENGES.length;
  return MOCK_DAILY_CHALLENGES[index];
}

export function getTipByIndex(index: number): string {
  if (CHECKERS_TIPS.length === 0) return 'Keep pieces connected and watch for forced captures.';
  const normalized = Math.abs(index) % CHECKERS_TIPS.length;
  return CHECKERS_TIPS[normalized];
}

export function getCompletionMessage(streak: number): string {
  if (streak >= 10) return 'Legendary form. You are dominating the board!';
  if (streak >= 5) return 'Hot streak active. Keep pressing the advantage!';
  if (streak >= 2) return 'Nice momentum. Queue another match and push your streak.';
  return 'Solid match complete. Review the replay and sharpen your next opening.';
}

export function clampHistory(
  history: ReadonlyArray<GameHistoryItem>,
  maxItems: number
): ReadonlyArray<GameHistoryItem> {
  if (maxItems <= 0) return [];
  return history.slice(-maxItems);
}
