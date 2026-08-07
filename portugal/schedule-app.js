const locations = {
  gwangmyeong: [37.4786, 126.8644],
  gwacheon: [37.4292, 126.9876],
  seoul: [37.5665, 126.9780],
  incheonAirport: [37.4602, 126.4407],
  lisbon: [38.7223, -9.1393],
  lisbonAirport: [38.7742, -9.1342],
  lisbonApproach: [38.805, -9.305]
};

const schedules = {
  "gwangmyeong-gwacheon": {
    day: 1,
    label: "Day 01 · Meet up",
    title: "광명에서 과천으로",
    meta: "09:00 출발 <span class=\"dot\">✦</span> 약 40분 <span class=\"dot\">✦</span> 09:40 도착 예정",
    footer: "Day 1 · Gwangmyeong → Gwacheon",
    from: locations.gwangmyeong,
    to: locations.gwacheon,
    fromLabel: "광명",
    toLabel: "과천",
    camera: [37.454, 126.926],
    zoom: 10.8,
    duration: 5200,
    region: "incheon",
    vehicle: "car",
    status: ["광명에서 출발 준비 중…", "과천으로 이동하는 중…", "과천 도착! 일행 만나기"]
  },
  "incheon-lisbon": {
    day: 1,
    label: "Day 01 · Departure",
    title: "인천에서 리스본으로",
    meta: "12:00 출발 <span class=\"dot\">✦</span> 약 14시간 40분 <span class=\"dot\">✦</span> 리스본행",
    footer: "Day 1 · Incheon → Lisbon · 10,438 km",
    from: locations.incheonAirport,
    to: locations.lisbonAirport,
    fromLabel: "인천국제공항",
    toLabel: "리스본 공항",
    camera: [48, 58],
    zoom: 2.35,
    duration: 9000,
    region: null,
    vehicle: "plane",
    status: ["인천공항에서 출발 준비 중…", "포르투갈로 비행하는 중…", "내일, 리스본에서 계속"]
  },
  "lisbon-arrival": {
    day: 2,
    label: "Day 02 · Arrival",
    title: "리스본 공항 도착",
    meta: "18:00 현지 시각 <span class=\"dot\">✦</span> LIS 접근 <span class=\"dot\">✦</span> 포르투갈 도착",
    footer: "Day 2 · Welcome to Lisbon",
    from: locations.lisbonApproach,
    to: locations.lisbonAirport,
    fromLabel: "대서양",
    toLabel: "리스본 공항",
    camera: [38.742, -9.175],
    zoom: 11.25,
    duration: 5600,
    region: "lisbon",
    vehicle: "plane",
    status: ["리스본 공항으로 접근 중…", "포르투갈 상공을 비행하는 중…", "리스본 도착! 여행 시작"]
  }
};

const canvas = document.getElementById("mapCanvas");
const context = canvas.getContext("2d");
const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("statusText");
const arrivalNote = document.getElementById("arrivalNote");
const replayButton = document.getElementById("replayButton");
const dayOne = document.getElementById("dayOne");
const dayTwo = document.getElementById("dayTwo");
const dayLabel = document.getElementById("dayLabel");
const routeTitle = document.getElementById("routeTitle");
const routeMeta = document.getElementById("routeMeta");
const footerNote = document.getElementById("footerNote");
const scheduleButtons = [...document.querySelectorAll(".schedule-item")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const landmarkSources = {
  incheonAirport: "assets/landmarks/incheon_airport.png",
  incheonBridge: "assets/landmarks/incheon_bridge.png",
  seoulTower: "assets/landmarks/n_seoul_tower.png",
  airplane: "assets/landmarks/airplane.png",
  lisbonAirport: "assets/landmarks/lisbon_airport.png",
  belemTower: "assets/landmarks/belem_tower.png",
  abrilBridge: "assets/landmarks/abril_bridge.png",
  lisbonTram: "assets/landmarks/lisbon_tram.png",
  car: "assets/landmarks/travel_car.png",
  mountains: "assets/landmarks/korean_mountains.png",
  river: "assets/landmarks/river_bend.png",
  portugalCoast: "assets/landmarks/portugal_coast.png"
};

const landmarks = {};
const mapPaths = {
  land: new Path2D(),
  countries: { KOR: new Path2D(), PRT: new Path2D() },
  local: {
    incheon: { coastline: new Path2D(), waterway: new Path2D(), runway: new Path2D(), taxiway: new Path2D() },
    lisbon: { coastline: new Path2D(), waterway: new Path2D(), runway: new Path2D(), taxiway: new Path2D() }
  }
};

let selectedSchedule = "gwangmyeong-gwacheon";
let animationFrame;
let animationStart;
let currentProgress = 0;
let assetsReady = false;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
}

