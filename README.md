# Battlecraft Arsenal Minecraft Bedrock Addon

Battlecraft Arsenal is a Minecraft Bedrock Edition addon with a Behavior Pack and Resource Pack that adds 16 military-style weapon items, ammunition, firing and reload systems, projectile damage, crafting recipes, survival equipment, army commands, factions, territories, quests, ranks, and multiplayer-oriented equipment ownership.

## Install

1. Use Minecraft Bedrock Edition 1.21.50 or newer.
2. Generate the resource assets from the project root:

   ```sh
   python Battlecraft_Arsenal_RP/tools/generate_assets.py
   ```

   Install Python 3 first. Install `ffmpeg` and add it to your system PATH if you want the script to generate the OGG sound files.

3. Import or copy both folders into Minecraft:

   - `Battlecraft_Arsenal_BP`
   - `Battlecraft_Arsenal_RP`

4. Activate both packs in the same world.
5. Place the Resource Pack above the Behavior Pack in the pack list.
6. Enable the Script API experiment if Minecraft requests it.
7. Create or load the world in Survival or multiplayer mode.

The generated icons are functional placeholder assets. The resource pack also includes a fallback weapon geometry and animation set.

## Use

Use the weapon item in your hand to fire in the direction you are looking. Weapon ammunition, damage, cooldown, and magazine sizes are defined in the Behavior Pack script.

Hold the weapon while sneaking to reload it. Reloading consumes the matching ammunition item from the player inventory.

The 16 weapons are:

- M1911
- Glock 17
- Revolver
- Desert Eagle
- MP5
- Uzi
- P90
- AK-47
- SCAR-H
- Pump Shotgun
- Double-Barrel Shotgun
- Bolt-Action Sniper
- Barrett
- M249
- Minigun
- RPG

The available ammunition types are 9mm, .45 ACP, 5.56, 7.62, 12 Gauge, and rockets.

Crafting recipes are stored in `Battlecraft_Arsenal_BP/recipes`. Recipes are included for selected weapons, ammunition, medical items, explosives, optics, crates, and equipment. Several weapon items are defined but do not currently have their own recipe file.

Functional equipment includes:

- Bandages and medkits that restore health
- Grenades with delayed explosions
- Player-owned landmines
- Player-owned C4 charges and detonators
- Binoculars that report coordinates in the viewing direction
- Night-vision goggles
- Military keycards
- Ammunition crates
- Weapon crates
- Supply drops

Use these script events in chat or command blocks:

- `/scriptevent battlecraft:menu`
- `/scriptevent battlecraft:status`
- `/scriptevent battlecraft:recruit [squad]`
- `/scriptevent battlecraft:command follow|stay|guard|patrol|attack`
- `/scriptevent battlecraft:squad create [name]`
- `/scriptevent battlecraft:squad leader 1-3`
- `/scriptevent battlecraft:squad line|spread`
- `/scriptevent battlecraft:waypoint`
- `/scriptevent battlecraft:faction status`
- `/scriptevent battlecraft:territory status`
- `/scriptevent battlecraft:territory capture [name]`
- `/scriptevent battlecraft:quest complete [id] [points]`
- `/scriptevent battlecraft:rank`
- `/scriptevent battlecraft:base list`
- `/scriptevent battlecraft:equipment supply`
- `/scriptevent battlecraft:equipment stations`

Army recruitment requires an entity with the `bc_recruitable` tag within six blocks and five gold ingots. The army system supports up to 16 soldiers across three squads, with up to six soldiers per squad. Entities tagged `bc_enemy` award rank points when defeated. Faction tracking uses tags such as `bc_faction_bandits`, `bc_faction_raiders`, `bc_faction_mercenaries`, and `bc_faction_military`.

To create an `.mcaddon` package after generating the assets, archive both pack folders:

```sh
zip -r battlecraft_arsenal.mcaddon Battlecraft_Arsenal_BP Battlecraft_Arsenal_RP
```

On Windows PowerShell:

```powershell
Compress-Archive -Path Battlecraft_Arsenal_BP,Battlecraft_Arsenal_RP -DestinationPath battlecraft_arsenal.zip
Rename-Item battlecraft_arsenal.zip battlecraft_arsenal.mcaddon
```

The current project does not include separate weapon models, working scope views, a custom weapon HUD, generated military structures, custom NPC definitions, or a completed binary `.mcaddon` archive. The included attachable uses one fallback geometry and animation set, and the sound definitions require generated OGG files.

---

More Minecraft mod projects by EnderDevelopment: https://github.com/EnderDevelopment

Project page: https://dash.enderdevelopment.com/community/4015f76a-9050-49eb-830d-835ebb18460c?utm_source=github&utm_medium=readme&utm_campaign=auto_publish&utm_content=4015f76a-9050-49eb-830d-835ebb18460c
