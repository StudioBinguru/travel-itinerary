const MAP_ZOOM = 15;
const TILE_SIZE = 512;
const MAP_SCALE = 2 ** (MAP_ZOOM - 14);
const ZOOM_OUT_STEP = Math.sqrt(1.22);
const ZOOM_IN_STEP = 1 / ZOOM_OUT_STEP;
const MARKER_RADIUS = 34 * MAP_SCALE;
const LABEL_HALF_HEIGHT = 34 * MAP_SCALE;
const LABEL_GAP = 12 * MAP_SCALE;

const days = [
  {
    id: "busan-day-1",
    date: "첫째 날 · 8월 13일 목요일",
    color: "#287cbe",
    image: "assets/map_sources/busan_shared_z15.webp",
    imageSize: [9728, 7680],
    tileOrigin: [28123, 12959],
    initialView: [448.5, 2399.1, 6710, 4312.2],
    places: [
      ["부산역", 35.1155532, 129.0425868, 0, -92],
      ["이재모피자 본점", 35.1009844, 129.0310242, 210, 0, 34, 12],
      ["국제시장", 35.1011643, 129.0281925, 0, -92, -34, -12],
      ["초량1941", 35.1264606, 129.0377097, 0, -92],
      ["감천문화마을", 35.0963371, 129.0087897, 0, -92],
      ["송도해상케이블카", 35.0689247, 129.0220234, 0, -92],
      ["흰여울문화마을", 35.0773961, 129.0456513, 0, -92],
      ["자갈치시장", 35.0966276, 129.0306885, 0, 100],
      ["대연역", 35.1351, 129.0915, 0, -92],
    ],
    schedule: [
      ["10:00", "부산역 도착 · 짐 보관", "부산 동구 중앙대로 206"],
      ["10:40–12:00", "이재모피자 본점", "부산 중구 광복중앙로 31"],
      ["12:00–12:30", "국제시장 구경", "부산 중구 신창동4가 일원"],
      ["13:00–13:50", "초량1941", "부산 동구 망양로 533-5"],
      ["14:20–15:30", "감천문화마을", "부산 사하구 감내2로 203"],
      ["15:50–17:10", "송도해상케이블카", "부산 서구 송도해변로 171"],
      ["17:30–18:40", "흰여울문화마을", "부산 영도구 절영로 194"],
      ["19:00–20:30", "자갈치시장 구경 · 꼼장어 저녁", "부산 중구 자갈치해안로 52"],
      ["20:30 이후", "대연역 숙소", "부산 남구 수영로 일대"],
    ],
    transfers: {
      0: {
        duration: "12분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 81 · 12분",
        summary: "도보 3분 · 81번 버스 7분 · 도보 1분",
        detail: "부산역 정류장 → 4개 정류장 → 국제시장 하차",
        note: "40번 버스도 이용 가능",
        labelOffset: [170, -130],
        path: {
          walkStart: [
            [35.1155532, 129.0425868],
            [35.11545, 129.04165],
            [35.11528, 129.04055],
          ],
          main: [
            [35.11528, 129.04055],
            [35.1127, 129.03955],
            [35.1095, 129.03785],
            [35.1062, 129.03655],
            [35.1032, 129.03595],
            [35.10185, 129.03585],
            [35.10178, 129.03315],
          ],
          walkEnd: [
            [35.10178, 129.03315],
            [35.1017, 129.03255],
            [35.10135, 129.03175],
            [35.1009844, 129.0310242],
          ],
        },
      },
      1: {
        duration: "3분",
        durationPosition: "bottom-left",
        mode: "도보",
        modeKey: "walk",
        icon: "도보",
        routeLabel: "도보 · 3분",
        summary: "도보 210m · 약 328걸음",
        detail: "이재모피자 본점 → 국제시장",
        labelOffset: [40, -115],
        path: {
          main: [
            [35.1009844, 129.0310242],
            [35.10105, 129.03015],
            [35.10108, 129.02915],
            [35.10148, 129.02845],
            [35.10122, 129.02805],
            [35.1011643, 129.0281925],
          ],
        },
      },
      2: {
        duration: "19분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 86 · 19분",
        summary: "도보 4분 · 86번 버스 10분 · 도보 3분",
        detail: "국제시장 → 금수사 하차",
        note: "186번 버스도 이용 가능",
        labelOffset: [-190, -120],
        path: {
          walkStart: [
            [35.1011643, 129.0281925],
            [35.10215, 129.02935],
            [35.1031, 129.03015],
          ],
          main: [
            [35.1031, 129.03015],
            [35.1062, 129.0322],
            [35.1091, 129.0312],
            [35.1118, 129.0331],
            [35.115, 129.0316],
            [35.1181, 129.0338],
            [35.1212, 129.0331],
            [35.1236, 129.0351],
          ],
          walkEnd: [
            [35.1236, 129.0351],
            [35.1252, 129.0361],
            [35.1264606, 129.0377097],
          ],
        },
      },
      3: {
        duration: "17분",
        fare: "예상 8,500원",
        mode: "택시",
        modeKey: "taxi",
        icon: "택시",
        routeLabel: "택시 · 17분",
        summary: "택시 5.5km",
        detail: "영주로 → 중구로 → 까치고개로",
        labelOffset: [120, -135],
        path: {
          main: [
            [35.1264606, 129.0377097],
            [35.1268, 129.0358],
            [35.1243, 129.0336],
            [35.1215, 129.0332],
            [35.1178, 129.0309],
            [35.1138, 129.0323],
            [35.1095, 129.0298],
            [35.1051, 129.0252],
            [35.1018, 129.0201],
            [35.1012, 129.0143],
            [35.0989, 129.0111],
            [35.0963371, 129.0087897],
          ],
        },
      },
      4: {
        duration: "11분",
        fare: "예상 6,200원",
        mode: "택시",
        modeKey: "taxi",
        icon: "택시",
        routeLabel: "택시 · 11분",
        summary: "택시 3.8km",
        detail: "옥천로 → 감천로 → 충무대로",
        labelOffset: [-80, -135],
        path: {
          main: [
            [35.0963371, 129.0087897],
            [35.0933, 129.0081],
            [35.0901, 129.0084],
            [35.0864, 129.0058],
            [35.0819, 129.0033],
            [35.0785, 129.0072],
            [35.0771, 129.0124],
            [35.0739, 129.0167],
            [35.0712, 129.0192],
            [35.0689247, 129.0220234],
          ],
        },
      },
      5: {
        duration: "8분",
        fare: "예상 6,300원",
        mode: "택시",
        modeKey: "taxi",
        icon: "택시",
        routeLabel: "택시 · 8분",
        summary: "택시 3.8km",
        detail: "등대로 → 영선대로 → 절영로",
        labelOffset: [0, -140],
        path: {
          main: [
            [35.0689247, 129.0220234],
            [35.0714, 129.0231],
            [35.0747, 129.0238],
            [35.0762, 129.0281],
            [35.0764, 129.0348],
            [35.077, 129.0401],
            [35.0805, 129.0442],
            [35.0827, 129.0455],
            [35.0796, 129.0472],
            [35.0773961, 129.0456513],
          ],
        },
      },
      6: {
        duration: "19분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 9 · 19분",
        summary: "도보 2분 · 9번 버스 12분 · 도보 4분",
        detail: "흰여울문화마을 → 3개 정류장 → 남포동 하차",
        labelOffset: [180, -120],
        path: {
          walkStart: [
            [35.0773961, 129.0456513],
            [35.0782, 129.0448],
          ],
          main: [
            [35.0782, 129.0448],
            [35.0819, 129.0431],
            [35.0862, 129.0416],
            [35.0905, 129.0392],
            [35.0941, 129.0365],
            [35.0972, 129.0351],
            [35.0984, 129.0327],
          ],
          walkEnd: [
            [35.0984, 129.0327],
            [35.0975, 129.0317],
            [35.0966276, 129.0306885],
          ],
        },
      },
      7: {
        duration: "33분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 41 · 33분",
        summary: "도보 1분 · 41번 버스 29분 · 도보 2분",
        detail: "자갈치시장 → 22개 정류장 → 대연역 하차",
        labelOffset: [0, -145],
        path: {
          walkStart: [
            [35.0966276, 129.0306885],
            [35.0974, 129.0317],
          ],
          main: [
            [35.0974, 129.0317],
            [35.1016, 129.0355],
            [35.107, 129.0384],
            [35.1145, 129.0412],
            [35.1225, 129.0452],
            [35.1307, 129.0523],
            [35.1372, 129.0618],
            [35.1396, 129.0715],
            [35.1391, 129.0817],
            [35.1372, 129.0893],
          ],
          walkEnd: [
            [35.1372, 129.0893],
            [35.1351, 129.0915],
          ],
        },
      },
    },
  },
  {
    id: "busan-day-2",
    date: "둘째 날 · 8월 14일 금요일",
    color: "#4ca99f",
    image: "assets/map_sources/busan_shared_z15.webp",
    imageSize: [9728, 7680],
    tileOrigin: [28123, 12959],
    initialView: [5332.5, 731.4, 4061.8, 2610.3],
    places: [
      ["대연역", 35.1351, 129.0915, 0, -92],
      ["톤쇼우 광안점", 35.1563957, 129.1248902, 0, -92],
      ["광안리 해수욕장", 35.1508879, 129.1167806, 0, -92],
      ["바닷마을과자점", 35.1460116, 129.1135348, -245, 0, -48, 22],
      ["다케다야", 35.1467057, 129.1134478, 190, 0, 48, -22],
      ["해운대해수욕장", 35.1592859, 129.1586091, 0, -92],
      ["더베이101", 35.1607386, 129.148551, 0, 100],
    ],
    schedule: [
      ["09:40", "대연역 숙소 출발", "부산 남구 수영로 일대"],
      ["10:00", "톤쇼우 광안점 웨이팅 등록", "부산 수영구 광안해변로279번길 13"],
      ["10:10–11:00", "광안리 해수욕장 산책", "부산 수영구 광안해변로 219"],
      ["11:00–12:30", "톤쇼우 광안점", "부산 수영구 광안해변로279번길 13"],
      ["12:40–13:30", "바닷마을과자점", "부산 수영구 광남로48번길 43 2층"],
      ["13:30–16:30", "대연역 숙소 복귀 · 휴식", "부산 남구 수영로 일대"],
      ["17:00–18:00", "다케다야", "부산 수영구 남천동로108번길 31 2층"],
      ["18:40–19:40", "해운대해수욕장", "부산 해운대구 해운대해변로 264"],
      ["19:40–20:30", "더베이101 야경", "부산 해운대구 동백로 52"],
      ["20:30 이후", "대연역 숙소 복귀", "부산 남구 수영로 일대"],
    ],
    transfers: {
      0: {
        duration: "25분",
        durationPosition: "left",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 41 · 25분",
        summary: "도보 2분 · 41번 버스 15분 · 도보 6분",
        detail: "대연역 → 민락동골목시장 하차 → 톤쇼우 광안점",
        note: "83번 버스도 이용 가능",
        path: {
          main: [
            [35.1351, 129.0915],
            [35.1353, 129.0940],
            [35.1360, 129.0975],
            [35.1375, 129.1004],
            [35.1398, 129.1040],
            [35.1420, 129.1078],
            [35.1454, 129.1097],
            [35.1497, 129.1107],
            [35.1537, 129.1116],
            [35.1573, 129.1130],
            [35.1576, 129.1160],
            [35.1574, 129.1195],
            [35.1569, 129.1224],
            [35.1563957, 129.1248902],
          ],
        },
      },
      1: {
        duration: "8분",
        mode: "도보",
        modeKey: "walk",
        icon: "도보",
        routeLabel: "도보 · 8분",
        summary: "도보 551m · 약 861걸음",
        detail: "광안해변로 골목 → 광안리 해수욕장",
        path: {
          main: [
            [35.1563957, 129.1248902],
            [35.1557, 129.1239],
            [35.15515, 129.1226],
            [35.15435, 129.1213],
            [35.15345, 129.12015],
            [35.1525, 129.11895],
            [35.15155, 129.11765],
            [35.1508879, 129.1167806],
          ],
        },
      },
      2: {
        duration: "8분",
        mode: "도보",
        modeKey: "walk",
        icon: "도보",
        routeLabel: "도보 · 8분",
        summary: "광안리 해변에서 톤쇼우로 복귀",
        detail: "광안리 해수욕장 → 톤쇼우 광안점",
        path: {
          main: [
            [35.1508879, 129.1167806],
            [35.15155, 129.11765],
            [35.1525, 129.11895],
            [35.15345, 129.12015],
            [35.15435, 129.1213],
            [35.15515, 129.1226],
            [35.1557, 129.1239],
            [35.1563957, 129.1248902],
          ],
        },
      },
      3: {
        duration: "21분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 41 · 21분",
        summary: "도보 8분 · 41번 버스 8분 · 도보 4분",
        detail: "민락동골목시장 → 수영구청 하차 → 바닷마을과자점",
        path: {
          main: [
            [35.1563957, 129.1248902],
            [35.1551, 129.1233],
            [35.1535, 129.1207],
            [35.1518, 129.1184],
            [35.1499, 129.1162],
            [35.1482, 129.1148],
            [35.14675, 129.11395],
            [35.1460116, 129.1135348],
          ],
        },
      },
      4: {
        duration: "14분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 42 · 14분",
        summary: "도보 4분 · 42번 버스 7분 · 도보 2분",
        detail: "수영구청 → 대남교차로 → 대연역",
        note: "41번 버스도 이용 가능",
        path: {
          main: [
            [35.1460116, 129.1135348],
            [35.14525, 129.1126],
            [35.14375, 129.1099],
            [35.1418, 129.1067],
            [35.13965, 129.1024],
            [35.13765, 129.0977],
            [35.13615, 129.0937],
            [35.1351, 129.0915],
          ],
        },
      },
      5: {
        duration: "14분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 41 · 14분",
        summary: "도보 2분 · 41번 버스 8분 · 도보 1분",
        detail: "대연역 → 수영구청 하차 → 다케다야",
        path: {
          main: [
            [35.1351, 129.0915],
            [35.13615, 129.0937],
            [35.13765, 129.0977],
            [35.13965, 129.1024],
            [35.1418, 129.1067],
            [35.14375, 129.1099],
            [35.14525, 129.1126],
            [35.1467057, 129.1134478],
          ],
        },
      },
      6: {
        duration: "29분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "버스 1003 · 29분",
        summary: "도보 4분 · 1003번 버스 21분 · 도보 1분",
        detail: "금련산청소년수련원 → 동백섬입구 하차 → 해운대해수욕장",
        path: {
          main: [
            [35.1467057, 129.1134478],
            [35.1504, 129.1144],
            [35.1547, 129.1148],
            [35.1589, 129.1175],
            [35.1624, 129.1226],
            [35.1659, 129.1292],
            [35.1692, 129.1364],
            [35.1686, 129.1427],
            [35.1652, 129.1486],
            [35.1621, 129.1539],
            [35.1592859, 129.1586091],
          ],
        },
      },
      7: {
        duration: "2분",
        mode: "도보",
        modeKey: "walk",
        icon: "도보",
        routeLabel: "도보 · 2분",
        summary: "도보 191m · 약 299걸음",
        detail: "해운대해수욕장 → 동백섬 입구 → 더베이101",
        path: {
          main: [
            [35.1592859, 129.1586091],
            [35.15965, 129.1569],
            [35.15995, 129.1549],
            [35.1602, 129.1529],
            [35.1607386, 129.148551],
          ],
        },
      },
      8: {
        duration: "29분",
        mode: "대중교통",
        modeKey: "subway",
        icon: "버스",
        routeLabel: "지하철 2호선 · 29분",
        summary: "도보 12분 · 지하철 16분",
        detail: "동백역 → 대연역",
        path: {
          main: [
            [35.1607386, 129.148551],
            [35.1641, 129.1464],
            [35.1675, 129.1417],
            [35.1702, 129.1362],
            [35.1684, 129.1291],
            [35.1643, 129.1214],
            [35.1591, 129.1161],
            [35.1533, 129.1137],
            [35.1473, 129.1114],
            [35.1419, 129.1059],
            [35.1374, 129.0981],
            [35.1351, 129.0915],
          ],
        },
      },
    },
  },
  {
    id: "busan-day-3",
    date: "셋째 날 · 8월 15일 토요일",
    color: "#7467b8",
    image: "assets/map_sources/busan_shared_z15.webp",
    imageSize: [9728, 7680],
    tileOrigin: [28123, 12959],
    initialView: [2860, 443.6, 5700, 3668.8],
    places: [
      ["대연역", 35.1351, 129.0915, 0, -92],
      ["벡스코", 35.168806, 129.136168, 0, -92],
      ["수변최고돼지국밥 센텀점", 35.1678653, 129.1334958, -310, 0],
      ["부산역", 35.1155532, 129.0425868, 0, -92],
    ],
    schedule: [
      ["07:50", "대연역 숙소 체크아웃 · 짐 챙기기", "부산 남구 수영로 일대"],
      ["10:00–13:00", "벡스코 · BIC 인디게임 페스티벌", "부산 해운대구 APEC로 55"],
      ["13:05–13:50", "수변최고돼지국밥 센텀점", "부산 해운대구 센텀3로 26 2층"],
      ["14:40–15:10", "부산역 간식 구입 · 탑승 준비", "부산 동구 중앙대로 206"],
      ["15:30경", "부산역 출발", "부산 동구 중앙대로 206"],
    ],
    transfers: {
      0: {
        duration: "17분",
        mode: "대중교통",
        modeKey: "subway",
        icon: "버스",
        routeLabel: "지하철 2호선 · 17분",
        summary: "지하철 12분 · 도보 4분",
        detail: "대연역 → 센텀시티역 → 벡스코",
        path: {
          main: [
            [35.1351, 129.0915],
            [35.1372, 129.0953],
            [35.1415, 129.1018],
            [35.1468, 129.1088],
            [35.1532, 129.1151],
            [35.1594, 129.1211],
            [35.165, 129.1284],
            [35.1682, 129.1335],
            [35.168806, 129.136168],
          ],
        },
      },
      1: {
        duration: "4분",
        mode: "도보",
        modeKey: "walk",
        icon: "도보",
        routeLabel: "도보 · 4분",
        summary: "도보 194m · 약 304걸음",
        detail: "벡스코 → 센텀시티역 방면 → 수변최고돼지국밥 센텀점",
        path: {
          main: [
            [35.168806, 129.136168],
            [35.16825, 129.13575],
            [35.16755, 129.13605],
            [35.1671, 129.1355],
            [35.16755, 129.13465],
            [35.1678653, 129.1334958],
          ],
        },
      },
      2: {
        duration: "44분",
        mode: "대중교통",
        modeKey: "bus",
        icon: "버스",
        routeLabel: "지하철 2호선 · 버스 41 · 44분",
        summary: "도보 5분 · 지하철 14분 · 41번 버스 18분 · 도보 3분",
        detail: "센텀시티역 → 남구청·못골역 → 부산역",
        path: {
          main: [
            [35.1678653, 129.1334958],
            [35.1669, 129.1322],
            [35.1636, 129.126],
            [35.1593, 129.1192],
            [35.1541, 129.1144],
            [35.1483, 129.1127],
            [35.1424, 129.1061],
            [35.1373, 129.0982],
            [35.1348, 129.0907],
            [35.1326, 129.0802],
            [35.1308, 129.0694],
            [35.1284, 129.0583],
            [35.1235, 129.0503],
            [35.1184, 129.0451],
            [35.1155532, 129.0425868],
          ],
        },
      },
    },
  },
];

