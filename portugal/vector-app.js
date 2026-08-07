const seoulAirport = [37.4602, 126.4407];
const seoulCity = [37.5665, 126.9780];
const lisbonAirport = [38.7742, -9.1342];
const lisbonCity = [38.7223, -9.1393];

const canvas = document.getElementById("mapCanvas");
const context = canvas.getContext("2d");
const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("statusText");
const arrivalNote = document.getElementById("arrivalNote");
const replayButton = document.getElementById("replayButton");
const dayOne = document.getElementById("dayOne");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const landmarkSources = {
  incheonAirport: "assets/landmarks/incheon_airport.png",
  incheonBridge: "assets/landmarks/incheon_bridge.png",
  seoulTower: "assets/landmarks/n_seoul_tower.png",
  airplane: "assets/landmarks/airplane.png",
  lisbonAirport: "assets/landmarks/lisbon_airport.png",
  belemTower: "assets/landmarks/belem_tower.png",
  abrilBridge: "assets/landmarks/abril_bridge.png",
  lisbonTram: "assets/landmarks/lisbon_tram.png"
};

const landmarks = {};
const mapPaths = {
  land: new Path2D(),
  countries: { KOR: new Path2D(), PRT: new Path2D() },
  local: {
    incheon: createLocalPaths(),
    lisbon: createLocalPaths()
  }
};

let animationFrame;
let sequenceStart;
let currentElapsed = 0;
let currentRouteProgress = 0;
let assetsReady = false;
let arrivalShown = false;
const routePoints = Array.from({ length: 601 }, (_, index) => getRoutePoint(index / 600));

function createLocalPaths() {
  return {
    motorway: new Path2D(),
    trunk: new Path2D(),
    primary: new Path2D(),
    coastline: new Path2D(),
    waterway: new Path2D(),
    runway: new Path2D(),
    taxiway: new Path2D()
  };
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothStep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getRoutePoint(progress) {
  const latitude = seoulAirport[0] + (lisbonAirport[0] - seoulAirport[0]) * progress
    + Math.sin(Math.PI * progress) * 24;
  const longitude = seoulAirport[1] + (lisbonAirport[1] - seoulAirport[1]) * progress;
  return [latitude, longitude];
}

function mercatorNormalized(point) {
  const latitude = clamp(point[0], -85.0511, 85.0511);
  const longitude = point[1];
  const sinLatitude = Math.sin(latitude * Math.PI / 180);
  return [
    (longitude + 180) / 360,
    0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)
  ];
}

