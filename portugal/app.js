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

const mapSources = {
  world: {
    path: "assets/map_sources/world.jpg",
    zoom: 4,
    tileX: 0,
    tileY: 1
  },
  incheon: {
    path: "assets/map_sources/incheon_seoul.jpg",
    zoom: 11,
    tileX: 1741,
    tileY: 791
  },
  lisbon: {
    path: "assets/map_sources/lisbon.jpg",
    zoom: 13,
    tileX: 3883,
    tileY: 3135
  }
};

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

const maps = {};
const landmarks = {};
let animationFrame;
let sequenceStart;
let currentElapsed = 0;
let currentRouteProgress = 0;
let assetsReady = false;
let arrivalShown = false;

const routePoints = Array.from({ length: 601 }, (_, index) => getRoutePoint(index / 600));

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지를 불러오지 못함: ${path}`));
    image.src = path;
  });
}

async function loadAssets() {
  const mapEntries = await Promise.all(Object.entries(mapSources).map(async ([key, source]) => {
    const image = await loadImage(source.path);
    return [key, { ...source, image }];
  }));
  mapEntries.forEach(([key, source]) => { maps[key] = source; });

  const landmarkEntries = await Promise.all(Object.entries(landmarkSources).map(async ([key, path]) => {
    return [key, await loadImage(path)];
  }));
  landmarkEntries.forEach(([key, image]) => { landmarks[key] = image; });
  assetsReady = true;
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

function mercatorPoint(point, zoom, tileSize = 256) {
  const latitude = Math.max(-85.0511, Math.min(85.0511, point[0]));
  const longitude = point[1];
  const scale = tileSize * Math.pow(2, zoom);
  const sinLatitude = Math.sin(latitude * Math.PI / 180);
  return [
    (longitude + 180) / 360 * scale,
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale
  ];
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFrame(currentElapsed, currentRouteProgress);
}

function drawMapSource(source, camera, zoom, alpha = 1) {
  if (!source?.image || alpha <= 0) return;
  const cameraPixel = mercatorPoint(camera, source.zoom, 512);
  const localX = cameraPixel[0] - source.tileX * 512;
  const localY = cameraPixel[1] - source.tileY * 512;
  const scale = 0.5 * Math.pow(2, zoom - source.zoom);
  const x = canvas.clientWidth / 2 - localX * scale;
  const y = canvas.clientHeight / 2 - localY * scale;

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(source.image, x, y, source.image.width * scale, source.image.height * scale);
  context.restore();
}

function projectToScreen(point, camera, zoom) {
  const pointPixel = mercatorPoint(point, zoom);
  const cameraPixel = mercatorPoint(camera, zoom);
  return [
    canvas.clientWidth / 2 + pointPixel[0] - cameraPixel[0],
    canvas.clientHeight / 2 + pointPixel[1] - cameraPixel[1]
  ];
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

function drawRoute(camera, zoom, progress) {
  const routeIndex = Math.floor(progress * (routePoints.length - 1));
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  routePoints.forEach((point, index) => {
    const [x, y] = projectToScreen(point, camera, zoom);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = "rgba(255, 255, 255, 0.94)";
  context.lineWidth = 5;
  context.setLineDash([3, 12]);
  context.stroke();

  context.beginPath();
  routePoints.slice(0, routeIndex + 1).forEach((point, index) => {
    const [x, y] = projectToScreen(point, camera, zoom);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = "#1975c7";
  context.lineWidth = 6;
  context.setLineDash([]);
  context.shadowColor = "rgba(25, 117, 199, 0.24)";
  context.shadowBlur = 8;
  context.stroke();
  context.restore();
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
    context.strokeStyle = "rgba(23, 54, 93, 0.38)";
    context.lineWidth = 1.5;
    context.setLineDash([3, 4]);
    context.stroke();
    context.setLineDash([]);
  }

  context.fillStyle = color;
  context.beginPath();
  context.arc(anchorX, anchorY, 8, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "white";
  context.lineWidth = 4;
  context.stroke();

  context.font = `${dark ? 700 : 600} 13px "Gowun Dodum", sans-serif`;
  const width = context.measureText(label).width + 24;
  roundedRect(x - width / 2, y - 17, width, 34, 11);
  context.fillStyle = dark ? "#17365d" : "rgba(255, 253, 248, 0.97)";
  context.shadowColor = "rgba(23, 54, 93, 0.18)";
  context.shadowBlur = 12;
  context.shadowOffsetY = 4;
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = dark ? "#fffaf0" : "#17365d";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y + 1);
  context.restore();
}

function drawLandmark(image, point, camera, zoom, width, anchorY = 0.82, alpha = 1) {
  if (!image || alpha <= 0) return;
  const [x, y] = projectToScreen(point, camera, zoom);
  if (x < -width || x > canvas.clientWidth + width || y < -width || y > canvas.clientHeight + width) return;
  const height = width * image.height / image.width;
  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = "rgba(23, 54, 93, 0.2)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 7;
  context.drawImage(image, x - width / 2, y - height * anchorY, width, height);
  context.restore();
}

function drawLocalLandmarks(camera, zoom, mapName, alpha) {
  if (mapName === "incheon") {
    drawLandmark(landmarks.incheonAirport, seoulAirport, camera, zoom, 190, 0.88, alpha);
    drawLandmark(landmarks.incheonBridge, [37.4136, 126.5667], camera, zoom, 180, 0.55, alpha);
    drawLandmark(landmarks.seoulTower, [37.5512, 126.9882], camera, zoom, 105, 0.88, alpha);
    drawLabel([36.7, 127.25], "대한민국", "#f4c95d", camera, zoom, 0, 0, true);
    drawLabel(seoulCity, "서울", "#f4c95d", camera, zoom, 54, -30);
    drawLabel(seoulAirport, "인천국제공항", "#ef6a5b", camera, zoom, -8, 62);
  } else {
    drawLandmark(landmarks.lisbonAirport, lisbonAirport, camera, zoom, 175, 0.88, alpha);
    drawLandmark(landmarks.belemTower, [38.6916, -9.2160], camera, zoom, 104, 0.86, alpha);
    drawLandmark(landmarks.abrilBridge, [38.6907, -9.1776], camera, zoom, 175, 0.58, alpha);
    drawLandmark(landmarks.lisbonTram, [38.7138, -9.1394], camera, zoom, 115, 0.82, alpha);
    drawLabel([38.73, -8.995], "포르투갈", "#f4c95d", camera, zoom, 0, 0, true);
    drawLabel(lisbonCity, "리스본", "#f4c95d", camera, zoom, -62, -28);
    drawLabel(lisbonAirport, "리스본 공항", "#4d9b76", camera, zoom, 64, 50);
  }
}

function drawWorldLabels(camera, zoom) {
  drawLabel([36.4, 127.8], "대한민국", "#ef6a5b", camera, zoom, -42, -52, true);
  drawLabel(seoulCity, "서울", "#f4c95d", camera, zoom, 54, -20);
  drawLabel(seoulAirport, "인천국제공항", "#ef6a5b", camera, zoom, 64, 24);
  drawLabel([39.5, -8.0], "포르투갈", "#4d9b76", camera, zoom, 42, -52, true);
  drawLabel(lisbonCity, "리스본", "#f4c95d", camera, zoom, -54, -20);
  drawLabel(lisbonAirport, "리스본 공항", "#4d9b76", camera, zoom, -66, 24);
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
  context.shadowColor = "rgba(21, 85, 155, 0.3)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function drawFrame(elapsed, routeProgress) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const camera = getRoutePoint(routeProgress);
  const ocean = context.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, "#dceff3");
  ocean.addColorStop(1, "#bddce4");
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);
  if (!assetsReady) return;

  const departureDuration = 3600;
  const arrivalStart = 9000;
  const arrivalDuration = 5040;
  const departureMix = smoothStep(elapsed / departureDuration);
  const arrivalMix = smoothStep((elapsed - arrivalStart) / arrivalDuration);
  const departureAlpha = 1 - smoothStep((elapsed - 2700) / 900);
  const lisbonAlpha = smoothStep((elapsed - 11600) / 600);
  const worldAlpha = Math.min(smoothStep((elapsed - 2500) / 900), 1 - smoothStep((elapsed - 11600) / 600));
  const departureZoom = mix(11.45, 10.05, departureMix);
  const worldZoom = mix(2.35, 5.0, arrivalMix);
  const lisbonZoom = mix(11.35, 13.15, smoothStep((elapsed - 11200) / 2840));

  drawMapSource(maps.world, camera, worldZoom, Math.max(0.08, worldAlpha));
  drawMapSource(maps.incheon, camera, departureZoom, departureAlpha);
  drawMapSource(maps.lisbon, camera, lisbonZoom, lisbonAlpha);

  let activeZoom = worldZoom;
  if (departureAlpha > 0.5) activeZoom = departureZoom;
  if (lisbonAlpha > 0.5) activeZoom = lisbonZoom;
  drawRoute(camera, activeZoom, routeProgress);

  if (departureAlpha > 0.05) drawLocalLandmarks(camera, departureZoom, "incheon", departureAlpha);
  if (worldAlpha > 0.2) drawWorldLabels(camera, worldZoom);
  if (lisbonAlpha > 0.05) drawLocalLandmarks(camera, lisbonZoom, "lisbon", lisbonAlpha);
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
  statusText.textContent = "여행 지도를 준비하는 중…";
  try {
    await loadAssets();
    resizeCanvas();
    setTimeout(playFlight, 500);
  } catch (error) {
    statusText.textContent = "지도 이미지를 확인해 주세요";
    console.error(error);
  }
});
