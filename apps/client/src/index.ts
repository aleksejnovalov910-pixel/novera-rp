import { AuthEvents, CharacterEvents, GameplayEvents, PhoneEvents, WorldEvents, type CharacterCreatorPreview } from '@novera/shared';

let uiBrowser: BrowserMp | null = null;
let creatorCamera: CameraMp | null = null;
let authCamera: CameraMp | null = null;
let creatorActive = false;
let authActive = false;
let creatorYaw = 180;
let creatorZoom = 2.15;
let characterActive = false;
let deviceOpen = false;
const CREATOR_TARGET = new mp.Vector3(402.89, -996.76, -98.25);
const AUTH_CAMERA = new mp.Vector3(-1045.0, -2744.5, 42.0);
const AUTH_TARGET = new mp.Vector3(-1034.0, -2732.0, 21.0);

function ensureBrowser(): BrowserMp { uiBrowser ??= mp.browsers.new('package://novera/cef/index.html'); return uiBrowser; }
function execute(fn: string, payload?: string): void { ensureBrowser().execute(payload === undefined ? `${fn}?.()` : `${fn}?.(${JSON.stringify(payload)})`); }
function setNativeUiVisible(visible:boolean): void { mp.game.ui.displayHud(visible); mp.game.ui.displayRadar(visible); try { mp.gui.chat.show(visible); } catch {} }
function showAuthCursor(): void { if(authActive && !characterActive) mp.gui.cursor.show(true,true); }
function clampInt(value: unknown, min: number, max: number, fallback: number): number { const parsed = Math.trunc(Number(value)); return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback; }
function clampUnit(value: unknown, fallback = 0.5): number { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback; }
function openAuthCamera(): void {
  authActive = true;
  characterActive = false;
  deviceOpen = false;
  mp.players.local.freezePosition(true);
  mp.players.local.setAlpha(0);
  setNativeUiVisible(false);
  authCamera?.destroy();
  authCamera = mp.cameras.new('default', AUTH_CAMERA, new mp.Vector3(0,0,0), 46);
  authCamera.pointAtCoord(AUTH_TARGET.x,AUTH_TARGET.y,AUTH_TARGET.z);
  authCamera.setActive(true);
  mp.game.cam.renderScriptCams(true,true,1200,true,false);
  showAuthCursor();
  setTimeout(showAuthCursor,150);
  setTimeout(showAuthCursor,700);
}
function closeAuthCamera(): void {
  authActive = false;
  if(authCamera){authCamera.setActive(false);authCamera.destroy();authCamera=null;}
  mp.game.cam.renderScriptCams(false,true,650,true,false);
  mp.players.local.setAlpha(255);
}
function updateCreatorCamera(): void { if(!creatorCamera)return; const r=creatorYaw*Math.PI/180; const x=CREATOR_TARGET.x+Math.sin(r)*creatorZoom,y=CREATOR_TARGET.y+Math.cos(r)*creatorZoom; creatorCamera.setCoord(x,y,CREATOR_TARGET.z+.55); creatorCamera.pointAtCoord(CREATOR_TARGET.x,CREATOR_TARGET.y,CREATOR_TARGET.z+.35); }
function openCreatorCamera(): void { closeAuthCamera();creatorActive=true;creatorYaw=180;creatorZoom=2.15;setNativeUiVisible(false);mp.players.local.freezePosition(true);mp.players.local.setAlpha(255);creatorCamera?.destroy();creatorCamera=mp.cameras.new('default',new mp.Vector3(402.89,-999,-97.7),new mp.Vector3(0,0,0),38);creatorCamera.setActive(true);updateCreatorCamera();mp.game.cam.renderScriptCams(true,false,0,true,false);mp.gui.cursor.show(true,true); }
function closeCreatorCamera(): void { creatorActive=false;mp.players.local.freezePosition(false);if(creatorCamera){creatorCamera.setActive(false);creatorCamera.destroy();creatorCamera=null}mp.game.cam.renderScriptCams(false,false,0,true,false); }
function applyAppearance(preview: CharacterCreatorPreview): void {
  const p=mp.players.local;
  const hash=mp.game.joaat(preview.gender==='female'?'mp_f_freemode_01':'mp_m_f_freemode_01');
  const mother=clampInt(preview.appearance?.mother,0,45,21);
  const father=clampInt(preview.appearance?.father,0,45,0);
  const resemblance=clampUnit(preview.appearance?.resemblance,0.5);
  const skinMix=clampUnit(preview.appearance?.skinMix,0.5);
  const hair=clampInt(preview.appearance?.hair,0,255,0);
  const hairColor=clampInt(preview.appearance?.hairColor,0,63,0);
  const eyebrow=clampInt(preview.appearance?.eyebrow,0,33,0);
  const eyebrowColor=clampInt(preview.appearance?.eyebrowColor,0,63,0);
  const beard=clampInt(preview.appearance?.beard,0,28,0);
  const beardColor=clampInt(preview.appearance?.beardColor,0,63,0);
  const eyeColor=clampInt(preview.appearance?.eyeColor,0,31,0);
  const apply=()=>{
    p.setHeadBlendData(mother,father,0,mother,father,0,resemblance,skinMix,0,false);
    p.setComponentVariation(2,hair,0,0);
    p.setHairColor(hairColor,hairColor);
    p.setHeadOverlay(2,eyebrow,1,0,0);
    p.setHeadOverlayColor(2,1,eyebrowColor,eyebrowColor);
    p.setHeadOverlay(1,preview.gender==='male'?beard:255,1,0,0);
    if(preview.gender==='male')p.setHeadOverlayColor(1,1,beardColor,beardColor);
    p.setEyeColor(eyeColor);
    p.setComponentVariation(3,15,0,0);
    p.setComponentVariation(4,preview.gender==='female'?15:21,0,0);
    p.setComponentVariation(6,preview.gender==='female'?5:34,0,0);
    p.setComponentVariation(8,15,0,0);
    p.setComponentVariation(11,15,0,0);
  };
  if(p.model!==hash){p.model=hash;setTimeout(apply,120)}else apply();
}
function openDevice(name: 'phone'|'tablet'|'inventory'|'settings'): void { if(!characterActive)return;deviceOpen=true;mp.gui.cursor.show(true,true);ensureBrowser().execute(`window.noveraOpenDevice?.(${JSON.stringify(name)})`);if(name==='phone')mp.events.callRemote(PhoneEvents.state);if(name==='tablet')mp.events.callRemote(WorldEvents.request); }
function closeDevice(): void { deviceOpen=false;mp.gui.cursor.show(false,false); }

