// 출신지 목록
// weight = 뽑힐 비중 (단위: 억 명, 항성계별 인구 현황 3525년 기준)
// since  = 이 해 이후 태어난 사람만 이 출신지가 나옴 (정착 시점)
// culture = 이름 풀 (names.js의 키). 배열이면 그중 하나를 뽑음. "mix"면 지구 나라 비중대로 섞어 뽑음
// ※ 초안: since 연도 중 설정집에 명시되지 않은 것은 게이트·정부 수립 연도로 임시 추정

// ── 지구 나라 ──
// [나라, 현재 인구(백만 명, 2020년대 기준 대략), 문화권]
// 비중은 아래 EARTH_BALANCE에 따라 자동 계산되어, 합계가 지구 육지 인구 120억에 맞춰집니다.
NAEVIS.EARTH_COUNTRIES = [
  ["가나", 34, "ak"], ["과테말라", 18, "es"], ["그리스", 10.4, "el"], ["나미비아", 2.6, ["ow","af","en"]],
  ["나이지리아", 227, "ng"], ["남아프리카 공화국", 63, ["zu","af","en"]], ["네덜란드", 18, "nl"], ["네팔", 30, "ne"],
  ["노르웨이", 5.5, "no"], ["뉴질랜드", 5.2, "en"], ["대만", 23.4, "zh"], ["덴마크", 6, "da"],
  ["도미니카 공화국", 11.3, "es"], ["독일", 84, "de"], ["라오스", 7.7, "lo"], ["마다가스카르", 31, "mg"],
  ["말레이시아", 35, ["ms","zh","hi"]], ["멕시코", 130, "es"], ["모로코", 38, "ar"], ["몽골", 3.5, "mn"],
  ["미국", 340, "en"], ["미얀마", 54, "my"], ["베트남", 101, "vi"], ["벨기에", 11.8, ["nl","fr"]],
  ["보츠와나", 2.5, "tn"], ["볼리비아", 12.4, "es"], ["베네수엘라", 28, "es"], ["브라질", 212, "pt"],
  ["사모아", 0.22, "sm"], ["사우디아라비아", 33, "ar"], ["세네갈", 18.5, "wo"], ["스리랑카", 22, "si"],
  ["스웨덴", 10.6, "sv"], ["스위스", 9, ["de","fr","it"]], ["스페인", 48.6, "es"], ["싱가포르", 6, ["zh","ms","hi"]],
  ["아랍에미리트", 10, "ar"], ["아르헨티나", 46, "es"], ["아이슬란드", 0.39, "is"], ["알제리", 46, "ar"],
  ["에콰도르", 18, "es"], ["에티오피아", 128, "am"], ["영국", 69, "en"], ["오스트리아", 9.1, "de"],
  ["온두라스", 10.6, "es"], ["우루과이", 3.4, "es"], ["이집트", 114, "ar"], ["이탈리아", 59, "it"],
  ["인도", 1440, "hi"], ["인도네시아", 280, "id"], ["일본", 123, "ja"], ["자메이카", 2.8, "en"],
  ["중국", 1410, "zh"], ["체코", 10.9, "cs"], ["칠레", 19.7, "es"], ["캐나다", 41, ["en","fr"]],
  ["캄보디아", 17.6, "km"], ["케냐", 56, "sw"], ["코스타리카", 5.2, "es"], ["콜롬비아", 52, "es"],
  ["쿠바", 11, "es"], ["크로아티아", 3.9, "hr"], ["탄자니아", 68, "sw"], ["태국", 71, "th"],
  ["통가", 0.1, "to"], ["튀니지", 12.3, "ar"], ["튀르키예", 86, "tr"], ["파나마", 4.5, "es"],
  ["파라과이", 6.9, "es"], ["파푸아뉴기니", 10.3, "pg"], ["페루", 34, "es"], ["포르투갈", 10.6, "pt"],
  ["폴란드", 36.6, "pl"], ["프랑스", 68, "fr"], ["피지", 0.93, ["fj","hi"]], ["핀란드", 5.6, "fi"],
  ["필리핀", 116, "tl"], ["한국", 51.7, "ko"], ["헝가리", 9.6, "hu"], ["호주", 27, "en"]
];

