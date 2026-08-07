from __future__ import annotations

import math
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "map_sources"
TILE_SIZE = 512
USER_AGENT = "StudioBinguru Portugal Trip Prototype/1.0"


def tile_x(longitude: float, zoom: int) -> int:
    return math.floor((longitude + 180.0) / 360.0 * (2**zoom))


def tile_y(latitude: float, zoom: int) -> int:
    latitude_radians = math.radians(latitude)
    value = (1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2
    return math.floor(value * (2**zoom))


def fetch_tile(zoom: int, x: int, y: int) -> Image.Image:
    url = f"https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{zoom}/{x}/{y}@2x.png"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return Image.open(BytesIO(response.read())).convert("RGB")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1.5 * (attempt + 1))


def soften_palette(image: Image.Image) -> Image.Image:
    image = ImageEnhance.Color(image).enhance(0.78)
    image = ImageEnhance.Contrast(image).enhance(0.94)
    warm = Image.new("RGB", image.size, "#fff1d9")
    image = Image.blend(image, warm, 0.08)
    return image.filter(ImageFilter.GaussianBlur(0.18))


def build_map(name: str, zoom: int, bounds: tuple[float, float, float, float]) -> None:
    west, south, east, north = bounds
    x_min, x_max = tile_x(west, zoom), tile_x(east, zoom)
    y_min, y_max = tile_y(north, zoom), tile_y(south, zoom)
    width = (x_max - x_min + 1) * TILE_SIZE
    height = (y_max - y_min + 1) * TILE_SIZE
    mosaic = Image.new("RGB", (width, height), "#dceff3")

    for y in range(y_min, y_max + 1):
        for x in range(x_min, x_max + 1):
            tile = fetch_tile(zoom, x, y)
            mosaic.paste(tile, ((x - x_min) * TILE_SIZE, (y - y_min) * TILE_SIZE))

    mosaic = soften_palette(mosaic)
    output_path = OUTPUT / f"{name}.jpg"
    mosaic.save(output_path, quality=94, subsampling=0, optimize=True)
    print(f"{name}: {mosaic.width}x{mosaic.height} z{zoom} tiles {x_min},{y_min}-{x_max},{y_max}")


def build_seoul_hires() -> None:
    zoom = 12
    x_min, x_max = 3482, 3497
    y_min, y_max = 1582, 1591
    width = (x_max - x_min + 1) * TILE_SIZE
    height = (y_max - y_min + 1) * TILE_SIZE
    mosaic = Image.new("RGB", (width, height), "#dceff3")
    coordinates = [(x, y) for y in range(y_min, y_max + 1) for x in range(x_min, x_max + 1)]

    with ThreadPoolExecutor(max_workers=8) as executor:
        jobs = {executor.submit(fetch_tile, zoom, x, y): (x, y) for x, y in coordinates}
        for completed, job in enumerate(as_completed(jobs), start=1):
            x, y = jobs[job]
            tile = job.result()
            mosaic.paste(tile, ((x - x_min) * TILE_SIZE, (y - y_min) * TILE_SIZE))
            if completed % 20 == 0 or completed == len(coordinates):
                print(f"downloaded: {completed}/{len(coordinates)}")

    output_path = OUTPUT / "incheon_seoul_z12.webp"
    mosaic.save(output_path, format="WEBP", lossless=True, method=6)
    print(f"saved: {output_path} {mosaic.width}x{mosaic.height}")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if "--seoul-hires" in sys.argv:
        build_seoul_hires()
        return
    build_map("world", 4, (-180, -70, 179.99, 82))
    build_map("incheon_seoul", 11, (126.20, 37.20, 127.30, 37.78))
    build_map("lisbon", 13, (-9.32, 38.66, -8.96, 38.84))


if __name__ == "__main__":
    main()