function addLine(path, coordinates, close = false) {
  coordinates.forEach(([longitude, latitude], index) => {
    const [x, y] = mercatorNormalized([latitude, longitude]);
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  if (close) path.closePath();
}

function buildVectorPaths() {
  window.MAP_DATA.land.forEach(polygon => {
    polygon.forEach(ring => addLine(mapPaths.land, ring, true));
  });

  ["KOR", "PRT"].forEach(code => {
    (window.MAP_DATA.countries[code] || []).forEach(polygon => {
      polygon.forEach(ring => addLine(mapPaths.countries[code], ring, true));
    });
  });

  Object.entries(window.MAP_DATA.local).forEach(([region, lines]) => {
    lines.forEach(line => {
      let key = line.category;
      if (line.category === "road") key = line.subtype;
      if (line.category === "aeroway") key = line.subtype;
      const path = mapPaths.local[region][key];
      if (path) addLine(path, line.coordinates);
    });
  });
}

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지를 불러오지 못함: ${path}`));
    image.src = path;
  });
}

async function loadLandmarks() {
  const entries = await Promise.all(Object.entries(landmarkSources).map(async ([key, path]) => {
    return [key, await loadImage(path)];
  }));
  entries.forEach(([key, image]) => { landmarks[key] = image; });
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFrame(currentElapsed, currentRouteProgress);
}

function withMapTransform(camera, zoom, draw) {
  const [cameraX, cameraY] = mercatorNormalized(camera);
  const scale = 256 * Math.pow(2, zoom);
  context.save();
  context.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
  context.scale(scale, scale);
  context.translate(-cameraX, -cameraY);
  draw(scale);
  context.restore();
}

function projectToScreen(point, camera, zoom) {
  const [pointX, pointY] = mercatorNormalized(point);
  const [cameraX, cameraY] = mercatorNormalized(camera);
  const scale = 256 * Math.pow(2, zoom);
  return [
    canvas.clientWidth / 2 + (pointX - cameraX) * scale,
    canvas.clientHeight / 2 + (pointY - cameraY) * scale
  ];
}

function drawVectorBase(camera, zoom) {
  withMapTransform(camera, zoom, scale => {
    context.fillStyle = "#f6edda";
    context.strokeStyle = "#93b9b8";
    context.lineWidth = 1.3 / scale;
    context.fill(mapPaths.land, "evenodd");
    context.stroke(mapPaths.land);

    const highlightAlpha = 0.2 + 0.28 * (1 - smoothStep((zoom - 4) / 3));
    context.globalAlpha = highlightAlpha;
    context.fillStyle = "#f3c969";
    context.fill(mapPaths.countries.KOR, "evenodd");
    context.fillStyle = "#72ad86";
    context.fill(mapPaths.countries.PRT, "evenodd");
    context.globalAlpha = 1;
  });
}

function strokeMapPath(path, color, width, scale, alpha = 1) {
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width / scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke(path);
}

function drawLocalDetails(camera, zoom, region) {
  const opacity = smoothStep((zoom - 5.6) / 2.5);
  if (opacity <= 0) return;
  const paths = mapPaths.local[region];
  withMapTransform(camera, zoom, scale => {
    strokeMapPath(paths.coastline, "#5d9fc0", 3.2, scale, opacity);
    strokeMapPath(paths.waterway, "#74acd0", 3.6, scale, opacity * 0.8);

    strokeMapPath(paths.motorway, "rgba(23,54,93,0.22)", 8.5, scale, opacity);
    strokeMapPath(paths.motorway, "#e8a84f", 5.2, scale, opacity);
    strokeMapPath(paths.trunk, "rgba(23,54,93,0.18)", 7.2, scale, opacity);
    strokeMapPath(paths.trunk, "#f2c874", 4.2, scale, opacity);
    strokeMapPath(paths.primary, "rgba(23,54,93,0.15)", 5.8, scale, opacity);
    strokeMapPath(paths.primary, "#fffaf0", 3.5, scale, opacity);

    strokeMapPath(paths.taxiway, "#d5b45f", 3.2, scale, opacity * smoothStep((zoom - 8) / 2));
    strokeMapPath(paths.runway, "#576676", 11, scale, opacity * smoothStep((zoom - 7) / 2));
    strokeMapPath(paths.runway, "#fffdf8", 2, scale, opacity * smoothStep((zoom - 7) / 2));
    context.globalAlpha = 1;
  });
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawLabel(point, label, color, camera, zoom, offsetX = 0, offsetY = 0, dark = false) {
  const [anchorX, anchorY] = projectToScreen(point, camera, zoom);
  if (anchorX < -180 || anchorX > canvas.clientWidth + 180 || anchorY < -100 || anchorY > canvas.clientHeight + 100) return;
  const x = anchorX + offsetX;
  const y = anchorY + offsetY;
  context.save();
  if (offsetX || offsetY) {
    context.beginPath();
    context.moveTo(anchorX, anchorY);
    context.lineTo(x, y);
    context.strokeStyle = "rgba(23,54,93,0.34)";
    context.lineWidth = 1.4;
    context.setLineDash([3, 4]);
    context.stroke();
    context.setLineDash([]);
  }
  context.fillStyle = color;
  context.beginPath();
  context.arc(anchorX, anchorY, 7, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.stroke();
  context.font = `${dark ? 700 : 600} 13px "Gowun Dodum", sans-serif`;
  const width = context.measureText(label).width + 24;
  roundedRect(x - width / 2, y - 17, width, 34, 11);
  context.fillStyle = dark ? "#17365d" : "rgba(255,253,248,0.97)";
  context.shadowColor = "rgba(23,54,93,0.17)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = dark ? "#fffaf0" : "#17365d";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y + 1);
  context.restore();
}

function drawLandmark(image, point, camera, zoom, width, alpha = 1) {
  if (!image || alpha <= 0) return;
  const [x, y] = projectToScreen(point, camera, zoom);
  if (x < -width || x > canvas.clientWidth + width || y < -width || y > canvas.clientHeight + width) return;
  const height = width * image.height / image.width;
  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = "rgba(23,54,93,0.22)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 7;
  context.drawImage(image, x - width / 2, y - height * 0.88, width, height);
  context.restore();
}

function drawRoute(camera, zoom, progress) {
  const routeIndex = Math.floor(progress * (routePoints.length - 1));
  const drawPart = (points, color, width, dashed) => {
    context.beginPath();
    points.forEach((point, index) => {
      const [x, y] = projectToScreen(point, camera, zoom);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash(dashed ? [3, 12] : []);
    context.stroke();
  };
  drawPart(routePoints, "rgba(255,255,255,0.94)", 5, true);
  drawPart(routePoints.slice(0, routeIndex + 1), "#1975c7", 6, false);
}

function drawPlaceInformation(camera, zoom, localRegion) {
  if (zoom < 5.4) {
    drawLabel([36.4, 127.8], "대한민국", "#ef6a5b", camera, zoom, -42, -52, true);
    drawLabel(seoulCity, "서울", "#f4c95d", camera, zoom, 54, -18);
    drawLabel(seoulAirport, "인천국제공항", "#ef6a5b", camera, zoom, 66, 24);
    drawLabel([39.5, -8.0], "포르투갈", "#4d9b76", camera, zoom, 42, -52, true);
    drawLabel(lisbonCity, "리스본", "#f4c95d", camera, zoom, -54, -18);
    drawLabel(lisbonAirport, "리스본 공항", "#4d9b76", camera, zoom, -68, 24);
    return;
  }

  const alpha = smoothStep((zoom - 6.4) / 2.4);
  if (localRegion === "incheon") {
    drawLandmark(landmarks.incheonAirport, seoulAirport, camera, zoom, 175, alpha);
    drawLandmark(landmarks.incheonBridge, [37.4136, 126.5667], camera, zoom, 165, alpha);
    drawLandmark(landmarks.seoulTower, [37.5512, 126.9882], camera, zoom, 96, alpha);
    drawLabel([36.7, 127.25], "대한민국", "#f4c95d", camera, zoom, 0, 0, true);
    drawLabel(seoulCity, "서울", "#f4c95d", camera, zoom, 50, -30);
    drawLabel(seoulAirport, "인천국제공항", "#ef6a5b", camera, zoom, -8, 64);
  } else if (localRegion === "lisbon") {
    drawLandmark(landmarks.lisbonAirport, lisbonAirport, camera, zoom, 165, alpha);
    drawLandmark(landmarks.belemTower, [38.6916, -9.2160], camera, zoom, 98, alpha);
    drawLandmark(landmarks.abrilBridge, [38.6907, -9.1776], camera, zoom, 160, alpha);
    drawLandmark(landmarks.lisbonTram, [38.7138, -9.1394], camera, zoom, 108, alpha);
    drawLabel([38.73, -8.995], "포르투갈", "#f4c95d", camera, zoom, 0, 0, true);
    drawLabel(lisbonCity, "리스본", "#f4c95d", camera, zoom, -60, -28);
    drawLabel(lisbonAirport, "리스본 공항", "#4d9b76", camera, zoom, 64, 52);
  }
}

function drawPlane() {
  const image = landmarks.airplane;
  if (!image) return;
  const width = canvas.clientWidth < 720 ? 76 : 92;
  const height = width * image.height / image.width;
  context.save();
  context.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
  context.scale(-1, 1);
  context.rotate(-0.12);
  context.shadowColor = "rgba(21,85,155,0.3)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function getCameraZoom(elapsed) {
  if (elapsed <= 3600) return mix(12.8, 2.3, smoothStep(elapsed / 3600));
  if (elapsed < 9000) return 2.3;
  return mix(2.3, 13.2, smoothStep((elapsed - 9000) / 5040));
}

function getLocalRegion(routeProgress, zoom) {
  if (zoom < 5.6) return null;
  if (routeProgress < 0.12) return "incheon";
  if (routeProgress > 0.88) return "lisbon";
  return null;
}

function drawFrame(elapsed, routeProgress) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const ocean = context.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, "#cfe7ec");
  ocean.addColorStop(1, "#a8d0db");
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);
  if (!assetsReady) return;

  const camera = getRoutePoint(routeProgress);
  const zoom = getCameraZoom(elapsed);
  const localRegion = getLocalRegion(routeProgress, zoom);
  drawVectorBase(camera, zoom);
  if (localRegion) drawLocalDetails(camera, zoom, localRegion);
  drawRoute(camera, zoom, routeProgress);
  drawPlaceInformation(camera, zoom, localRegion);
  drawPlane();

  const vignette = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.72);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(23,54,93,0.1)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function updateStatus(routeProgress) {
  progressBar.style.width = `${Math.round(routeProgress * 100)}%`;
  if (routeProgress < 0.02) statusText.textContent = "인천공항에서 출발 준비 중…";
  else if (routeProgress < 0.12) statusText.textContent = "인천공항에서 출발! ✈";
  else if (routeProgress < 0.78) statusText.textContent = "구름 위를 여행하는 중…";
  else if (routeProgress < 1) statusText.textContent = "리스본에 가까워지는 중…";
  else statusText.textContent = "리스본 도착! 여행 시작 ☀";
}

function showArrival() {
  if (arrivalShown) return;
  arrivalShown = true;
  arrivalNote.classList.add("show");
}

function playFlight() {
  cancelAnimationFrame(animationFrame);
  sequenceStart = undefined;
  currentElapsed = 0;
  currentRouteProgress = 0;
  arrivalShown = false;
  arrivalNote.classList.remove("show");
  updateStatus(0);
  drawFrame(0, 0);

  if (reducedMotion) {
    currentElapsed = 14040;
    currentRouteProgress = 1;
    updateStatus(1);
    showArrival();
    drawFrame(currentElapsed, 1);
    return;
  }

  const flightStart = 3000;
  const flightDuration = 9000;
  const sequenceDuration = 14040;
  function animate(timestamp) {
    if (!sequenceStart) sequenceStart = timestamp;
    currentElapsed = Math.min(timestamp - sequenceStart, sequenceDuration);
    const linearRoute = clamp((currentElapsed - flightStart) / flightDuration);
    currentRouteProgress = easeInOutCubic(linearRoute);
    updateStatus(linearRoute);
    if (linearRoute >= 1) showArrival();
    drawFrame(currentElapsed, currentRouteProgress);
    if (currentElapsed < sequenceDuration) animationFrame = requestAnimationFrame(animate);
  }
  animationFrame = requestAnimationFrame(animate);
}

replayButton.addEventListener("click", playFlight);
dayOne.addEventListener("click", playFlight);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", async () => {
  resizeCanvas();
  statusText.textContent = "벡터 지도를 준비하는 중…";
  try {
    buildVectorPaths();
    await loadLandmarks();
    assetsReady = true;
    resizeCanvas();
    setTimeout(playFlight, 350);
  } catch (error) {
    statusText.textContent = "지도 자료를 확인해 주세요";
    console.error(error);
  }
});
