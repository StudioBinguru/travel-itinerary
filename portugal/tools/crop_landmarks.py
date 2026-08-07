from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "landmarks" / "landmarks_sheet.png"
OUTPUT = SOURCE.parent
NAMES = [
    "incheon_airport",
    "incheon_bridge",
    "n_seoul_tower",
    "airplane",
    "lisbon_airport",
    "belem_tower",
    "abril_bridge",
    "lisbon_tram",
]


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    cell_width = image.width // 4
    cell_height = image.height // 2

    for index, name in enumerate(NAMES):
      column = index % 4
      row = index // 4
      cell = image.crop((
          column * cell_width,
          row * cell_height,
          (column + 1) * cell_width,
          (row + 1) * cell_height,
      ))
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
