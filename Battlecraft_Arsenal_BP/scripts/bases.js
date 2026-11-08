import { world } from '@minecraft/server';
const bases=['Bandit Camp','Raider Outpost','Mercenary Compound','Military Bunker','Command Fortress','Juggernaut Warzone'];
world.afterEvents.scriptEventReceive.subscribe(e=>{const p=e.sourceEntity;if(!p||p.typeId!=='minecraft:player'||e.id!=='battlecraft:base')return;const a=e.message.trim().split(/\s+/);if(a[0]==='list')p.sendMessage(`§6Bases: §f${bases.join(', ')}`);if(a[0]==='alarm')p.dimension.getEntities({location:p.location,maxDistance:32}).forEach(x=>{if(x.hasTag('bc_enemy'))try{x.addTag('bc_attack_order')}catch{}})});
export { bases };
