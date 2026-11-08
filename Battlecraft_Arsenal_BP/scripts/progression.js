import { world } from '@minecraft/server';
const names=['Recruit','Soldier','Sergeant','Captain','Commander','General'];const k=()=> 'bc:progress_data';const init=()=>({points:0,quests:{},rank:0});
function read(p){try{return JSON.parse(p.getDynamicProperty(k(p))??'null')??init()}catch{return init()}}function write(p,d){try{p.setDynamicProperty(k(p),JSON.stringify(d))}catch{}}
function add(p,n){const d=read(p);d.points+=n;d.rank=Math.min(5,Math.floor(d.points/100));write(p,d);p.sendMessage(`§e+${n} Rank Points §7| ${names[d.rank]}`)}
world.afterEvents.scriptEventReceive.subscribe(e=>{const p=e.sourceEntity;if(!p||p.typeId!=='minecraft:player')return;const a=e.message.trim().split(/\s+/);if(e.id==='battlecraft:quest'&&a[0]==='complete'){const d=read(p);if(d.quests[a[1]])return;d.quests[a[1]]=true;write(p,d);add(p,Number(a[2]??10))}if(e.id==='battlecraft:rank'){const d=read(p);p.sendMessage(`§6Rank: ${names[d.rank]} §7(${d.points} RP)`);}});
world.afterEvents.entityDie.subscribe(e=>{const p=e.damageSource?.damagingEntity;if(p?.typeId==='minecraft:player'&&e.deadEntity.hasTag('bc_enemy'))add(p,10)});
export { add };
