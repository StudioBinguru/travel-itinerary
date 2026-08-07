# 포르투갈 여행 설정

## 현재 일정

- Day 1 첫 일정: 광명·과천에서 인천국제공항으로 이동
- 지도 ID: `seoul-airport-meetup`
- 색상: 확정
- 화면 위치·배율: 미확정

## 지도 화면 기준값

```text
map: seoul-airport-meetup
center: 37.433977, 126.697941
zoom: 1.0000
viewBox: 904.0, 1002.0, 2053.0, 1112.0
finalized: false
```

화면이 확정되기 전까지 오른쪽 위 `화면 값 복사` 버튼 유지. 확정 후 `data-view-finalized="true"`로 변경해 버튼 숨김.

## 지도 이미지

- 실행용: `assets/map_sources/seoul_explorer_default.webp`
- 크기: 8192×5120
- 화면 좌표계: 4096×2560
- 원본 지도: 줌 12 정적 타일 결합
- 실시간 지도 호출 없음

## 색상

공통 기본 색상 사용.

| 구분 | 색상 |
|---|---|
| 일반 도심 | `#E0E3E6` |
| 동네 도로 | `#F0F0F0` |
| 큰 도로 | `#F0D2AA` |
| 바다·강 | `#A4CFEA` |
| 산·공원 | `#D2E1C8` |

## 제작용 파일

- 고해상도 원본: `assets/map_sources/incheon_seoul_z12.webp`
- 지도 원본 제작: `tools/build_map_bases.py --seoul-hires`
- 기본 색상 지도 제작: `tools/stylize_seoul_map.py --default-only`
- 색상 마스크 제작: `tools/stylize_seoul_map.py --masks-only`

분리 마스크는 색상 설정 기간에만 생성해 화면에서 사용. 색상 확정 후 삭제. 평상시 실행 화면에서는 단일 지도 이미지 사용.