mp.events.add('playerReady',()=>{ensureBrowser();openAuthCamera();showAuthCursor();mp.events.callRemote(AuthEvents.clientReady)});
mp.events.add('render',()=>{
  if(authActive||creatorActive){
    mp.game.ui.displayHud(false);
    mp.game.ui.displayRadar(false);
    mp.game.controls.disableAllControlActions(0);
    mp.game.controls.disableAllControlActions(1);
    mp.game.controls.disableAllControlActions(2);
  }
});
mp.events.add('novera:cef:ready',()=>{showAuthCursor();setTimeout(showAuthCursor,100);});
mp.events.add(AuthEvents.result,(p:string)=>execute('window.noveraAuthResult',p));
mp.events.add(AuthEvents.characters,(p:string)=>execute('window.noveraCharacters',p));
mp.events.add(CharacterEvents.list,(p:string)=>execute('window.noveraCharacters',p));
mp.events.add(CharacterEvents.result,(p:string)=>execute('window.noveraCharacterResult',p));
mp.events.add(CharacterEvents.creatorOpen,(slot:number)=>{openCreatorCamera();ensureBrowser().execute(`window.noveraOpenCreator?.(${Number(slot)})`)});
mp.events.add(CharacterEvents.selected,(p:string)=>{closeAuthCamera();closeCreatorCamera();characterActive=true;setNativeUiVisible(true);execute('window.noveraCharacterSelected',p);mp.gui.cursor.show(false,false);mp.events.callRemote(GameplayEvents.bootstrap);mp.events.callRemote(WorldEvents.request)});
mp.events.add(GameplayEvents.state,(p:string)=>execute('window.noveraGameplayState',p));
mp.events.add(WorldEvents.result,(p:string)=>execute('window.noveraWorldState',p));
mp.events.add(PhoneEvents.state,(p:string)=>execute('window.noveraPhoneState',p));
mp.events.add(PhoneEvents.conversation,(p:string)=>execute('window.noveraPhoneConversation',p));

