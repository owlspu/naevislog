// 나이비스 호 승선 기록 조회 — 로직
// 같은 이름 + 생년월일이면 언제나 같은 결과가 나옵니다 (입력값은 결과를 정하는 '시드'로만 쓰임).
{
const N = window.NAEVIS;
const $ = id => document.getElementById(id);

/* ── 결정적 난수 ── */
function hash(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0);
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const one = (r, list) => list[Math.floor(r() * list.length)];
function pick(r, list, w) {
  const tot = list.reduce((s, x) => s + w(x), 0);
  let v = r() * tot;
  for (const x of list) { v -= w(x); if (v < 0) return x; }
  return list[list.length - 1];
}

/* ── 날짜 (그레고리력, 3000년대도 계산) ── */
const yearsBefore = n => n * 365 + Math.floor(n / 4) - Math.floor(n / 100) + Math.floor(n / 400);
const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dayOfYear = (y, m, d) => { const ref = isLeap(y) ? 2000 : 2001; return (Date.UTC(ref, m - 1, d) - Date.UTC(ref, 0, 1)) / 864e5; };
const toDay = ([y, m, d]) => yearsBefore(y - 1) + dayOfYear(y, m, d);
function fromDay(n) {
  let y = Math.floor(2000 + n / 365.2425);
  while (toDay([y, 1, 1]) > n) y--;
  while (toDay([y + 1, 1, 1]) <= n) y++;
  let m = 1;
  while (m < 12 && toDay([y, m + 1, 1]) <= n) m++;
  return [y, m, n - toDay([y, m, 1]) + 1];
}
const pad = n => String(n).padStart(2, "0");
const fmt = ([y, m, d]) => `${y}년 ${pad(m)}월 ${pad(d)}일`;

/* ── 한국어 조사 ── */
function hasBatchim(w) {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
}
function copula(w) {
  w = w.trim().replace(/때문에$/, "때문"); // "~ 때문에" → "~ 때문이었습니다"
  return w + (hasBatchim(w) ? "이었습니다" : "였습니다");
}

/* ── 이름 만들기 ── */
function cultureKey(r, culture) {
  if (culture === "mix") {
    // 식민지 출신: 지구 나라 비중대로 조상 나라를 고른 뒤 그 문화권
    const earth = N.PLACES.filter(p => p.since === 0);
    return cultureKey(r, pick(r, earth, p => p.weight).culture);
  }
  return Array.isArray(culture) ? one(r, culture) : culture;
}
// 이름 모양은 입력한 이름으로만 정해짐 (rn = 이름 시드).
// 같은 이름이면 각 문화권 목록에서 늘 비슷한 자리의 이름이 뽑히고, 출신지가 바뀌면 그 문화권 이름으로 바뀜.
function makeName(r, rn, culture) {
  const p = N.NAMES[cultureKey(r, culture)];
  for (let i = 0; i < 10; i++) {
    const g = one(rn, p.given);
    if (p.order === "g" || !p.family.length) { if (!N.RESERVED.includes(g)) return g; continue; }
    const f = one(rn, p.family);
    const full = p.order === "fg" ? f + g : p.order === "f g" ? `${f} ${g}` : `${g} ${f}`;
    if (!N.RESERVED.includes(full)) return full;
  }
  return one(rn, p.given);
}

// 오늘 날짜 (보는 사람의 현지 시간 기준) — 하루 동안은 같은 결과
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ── 기록 생성 ── */
// 이름 → 세계관 이름의 모양 / 이름 + 생년월일 + 오늘 날짜 → 나머지 전부
function roll(name, bd, day = today()) {
  const nm = name.normalize("NFC");
  const r = rng(hash(nm + "|" + bd + "|" + day));
  const rn = rng(hash("name|" + nm));

  // 직책·시대
  let role, era;
  const rare = N.RARE.find(x => r() < x[2]);
  if (rare) { role = rare; era = N.ERAS.find(e => e.key === "first"); }
  else { role = pick(r, N.ROLES, x => x[2]); era = pick(r, N.ERAS, x => x.weight); }

  // 승선·하선
  const a = toDay(era.from), b = toDay(era.to);
  const min = era.minDays ?? N.MIN_DAYS;
  // 근무 일수는 승선일·하선일을 모두 포함해서 셈 (off - on + 1 ≥ min)
  const on = a + Math.floor(r() * Math.max(1, b - a - min + 2));
  const off = on + min - 1 + Math.floor(r() * (b - on - min + 2));
  const onD = fromDay(on), offD = fromDay(off);

  // 출생 연도: 승선 당시 나이가 직책에 맞도록
  const ageLo = rare ? rare[3] : role[3], ageHi = rare ? rare[4] : role[4];
  const birthYear = onD[0] - int(r, ageLo, ageHi);

  // 출신지: 그 해에 이미 사람이 살던 곳만
  const places = N.PLACES.filter(p => p.since <= birthYear);
  const place = pick(r, places, p => p.weight);
  const newName = makeName(r, rn, place.culture);

  const pool = N.REASONS[era.key] || [];
  const reason = pool.length ? one(r, pool) : "기록되지 않은 사유";
  const no = `NV-${int(r, 1000, 9999)}-${onD[0]}`;

  return { role, era, on: onD, off: offD, days: off - on + 1, reason, no, rare: !!rare, birthYear, place: place.name, newName };
}

/* ── 화면 ── */
let last = "";
function show(res) {
  $("no").textContent = "기록 번호 " + res.no;
  $("born").innerHTML = "";
  $("born").append(`${res.birthYear}년 ${res.place} 출생 · `, Object.assign(document.createElement("b"), { textContent: res.newName }));
  $("who").textContent = `${res.era.label} · ${res.role[0]}`;
  $("role").textContent = res.role[1] + " 담당";
  if (res.rare) $("role").append(Object.assign(document.createElement("span"), { className: "rare", textContent: "희귀 기록" }));
  $("on").textContent = fmt(res.on);
  $("off").textContent = fmt(res.off);
  const days = res.days.toLocaleString("ko-KR");
  $("days").textContent = days + "일";

  last = `당신은 ${res.birthYear}년에 ${res.place}에서 태어났고, 이름은 ${res.newName}입니다. `
       + `당신은 나이비스 호의 ${res.role[1]} 입니다. `
       + `첫 승선은 ${fmt(res.on)}이었고, 마지막 하선은 ${fmt(res.off)}이었습니다. `
       + `당신은 ${days}일간 나이비스 호에 근무했고, 하선한 이유는 ${copula(res.reason)}.`;
  $("txt").textContent = last;
  $("cnote").textContent = "";

  const c = $("card");
  c.hidden = false;
  c.classList.remove("show"); void c.offsetWidth; c.classList.add("show");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  c.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
}

/* ── 생년월일 선택 상자 (모바일 달력 대신) ── */
{
  const thisYear = new Date().getFullYear();
  const opt = (v, t) => Object.assign(document.createElement("option"), { value: v, textContent: t });
  for (let y = thisYear; y >= thisYear - 100; y--) $("by").append(opt(y, y + "년"));
  for (let m = 1; m <= 12; m++) $("bm").append(opt(pad(m), m + "월"));
  const fillDays = () => {
    const y = +$("by").value || 2000, m = +$("bm").value || 1, keep = $("bdd").value;
    const max = new Date(y, m, 0).getDate();
    $("bdd").length = 1;
    for (let d = 1; d <= max; d++) $("bdd").append(opt(pad(d), d + "일"));
    if (keep && +keep <= max) $("bdd").value = keep;
  };
  $("by").addEventListener("change", fillDays);
  $("bm").addEventListener("change", fillDays);
  fillDays();
}
const getBd = () => ($("by").value && $("bm").value && $("bdd").value) ? `${$("by").value}-${$("bm").value}-${$("bdd").value}` : "";

$("f").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("nm").value.trim(), bd = getBd();
  if (!name || !bd) { $("err").textContent = "이름과 생년월일을 모두 넣어 주세요."; return; }
  $("err").textContent = "";
  show(roll(name, bd));
  // 조회 버튼 누른 횟수도 따로 집계 (GoatCounter 이벤트)
  try { window.goatcounter?.count?.({ path: "naevis-crew-record-roll", title: "승선 기록 조회", event: true }); } catch (_) {}
});
$("again").addEventListener("click", () => { $("card").hidden = true; $("nm").focus(); });
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(last + "\n" + N.SHARE_TAG); $("cnote").textContent = "복사했어요."; }
  catch (_) { $("cnote").textContent = "복사가 막혀 있어요. 문장을 길게 눌러 직접 복사해 주세요."; }
});
// 입력값은 어디에도 저장하지 않음
try { localStorage.removeItem("naevis-crew"); } catch (_) {}

// 배경 별
const r0 = rng(7);
$("stars").innerHTML = Array.from({ length: 70 }, () =>
  `<circle cx="${(r0() * 720).toFixed(1)}" cy="${(r0() * 220).toFixed(1)}" r="${(r0() * 1.4 + .3).toFixed(2)}" opacity="${(r0() * .6 + .2).toFixed(2)}"/>`
).join("");

// 콘솔 테스트용
N._roll = roll;
}
