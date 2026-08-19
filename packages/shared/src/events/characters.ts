export const CharacterEvents = {
  list: 'novera:characters:list',
  create: 'novera:characters:create',
  delete: 'novera:characters:delete',
  select: 'novera:characters:select',
  creatorOpen: 'novera:characters:creator:open',
  creatorPreview: 'novera:characters:creator:preview',
  creatorClose: 'novera:characters:creator:close',
  result: 'novera:characters:result',
  selected: 'novera:characters:selected'
} as const;

export type Gender = 'male' | 'female';

export interface CharacterAppearance {
  mother: number;
  father: number;
  resemblance: number;
  skinMix: number;
  hair: number;
  hairColor: number;
  eyebrow: number;
  eyebrowColor: number;
  beard: number;
  beardColor: number;
  eyeColor: number;
}

export interface CreateCharacterInput {
  slot: 1 | 2 | 3;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  appearance: CharacterAppearance;
}

export interface CharacterCreatorPreview {
  gender: Gender;
  appearance: CharacterAppearance;
}

export interface CharacterSummary {
  id: string;
  slot: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  level: number;
  lastPlayedAt: string | null;
}

export type CharacterActionCode =
  | 'OK'
  | 'UNAUTHENTICATED'
  | 'INVALID_INPUT'
  | 'SLOT_OCCUPIED'
  | 'SLOT_EMPTY'
  | 'NAME_TAKEN'
  | 'NOT_OWNER'
  | 'INTERNAL_ERROR';

export interface CharacterActionResult {
  ok: boolean;
  code: CharacterActionCode;
  message: string;
}
