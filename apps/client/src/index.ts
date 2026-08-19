import {
  AuthEvents,
  CharacterEvents,
  type CharacterCreatorPreview,
  type CreateCharacterInput
} from '@novera/shared';

let authBrowser: BrowserMp | null = null;
let creatorCamera: CameraMp | null = null;
let creatorActive = false;
let creatorYaw = 180;
let creatorZoom = 2.15;

const CREATOR_TARGET = new mp.Vector3(402.89, -996.76, -98.25);

function ensureBrowser(): BrowserMp {
  authBrowser ??= mp.browsers.new('package://novera/cef/index.html');
  return authBrowser;
}

function updateCreatorCamera(): void {
  if (!creatorCamera) return;
  const radians = (creatorYaw * Math.PI) / 180;
  const x = CREATOR_TARGET.x + Math.sin(radians) * creatorZoom;
  const y = CREATOR_TARGET.y + Math.cos(radians) * creatorZoom;
  creatorCamera.setCoord(x, y, CREATOR_TARGET.z + 0.55);
  creatorCamera.pointAtCoord(CREATOR_TARGET.x, CREATOR_TARGET.y, CREATOR_TARGET.z + 0.35);
}

function openCreatorCamera(): void {
  creatorActive = true;
  creatorYaw = 180;
  creatorZoom = 2.15;
  mp.players.local.freezePosition(true);
  creatorCamera?.destroy();
  creatorCamera = mp.cameras.new('default', new mp.Vector3(402.89, -999.0, -97.7), new mp.Vector3(0, 0, 0), 38);
  creatorCamera.setActive(true);
  updateCreatorCamera();
  mp.game.cam.renderScriptCams(true, false, 0, true, false);
}

function closeCreatorCamera(): void {
  creatorActive = false;
  mp.players.local.freezePosition(false);
  if (creatorCamera) {
    creatorCamera.setActive(false);
    creatorCamera.destroy();
    creatorCamera = null;
  }
  mp.game.cam.renderScriptCams(false, false, 0, true, false);
}

function applyAppearance(preview: CharacterCreatorPreview): void {
  const player = mp.players.local;
  const model = preview.gender === 'female' ? 'mp_f_freemode_01' : 'mp_m_freemode_01';
  const hash = mp.game.joaat(model);
  const apply = () => {
    player.setHeadBlendData(
      preview.appearance.mother,
      preview.appearance.father,
      0,
      preview.appearance.mother,
      preview.appearance.father,
      0,
      preview.appearance.resemblance,
      preview.appearance.skinMix,
      0,
      false
    );
    player.setComponentVariation(2, preview.appearance.hair, 0, 0);
    player.setHairColor(preview.appearance.hairColor, preview.appearance.hairColor);
    player.setHeadOverlay(2, preview.appearance.eyebrow, 1, 0, 0);
    player.setHeadOverlayColor(2, 1, preview.appearance.eyebrowColor, preview.appearance.eyebrowColor);
    player.setHeadOverlay(1, preview.gender === 'male' ? preview.appearance.beard : 255, 1, 0, 0);
    if (preview.gender === 'male') player.setHeadOverlayColor(1, 1, preview.appearance.beardColor, preview.appearance.beardColor);
    player.setEyeColor(preview.appearance.eyeColor);

    // Neutral starter outfit. Full clothing catalog is a later module.
    player.setComponentVariation(3, 15, 0, 0);
    player.setComponentVariation(4, preview.gender === 'female' ? 15 : 21, 0, 0);
    player.setComponentVariation(6, preview.gender === 'female' ? 5 : 34, 0, 0);
    player.setComponentVariation(8, 15, 0, 0);
    player.setComponentVariation(11, preview.gender === 'female' ? 15 : 15, 0, 0);
  };

  if (player.model !== hash) {
    player.model = hash;
    setTimeout(apply, 120);
  } else {
    apply();
  }
}

mp.events.add('playerReady', () => {
  ensureBrowser();
  mp.gui.cursor.show(true, true);
  mp.events.callRemote(AuthEvents.clientReady);
});

mp.events.add(AuthEvents.result, (payload: string) => ensureBrowser().execute(`window.noveraAuthResult?.(${JSON.stringify(payload)})`));
mp.events.add(AuthEvents.characters, (payload: string) => ensureBrowser().execute(`window.noveraCharacters?.(${JSON.stringify(payload)})`));
mp.events.add(CharacterEvents.list, (payload: string) => ensureBrowser().execute(`window.noveraCharacters?.(${JSON.stringify(payload)})`));
mp.events.add(CharacterEvents.result, (payload: string) => ensureBrowser().execute(`window.noveraCharacterResult?.(${JSON.stringify(payload)})`));
mp.events.add(CharacterEvents.creatorOpen, (slot: number) => {
  openCreatorCamera();
  ensureBrowser().execute(`window.noveraOpenCreator?.(${Number(slot)})`);
});
mp.events.add(CharacterEvents.selected, (payload: string) => {
  closeCreatorCamera();
  ensureBrowser().execute(`window.noveraCharacterSelected?.(${JSON.stringify(payload)})`);
  mp.gui.cursor.show(false, false);
  authBrowser?.destroy();
  authBrowser = null;
});

mp.events.add('novera:cef:login', (login: string, password: string) => mp.events.callRemote(AuthEvents.login, JSON.stringify({ login, password })));
mp.events.add('novera:cef:register', (login: string, password: string) => mp.events.callRemote(AuthEvents.register, JSON.stringify({ login, password })));
mp.events.add('novera:cef:creator:open', (slot: number) => mp.events.callRemote(CharacterEvents.creatorOpen, Number(slot)));
mp.events.add('novera:cef:creator:preview', (payload: string) => {
  if (!creatorActive) return;
  try { applyAppearance(JSON.parse(payload) as CharacterCreatorPreview); } catch { /* malformed CEF payload ignored */ }
});
mp.events.add('novera:cef:creator:rotate', (delta: number) => {
  if (!creatorActive) return;
  creatorYaw = (creatorYaw + Math.max(-20, Math.min(20, Number(delta) || 0))) % 360;
  mp.players.local.setHeading(creatorYaw + 180);
  updateCreatorCamera();
});
mp.events.add('novera:cef:creator:zoom', (delta: number) => {
  if (!creatorActive) return;
  creatorZoom = Math.max(1.25, Math.min(3.25, creatorZoom + Math.max(-0.35, Math.min(0.35, Number(delta) || 0))));
  updateCreatorCamera();
});
mp.events.add('novera:cef:character:create', (payload: string) => {
  const input = JSON.parse(payload) as CreateCharacterInput;
  mp.events.callRemote(CharacterEvents.create, JSON.stringify(input));
});
mp.events.add('novera:cef:character:select', (id: string) => mp.events.callRemote(CharacterEvents.select, id));
mp.events.add('novera:cef:character:delete', (id: string) => mp.events.callRemote(CharacterEvents.delete, id));
