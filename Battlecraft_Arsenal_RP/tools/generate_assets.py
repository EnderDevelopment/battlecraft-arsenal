#!/usr/bin/env python3
"""Generate the Battlecraft Arsenal placeholder asset set.

The PNG writer uses only Python's standard library. OGG output requires ffmpeg
on PATH because Python's standard library does not include an OGG encoder.
Run this file from the repository root:
    python Battlecraft_Arsenal_RP/tools/generate_assets.py
"""
from __future__ import annotations

import math
import shutil
import struct
import subprocess
import tempfile
import wave
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEM_DIR = ROOT / "textures" / "items"
SOUND_DIR = ROOT / "sounds" / "weapons"
ITEMS = [
    "m1911", "glock17", "revolver", "desert_eagle", "mp5", "uzi", "p90",
    "ak47", "scar_h", "pump_shotgun", "double_barrel", "bolt_sniper",
    "barrett", "m249", "minigun", "rpg", "ammo_9mm", "ammo_45acp",
    "ammo_556", "ammo_762", "ammo_12gauge", "ammo_rocket", "bandage",
    "medkit", "grenade", "landmine", "c4", "detonator", "binoculars",
    "night_vision_goggles", "military_keycard", "ammunition_crate",
    "weapon_crate", "supply_drop",
]


def chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xffffffff)


def write_png(path: Path, label: str) -> None:
    size = 128
    pixels = bytearray()
    accent = (210, 170, 55) if label.startswith("ammo_") else (62, 124, 151)
    if label in {"grenade", "landmine", "c4"}:
        accent = (176, 64, 52)
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            border = x < 6 or y < 6 or x >= size - 6 or y >= size - 6
            cross = abs(x - 64) < 4 or abs(y - 64) < 4
            if border:
                color = (18, 24, 28)
            elif cross:
                color = accent
            else:
                color = (42, 50, 54)
            pixels.extend(color)
    raw = b"\x89PNG\r\n\x1a\n"
    raw += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    raw += chunk(b"IDAT", zlib.compress(bytes(pixels), 9))
    raw += chunk(b"IEND", b"")
    path.write_bytes(raw)


def write_tone(path: Path, frequency: int, seconds: float = 0.18) -> None:
    rate = 44100
    frames = int(rate * seconds)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        data = bytearray()
        for index in range(frames):
            envelope = min(1.0, index / 600.0, (frames - index) / 1800.0)
            sample = int(16000 * envelope * math.sin(2 * math.pi * frequency * index / rate))
            data.extend(struct.pack("<h", sample))
        output.writeframes(bytes(data))


def main() -> None:
    ITEM_DIR.mkdir(parents=True, exist_ok=True)
    SOUND_DIR.mkdir(parents=True, exist_ok=True)
    for item in ITEMS:
        write_png(ITEM_DIR / f"{item}.png", item)

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise SystemExit("PNG assets were generated. Install ffmpeg and rerun to generate fire.ogg and reload.ogg.")
    with tempfile.TemporaryDirectory() as temporary:
        temporary_dir = Path(temporary)
        for name, frequency in (("fire", 110), ("reload", 440)):
            wav = temporary_dir / f"{name}.wav"
            write_tone(wav, frequency)
            subprocess.run(
                [ffmpeg, "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", str(SOUND_DIR / f"{name}.ogg")],
                check=True,
            )
    print(f"Generated {len(ITEMS)} PNG icons and 2 OGG sounds.")


if __name__ == "__main__":
    main()
