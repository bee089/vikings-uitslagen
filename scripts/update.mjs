import {mkdir,writeFile} from 'node:fs/promises';
const CLUB='b096fce6-238c-4f01-8cb9-1ef2fe6e47a0';
const FED='52cfa65e-9782-4a81-ab35-e2f981fcb7a9';
const dateInNL=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const today=dateInNL();const weekday=new Date(today+'T12:00:00Z').getUTCDay();
const start=addDays(today,-weekday),end=addDays(start,6);
let all=[];
for(let skip=0;skip<1000;skip+=100){
 const p=new URLSearchParams({startDate:start,endDate:end,organisationId:CLUB,skipCount:String(skip),maxResultCount:'100',sorting:'date asc, startTime asc'});
 const res=await fetch('https://api.foys.io/competition/public-api/v1/matches?'+p,{headers:{'X-Federationid':FED},signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('FOYS HTTP '+res.status);
 const data=await res.json();if(!Array.isArray(data.items))throw Error('FOYS antwoord bevat geen items');
 all.push(...data.items);if(data.items.length<100)break;
}
const matches=all.filter(m=>{const date=String(m.date||'').slice(0,10);return date>=start&&date<=end&&(m.homeOrganisation?.id===CLUB||m.awayOrganisation?.id===CLUB)&&!['cancelled','canceled','afgelast','final'].includes(String(m.status||'').toLowerCase())}).sort((a,b)=>(String(a.date).slice(0,10)+String(a.startTime||'')).localeCompare(String(b.date).slice(0,10)+String(b.startTime||'')));
await mkdir('wedstrijdoverzicht',{recursive:true});
await writeFile('wedstrijdoverzicht/wedstrijden.json',JSON.stringify({start,end,updatedAt:new Date().toISOString(),matches},null,2)+'\n');
console.log(`Opgeslagen: ${matches.length} wedstrijden (${start} t/m ${end})`);
