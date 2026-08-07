from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "map_sources" / "incheon_seoul.jpg"
OUTPUT = ROOT / "assets" / "map_sources" / "seoul_meetup.jpg"
FULL_OUTPUT = ROOT / "assets" / "map_sources" / "seoul_explorer.jpg"
GRAY_OUTPUT = ROOT / "assets" / "map_sources" / "seoul_meetup_gray.jpg"
FULL_GRAY_OUTPUT = ROOT / "assets" / "map_sources" / "seoul_explorer_gray.jpg"
HIGH_SOURCE = ROOT / "assets" / "map_sources" / "incheon_seoul_z12.webp"
FULL_HIGH_OUTPUT = ROOT / "assets" / "map_sources" / "seoul_explorer_gray_z12.webp"
DEFAULT_OUTPUT = ROOT / "assets" / "map_sources" / "seoul_explorer_default.webp"
DEFAULT_PALETTE = {
    "urban": (224, 227, 230),
    "local_roads": (240, 240, 240),
    "major_roads": (240, 210, 170),
    "water": (164, 207, 234),
    "park": (210, 225, 200),
}
MASK_OUTPUTS = {
    "local_roads": ROOT / "assets" / "map_sources" / "seoul_mask_local_roads.webp",
    "major_roads": ROOT / "assets" / "map_sources" / "seoul_mask_major_roads.webp",
    "water": ROOT / "assets" / "map_sources" / "seoul_mask_water.webp",
    "park": ROOT / "assets" / "map_sources" / "seoul_mask_park.webp",
}
ZOOM = 11
TILE_SIZE = 512
SOURCE_WEST = 126.20
SOURCE_NORTH = 37.78
TARGET_BOUNDS = (126.20, 37.29352307026523, 127.30, 37.78)
TARGET_SIZE = (2048, 1143)


def tile_x(longitude: float) -> float:
    return (longitude + 180.0) / 360.0 * (2**ZOOM)


def tile_y(latitude: float) -> float:
    latitude_radians = math.radians(latitude)
    return (1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2 * (2**ZOOM)


def crop_to_bounds(image: Image.Image) -> Image.Image:
    west, south, east, north = TARGET_BOUNDS
    source_x = math.floor(tile_x(SOURCE_WEST))
    source_y = math.floor(tile_y(SOURCE_NORTH))
    box = (
        round((tile_x(west) - source_x) * TILE_SIZE),
        round((tile_y(north) - source_y) * TILE_SIZE),
        round((tile_x(east) - source_x) * TILE_SIZE),
        round((tile_y(south) - source_y) * TILE_SIZE),
    )
    return image.crop(box).resize(TARGET_SIZE, Image.Resampling.LANCZOS)


def illustrated_palette(image: Image.Image) -> Image.Image:
    softened = image.filter(ImageFilter.GaussianBlur(1.15))
    pixels = np.asarray(softened, dtype=np.float32)
    red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]
    lightness = pixels.mean(axis=2, keepdims=True)

    water = (blue > red + 4) & (green > red + 4)
    park = (green > red + 2) & (green > blue + 4)
    warm = (red > blue + 8) & (green > blue + 6)

    targets = np.empty_like(pixels)
    targets[:] = (229, 231, 232)
    targets[water] = (157, 194, 236)
    targets[park] = (181, 214, 155)
    targets[warm] = (238, 222, 202)

    relief = np.clip((lightness - 228) * 0.30, -14, 13)
    result = np.clip(targets + relief, 0, 255).astype(np.uint8)
    flattened = Image.fromarray(result, "RGB").quantize(colors=28, dither=Image.Dither.NONE).convert("RGB")
    return flattened.filter(ImageFilter.SMOOTH_MORE)


def keep_large_regions(mask: np.ndarray, radius: int, threshold: float) -> np.ndarray:
    density = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.BoxBlur(radius))
    core = np.asarray(density, dtype=np.uint8) > round(255 * threshold)
    expanded = Image.fromarray(core.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(radius * 2 + 1))
    return mask & (np.asarray(expanded, dtype=np.uint8) > 0)


def gray_illustrated_palette(image: Image.Image, detail_scale: int = 1) -> Image.Image:
    softened = image.filter(ImageFilter.GaussianBlur(0.35))
    raw = np.asarray(image, dtype=np.float32)
    pixels = np.asarray(softened, dtype=np.float32)
    red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]

    water = (blue > red + 4) & (green > red + 4)
    park = (green > red + 2) & (green > blue + 4)
    major_water = keep_large_regions(water, radius=5 * detail_scale, threshold=0.24)
    major_park = keep_large_regions(park, radius=7 * detail_scale, threshold=0.32)

    channel_range = raw.max(axis=2) - raw.min(axis=2)
    local_roads = (raw.min(axis=2) > 247) & (channel_range < 7)

    targets = np.empty_like(pixels)
    targets[:] = (224, 227, 230)
    targets[major_water] = (164, 207, 234)
    targets[major_park] = (183, 220, 160)
    targets[local_roads & ~major_water & ~major_park] = (248, 248, 246)

    lightness = pixels.mean(axis=2, keepdims=True)
    relief = np.clip((lightness - 238) * 0.16, -7, 6)
    result = np.clip(targets + relief, 0, 255).astype(np.uint8)
    return Image.fromarray(result, "RGB")


