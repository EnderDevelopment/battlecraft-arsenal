import { world, system } from '@minecraft/server';

const SQUAD_LIMIT = 3;
const SOLDIER_LIMIT = 16;
const PER_SQUAD = 6;
const COST = 5;
const key = () => 'bc:army_data';
const defaults = () => ({ squads: [{ name: 'Alpha', command: 'follow', leader: true, soldiers: [], waypoints: [], formation: 'line' }], rank: 0, points: 0, reputation: {}, territory: {}, quests: {}, currency: 0 });
function data(p) { try { return JSON.parse(p.getDynamicProperty(key(p)) ?? 'null') ?? defaults(); } catch { return defaults(); } }
function save(p, d) { try { p.setDynamicProperty(key(p), JSON.stringify(d)); } catch {} }
function nearby(p, radius = 12) { return p.dimension.getEntities({ location: p.location, maxDistance: radius, excludeTypes: ['minecraft:player'] }); }
function squadEntities(p, squad) { return squad.soldiers.map(id => { try { return p.dimension.getEntities({}).find(e => e.id === id); } catch { return undefined; } }).filter(Boolean); }
function setCommand(p, d, squad, command) {
  squad.command = command;
  for (const soldier of squadEntities(p, squad)) {
    try {
      soldier.addTag(`bc_owner_${p.id}`); soldier.addTag('bc_player_army');
      if (command === 'follow') soldier.teleport(p.location);
      if (command === 'stay' || command === 'guard') soldier.addTag('bc_hold_position'); else soldier.removeTag('bc_hold_position');
      if (command === 'attack') soldier.addTag('bc_attack_order'); else soldier.removeTag('bc_attack_order');
      if (command === 'patrol') soldier.addTag('bc_patrol_order'); else soldier.removeTag('bc_patrol_order');
    } catch {}
  }
}
function status(p, d) { const n = d.squads.reduce((a,s)=>a+s.soldiers.length,0); return `Army ${n}/${SOLDIER_LIMIT} | Rank ${['Recruit','Soldier','Sergeant','Captain','Commander','General'][d.rank]} | RP ${d.points}`; }
function menu(p) {
  const d = data(p);
  p.sendMessage('§6[Army Radio] §fRecruit: use a tagged soldier within 6 blocks while holding 5 gold ingots. Commands: /scriptevent battlecraft:command follow|stay|guard|patrol|attack.');
  p.sendMessage(`§eSquads ${d.squads.length}/${SQUAD_LIMIT}; ${d.squads.map((s,i)=>`${i+1}:${s.name} ${s.command} ${s.soldiers.length}/${PER_SQUAD}`).join(' | ')}`);
  p.sendMessage('§7Use /scriptevent battlecraft:squad create|leader|line|spread and /scriptevent battlecraft:status.');
}
world.afterEvents.playerSpawn.subscribe(({ player }) => { const d=data(player); save(player,d); });
world.beforeEvents.chatSend.subscribe(e => {
  const m=e.message.trim().toLowerCase();
  if (m === '!army' || m === '!radio') { e.cancel=true; system.run(()=>menu(e.sender)); }
});
world.afterEvents.scriptEventReceive.subscribe(e => {
  const p=e.sourceEntity; if (!p || p.typeId !== 'minecraft:player') return;
  const d=data(p), id=e.id, args=e.message.trim().split(/\s+/), first=d.squads[0];
  if (id === 'battlecraft:menu' || id === 'battlecraft:status') { menu(p); p.onScreenDisplay.setActionBar(status(p,d)); return; }
  if (id === 'battlecraft:command') { const cmd=args[0]; if (!['follow','stay','guard','patrol','attack'].includes(cmd)) { p.sendMessage('Commands: follow, stay, guard, patrol, attack'); return; } setCommand(p,d,first,cmd); save(p,d); p.sendMessage(`Squad ${first.name}: ${cmd}`); return; }
  if (id === 'battlecraft:squad') {
    const op=args[0];
    if (op === 'create' && d.squads.length < SQUAD_LIMIT) d.squads.push({ name: args[1] ?? `Squad${d.squads.length+1}`, command:'follow', leader:false, soldiers:[], waypoints:[], formation:'line' });
    else if (op === 'leader') { d.squads.forEach((s,i)=>s.leader=i===Number(args[1])-1); }
    else if (op === 'line' || op === 'spread') first.formation=op;
    else { p.sendMessage('Usage: battlecraft:squad create [name], leader [1-3], line, spread'); return; }
    save(p,d); menu(p); return;
  }
  if (id === 'battlecraft:recruit') {
    let squad=d.squads.find(s=>s.name===args[0]) ?? first;
    const count=d.squads.reduce((n,s)=>n+s.soldiers.length,0);
    const target=nearby(p,6).find(e=>e.hasTag('bc_recruitable') && !e.hasTag(`bc_owner_${p.id}`));
    if (!target || count>=SOLDIER_LIMIT || squad.soldiers.length>=PER_SQUAD) { p.sendMessage('No available recruit or squad capacity reached.'); return; }
    const inv=p.getComponent('minecraft:inventory')?.container; let slot=-1;
    if(inv) for(let i=0;i<inv.size;i++){const it=inv.getItem(i);if(it?.typeId==='minecraft:gold_ingot'&&it.amount>=COST){slot=i;break;}}
    if(slot<0){p.sendMessage(`Recruitment costs ${COST} gold ingots.`);return;}
    const stack=inv.getItem(slot); stack.amount-=COST; inv.setItem(slot,stack.amount?stack:undefined);
    squad.soldiers.push(target.id); target.addTag(`bc_owner_${p.id}`);target.addTag('bc_player_army');target.removeTag('bc_recruitable');save(p,d);p.sendMessage(`Recruited into ${squad.name}.`);return;
  }
  if (id === 'battlecraft:waypoint') { if(first.waypoints.length>=4) first.waypoints.shift(); first.waypoints.push({x:p.location.x,y:p.location.y,z:p.location.z,dimension:p.dimension.id}); save(p,d); p.sendMessage(`Patrol waypoint ${first.waypoints.length}/4 recorded.`); }
});
system.runInterval(()=>{for(const p of world.getAllPlayers()){const d=data(p);for(const s of d.squads){for(const soldier of squadEntities(p,s)){try{if(s.command==='follow'){const dx=soldier.location.x-p.location.x,dy=soldier.location.y-p.location.y,dz=soldier.location.z-p.location.z;if(dx*dx+dy*dy+dz*dz>144)soldier.teleport(p.location);}if(s.command==='guard'||s.command==='stay')soldier.removeTag('bc_attack_order');}catch{}}}p.onScreenDisplay.setActionBar(status(p,d));}},100);
export { data, save };
