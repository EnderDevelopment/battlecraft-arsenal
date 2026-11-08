Asset generation

The repository includes `tools/generate_assets.py`. Run it from the project root:

    python Battlecraft_Arsenal_RP/tools/generate_assets.py

It creates 34 valid 128x128 PNG item icons under `textures/items`. It also creates temporary WAV source tones and converts them to `sounds/weapons/fire.ogg` and `sounds/weapons/reload.ogg` with `ffmpeg`.

Install ffmpeg and ensure it is on PATH before running the script. If ffmpeg is unavailable, the script still creates all PNG files and reports that the OGG files need a second run after ffmpeg is installed. The supplied geometry is a lightweight functional fallback; replace it with authored geometry while retaining `geometry.battlecraft_weapon` or update `attachables/weapons.json`.