// 1   = 실제 인구 비율 그대로 (중국·인도가 지구 출신의 절반 가까이)
// 0.5 = 작은 나라도 꽤 나오게 완화 (기본값)
// 0   = 모든 나라가 똑같은 확률
NAEVIS.EARTH_BALANCE = 0.5;
NAEVIS.EARTH_LAND_TOTAL = 120; // 지구 육지 거주 인구(억)

const _earth = NAEVIS.EARTH_COUNTRIES.map(([name, pop, culture]) => ({ name: "지구 " + name, raw: Math.pow(pop, NAEVIS.EARTH_BALANCE), since: 0, culture }));
const _sum = _earth.reduce((s, p) => s + p.raw, 0);
_earth.forEach(p => { p.weight = p.raw / _sum * NAEVIS.EARTH_LAND_TOTAL; delete p.raw; });

NAEVIS.PLACES = [
  ..._earth,

  // 지구 특수 거주지 (3000년대 이후 개척)
  { name: "지구 남극 기지",     weight: 3,  since: 3000, culture: "mix" },
  { name: "지구 북극 기지",     weight: 2,  since: 3000, culture: "mix" },
  { name: "지구 사하라 정착지", weight: 6,  since: 3000, culture: "mix" },
  { name: "지구 고비 정착지",   weight: 4,  since: 3000, culture: "mix" },
  { name: "지구 심해 기지",     weight: 15, since: 3000, culture: "mix" },

  // 태양계 기타
  { name: "화성",               weight: 30,  since: 2890, culture: "mix" },
  { name: "엔셀라두스 정거장",  weight: 0.3, since: 3000, culture: "mix" },
  { name: "유로파 연구기지",    weight: 0.1, since: 3000, culture: "mix" },
  { name: "소행성대 채굴 기지", weight: 0.2, since: 3000, culture: "mix" },

  // 광휘계 (시리우스) — 게이트 3295, 새벽의 여명 첫 이주 3358+
  { name: "광휘계 아쿠아리스",       weight: 19, since: 3360, culture: "mix" },
  { name: "광휘계 미르잠 물류 허브", weight: 1,  since: 3300, culture: "mix" },

  // 청염계 (베가) — 게이트 3303, 정부 3312
  { name: "청염계 엘리시아",         weight: 28, since: 3312, culture: "mix" },
  { name: "청염계 스피카 물류 허브", weight: 2,  since: 3310, culture: "mix" },

  // 신성계 — 게이트 3330
  { name: "신성계 아스트리움 채굴 기지", weight: 7, since: 3330, culture: "mix" },
  { name: "신성계 니플헤임 물류 허브",   weight: 1, since: 3330, culture: "mix" },

  // 잔화계·나란빛계 — 기지 건설 3465
  { name: "잔화계 세이휘",       weight: 3,  since: 3465, culture: "mix" },
  { name: "나란빛계 프로스트벨", weight: 15, since: 3465, culture: "mix" },
  // 이슬빛계는 3525년 현재 게이트 건설 중이라 출신지에서 제외

  // 우주선
  { name: "지구에서 아쿠아리스로 향하는 여객선",       weight: 0.1,  since: 3296, culture: "mix" },
  { name: "아쿠아리스에서 지구로 향하는 여객선",       weight: 0.1,  since: 3296, culture: "mix" },
  { name: "지구에서 엘리시아로 향하는 여객선",       weight: 0.1,  since: 3304, culture: "mix" },
  { name: "엘리시아에서 지구로 향하는 여객선",       weight: 0.1,  since: 3304, culture: "mix" },
  { name: "미르잠에서 엔셀라두스로 향하는 화물선",       weight: 0.05,  since: 3303, culture: "mix" },
  { name: "스피카에서 엔셀라두스로 향하는 화물선",       weight: 0.05,  since: 3305, culture: "mix" },
  { name: "니플헤임에서 지구로 향하는 화물선",       weight: 0.01,  since: 3332, culture: "mix" },
  { name: "세이휘에서 지구로 향하는 화물선",       weight: 0.01,  since: 3468, culture: "mix" },
  { name: "프로스트벨에서 지구로 향하는 화물선",       weight: 0.01,  since: 3472, culture: "mix" }
];
