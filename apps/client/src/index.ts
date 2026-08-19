import { AuthEvents, CharacterEvents, GameplayEvents, WorldEvents, type CharacterCreatorPreview } from '@novera/shared';

let uiBrowser: BrowserMp | null = null;
let creatorCamera: CameraMp | null = null;
let creatorActive = false;
let creatorYaw = 180;
let creatorZoom = 2.15;
let characterActive = false;
let deviceOpen = false;
const CREATOR_TARGET = new mp.Vector3(402.89, -996.76, -98.25);

function ensureBrowser(): BrowserMp { uiBrowser ??= mp.browsers.new('package://novera/cef/index.html'); return uiBrowser; }
function execute(fn: string, payload?: string): void { ensureBrowser().execute(payload === undefined ? `${fn}?.()` : `${fn}?.(${JSON.stringify(payload)})`); }
function updateCreatorCamera(): void { if(!creatorCamera)return; const r=creatorYaw*Math.PI/180; const x=CREATOR_TARGET.x+Math.sin(r)*creatorZoom,y=CREATOR_TARGET.y+Math.cos(r)*creatorZoom; creatorCamera.setCoord(x,y,CREATOR_TARGET.z+.55); creatorCamera.pointAtCoord(CREATOR_TARGET.x,CREATOR_TARGET.y,CREATOR_TARGET.z+.35); }
function openCreatorCamera(): void { creatorActive=true;creatorYaw=180;creatorZoom=2.15;mp.players.local.freezePosition(true);creatorCamera?.destroy();creatorCamera=mp.cameras.new('default',new mp.Vector3(402.89,-999,-97.7),new mp.Vector3(0,0,0),38);creatorCamera.setActive(true);updateCreatorCamera();mp.game.cam.renderScriptCams(true,false,0,true,false); }
function closeCreatorCamera(): void { creatorActive=false;mp.players.local.freezePosition(false);if(creatorCamera){creatorCamera.setActive(false);creatorCamera.destroy();creatorCamera=null}mp.game.cam.renderScriptCams(false,false,0,true,false); }
function applyAppearance(preview: CharacterCreatorPreview): void { const p=mp.players.local,hash=mp.game.joaat(preview.gender==='female'?'mp_f_freemode_01':'mp_m_freemode_01'); const apply=()=>{p.setHeadBlendData(preview.appearance.mother,preview.appearance.father,0,preview.appearance.mother,preview.appearance.father,0,preview.appearance.resemblance,preview.appearance.skinMix,0,false);p.setComponentVariation(2,preview.appearance.hair,0,0);p.setHairColor(preview.appearance.hairColor,preview.appearance.hairColor);p.setHeadOverlay(2,preview.appearance.eyebrow,1,0,0);p.setHeadOverlayColor(2,1,preview.appearance.eyebrowColor,preview.appearance.eyebrowColor);p.setHeadOverlay(1,preview.gender==='male'?preview.appearance.beard:255,1,0,0);if(preview.gender==='male')p.setHeadOverlayColor(1,1,preview.appearance.beardColor,preview.appearance.beardColor);p.setEyeColor(preview.appearance.eyeColor);p.setComponentVariation(3,15,0,0);p.setComponentVariation(4,preview.gender==='female'?15:21,0,0);p.setComponentVariation(6,preview.gender==='female'?5:34,0,0);p.setComponentVariation(8,15,0,0);p.setComponentVariation(11,15,0,0)}; if(p.model!==hash){p.model=hash;setTimeout(apply,120)}else apply(); }
function openDevice(name: 'phone'|'tablet'|'inventory'|'settings'): void { if(!characterActive)return;deviceOpen=true;mp.gui.cursor.show(true,true);ensureBrowser().execute(`window.noveraOpenDevice?.(${JSON.stringify(name)})`); }
function closeDevice(): void { deviceOpen=false;mp.gui.cursor.show(false,false); }

mp.events.add('playerReady',()=>{ensureBrowser();mp.gui.cursor.show(true,true);mp.events.callRemote(AuthEvents.clientReady)});
mp.events.add(AuthEvents.result,(p:string)=>execute('window.noveraAuthResult',p));
mp.events.add(AuthEvents.characters,(p:string)=>execute('window.noveraCharacters',p));
mp.events.add(CharacterEvents.list,(p:string)=>execute('window.noveraCharacters',p));
mp.events.add(CharacterEvents.result,(p:string)=>execute('window.noveraCharacterResult',p));
mp.events.add(CharacterEvents.creatorOpen,(slot:number)=>{openCreatorCamera();ensureBrowser().execute(`window.noveraOpenCreator?.(${Number(slot)})`)});
mp.events.add(CharacterEvents.selected,(p:string)=>{closeCreatorCamera();characterActive=true;execute('window.noveraCharacterSelected',p);mp.gui.cursor.show(false,false);mp.events.callRemote(GameplayEvents.bootstrap);mp.events.callRemote(WorldEvents.request)});
mp.events.add(GameplayEvents.state,(p:string)=>execute('window.noveraGameplayState',p));
mp.events.add(WorldEvents.result,(p:string)=>execute('window.noveraWorldState',p));

mp.events.add('novera:cef:login',(l:string,p:string)=>mp.events.callRemote(AuthEvents.login,JSON.stringify({login:l,password:p})));
mp.events.add('novera:cef:register',(l:string,p:string)=>mp.events.callRemote(AuthEvents.register,JSON.stringify({login:l,password:p})));
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

mp.keys.bind(0x26,true,()=>{if(!deviceOpen)openDevice('phone');else closeDevice()});
mp.keys.bind(0x28,true,()=>{if(!deviceOpen)openDevice('tablet');else closeDevice()});
mp.keys.bind(0x71,true,()=>{if(!deviceOpen)openDevice('settings');else closeDevice()});
mp.keys.bind(0x49,true,()=>{if(!deviceOpen)openDevice('inventory');else closeDevice()});
