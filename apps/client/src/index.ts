import { AuthEvents } from '@novera/shared';

let authBrowser: BrowserMp | null = null;

mp.events.add('playerReady', () => {
  authBrowser = mp.browsers.new('package://novera/cef/index.html');
  mp.gui.cursor.show(true, true);
  mp.events.callRemote(AuthEvents.clientReady);
});

mp.events.add(AuthEvents.result, (payload: string) => {
  authBrowser?.execute(`window.noveraAuthResult?.(${JSON.stringify(payload)})`);
});

mp.events.add(AuthEvents.characters, (payload: string) => {
  authBrowser?.execute(`window.noveraCharacters?.(${JSON.stringify(payload)})`);
});

mp.events.add('novera:cef:login', (login: string, password: string) => {
  mp.events.callRemote(AuthEvents.login, JSON.stringify({ login, password }));
});

mp.events.add('novera:cef:register', (login: string, password: string) => {
  mp.events.callRemote(AuthEvents.register, JSON.stringify({ login, password }));
});
