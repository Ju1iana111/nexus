export enum MessageRole {
  PLAYER = 'player',
  GAME_MASTER = 'game_master',
}

export interface Message {
  role: MessageRole;
  content: string;
}

export enum QuestStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  type?: 'standard' | 'architect';
}

export interface CharacterStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  hp: number;
  maxHp: number;
  reputation: Record<string, number>;
}

export interface PlayerInfo {
    playerId: string;
    name: string;
    description: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

export interface CombatState {
    isActive: boolean;
    enemies: Enemy[];
    turn: 'player' | string; // 'player' or enemy id
    log: string[];
}

export interface GameResponse {
  description: string;
  suggested_actions: string[];
  inventory: string[];
  newItem?: string;
  quests: Quest[];
  characterStats: CharacterStats;
  xpGained?: number;
  combatState: CombatState;
  currentLocation?: string;
  locationDescription?: string;
  randomEvent?: {
    name: string;
    description: string;
  };
}

export interface GameState {
  messages: Message[];
  inventory: string[];
  quests: Quest[];
  characterStats: CharacterStats;
  combatState: CombatState;
  currentLocation: string | null;
  locationDescription: string | null;
  playerInfo: PlayerInfo | null;
}

export interface Exit {
  id: string;
  name: string;
}
