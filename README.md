# 여행 일정 프로젝트

여행지별 일정과 이동 애니메이션을 만드는 정적 웹 프로젝트 모음.

## 폴더 구조

```text
travel-itinerary/
├─ map_settings.md        # 모든 여행지 공통 지도 설정
├─ portugal/              # 포르투갈 여행
│  ├─ index.html
│  ├─ trip_settings.md
│  ├─ assets/
│  └─ tools/
└─ busan/                 # 부산 2박 3일 여행
   ├─ index.html
   ├─ trip_settings.md
   ├─ assets/
   └─ tools/
```

새 여행지 추가 시 `portugal`과 같은 위치에 여행지 영문 폴더 생성. 공통 지도 색상과 제작 방식은 `map_settings.md` 기준 사용.

## 지도 사용 원칙

- 실제 지리 위치와 비율 유지
- 실시간 지도 서비스 호출 없음
- 실행 화면에서는 색상을 미리 적용한 고해상도 지도 이미지 한 장 사용
- 색상 조정이 필요할 때만 임시 설정창과 분리 마스크 사용
- 색상 확정 후 단일 이미지로 다시 제작해 확대·이동 성능 유지
- 지도 화면이 확정되기 전에는 화면 값 복사 버튼 유지
