export const AuthEvents = {
  clientReady: 'novera:auth:clientReady',
  register: 'novera:auth:register',
  login: 'novera:auth:login',
  result: 'novera:auth:result',
  characters: 'novera:characters:list'
} as const;

export interface AuthCredentials {
  login: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  code: 'OK' | 'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'ACCOUNT_EXISTS' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
  message: string;
}

export interface CharacterSummary {
  id: string;
  firstName: string;
  lastName: string;
  level: number;
  lastPlayedAt: string | null;
}
