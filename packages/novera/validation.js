'use strict';
exports.int=function(v,min,max,fallback){const n=Math.floor(Number(v));if(!Number.isFinite(n))return fallback;if(min!=null&&n<min)return fallback;if(max!=null&&n>max)return fallback;return n;};
exports.age=function(v){return exports.int(v,18,90,null);};
exports.name=function(v){const s=String(v||'').trim();return /^[A-Za-zА-Яа-яЁё-]{2,24}$/.test(s)?s:null;};
exports.headId=function(v,fallback){return exports.int(v,0,45,fallback==null?0:fallback);};
exports.unit=function(v,fallback){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;};
