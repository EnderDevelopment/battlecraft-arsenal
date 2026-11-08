import { world, system } from '@minecraft/server';

const utilityItems = {
  'battlecraft:bandage': 4,
  'battlecraft:medkit': 12
};
const mines = new Map();
const charges = new Map();

function inventory(player) {
  return player.getComponent('minecraft:inventory')?.container;
}

function removeOne(player, typeId) {
  const container = inventory(player);
  if (!container) return false;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId !== typeId) continue;
    stack.amount -= 1;
    container.setItem(slot, stack.amount ? stack : undefined);
    return true;
  }
  return false;
}

function heal(player, amount) {
  const health = player.getComponent('minecraft:health');
  if (!health) return;
  health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + amount));
  player.sendMessage(`§aRecovered ${amount} health.`);
}

function explode(dimension, location, power, ownerId) {
  try {
    dimension.createExplosion(location, power, { breaksBlocks: true, causesFire: false, source: undefined });
    dimension.getEntities({ location, maxDistance: power + 2 }).forEach(entity => {
      if (entity.id !== ownerId && entity.typeId !== 'minecraft:item' && entity.typeId !== 'minecraft:xp_orb') {
        try { entity.applyDamage(power * 4); } catch {}
      }
    });
  } catch {}
}

function deploy(player, typeId) {
  const location = { x: Math.floor(player.location.x), y: Math.floor(player.location.y), z: Math.floor(player.location.z) };
  const key = `${player.dimension.id}:${location.x}:${location.y}:${location.z}`;
  if (typeId === 'battlecraft:landmine') {
    if (mines.has(key)) return player.sendMessage('§cA device is already deployed here.');
    if (!removeOne(player, typeId)) return;
    mines.set(key, { dimension: player.dimension, location, ownerId: player.id });
    player.sendMessage('§eLandmine deployed.');
  } else {
    if (charges.has(key)) return player.sendMessage('§cA charge is already attached here.');
    if (!removeOne(player, typeId)) return;
    charges.set(key, { dimension: player.dimension, location, ownerId: player.id });
    player.sendMessage('§eC4 charge placed. Use the detonator to trigger it.');
  }
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source;
  if (!player || player.typeId !== 'minecraft:player') return;
  const typeId = event.itemStack.typeId;
  if (utilityItems[typeId]) {
    if (removeOne(player, typeId)) heal(player, utilityItems[typeId]);
    return;
  }
  if (typeId === 'battlecraft:grenade') {
    if (!removeOne(player, typeId)) return;
    const direction = player.getViewDirection();
    const location = player.getHeadLocation();
    system.runTimeout(() => explode(player.dimension, { x: location.x + direction.x * 4, y: location.y + direction.y * 4, z: location.z + direction.z * 4 }, 3, player.id), 20);
    player.sendMessage('§eGrenade thrown.');
    return;
  }
  if (typeId === 'battlecraft:landmine' || typeId === 'battlecraft:c4') {
    deploy(player, typeId);
    return;
  }
  if (typeId === 'battlecraft:detonator') {
    let count = 0;
    for (const [key, charge] of charges) {
      if (charge.ownerId !== player.id || charge.dimension.id !== player.dimension.id) continue;
      explode(charge.dimension, charge.location, 4, player.id);
      charges.delete(key);
      count++;
    }
    player.sendMessage(count ? `§cDetonated ${count} charge(s).` : '§7No active charges.');
    return;
  }
  if (typeId === 'battlecraft:binoculars') {
    const direction = player.getViewDirection();
    const target = { x: player.location.x + direction.x * 32, y: player.location.y + direction.y * 32, z: player.location.z + direction.z * 32 };
    player.sendMessage(`§bBinoculars: looking toward ${Math.floor(target.x)}, ${Math.floor(target.y)}, ${Math.floor(target.z)}.`);
    return;
  }
  if (typeId === 'battlecraft:night_vision_goggles') {
    player.addEffect('night_vision', 600, { amplifier: 0, showParticles: false });
    player.sendMessage('§bNight vision enabled for 30 seconds.');
    return;
  }
  if (typeId === 'battlecraft:military_keycard') {
    player.sendMessage('§6Military keycard accepted by Battlecraft security systems.');
    return;
  }
  if (typeId === 'battlecraft:ammunition_crate') {
    if (!removeOne(player, typeId)) return;
    player.runCommand('give @s battlecraft:556 32');
    player.runCommand('give @s battlecraft:762 32');
    player.runCommand('give @s battlecraft:9mm 32');
    player.sendMessage('§aAmmunition crate opened.');
    return;
  }
  if (typeId === 'battlecraft:weapon_crate') {
    if (!removeOne(player, typeId)) return;
    player.runCommand('give @s battlecraft:mp5 1');
    player.runCommand('give @s battlecraft:ak47 1');
    player.sendMessage('§aWeapon crate opened.');
    return;
  }
  if (typeId === 'battlecraft:supply_drop') {
    if (!removeOne(player, typeId)) return;
    player.runCommand('give @s battlecraft:ammunition_crate 2');
    player.runCommand('give @s battlecraft:medkit 2');
    player.runCommand('give @s battlecraft:bandage 4');
    player.sendMessage('§aSupply drop distributed.');
  }
});

system.runInterval(() => {
  for (const [key, mine] of mines) {
    const nearby = mine.dimension.getEntities({ location: mine.location, maxDistance: 1.6 });
    const target = nearby.find(entity => entity.id !== mine.ownerId && entity.typeId !== 'minecraft:item' && entity.typeId !== 'minecraft:xp_orb');
    if (target) {
      explode(mine.dimension, mine.location, 3, mine.ownerId);
      mines.delete(key);
    }
  }
}, 10);

world.afterEvents.scriptEventReceive.subscribe(event => {
  const player = event.sourceEntity;
  if (!player || player.typeId !== 'minecraft:player' || event.id !== 'battlecraft:equipment') return;
  const args = event.message.trim().split(/\s+/);
  if (args[0] === 'supply') player.runCommand('give @s battlecraft:supply_drop 1');
  if (args[0] === 'stations') player.sendMessage('§6Stations: Barracks, Military Tower, Command Post, Weapon Workbench, Supply Center.');
});
