export const PhoneEvents = { state:'novera:phone:state', addContact:'novera:phone:contact:add', sendMessage:'novera:phone:message:send', conversation:'novera:phone:conversation' } as const;
export const BusinessEvents = { state:'novera:business:state', deposit:'novera:business:deposit', withdraw:'novera:business:withdraw' } as const;
export const GovernmentEvents = { state:'novera:government:state', fineIssue:'novera:government:fine:issue', finePay:'novera:government:fine:pay' } as const;
export const AdminEvents = { reportCreate:'novera:admin:report:create', reportState:'novera:admin:report:state', punish:'novera:admin:punish' } as const;

export interface PhoneContactView { id:string; characterId:string; alias:string; }
export interface PhoneMessageView { id:string; senderId:string; receiverId:string; body:string; createdAt:string; readAt:string|null; }
export interface BusinessView { id:string; name:string; type:string; balance:number; role:string; salary:number; }
export interface FineView { id:string; amount:number; reason:string; status:string; createdAt:string; }
