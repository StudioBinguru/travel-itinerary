from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "landmarks" / "travel_decor_sheet.png"
OUTPUT = SOURCE.parent
NAMES = ["travel_car", "korean_mountains", "river_bend", "portugal_coast"]


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    cell_width = image.width // 4
    for index, name in enumerate(NAMES):
        cell = image.crop((index * cell_width, 0, (index + 1) * cell_width, image.height))
        bounds = cell.getchannel("A").getbbox()
        if bounds is None:
            raise RuntimeError(f"No visible pixels found for {name}")
        left, top, right, bottom = bounds
        padding = 10
        crop = cell.crop((
            max(0, left - padding),
            max(0, top - padding),
            min(cell.width, right + padding),
            min(cell.height, bottom + padding),
        ))
        crop.save(OUTPUT / f"{name}.png", optimize=True)
        print(f"{name}: {crop.width}x{crop.height}")


if __name__ == "__main__":
    main()
