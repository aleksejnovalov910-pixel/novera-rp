# Character System v0.3

NOVERA accounts have exactly three character slots. The server owns slot state, ownership checks, creation validation, selection and deletion.

## Creation flow

1. Auth succeeds and server returns the current character list.
2. Player chooses an empty slot (1..3).
3. Server moves that player into a private creator dimension (`50000 + player.id`).
4. CEF sends identity + appearance data.
5. Server validates age, name format, GTA heritage/appearance ranges and the expected slot.
6. DB enforces unique account/slot and unique character name.
7. Character is inserted and the refreshed slot list is pushed to CEF.

## Selection

Selection requires ownership. The server applies stored position/dimension and the freemode model, sets `characterId`, and only then tells the client the character is active.

## Deletion

Deletion is soft-delete (`deleted_at`) to preserve auditability and make future staff restoration possible. Deleted characters do not appear in normal account queries.

## Next milestone

v0.4 will apply full GTA appearance to the freemode ped, add creator camera controls, parent preview data, clothes preview/loadout, and a polished CEF character creator/selector.
