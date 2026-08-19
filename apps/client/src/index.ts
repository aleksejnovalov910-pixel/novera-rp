import { AuthEvents, CharacterEvents, type CreateCharacterInput } from '@novera/shared';

let authBrowser: BrowserMp | null = null;

function ensureBrowser(): BrowserMp {
  authBrowser ??= mp.browsers.new('package://novera/cef/index.html');
  return authBrowser;
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
mp.events.add(CharacterEvents.creatorOpen, (slot: number) => ensureBrowser().execute(`window.noveraOpenCreator?.(${Number(slot)})`));
mp.events.add(CharacterEvents.selected, (payload: string) => {
  ensureBrowser().execute(`window.noveraCharacterSelected?.(${JSON.stringify(payload)})`);
  mp.gui.cursor.show(false, false);
  authBrowser?.destroy();
  authBrowser = null;
});

mp.events.add('novera:cef:login', (login: string, password: string) => mp.events.callRemote(AuthEvents.login, JSON.stringify({ login, password })));
mp.events.add('novera:cef:register', (login: string, password: string) => mp.events.callRemote(AuthEvents.register, JSON.stringify({ login, password })));
mp.events.add('novera:cef:creator:open', (slot: number) => mp.events.callRemote(CharacterEvents.creatorOpen, Number(slot)));
mp.events.add('novera:cef:character:create', (payload: string) => {
  const input = JSON.parse(payload) as CreateCharacterInput;
  mp.events.callRemote(CharacterEvents.create, JSON.stringify(input));
});
mp.events.add('novera:cef:character:select', (id: string) => mp.events.callRemote(CharacterEvents.select, id));
mp.events.add('novera:cef:character:delete', (id: string) => mp.events.callRemote(CharacterEvents.delete, id));