function mercatorNormalized(point) {
  const latitude = clamp(point[0], -85.0511, 85.0511);
  const sinLatitude = Math.sin(latitude * Math.PI / 180);
  return [
    (point[1] + 180) / 360,
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
  window.MAP_DATA.land.forEach(polygon => polygon.forEach(ring => addLine(mapPaths.land, ring, true)));
  ["KOR", "PRT"].forEach(code => {
    (window.MAP_DATA.countries[code] || []).forEach(polygon => polygon.forEach(ring => addLine(mapPaths.countries[code], ring, true)));
  });
  Object.entries(window.MAP_DATA.local).forEach(([region, lines]) => {
    lines.forEach(line => {
      const key = line.category === "aeroway" ? line.subtype : line.category;
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
  const entries = await Promise.all(Object.entries(landmarkSources).map(async ([key, path]) => [key, await loadImage(path)]));
  entries.forEach(([key, image]) => { landmarks[key] = image; });
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFrame(currentProgress);
}

function withMapTransform(camera, zoom, draw) {
  const [cameraX, cameraY] = mercatorNormalized(camera);
  const scale = 256 * 2 ** zoom;
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
  const scale = 256 * 2 ** zoom;
  return [canvas.clientWidth / 2 + (pointX - cameraX) * scale, canvas.clientHeight / 2 + (pointY - cameraY) * scale];
}

function strokePath(path, color, width, scale, alpha = 1) {
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width / scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke(path);
}

function drawZonePolygon(points, fill) {
  context.beginPath();
  points.forEach(([x, y], index) => {
    const px = x * canvas.clientWidth;
    const py = y * canvas.clientHeight;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = "#62401f";
  context.lineWidth = 2.2;
  context.lineJoin = "round";
  context.stroke();
}

function drawIllustratedZones(config) {
  if (!config.region) return;
  context.save();
  context.globalAlpha = 0.94;
  context.fillStyle = "#fbf8ef";
  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (config.region === "incheon") {
    drawZonePolygon([[0.04,0.2],[0.26,0.08],[0.49,0.13],[0.6,0.34],[0.54,0.55],[0.3,0.6],[0.08,0.48]], "#acd15c");
    drawZonePolygon([[0.49,0.13],[0.78,0.08],[0.96,0.22],[0.91,0.49],[0.72,0.57],[0.54,0.55],[0.6,0.34]], "#91c34d");
    drawZonePolygon([[0.08,0.48],[0.3,0.6],[0.54,0.55],[0.64,0.78],[0.47,0.94],[0.18,0.88],[0.03,0.7]], "#c0dc71");
    drawZonePolygon([[0.54,0.55],[0.72,0.57],[0.91,0.49],[0.97,0.74],[0.8,0.91],[0.64,0.78]], "#a6ce5a");
  } else {
    drawZonePolygon([[0.03,0.14],[0.32,0.06],[0.54,0.18],[0.56,0.48],[0.33,0.59],[0.08,0.46]], "#b7d66e");
    drawZonePolygon([[0.54,0.18],[0.86,0.1],[0.97,0.3],[0.88,0.55],[0.56,0.48]], "#96c35a");
    drawZonePolygon([[0.08,0.46],[0.33,0.59],[0.55,0.7],[0.44,0.94],[0.14,0.88],[0.02,0.68]], "#d5df86");
    drawZonePolygon([[0.55,0.7],[0.88,0.55],[0.98,0.72],[0.84,0.92],[0.44,0.94]], "#accd68");
  }
  context.restore();
}

function drawMapBase(config) {
  withMapTransform(config.camera, config.zoom, scale => {
    context.fillStyle = "#f7f3e7";
    context.strokeStyle = "#62401f";
    context.lineWidth = 1.4 / scale;
    context.fill(mapPaths.land, "evenodd");
    context.stroke(mapPaths.land);
    context.globalAlpha = 0.3;
    context.fillStyle = "#f1c65e";
    context.fill(mapPaths.countries.KOR, "evenodd");
    context.fillStyle = "#6fa97e";
    context.fill(mapPaths.countries.PRT, "evenodd");
    context.globalAlpha = 1;
  });

  if (!config.region) return;
  drawIllustratedZones(config);
  const paths = mapPaths.local[config.region];
  withMapTransform(config.camera, config.zoom, scale => {
    strokePath(paths.coastline, "#3b91b2", 4.2, scale);
    strokePath(paths.waterway, "#54b7d1", 8.5, scale, 0.96);
    strokePath(paths.taxiway, "#d6b562", 2.4, scale, 0.72);
    strokePath(paths.runway, "#536372", 12, scale, 0.9);
    strokePath(paths.runway, "#fffdf8", 2, scale, 0.95);
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

function drawLabel(point, label, color, config, offsetX = 0, offsetY = 0, dark = false) {
  const [anchorX, anchorY] = projectToScreen(point, config.camera, config.zoom);
  if (anchorX < -170 || anchorX > canvas.clientWidth + 170 || anchorY < -90 || anchorY > canvas.clientHeight + 90) return;
  const x = anchorX + offsetX;
  const y = anchorY + offsetY;
  context.save();
  if (offsetX || offsetY) {
    context.beginPath();
    context.moveTo(anchorX, anchorY);
    context.lineTo(x, y);
    context.strokeStyle = "rgba(23,54,93,0.32)";
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
  context.shadowColor = "rgba(23,54,93,0.16)";
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

function drawLandmark(image, point, config, width, anchor = 0.86, alpha = 1) {
  if (!image) return;
  const [x, y] = projectToScreen(point, config.camera, config.zoom);
  if (x < -width || x > canvas.clientWidth + width || y < -width || y > canvas.clientHeight + width) return;
  const height = width * image.height / image.width;
  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, x - width / 2, y - height * anchor, width, height);
  context.restore();
}

function routePoint(config, progress) {
  if (config === schedules["incheon-lisbon"]) {
    return [
      config.from[0] + (config.to[0] - config.from[0]) * progress + Math.sin(Math.PI * progress) * 24,
      config.from[1] + (config.to[1] - config.from[1]) * progress
    ];
  }
  const curve = Math.sin(Math.PI * progress) * (config === schedules["lisbon-arrival"] ? 0.012 : 0.025);
  return [
    config.from[0] + (config.to[0] - config.from[0]) * progress + curve,
    config.from[1] + (config.to[1] - config.from[1]) * progress
  ];
}

function buildRoute(config) {
  return Array.from({ length: 241 }, (_, index) => routePoint(config, index / 240));
}

function drawRoute(config, progress) {
  const route = buildRoute(config);
  const routeIndex = Math.floor(progress * 240);
  const stroke = (points, color, width, dashed) => {
    context.beginPath();
    points.forEach((point, index) => {
      const [x, y] = projectToScreen(point, config.camera, config.zoom);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash(dashed ? [3, 11] : []);
    context.stroke();
  };
  stroke(route, "rgba(255,255,255,0.95)", 5, true);
  stroke(route.slice(0, routeIndex + 1), "#1975c7", 6, false);
}

function drawMovingVehicle(config, progress) {
  const image = config.vehicle === "car" ? landmarks.car : landmarks.airplane;
  if (!image) return;
  const point = routePoint(config, progress);
  const [x, y] = projectToScreen(point, config.camera, config.zoom);
  const width = config.vehicle === "car" ? 74 : 88;
  const height = width * image.height / image.width;
  context.save();
  context.translate(x, y);
  if (config.vehicle === "plane") {
    context.scale(-1, 1);
    context.rotate(-0.12);
  }
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function drawTerrainAndLandmarks(config) {
  if (config === schedules["gwangmyeong-gwacheon"]) {
    drawLandmark(landmarks.mountains, [37.444, 126.967], config, 150, 0.84, 0.86);
    drawLandmark(landmarks.river, [37.548, 126.93], config, 132, 0.58, 0.68);
    drawLabel(locations.gwangmyeong, "광명", "#ef6a5b", config, -46, 34);
    drawLabel(locations.gwacheon, "과천", "#4d9b76", config, 46, -34);
  } else if (config === schedules["incheon-lisbon"]) {
    drawLabel([36.4, 127.8], "대한민국", "#ef6a5b", config, -42, -52, true);
    drawLabel(locations.incheonAirport, "인천국제공항", "#ef6a5b", config, 62, 24);
    drawLabel([39.5, -8.0], "포르투갈", "#4d9b76", config, 42, -52, true);
    drawLabel(locations.lisbonAirport, "리스본 공항", "#4d9b76", config, -66, 24);
  } else {
    drawLandmark(landmarks.portugalCoast, [38.69, -9.19], config, 165, 0.72, 0.82);
    drawLandmark(landmarks.lisbonAirport, locations.lisbonAirport, config, 155);
    drawLandmark(landmarks.belemTower, [38.6916, -9.2160], config, 86);
    drawLandmark(landmarks.abrilBridge, [38.6907, -9.1776], config, 145, 0.58);
    drawLandmark(landmarks.lisbonTram, [38.7138, -9.1394], config, 96);
    drawLabel([38.79, -9.04], "포르투갈", "#f4c95d", config, 0, 0, true);
    drawLabel(locations.lisbon, "리스본", "#f4c95d", config, -58, -28);
    drawLabel(locations.lisbonAirport, "리스본 공항", "#4d9b76", config, 62, 52);
  }
}

function drawFrame(progress) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const ocean = context.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, "#cee7ed");
  ocean.addColorStop(1, "#a8d0dc");
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);
  if (!assetsReady) return;

  const config = schedules[selectedSchedule];
  drawMapBase(config);
  drawTerrainAndLandmarks(config);
  drawRoute(config, progress);
  drawMovingVehicle(config, progress);
}

function setInfo(config) {
  dayLabel.textContent = config.label;
  routeTitle.textContent = config.title;
  routeMeta.innerHTML = config.meta;
  footerNote.innerHTML = `<span>♥</span> ${config.footer}`;
  arrivalNote.textContent = config.day === 2 ? "Olá, Lisboa! ☀" : "일정 완료 ✦";
}

function updateStatus(config, progress) {
  progressBar.style.width = `${Math.round(progress * 100)}%`;
  statusText.textContent = progress < 0.08 ? config.status[0] : progress < 1 ? config.status[1] : config.status[2];
}

function playSchedule() {
  cancelAnimationFrame(animationFrame);
  animationStart = undefined;
  currentProgress = 0;
  arrivalNote.classList.remove("show");
  const config = schedules[selectedSchedule];
  setInfo(config);
  updateStatus(config, 0);
  drawFrame(0);

  if (reducedMotion) {
    currentProgress = 1;
    updateStatus(config, 1);
    drawFrame(1);
    arrivalNote.classList.add("show");
    return;
  }

  function animate(timestamp) {
    if (!animationStart) animationStart = timestamp;
    const linear = clamp((timestamp - animationStart) / config.duration);
    currentProgress = easeInOutCubic(linear);
    updateStatus(config, linear);
    drawFrame(currentProgress);
    if (linear < 1) animationFrame = requestAnimationFrame(animate);
    else arrivalNote.classList.add("show");
  }
  animationFrame = requestAnimationFrame(animate);
}

function selectSchedule(name) {
  selectedSchedule = name;
  scheduleButtons.forEach(button => {
    const active = button.dataset.schedule === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  playSchedule();
}

function selectDay(day) {
  dayOne.classList.toggle("active", day === 1);
  dayTwo.classList.toggle("active", day === 2);
  dayOne.setAttribute("aria-pressed", String(day === 1));
  dayTwo.setAttribute("aria-pressed", String(day === 2));
  scheduleButtons.forEach(button => { button.hidden = Number(button.dataset.day) !== day; });
  const firstSchedule = scheduleButtons.find(button => Number(button.dataset.day) === day)?.dataset.schedule;
  if (firstSchedule) selectSchedule(firstSchedule);
}

scheduleButtons.forEach(button => button.addEventListener("click", () => selectSchedule(button.dataset.schedule)));
dayOne.addEventListener("click", () => selectDay(1));
dayTwo.addEventListener("click", () => selectDay(2));
replayButton.addEventListener("click", playSchedule);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", async () => {
  resizeCanvas();
  statusText.textContent = "여행 지도를 준비하는 중…";
  try {
    buildVectorPaths();
    await loadLandmarks();
    assetsReady = true;
    resizeCanvas();
    setTimeout(() => selectSchedule(selectedSchedule), 350);
  } catch (error) {
    statusText.textContent = "지도 자료를 확인해 주세요";
    console.error(error);
  }
});
