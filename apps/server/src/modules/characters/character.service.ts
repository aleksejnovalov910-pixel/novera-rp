import { and, characters, eq, isNull, type NoveraDatabase } from '@novera/database';
import type { CharacterAppearance, CharacterSummary, CreateCharacterInput, Gender } from '@novera/shared';

const NAME = /^[A-Z][a-z]{2,23}$/;
const DEFAULT_APPEARANCE: CharacterAppearance = {
  mother: 21,
  father: 0,
  resemblance: 0.5,
  skinMix: 0.5,
  hair: 0,
  hairColor: 0,
  eyebrow: 0,
  eyebrowColor: 0,
  beard: 255,
  beardColor: 0,
  eyeColor: 0
};

function ageFromBirthDate(birthDate: string): number {
  const born = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(born.valueOf())) return 18;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < born.getUTCMonth()
    || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Math.max(18, Math.min(90, age));
}

function birthDateFromAge(age: number): string {
  const safeAge = Math.max(18, Math.min(90, Math.trunc(age)));
  const year = new Date().getUTCFullYear() - safeAge;
  return `${year}-01-01`;
}

export interface CharacterPositionSnapshot {
  x: number;
  y: number;
  z: number;
  heading: number;
  dimension: number;
}

export class CharacterService {
  constructor(private readonly db: NoveraDatabase) {}

  private summary(row: typeof characters.$inferSelect): CharacterSummary {
    return {
      id: row.id.toString(),
      slot: row.slot,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender as Gender,
      age: ageFromBirthDate(row.birthDate),
      level: row.level,
      lastPlayedAt: row.lastPlayedAt?.toISOString() ?? null
    };
  }

  async list(accountId: bigint): Promise<CharacterSummary[]> {
    const rows = await this.db.orm.select().from(characters)
      .where(and(eq(characters.accountId, accountId), isNull(characters.deletedAt)));
    return rows.sort((a, b) => a.slot - b.slot).map((row) => this.summary(row));
  }

  validate(input: CreateCharacterInput): boolean {
    if (![1, 2, 3].includes(input.slot)) return false;
    if (!NAME.test(input.firstName) || !NAME.test(input.lastName)) return false;
    if (input.gender !== 'male' && input.gender !== 'female') return false;
    if (!Number.isInteger(input.age) || input.age < 18 || input.age > 90) return false;

    const a = input.appearance ?? DEFAULT_APPEARANCE;
    return Number.isInteger(a.mother) && a.mother >= 0 && a.mother <= 45
      && Number.isInteger(a.father) && a.father >= 0 && a.father <= 44
      && Number.isFinite(a.resemblance) && a.resemblance >= 0 && a.resemblance <= 1
      && Number.isFinite(a.skinMix) && a.skinMix >= 0 && a.skinMix <= 1
      && Number.isInteger(a.hair) && a.hair >= 0 && a.hair <= 255
      && Number.isInteger(a.hairColor) && a.hairColor >= 0 && a.hairColor <= 63
      && Number.isInteger(a.eyebrow) && a.eyebrow >= 0 && a.eyebrow <= 33
      && Number.isInteger(a.eyebrowColor) && a.eyebrowColor >= 0 && a.eyebrowColor <= 63
      && Number.isInteger(a.beard) && a.beard >= 0 && a.beard <= 255
      && Number.isInteger(a.beardColor) && a.beardColor >= 0 && a.beardColor <= 63
      && Number.isInteger(a.eyeColor) && a.eyeColor >= 0 && a.eyeColor <= 31;
  }

  async create(accountId: bigint, input: CreateCharacterInput): Promise<CharacterSummary | 'SLOT_OCCUPIED' | 'NAME_TAKEN'> {
    const current = await this.db.orm.select({ id: characters.id }).from(characters)
      .where(and(eq(characters.accountId, accountId), eq(characters.slot, input.slot), isNull(characters.deletedAt))).limit(1);
    if (current.length > 0) return 'SLOT_OCCUPIED';

    const duplicate = await this.db.orm.select({ id: characters.id }).from(characters)
      .where(and(eq(characters.firstName, input.firstName), eq(characters.lastName, input.lastName), isNull(characters.deletedAt))).limit(1);
    if (duplicate.length > 0) return 'NAME_TAKEN';

    const result = await this.db.orm.insert(characters).values({
      accountId,
      slot: input.slot,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender,
      birthDate: birthDateFromAge(input.age),
      appearance: input.appearance ?? DEFAULT_APPEARANCE
    });

    const id = BigInt(result[0].insertId);
    const rows = await this.db.orm.select().from(characters).where(eq(characters.id, id)).limit(1);
    const created = rows[0];
    if (!created) throw new Error(`Character ${id.toString()} was inserted but could not be reloaded`);
    return this.summary(created);
  }

  async getOwned(accountId: bigint, characterId: bigint) {
    const rows = await this.db.orm.select().from(characters).where(and(
      eq(characters.id, characterId),
      eq(characters.accountId, accountId),
      isNull(characters.deletedAt)
    )).limit(1);
    return rows[0] ?? null;
  }

  async select(accountId: bigint, characterId: bigint) {
    const row = await this.getOwned(accountId, characterId);
    if (!row) return null;
    await this.db.orm.update(characters).set({ lastPlayedAt: new Date() }).where(eq(characters.id, row.id));
    return row;
  }

  async savePosition(characterId: bigint, snapshot: CharacterPositionSnapshot): Promise<void> {
    if (![snapshot.x, snapshot.y, snapshot.z, snapshot.heading, snapshot.dimension].every(Number.isFinite)) {
      throw new Error('Cannot persist non-finite character position');
    }
    await this.db.orm.update(characters).set({
      posX: snapshot.x,
      posY: snapshot.y,
      posZ: snapshot.z,
      heading: snapshot.heading,
      dimension: Math.max(0, Math.trunc(snapshot.dimension)),
      lastPlayedAt: new Date()
    }).where(and(eq(characters.id, characterId), isNull(characters.deletedAt)));
  }

  async softDelete(accountId: bigint, characterId: bigint): Promise<boolean> {
    const row = await this.getOwned(accountId, characterId);
    if (!row) return false;
    await this.db.orm.update(characters).set({ deletedAt: new Date() }).where(eq(characters.id, row.id));
    return true;
  }
}
