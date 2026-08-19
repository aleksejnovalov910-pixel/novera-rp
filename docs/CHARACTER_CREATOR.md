# Character Creator v0.4

## Flow

1. Account authentication returns the three character slots.
2. An empty slot requests a private creator dimension from the server.
3. The client opens a scripted camera and freezes the local player.
4. CEF sends local preview changes to the RAGE:MP client only.
5. The client applies freemode model, head blend, hair, eyebrows, beard and eye color for preview.
6. LMB drag rotates the character/camera presentation; the mouse wheel changes camera distance.
7. Final creation is sent to the server as `CreateCharacterInput`.
8. Server validates ownership, slot, name, age and appearance ranges before writing MySQL.

## Security boundary

Preview is intentionally client-side because it is cosmetic and temporary. The persisted character is still server-authoritative: the server validates the final payload and owns the database write.

## UI

The current CEF contains one cohesive flow for authentication, the three-slot selector and character creation. It is intentionally dependency-light so it can be shipped as static files on GTA5HOST RAGE:MP 1.1 old.

## Future extensions

- parent portrait gallery instead of numeric sliders;
- face-feature sliders (20 GTA freemode morph values);
- eyebrow/hair/clothing thumbnail catalogs;
- per-gender validated drawable catalogs;
- creator scene lighting and animation;
- starter outfit presets persisted as inventory/clothing data;
- delete confirmation with account password/cooldown for production safety.
