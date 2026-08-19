export const PROJECT_NAME = 'NOVERA RP' as const;
export const MAX_PLAYERS = 500 as const;

export type Environment = 'development' | 'test' | 'production';

export interface PlayerIdentity {
  accountId: string;
  characterId: string | null;
}

export * from './events/auth';
export * from './events/characters';
