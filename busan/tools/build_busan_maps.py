from __future__ import annotations

import math
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "map_sources"
TILE_SIZE = 512
ZOOM = 15
USER_AGENT = "StudioBinguru Busan Trip Prototype/1.0"
PALETTE = {
    "urban": (224, 227, 230),
    "local_roads": (240, 240, 240),
    "major_roads": (240, 210, 170),
    "water": (164, 207, 234),
    "park": (210, 225, 200),
}

MAPS = {
    "shared": (128.975, 35.052, 129.170, 35.180),
}


def tile_x(longitude: float) -> float:
    return (longitude + 180.0) / 360.0 * (2**ZOOM)


def tile_y(latitude: float) -> float:
    latitude_radians = math.radians(latitude)
    return (1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2 * (2**ZOOM)


def fetch_tile(x: int, y: int) -> Image.Image:
    url = f"https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{ZOOM}/{x}/{y}@2x.png"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return Image.open(BytesIO(response.read())).convert("RGB")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1.5 * (attempt + 1))


def keep_large_regions(mask: np.ndarray, radius: int, threshold: float) -> np.ndarray:
    density = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.BoxBlur(radius))
    core = np.asarray(density, dtype=np.uint8) > round(255 * threshold)
    expanded = Image.fromarray(core.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(radius * 2 + 1))
    return mask & (np.asarray(expanded, dtype=np.uint8) > 0)


def palette_masks(image: Image.Image) -> dict[str, np.ndarray]:
    softened = np.asarray(image.filter(ImageFilter.GaussianBlur(0.35)), dtype=np.int16)
    raw = np.asarray(image, dtype=np.uint8)
    red, green, blue = softened[..., 0], softened[..., 1], softened[..., 2]

    water = (blue > red + 4) & (green > red + 4)
    park = (green > red + 2) & (green > blue + 4)
    major_roads = (red > blue + 22) & (green > blue + 12) & (red > 210) & ~water & ~park
    channel_range = raw.max(axis=2) - raw.min(axis=2)
    local_roads = (raw.min(axis=2) > 247) & (channel_range < 7) & ~major_roads

    return {
        "local_roads": local_roads,
        "major_roads": major_roads,
        "water": keep_large_regions(water, radius=10, threshold=0.24),
        "park": keep_large_regions(park, radius=14, threshold=0.32),
    }


def apply_palette(image: Image.Image, chunk_size: int = 1024, overlap: int = 32) -> Image.Image:
    output = Image.new("RGB", image.size, PALETTE["urban"])
    for top in range(0, image.height, chunk_size):
        for left in range(0, image.width, chunk_size):
            right = min(left + chunk_size, image.width)
            bottom = min(top + chunk_size, image.height)
            source_box = (
                max(0, left - overlap),
                max(0, top - overlap),
                min(image.width, right + overlap),
                min(image.height, bottom + overlap),
            )
            source = image.crop(source_box)
            masks = palette_masks(source)
            pixels = np.empty((source.height, source.width, 3), dtype=np.uint8)
            pixels[:] = PALETTE["urban"]
            for layer in ("park", "water", "local_roads", "major_roads"):
                pixels[masks[layer]] = PALETTE[layer]
            styled = Image.fromarray(pixels, "RGB")
            paste_box = (
                left - source_box[0],
                top - source_box[1],
                left - source_box[0] + right - left,
                top - source_box[1] + bottom - top,
            )
            output.paste(styled.crop(paste_box), (left, top))
    return output


def build_map(name: str, bounds: tuple[float, float, float, float]) -> None:
    west, south, east, north = bounds
    x_min, x_max = math.floor(tile_x(west)), math.floor(tile_x(east))
    y_min, y_max = math.floor(tile_y(north)), math.floor(tile_y(south))
    coordinates = [(x, y) for y in range(y_min, y_max + 1) for x in range(x_min, x_max + 1)]
    mosaic = Image.new(
        "RGB",
        ((x_max - x_min + 1) * TILE_SIZE, (y_max - y_min + 1) * TILE_SIZE),
        PALETTE["urban"],
    )

    with ThreadPoolExecutor(max_workers=8) as executor:
        jobs = {executor.submit(fetch_tile, x, y): (x, y) for x, y in coordinates}
        for completed, job in enumerate(as_completed(jobs), start=1):
            x, y = jobs[job]
            mosaic.paste(job.result(), ((x - x_min) * TILE_SIZE, (y - y_min) * TILE_SIZE))
            print(f"{name}: {completed}/{len(coordinates)}", end="\r")

    styled = apply_palette(mosaic)
    target = OUTPUT / f"busan_{name}_z{ZOOM}.webp"
    styled.save(target, format="WEBP", lossless=True, method=6)
    print(
        f"{name}: saved {target.name} {styled.width}x{styled.height} "
        f"tiles {x_min},{y_min}-{x_max},{y_max}"
    )


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    selected = sys.argv[1:]
    targets = {name: bounds for name, bounds in MAPS.items() if not selected or name in selected}
    for name, bounds in targets.items():
        build_map(name, bounds)


if __name__ == "__main__":
    main()
