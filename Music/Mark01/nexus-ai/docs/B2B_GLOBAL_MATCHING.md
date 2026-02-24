# B2B 글로벌 매칭 기획·설정 가이드

글로벌 B2B 매칭 플랫폼의 **지역 확장**, **산업/섹터**, **지역별 메타데이터**, **API 스코프** 적용 내용과 사용 방법을 정리합니다.

---

## 1. 대상 지역

### 1.1 국가 마스터 확장

- **기존**: 동아시아·동남아·남아시아·북미·유럽·라틴아메리카 20개국
- **추가**:
  - **중미**: GT(과테말라), HN(온두라스), SV(엘살바도르), NI(니카라과), CR(코스타리카)
  - **중동**: AE(UAE), SA(사우디), QA(카타르), KW(쿠웨이트)
  - **아프리카**: EG(이집트), ZA(남아공), NG(나이지리아)
  - **유럽 추가**: NL(네덜란드), FR(프랑스), IT(이탈리아), ES(스페인)

`/markets/countries` 및 B2B 매칭 국가 풀은 위 확장된 목록을 사용합니다.

### 1.2 지역(Region) 목록

- Northeast Asia, Southeast Asia, South Asia, North America, Europe  
- Latin America, **Central America**, **Middle East**, **Africa**

---

## 2. 산업/섹터 (B2B Sectors)

매칭·필터에 사용하는 산업 코드:

| 코드 | 설명 |
|------|------|
| `steel` | 철강 |
| `machinery` | 기계·장비 |
| `power_equipment` | 발전 설비 |
| `raw_materials` | 원자재 |
| `fruits_agri` | 과일·농산물 |
| `electronics` | 전자·부품 |

- **API**: `GET /b2b/options` → `{ sectors, regions }`
- **매칭**: `GET /b2b/match-buyers?product=8504&sector=power_equipment&countries=AE,SA`  
  - `sector`를 주면 해당 국가의 **대표 산업**과 일치할 때 산업적합 점수(5점) 가산
- HS 코드로부터 섹터를 자동 추정할 수도 있습니다(72/73→steel, 84→machinery, 85/8541→electronics, 8504→power_equipment 등).

---

## 3. 지역별 메타데이터

국가별 B2B 메타(결제 선호, 대표 산업, 물류 난이도, FTA)는 `backend/src/data/b2bRegionMetadata.ts`에 정의되어 있습니다.

| 항목 | 설명 |
|------|------|
| `payment_preference` | 결제 선호 (예: LC, T/T, D/P) |
| `key_industries` | 해당 국가 대표 산업(섹터 코드 배열) |
| `logistics_difficulty` | low / medium / high |
| `fta_with_kr` | 한·FTA 적용 여부 |
| `note` | 참고 (예: USMCA, 에너지·인프라 수요 등) |

### 3.1 활용 위치

- **바이어 매칭**: 지역(물류) 점수에 `logistics_difficulty` 반영, 산업적합에 `key_industries` 사용
- **랜딩 코스트**: 응답에 `region_hint` (결제 선호, FTA, note 요약)
- **바이어 프로필**: 응답에 `paymentSuggestion` (해당 지역 결제 선호·FTA 안내)

---

## 4. API 스코프 (Organization / Country)

B2B API에 **선택적으로** 다음 스코프를 넣을 수 있습니다.

- **헤더**: `X-Organization-Id`, `X-Country`
- **쿼리**: `orgId`, `country` (헤더 없을 때 대체)

적용 예:

- `GET /b2b/match-buyers`: 응답에 `scope: { organization_id, country_code }` (스코프가 있을 때만)
- `POST /b2b/landed-cost`: `destination_country` 미지정 시 `X-Country`를 목적지로 사용

AI·프론트에서 “현재 조직·타깃 시장”을 일관되게 전달하려면 위 헤더를 사용하면 됩니다.

---

## 5. 바이어 매칭 점수 구성

| 항목 | 배점 | 설명 |
|------|------|------|
| 제품 매칭 | 30 | HS·수입 품목 유사도 |
| 거래 규모 | 25 | 연간 수입액 |
| 신뢰도 | 20 | 리스크·평판 |
| 지역(물류) | 15 | KR→대상국 물류 효율 + 메타 `logistics_difficulty` |
| 응답률 예측 | 5 | 아웃리치 응답 가능성 |
| **산업 적합** | **5** | 요청 `sector`와该国 `key_industries` 일치 시 가산 |

**총 100점**, `min_score` 이상만 반환, 상위 50명.

---

## 6. 지역별 전략 요약

| 지역 | 결제·FTA | 대표 산업 예시 | 비고 |
|------|-----------|----------------|------|
| 아시아 | T/T, LC, 한·FTA 다수 | electronics, machinery, steel | 공급망·원자재 협력 |
| 중미·라틴아메리카 | LC, 일부 FTA | fruits_agri, raw_materials, electronics | 농산물·자원, 물류 허브(PA 등) |
| 미국 | T/T, LC, 한·FTA | electronics, machinery | FDA/FCC 등 규제 고려 |
| 중동 | LC | power_equipment, machinery, steel | 에너지·인프라·발전 프로젝트 |
| 유럽 | T/T, LC, 한·FTA | machinery, electronics | CE, REACH 등 규격 |

---

## 7. 프론트 UI

- **바이어 매칭**:  
  - 산업 섹터 드롭다운(`/b2b/options`의 `sectors`)  
  - 대상 국가(쉼표) + **지역**(쉼표, 국가 비우면 적용)  
  - 결과 테이블에 **지역**·**세부(S: 산업적합)** 컬럼
- **랜딩 코스트**: 결과 하단에 **region_hint** 표시
- **바이어 프로필**: 상단에 **paymentSuggestion** 표시

---

## 8. 정리

- **지역**: 중동·중미·아프리카·유럽 확대로 글로벌 풀 확장
- **산업**: steel, machinery, power_equipment, raw_materials, fruits_agri, electronics 도입 및 매칭 산업적합 반영
- **메타**: 국가별 결제·물류·FTA를 랜딩코스트·바이어 프로필·매칭에 활용
- **스코프**: B2B API에 `X-Organization-Id`, `X-Country` 적용해 AI·클라이언트가 시장을 일관되게 인식하도록 설정

추가로 **반자율/자율** 설정(제안서·이메일 자동 발송 등)을 도입할 경우 B2C와 동일하게 “승인 대기” 플로우를 두는 것을 권장합니다.
