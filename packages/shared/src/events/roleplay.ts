export const PoliceEvents={state:'novera:police:state',wantedSet:'novera:police:wanted:set',caseCreate:'novera:police:case:create',evidenceCreate:'novera:police:evidence:create'} as const;
export const MedicalEvents={state:'novera:medical:state',recordUpdate:'novera:medical:record:update',treat:'novera:medical:treat'} as const;
export const ProgressionEvents={state:'novera:progression:state',questStart:'novera:quest:start'} as const;
export interface WantedView{id:string;level:number;reason:string;createdAt:string}
export interface InjuryView{id:string;type:string;bodyPart:string;severity:number;treated:boolean;occurredAt:string}
export interface QuestView{key:string;stage:string;status:string;progress:Record<string,unknown>}
