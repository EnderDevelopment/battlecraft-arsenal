import { world, DynamicPropertiesDefinition } from '@minecraft/server';

world.afterEvents.worldInitialize.subscribe(event => {
  const definition = new DynamicPropertiesDefinition();
  definition.defineString('bc:army_data', 32767);
  definition.defineString('bc:faction_data', 32767);
  definition.defineString('bc:progress_data', 32767);
  definition.defineString('bc:territory_data', 32767);
  event.propertyRegistry.registerEntityType(definition, 'minecraft:player');
});
