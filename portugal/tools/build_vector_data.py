from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "map_data.js"
USER_AGENT = "StudioBinguru Portugal Trip Prototype/1.0"
NATURAL_EARTH_ROOT = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_overpass(bounds: tuple[float, float, float, float]) -> dict:
    south, west, north, east = bounds
    bbox = f"{south},{west},{north},{east}"
    query = f"""
    [out:json][timeout:120];
    (
      way[\"waterway\"~\"river|canal\"]({bbox});
      way[\"natural\"=\"coastline\"]({bbox});
      way[\"aeroway\"~\"runway|taxiway\"]({bbox});
    );
    out tags geom;
    """
    payload = urllib.parse.urlencode({"data": query}).encode("utf-8")
    request = urllib.request.Request(
        OVERPASS_URL,
        data=payload,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.loads(response.read().decode("utf-8"))


def geometry_polygons(geometry: dict) -> list:
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def simplify_coordinates(coordinates: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(coordinates) <= 2:
        return coordinates

    def perpendicular_distance(point, start, end):
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        if dx == 0 and dy == 0:
            return ((point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2) ** 0.5
        numerator = abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0])
        return numerator / ((dx * dx + dy * dy) ** 0.5)

    max_distance = 0.0
    split_index = 0
    for index in range(1, len(coordinates) - 1):
        distance = perpendicular_distance(coordinates[index], coordinates[0], coordinates[-1])
        if distance > max_distance:
            max_distance = distance
            split_index = index

    if max_distance > tolerance:
        left = simplify_coordinates(coordinates[: split_index + 1], tolerance)
        right = simplify_coordinates(coordinates[split_index:], tolerance)
        return left[:-1] + right
    return [coordinates[0], coordinates[-1]]


def extract_osm_lines(data: dict) -> list[dict]:
    lines = []
    for element in data.get("elements", []):
        geometry = element.get("geometry")
        if not geometry or len(geometry) < 2:
            continue
        tags = element.get("tags", {})
        if "aeroway" in tags:
            category = "aeroway"
            subtype = tags["aeroway"]
            tolerance = 0.00002
        elif tags.get("natural") == "coastline":
            category = "coastline"
            subtype = "coastline"
            tolerance = 0.00008
        elif "waterway" in tags:
            category = "waterway"
            subtype = tags["waterway"]
            tolerance = 0.00005
        else:
            category = "road"
            subtype = tags.get("highway", "secondary")
            tolerance = 0.00004
        coordinates = [[round(point["lon"], 6), round(point["lat"], 6)] for point in geometry]
        coordinates = simplify_coordinates(coordinates, tolerance)
        lines.append({"category": category, "subtype": subtype, "coordinates": coordinates})
    return lines


def main() -> None:
    land = fetch_json(f"{NATURAL_EARTH_ROOT}/ne_110m_land.geojson")
    countries = fetch_json(f"{NATURAL_EARTH_ROOT}/ne_110m_admin_0_countries.geojson")
    selected_countries = {}
    for feature in countries["features"]:
        iso = feature.get("properties", {}).get("ADM0_A3")
        if iso in {"KOR", "PRT"}:
            selected_countries[iso] = geometry_polygons(feature["geometry"])

    incheon = fetch_overpass((37.20, 126.20, 37.78, 127.30))
    lisbon = fetch_overpass((38.66, -9.32, 38.84, -8.96))
    payload = {
        "land": [polygon for feature in land["features"] for polygon in geometry_polygons(feature["geometry"])],
        "countries": selected_countries,
        "local": {
            "incheon": extract_osm_lines(incheon),
            "lisbon": extract_osm_lines(lisbon),
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "window.MAP_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"world polygons: {len(payload['land'])}")
    print(f"incheon lines: {len(payload['local']['incheon'])}")
    print(f"lisbon lines: {len(payload['local']['lisbon'])}")
    print(f"output: {OUTPUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
