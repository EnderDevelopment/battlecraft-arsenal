import { world } from '@minecraft/server';
const factions=['Bandits','Raiders','Mercenaries','Military','Player Army'];
const rel={Bandits:['Raiders'],Raiders:['Bandits'],Mercenaries:[],Military:[], 'Player Army':[]};
const k=()=> 'bc:faction_data'; const base=()=>Object.fromEntries(factions.map(f=>[f,0]));
function read(p){try{return JSON.parse(p.getDynamicProperty(k(p))??'null')??base()}catch{return base()}}
function write(p,d){try{p.setDynamicProperty(k(p),JSON.stringify(d))}catch{}}
function show(p){const d=read(p);p.sendMessage(`§6Faction reputation §f${factions.map(f=>`${f}: ${d[f]}`).join(' | ')}`)}
world.afterEvents.scriptEventReceive.subscribe(e=>{const p=e.sourceEntity;if(!p||p.typeId!=='minecraft:player')return;if(e.id==='battlecraft:faction'){const a=e.message.trim().split(/\s+/);if(a[0]==='status'){show(p);return}if(factions.includes(a[0])){const d=read(p);const change=Number(a[1]??0);if(!Number.isFinite(change)){p.sendMessage('§cReputation change must be a number.');return}d[a[0]]=Math.max(-100,Math.min(100,(d[a[0]]??0)+change));write(p,d);show(p)}}});
world.afterEvents.entityDie.subscribe(e=>{const victim=e.deadEntity;const killer=e.damageSource?.damagingEntity;if(!killer||killer.typeId!=='minecraft:player')return;for(const f of factions.slice(0,4))if(victim.hasTag(`bc_faction_${f.toLowerCase().replace(' ','_')}`)){const d=read(killer);d[f]=Math.max(-100,d[f]-5);write(killer,d)}});
export { factions, rel };