const svg = document.querySelector("#trip-map");
const mapImage = document.querySelector("#map-image");
const routeLayer = document.querySelector("#route-layer");
const markerLayer = document.querySelector("#marker-layer");
const transportLayer = document.querySelector("#transport-layer");
const scheduleList = document.querySelector("#schedule-list");
const state = days.map((day) => ({ viewBox: [...day.initialView], selectedTransfer: null }));
let activeDay = 0;
let drag = null;

function project(lat, lon, day) {
  const worldX = ((lon + 180) / 360) * 2 ** MAP_ZOOM;
  const radians = lat * Math.PI / 180;
  const worldY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * 2 ** MAP_ZOOM;
  return [(worldX - day.tileOrigin[0]) * TILE_SIZE, (worldY - day.tileOrigin[1]) * TILE_SIZE];
}

function labelWidth(name) {
  return Math.max(150, name.length * 38 + 44) * MAP_SCALE;
}

function pathData(points, day, startOffset = [0, 0], endOffset = [0, 0]) {
  return points.map(([lat, lon], index) => {
    let [x, y] = project(lat, lon, day);
    if (index === 0) {
      x += startOffset[0];
      y += startOffset[1];
    }
    if (index === points.length - 1) {
      x += endOffset[0];
      y += endOffset[1];
    }
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function polylineMidpoint(points, day) {
  const projectedPoints = points.map(([lat, lon]) => project(lat, lon, day));
  const segments = projectedPoints.slice(1).map((point, index) => {
    const start = projectedPoints[index];
    return {
      start,
      end: point,
      length: Math.hypot(point[0] - start[0], point[1] - start[1]),
    };
  });
  const halfway = segments.reduce((sum, segment) => sum + segment.length, 0) / 2;
  let travelled = 0;

  for (const segment of segments) {
    if (travelled + segment.length >= halfway) {
      const ratio = segment.length ? (halfway - travelled) / segment.length : 0;
      return [
        segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
        segment.start[1] + (segment.end[1] - segment.start[1]) * ratio,
      ];
    }
    travelled += segment.length;
  }

  return projectedPoints[0] || [0, 0];
}

function routeModeIcon(modeKey) {
  return {
    bus: "🚌",
    subway: "🚇",
    taxi: "🚕",
    walk: "👟",
  }[modeKey] || "●";
}

function schedulePlace(day, scheduleIndex) {
  const scheduleName = day.schedule[scheduleIndex]?.[1] || "";
  return day.places.find((place) => scheduleName.includes(place[0]) || place[0].includes(scheduleName));
}

function displayedMarkerOffset(place, markerScale) {
  return place
    ? [(place[5] || 0) * MAP_SCALE * markerScale, (place[6] || 0) * MAP_SCALE * markerScale]
    : [0, 0];
}

function renderTransitRoute(transfer, transferIndex, day, markerScale) {
  const segments = [transfer.path.walkStart, transfer.path.main, transfer.path.walkEnd]
    .filter(Boolean);
  const startOffset = displayedMarkerOffset(schedulePlace(day, transferIndex), markerScale);
  const endOffset = displayedMarkerOffset(schedulePlace(day, transferIndex + 1), markerScale);
  const routePaths = segments.map((points, index) => pathData(
    points,
    day,
    index === 0 ? startOffset : [0, 0],
    index === segments.length - 1 ? endOffset : [0, 0],
  ));
  return `
    <g class="verified-transfer">
      ${routePaths.map((path) => `<path class="transit-casing" d="${path}"></path>`).join("")}
      ${routePaths.map((path) => `<path class="transit-${transfer.modeKey} route-hit-path" d="${path}"></path>`).join("")}
    </g>`;
}

function renderTransportOverlay(transfer, day, markerScale) {
  const [iconX, iconY] = polylineMidpoint(transfer.path.main, day);
  return `
    <g class="route-mode-marker route-mode-${transfer.modeKey}" transform="translate(${iconX} ${iconY}) scale(${markerScale})" role="img" aria-label="${transfer.icon}">
      <text x="0" y="${2 * MAP_SCALE}">${routeModeIcon(transfer.modeKey)}</text>
    </g>
    <g class="route-duration-label" data-scale="${markerScale}" data-preferred-position="${transfer.durationPosition || ""}" transform="translate(${iconX} ${iconY}) scale(${markerScale})">
      <text x="0" y="4">${transfer.duration}</text>
    </g>`;
}

function rectanglesOverlap(first, second) {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

function intersectionArea(first, second) {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
}

function pathCoversRectangle(path, rectangle) {
  const matrix = path.getScreenCTM();
  if (!matrix) return false;
  const pathLength = path.getTotalLength();
  const screenScale = Math.max(.01, Math.hypot(matrix.a, matrix.b));
  const sampleStep = Math.max(1, 5 / screenScale);
  const padding = 3;

  for (let distance = 0; distance <= pathLength; distance += sampleStep) {
    const point = path.getPointAtLength(distance).matrixTransform(matrix);
    if (
      point.x >= rectangle.left - padding
      && point.x <= rectangle.right + padding
      && point.y >= rectangle.top - padding
      && point.y <= rectangle.bottom + padding
    ) return true;
  }

  return false;
}

function positionDurationLabel() {
  const label = transportLayer.querySelector(".route-duration-label");
  const icon = transportLayer.querySelector(".route-mode-marker");
  if (!label || !icon) return;

  const iconRectangle = icon.getBoundingClientRect();
  const labelRectangle = label.getBoundingClientRect();
  const mapRectangle = svg.getBoundingClientRect();
  const width = labelRectangle.width;
  const height = labelRectangle.height;
  const gap = 1;
  const centerX = (iconRectangle.left + iconRectangle.right) / 2;
  const centerY = (iconRectangle.top + iconRectangle.bottom) / 2;
  const candidates = [
    { name: "top", x: centerX, y: iconRectangle.top - gap - height / 2 },
    { name: "bottom", x: centerX, y: iconRectangle.bottom + gap + height / 2 },
    { name: "left", x: iconRectangle.left - gap - width / 2, y: centerY },
    { name: "right", x: iconRectangle.right + gap + width / 2, y: centerY },
    { name: "top-right", x: iconRectangle.right + gap + width / 2, y: iconRectangle.top - gap - height / 2 },
    { name: "top-left", x: iconRectangle.left - gap - width / 2, y: iconRectangle.top - gap - height / 2 },
    { name: "bottom-right", x: iconRectangle.right + gap + width / 2, y: iconRectangle.bottom + gap + height / 2 },
    { name: "bottom-left", x: iconRectangle.left - gap - width / 2, y: iconRectangle.bottom + gap + height / 2 },
  ];
  const occupiedRectangles = [
    ...markerLayer.querySelectorAll(".place-marker"),
    document.querySelector("#reset-view"),
    document.querySelector(".map-controls"),
  ].filter(Boolean).map((element) => element.getBoundingClientRect());
  const routePaths = [...routeLayer.querySelectorAll(".route-hit-path")];

  const scoredCandidates = candidates.map((candidate) => {
    const rectangle = {
      left: candidate.x - width / 2,
      right: candidate.x + width / 2,
      top: candidate.y - height / 2,
      bottom: candidate.y + height / 2,
    };
    const labelArea = width * height;
    const insideArea = intersectionArea(rectangle, mapRectangle);
    const outsidePenalty = (labelArea - insideArea) * 1000;
    const occupiedPenalty = occupiedRectangles.reduce(
      (sum, occupied) => sum + intersectionArea(rectangle, occupied) * 8,
      0,
    );
    const routePenalty = routePaths.some((path) => pathCoversRectangle(path, rectangle)) ? 800 : 0;
    return { ...candidate, score: outsidePenalty + occupiedPenalty + routePenalty };
  });
  const preferredPosition = label.dataset.preferredPosition;
  const best = scoredCandidates.find((candidate) => candidate.name === preferredPosition)
    || scoredCandidates.reduce((current, candidate) => (
      candidate.score < current.score ? candidate : current
    ));
  const screenMatrix = svg.getScreenCTM();
  if (!screenMatrix) return;
  const svgPoint = new DOMPoint(best.x, best.y).matrixTransform(screenMatrix.inverse());
  label.setAttribute(
    "transform",
    `translate(${svgPoint.x} ${svgPoint.y}) scale(${label.dataset.scale})`,
  );
  label.dataset.position = best.name;
}

function updateObscuredMarkers(day, transferIndex) {
  const markers = [...markerLayer.querySelectorAll(".place-marker")];
  markers.forEach((marker) => marker.classList.remove("is-obscured"));

  const paths = [...routeLayer.querySelectorAll(".route-hit-path")];
  const modeMarker = transportLayer.querySelector(".route-mode-marker");
  const durationLabel = transportLayer.querySelector(".route-duration-label");
  if (!paths.length) return;

  const endpointIndexes = new Set([
    schedulePlace(day, transferIndex),
    schedulePlace(day, transferIndex + 1),
  ].map((place) => day.places.indexOf(place)).filter((index) => index >= 0));
  const iconRectangle = modeMarker?.getBoundingClientRect();
  const durationRectangle = durationLabel?.getBoundingClientRect();
  markers.forEach((marker) => {
    if (endpointIndexes.has(Number(marker.dataset.markerIndex))) return;
    const markerRectangle = marker.getBoundingClientRect();
    const coveredByIcon = iconRectangle && rectanglesOverlap(markerRectangle, iconRectangle);
    const coveredByDuration = durationRectangle && rectanglesOverlap(markerRectangle, durationRectangle);
    const coveredByPath = paths.some((path) => pathCoversRectangle(path, markerRectangle));
    marker.classList.toggle("is-obscured", Boolean(coveredByIcon || coveredByDuration || coveredByPath));
  });
}

function refreshSelectedRouteLayout() {
  const selectedTransferIndex = state[activeDay].selectedTransfer;
  if (selectedTransferIndex == null) return;
  positionDurationLabel();
  updateObscuredMarkers(days[activeDay], selectedTransferIndex);
}

function renderMap(day) {
  const points = day.places.map((place) => project(place[1], place[2], day));
  const selectedTransferIndex = state[activeDay].selectedTransfer;
  const selectedTransfer = day.transfers?.[selectedTransferIndex];
  const markerScale = day.initialView[2] / days[0].initialView[2];
  routeLayer.innerHTML = selectedTransfer
    ? renderTransitRoute(selectedTransfer, selectedTransferIndex, day, markerScale)
    : "";
  transportLayer.innerHTML = selectedTransfer
    ? renderTransportOverlay(selectedTransfer, day, markerScale)
    : "";

  markerLayer.innerHTML = day.places.map((place, index) => {
    const [x, y] = points[index];
    const dotX = x + (place[5] || 0) * MAP_SCALE * markerScale;
    const dotY = y + (place[6] || 0) * MAP_SCALE * markerScale;
    const width = labelWidth(place[0]);
    const isHorizontalLabel = Math.abs(place[3]) > Math.abs(place[4]);
    const labelX = isHorizontalLabel
      ? Math.sign(place[3]) * (MARKER_RADIUS + LABEL_GAP + width / 2)
      : 0;
    const labelY = isHorizontalLabel
      ? 0
      : Math.sign(place[4]) * (MARKER_RADIUS + LABEL_GAP + LABEL_HALF_HEIGHT);
    return `
      <g class="place-marker" data-marker-index="${index}" transform="translate(${dotX} ${dotY}) scale(${markerScale})">
        <circle class="marker-dot" cx="0" cy="0" r="${MARKER_RADIUS}"></circle>
        <text class="marker-number" x="0" y="${MAP_SCALE}">${index + 1}</text>
        <rect class="marker-label-bg" x="${labelX - width / 2}" y="${labelY - LABEL_HALF_HEIGHT}" width="${width}" height="${LABEL_HALF_HEIGHT * 2}" rx="${27 * MAP_SCALE}"></rect>
        <text class="marker-label" x="${labelX}" y="${labelY + MAP_SCALE}">${place[0]}</text>
      </g>`;
  }).join("");

  mapImage.setAttribute("href", day.image);
  mapImage.setAttribute("width", day.imageSize[0]);
  mapImage.setAttribute("height", day.imageSize[1]);
  fitViewToStage();
  updateViewBox();
  refreshSelectedRouteLayout();
}

function scheduleIcon(place) {
  if (place.includes("피자")) return "🍕";
  if (place.includes("국제시장")) return "🛍️";
  if (place.includes("초량1941")) return "☕";
  if (place.includes("감천") || place.includes("흰여울")) return "🏘️";
  if (place.includes("케이블카")) return "🚠";
  if (place.includes("자갈치")) return "🐟";
  if (place.includes("톤쇼우")) return "🍖";
  if (place.includes("해수욕장")) return "🏖️";
  if (place.includes("과자점")) return "🍪";
  if (place.includes("다케다야")) return "🍜";
  if (place.includes("돼지국밥")) return "🍲";
  if (place.includes("벡스코") || place.includes("BIC")) return "🎮";
  if (place.includes("역")) return "🚉";
  return "📍";
}

function startTime(time) {
  return time.split(/[–-]/)[0].trim();
}

function routeSummary(transfer) {
  const mode = {
    bus: "버스로",
    subway: "지하철로",
    taxi: "택시로",
    walk: "도보로",
  }[transfer.modeKey] || "이동";
  return `${mode} ${transfer.duration}`;
}

function renderSchedule(day) {
  scheduleList.innerHTML = day.schedule.map(([time, place], index) => {
    const transferIndex = index - 1;
    const transfer = day.transfers?.[transferIndex];
    const isOpen = state[activeDay].selectedTransfer === transferIndex;
    const rowTag = transfer ? "button" : "div";
    const rowAttributes = transfer
      ? `type="button" data-transfer="${transferIndex}" data-mode="${transfer.modeKey}" aria-pressed="${isOpen}"`
      : "";
    return `
      <li class="schedule-item${isOpen ? " is-active" : ""}">
        <${rowTag} class="schedule-row" ${rowAttributes}>
          <span class="schedule-icon" aria-hidden="true">${scheduleIcon(place)}</span>
          <span class="schedule-info">
            <span class="schedule-place">${place}</span>
            <time class="schedule-time">${startTime(time)}</time>
          </span>
          ${isOpen
            ? `<span class="schedule-route-summary">${routeSummary(transfer)}</span>`
            : ""}
        </${rowTag}>
      </li>`;
  }).join("");
}

function selectDay(index) {
  activeDay = index;
  const day = days[index];
  state[index].selectedTransfer = null;
  document.documentElement.style.setProperty("--blue", day.color);
  document.querySelectorAll(".day-tab").forEach((tab, tabIndex) => tab.classList.toggle("is-active", tabIndex === index));
  document.querySelector("#day-label").textContent = day.date;
  renderMap(day);
  renderSchedule(day);
}

function updateViewBox() {
  keepViewInsideMap();
  svg.setAttribute("viewBox", state[activeDay].viewBox.map((value) => value.toFixed(2)).join(" "));
}

function fitViewToStage() {
  const box = svg.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const view = state[activeDay].viewBox;
  const centerX = view[0] + view[2] / 2;
  const centerY = view[1] + view[3] / 2;
  const targetAspect = box.width / box.height;
  const currentAspect = view[2] / view[3];
  if (currentAspect < targetAspect) view[2] = view[3] * targetAspect;
  else view[3] = view[2] / targetAspect;
  view[0] = centerX - view[2] / 2;
  view[1] = centerY - view[3] / 2;
  keepViewInsideMap();
}

function keepViewInsideMap() {
  const day = days[activeDay];
  const view = state[activeDay].viewBox;
  const scale = Math.min(1, day.imageSize[0] / view[2], day.imageSize[1] / view[3]);
  if (scale < 1) {
    const centerX = view[0] + view[2] / 2;
    const centerY = view[1] + view[3] / 2;
    view[2] *= scale;
    view[3] *= scale;
    view[0] = centerX - view[2] / 2;
    view[1] = centerY - view[3] / 2;
  }
  view[0] = Math.max(0, Math.min(day.imageSize[0] - view[2], view[0]));
  view[1] = Math.max(0, Math.min(day.imageSize[1] - view[3], view[1]));
}

function zoomAt(factor, clientX, clientY) {
  const box = svg.getBoundingClientRect();
  const view = state[activeDay].viewBox;
  const px = clientX == null ? .5 : (clientX - box.left) / box.width;
  const py = clientY == null ? .5 : (clientY - box.top) / box.height;
  const anchorX = view[0] + view[2] * px;
  const anchorY = view[1] + view[3] * py;
  const minWidth = 520;
  const maxWidth = days[activeDay].imageSize[0] * 1.2;
  const nextWidth = Math.max(minWidth, Math.min(maxWidth, view[2] * factor));
  const ratio = nextWidth / view[2];
  const nextHeight = view[3] * ratio;
  view[0] = anchorX - nextWidth * px;
  view[1] = anchorY - nextHeight * py;
  view[2] = nextWidth;
  view[3] = nextHeight;
  updateViewBox();
  refreshSelectedRouteLayout();
}

svg.addEventListener("pointerdown", (event) => {
  svg.setPointerCapture(event.pointerId);
  drag = { x: event.clientX, y: event.clientY, view: [...state[activeDay].viewBox] };
  svg.classList.add("is-dragging");
});

svg.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const box = svg.getBoundingClientRect();
  const view = state[activeDay].viewBox;
  view[0] = drag.view[0] - (event.clientX - drag.x) / box.width * drag.view[2];
  view[1] = drag.view[1] - (event.clientY - drag.y) / box.height * drag.view[3];
  updateViewBox();
});

function stopDrag() {
  drag = null;
  svg.classList.remove("is-dragging");
  refreshSelectedRouteLayout();
}

svg.addEventListener("pointerup", stopDrag);
svg.addEventListener("pointercancel", stopDrag);
svg.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomAt(event.deltaY > 0 ? ZOOM_OUT_STEP : ZOOM_IN_STEP, event.clientX, event.clientY);
}, { passive: false });

document.querySelector("#zoom-in").addEventListener("click", () => zoomAt(ZOOM_IN_STEP));
document.querySelector("#zoom-out").addEventListener("click", () => zoomAt(ZOOM_OUT_STEP));
document.querySelectorAll(".day-tab").forEach((tab) => tab.addEventListener("click", () => selectDay(Number(tab.dataset.day))));

scheduleList.addEventListener("click", (event) => {
  const row = event.target.closest(".schedule-row[data-transfer]");
  if (!row) return;
  const transferIndex = Number(row.dataset.transfer);
  state[activeDay].selectedTransfer = state[activeDay].selectedTransfer === transferIndex
    ? null
    : transferIndex;
  renderMap(days[activeDay]);
  renderSchedule(days[activeDay]);
});

document.querySelector("#reset-view").addEventListener("click", () => {
  state[activeDay].viewBox = [...days[activeDay].initialView];
  fitViewToStage();
  updateViewBox();
  refreshSelectedRouteLayout();
});

new ResizeObserver(() => {
  fitViewToStage();
  updateViewBox();
  refreshSelectedRouteLayout();
}).observe(svg);

selectDay(0);
