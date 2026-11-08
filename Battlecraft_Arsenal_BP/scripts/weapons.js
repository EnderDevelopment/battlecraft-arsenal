import { world, system, EntityDamageCause } from '@minecraft/server';

const weapons = {
  'battlecraft:m1911': { ammo: 'battlecraft:45acp', damage: 7, cooldown: 8, magazine: 7 },
  'battlecraft:glock17': { ammo: 'battlecraft:9mm', damage: 5, cooldown: 5, magazine: 17 },
  'battlecraft:revolver': { ammo: 'battlecraft:45acp', damage: 10, cooldown: 12, magazine: 6 },
  'battlecraft:desert_eagle': { ammo: 'battlecraft:45acp', damage: 13, cooldown: 16, magazine: 7 },
  'battlecraft:mp5': { ammo: 'battlecraft:9mm', damage: 5, cooldown: 3, magazine: 30 },
  'battlecraft:uzi': { ammo: 'battlecraft:9mm', damage: 4, cooldown: 2, magazine: 32 },
  'battlecraft:p90': { ammo: 'battlecraft:9mm', damage: 5, cooldown: 2, magazine: 50 },
  'battlecraft:ak47': { ammo: 'battlecraft:762', damage: 8, cooldown: 4, magazine: 30 },
  'battlecraft:scar_h': { ammo: 'battlecraft:762', damage: 10, cooldown: 5, magazine: 20 },
  'battlecraft:pump_shotgun': { ammo: 'battlecraft:12gauge', damage: 40, cooldown: 18, magazine: 6 },
  'battlecraft:double_barrel': { ammo: 'battlecraft:12gauge', damage: 60, cooldown: 24, magazine: 2 },
  'battlecraft:bolt_sniper': { ammo: 'battlecraft:762', damage: 32, cooldown: 35, magazine: 5 },
  'battlecraft:barrett': { ammo: 'battlecraft:762', damage: 45, cooldown: 48, magazine: 10 },
  'battlecraft:m249': { ammo: 'battlecraft:556', damage: 7, cooldown: 3, magazine: 100 },
  'battlecraft:minigun': { ammo: 'battlecraft:556', damage: 6, cooldown: 1, magazine: 200 },
  'battlecraft:rpg': { ammo: 'battlecraft:rocket', damage: 60, cooldown: 60, magazine: 1 }
};

const states = new Map();
const inventory = player => player.getComponent('minecraft:inventory')?.container;

function take(player, id, amount = 1) {
  const container = inventory(player);
  if (!container) return false;
  let available = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId === id) available += stack.amount;
  }
  if (available < amount) return false;
  let remaining = amount;
  for (let slot = 0; slot < container.size && remaining > 0; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId !== id) continue;
    const removed = Math.min(stack.amount, remaining);
    stack.amount -= removed;
    remaining -= removed;
    container.setItem(slot, stack.amount > 0 ? stack : undefined);
  }
  return true;
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source;
  const weapon = weapons[event.itemStack.typeId];
  if (!weapon || player.typeId !== 'minecraft:player') return;
  const key = `${player.id}:${event.itemStack.typeId}`;
  const state = states.get(key) ?? { ammo: 0, lastShot: -weapon.cooldown };

  if (player.isSneaking) {
    const needed = weapon.magazine - state.ammo;
    if (needed > 0 && take(player, weapon.ammo, needed)) {
      state.ammo = weapon.magazine;
      player.sendMessage('§aWeapon reloaded.');
    } else if (needed > 0) {
      player.sendMessage('§cNot enough ammunition to reload.');
    }
    states.set(key, state);
    return;
  }

  if (system.currentTick - state.lastShot < weapon.cooldown || state.ammo <= 0) return;
  state.ammo--;
  state.lastShot = system.currentTick;
  states.set(key, state);
  const origin = player.getHeadLocation();
  const direction = player.getViewDirection();
  try {
    const projectile = player.dimension.spawnEntity('minecraft:snowball', origin);
    projectile.applyImpulse({ x: direction.x * 3, y: direction.y * 3, z: direction.z * 3 });
    projectile.nameTag = `bc|${weapon.damage}|${player.id}`;
  } catch {
    states.delete(key);
  }
});

world.afterEvents.projectileHitEntity.subscribe(event => {
  const hit = event.getEntityHit()?.entity;
  if (!hit) return;
  const data = (event.projectile.nameTag ?? '').split('|');
  if (Number(data[1]) > 0 && data[2] !== hit.id) {
    try { hit.applyDamage(Number(data[1]), { cause: EntityDamageCause.projectile }); } catch {}
  }
});

world.afterEvents.playerLeave.subscribe(event => {
  for (const key of states.keys()) if (key.startsWith(`${event.playerId}:`)) states.delete(key);
});