def style_in_chunks(image: Image.Image, chunk_size: int = 1024, overlap: int = 32) -> Image.Image:
    output = Image.new("RGB", image.size)
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
            styled = gray_illustrated_palette(image.crop(source_box), detail_scale=2)
            paste_box = (
                left - source_box[0],
                top - source_box[1],
                left - source_box[0] + right - left,
                top - source_box[1] + bottom - top,
            )
            output.paste(styled.crop(paste_box), (left, top))
    return output


def palette_masks(image: Image.Image, detail_scale: int = 2) -> dict[str, np.ndarray]:
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
        "water": keep_large_regions(water, radius=5 * detail_scale, threshold=0.24),
        "park": keep_large_regions(park, radius=7 * detail_scale, threshold=0.32),
    }


def save_palette_masks(image: Image.Image, chunk_size: int = 1024, overlap: int = 32) -> None:
    outputs = {name: Image.new("L", image.size) for name in MASK_OUTPUTS}
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
            masks = palette_masks(image.crop(source_box))
            paste_box = (
                left - source_box[0],
                top - source_box[1],
                left - source_box[0] + right - left,
                top - source_box[1] + bottom - top,
            )
            for name, mask in masks.items():
                layer = Image.fromarray(mask.astype(np.uint8) * 255, "L")
                outputs[name].paste(layer.crop(paste_box), (left, top))

    for name, output in outputs.items():
        output.save(MASK_OUTPUTS[name], format="WEBP", lossless=True, method=6)
        print(f"saved: {MASK_OUTPUTS[name]} {output.size[0]}x{output.size[1]}")


def bake_default_palette(image: Image.Image, chunk_size: int = 1024, overlap: int = 32) -> Image.Image:
    output = Image.new("RGB", image.size, DEFAULT_PALETTE["urban"])
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
            masks = palette_masks(image.crop(source_box))
            pixels = np.empty((source_box[3] - source_box[1], source_box[2] - source_box[0], 3), dtype=np.uint8)
            pixels[:] = DEFAULT_PALETTE["urban"]
            for name in ("park", "water", "local_roads", "major_roads"):
                pixels[masks[name]] = DEFAULT_PALETTE[name]

            styled = Image.fromarray(pixels, "RGB")
            paste_box = (
                left - source_box[0],
                top - source_box[1],
                left - source_box[0] + right - left,
                top - source_box[1] + bottom - top,
            )
            output.paste(styled.crop(paste_box), (left, top))
    return output


def main() -> None:
    if "--default-only" in sys.argv:
        high_source = Image.open(HIGH_SOURCE).convert("RGB")
        default_map = bake_default_palette(high_source)
        default_map.save(DEFAULT_OUTPUT, format="WEBP", lossless=True, method=6)
        print(f"saved: {DEFAULT_OUTPUT} {default_map.size[0]}x{default_map.size[1]}")
        return

    if "--masks-only" in sys.argv:
        high_source = Image.open(HIGH_SOURCE).convert("RGB")
        save_palette_masks(high_source)
        return

    source = Image.open(SOURCE).convert("RGB")
    cropped = crop_to_bounds(source)
    gray_styled = gray_illustrated_palette(cropped)
    gray_styled.save(GRAY_OUTPUT, quality=94, subsampling=0, optimize=True)
    print(f"saved: {GRAY_OUTPUT} {gray_styled.size[0]}x{gray_styled.size[1]}")

    full_gray_styled = gray_illustrated_palette(source)
    full_gray_styled.save(FULL_GRAY_OUTPUT, quality=94, subsampling=0, optimize=True)
    print(f"saved: {FULL_GRAY_OUTPUT} {full_gray_styled.size[0]}x{full_gray_styled.size[1]}")

    if HIGH_SOURCE.exists():
        high_source = Image.open(HIGH_SOURCE).convert("RGB")
        full_high_styled = style_in_chunks(high_source)
        full_high_styled.save(FULL_HIGH_OUTPUT, format="WEBP", quality=95, method=6)
        print(f"saved: {FULL_HIGH_OUTPUT} {full_high_styled.size[0]}x{full_high_styled.size[1]}")
        save_palette_masks(high_source)


if __name__ == "__main__":
    main()