mp.events.add('novera:cef:login',(l:string,p:string)=>{execute('window.noveraAuthBridgeAck','login');mp.events.callRemote(AuthEvents.login,JSON.stringify({login:l,password:p}));});
mp.events.add('novera:cef:register',(l:string,p:string)=>{execute('window.noveraAuthBridgeAck','register');mp.events.callRemote(AuthEvents.register,JSON.stringify({login:l,password:p}));});
mp.events.add('novera:cef:creator:open',(s:number)=>mp.events.callRemote(CharacterEvents.creatorOpen,Number(s)));
mp.events.add('novera:cef:creator:preview',(raw:string)=>{if(!creatorActive)return;try{applyAppearance(JSON.parse(raw) as CharacterCreatorPreview)}catch{}});
mp.events.add('novera:cef:creator:rotate',(d:number)=>{if(!creatorActive)return;creatorYaw=(creatorYaw+Math.max(-20,Math.min(20,Number(d)||0)))%360;mp.players.local.setHeading(creatorYaw+180);updateCreatorCamera()});
mp.events.add('novera:cef:creator:zoom',(d:number)=>{if(!creatorActive)return;creatorZoom=Math.max(1.25,Math.min(3.25,creatorZoom+Math.max(-.35,Math.min(.35,Number(d)||0))));updateCreatorCamera()});
mp.events.add('novera:cef:character:create',(raw:string)=>mp.events.callRemote(CharacterEvents.create,raw));
mp.events.add('novera:cef:character:select',(id:string)=>mp.events.callRemote(CharacterEvents.select,id));
mp.events.add('novera:cef:character:delete',(id:string)=>mp.events.callRemote(CharacterEvents.delete,id));
mp.events.add('novera:cef:device:close',closeDevice);
mp.events.add('novera:cef:bank:deposit',(amount:number)=>mp.events.callRemote(GameplayEvents.bankDeposit,Number(amount)));
mp.events.add('novera:cef:bank:withdraw',(amount:number)=>mp.events.callRemote(GameplayEvents.bankWithdraw,Number(amount)));
mp.events.add('novera:cef:bank:transfer',(account:string,amount:number)=>mp.events.callRemote(GameplayEvents.bankTransfer,String(account),Number(amount)));
mp.events.add('novera:cef:inventory:move',(from:number,to:number)=>mp.events.callRemote(GameplayEvents.inventoryMove,Number(from),Number(to)));
mp.events.add('novera:cef:inventory:split',(from:number,to:number,amount:number)=>mp.events.callRemote(GameplayEvents.inventorySplit,Number(from),Number(to),Number(amount)));
mp.events.add('novera:cef:inventory:use',(slot:number)=>mp.events.callRemote(GameplayEvents.inventoryUse,Number(slot)));
mp.events.add('novera:cef:vehicle:spawn',(id:string)=>mp.events.callRemote(WorldEvents.vehicleSpawn,id));
mp.events.add('novera:cef:phone:state',()=>mp.events.callRemote(PhoneEvents.state));
mp.events.add('novera:cef:phone:add-contact',(id:string,alias:string)=>mp.events.callRemote(PhoneEvents.addContact,String(id),String(alias)));
mp.events.add('novera:cef:phone:conversation',(id:string)=>mp.events.callRemote(PhoneEvents.conversation,String(id)));
mp.events.add('novera:cef:phone:message',(id:string,body:string)=>mp.events.callRemote(PhoneEvents.sendMessage,String(id),String(body)));

mp.keys.bind(0x26,true,()=>{if(!deviceOpen)openDevice('phone');else closeDevice()});
mp.keys.bind(0x28,true,()=>{if(!deviceOpen)openDevice('tablet');else closeDevice()});
mp.keys.bind(0x71,true,()=>{if(!deviceOpen)openDevice('settings');else closeDevice()});
mp.keys.bind(0x49,true,()=>{if(!deviceOpen)openDevice('inventory');else closeDevice()});
