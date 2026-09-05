#!/usr/bin/env node
/**
 * extract_ticker.js — KET NOI FIREANT
 * ------------------------------------------------------------------
 * Doc positions.json -> goi API FireAnt (restv2.fireant.vn) lay du lieu
 * LIVE cho tung ma: gia hien tai, %, khoi luong, NGOAI RONG (foreign net),
 * co ban (ROE/PE/PB/EPS/marketCap/co tuc), 52w range -> tinh:
 *   - P&L thuc so voi avg_cost + gia tri vi the
 *   - net LONG/SHORT (huong dong tien ngoai + xu huong gia)
 *   - DR% (dinh gia): vi tri gia trong bien 52w -> PREMIUM / EQ / DISCOUNT
 *   - verdict heuristic (TAKE LONG / TAKE SHORT / SKIP) + khoang cach ho tro/khang cu
 *
 * LUU Y ve pf / net / DR:
 *   Cac tin hieu goc trong entry_context ("pf 0.xx", "net SHORT 0.xx", "DR ...")
 *   den tu he scan "vnpool" RIENG cua user (khong nam trong repo nay). Script
 *   nay TAI TAO cac chi so tuong duong TRUC TIEP tu du lieu FireAnt (transparent,
 *   co the chinh o phan CONFIG). Do la PROXY, khong phai model vnpool goc.
 *
 * TOKEN: doc tu bien moi truong FIREANT_TOKEN (Bearer JWT cua FireAnt).
 *   Lay token: dang nhap fireant.vn -> F12 -> Network -> request bat ky ->
 *   header "Authorization: Bearer eyJ..." -> copy phan sau "Bearer ".
 *   Tren GitHub: luu vao Settings -> Secrets -> Actions -> FIREANT_TOKEN
 *   (workflow .github/workflows/fireant.yml da doc san).
 *
 * Du lieu moi ma: gia/KL/GT, KHOI NGOAI (cp+tien+room), TU DOANH (propTradingNetValue),
 *   co ban ROE/ROA/PE/PB SO NGANH, DT/LN gop/LNST 4 QUY, dong tien CFO/CFI/CFF,
 *   No/VCSH, co tuc+yield, so huu NN, TIN TUC (title+sentiment), va NHAN DINH/khuyen nghi.
 *
 * Dung:
 *   node extract_ticker.js FPT HPG        # vai ma cu the
 *   node extract_ticker.js --all          # tat ca ma trong positions.json
 *   node extract_ticker.js FPT --json     # xuat JSON (may doc)
 *   node extract_ticker.js --all --save   # ghi snapshot ra data/snapshots/
 *   node extract_ticker.js FPT --fast     # bo qua co ban/tin tuc (chi gia+ngoai, nhanh)
 *   node extract_ticker.js VNM --peers    # tim cp TOT HON cung nganh + khac nganh (screener)
 *   node extract_ticker.js FPT --probe    # do cau truc endpoint FireAnt (debug)
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----------------------------- CONFIG ---------------------------------
const API_BASE = process.env.FIREANT_API_BASE || "https://restv2.fireant.vn";
const TOKEN = process.env.FIREANT_TOKEN || "";
const LOOKBACK_SESSIONS = 130; // ~6 thang phien de tinh MA50 + 52w gan dung
const TIMEOUT_MS = 20000;
// FireAnt historical-quotes tra GIA theo NGHIN DONG (VND'000): NVL=14, FPT=71...
// avg_cost trong positions.json theo DONG (14000, 71000) -> nhan gia ve dong.
const PRICE_SCALE = Number(process.env.FIREANT_PRICE_SCALE || 1000);

// Nguong cho verdict/valuation (co the chinh)
const CFG = {
  drDiscount: 0.33, // gia o 1/3 duoi bien 52w -> DISCOUNT
  drPremium: 0.66, // gia o 1/3 tren bien 52w -> PREMIUM
  foreignWindow: 20, // so phien tinh dong tien ngoai rong
  volMedianWindow: 20, // so phien tinh KL median
  minLiqShares: Number(process.env.MIN_LIQ_SHARES || 1e6), // loc ma de xuat: KL TB >= 1tr cp
};

// --------------------------- API HELPERS ------------------------------
function authHeaders() {
  if (!TOKEN) {
    throw new Error(
      "Thieu FIREANT_TOKEN. Set bien moi truong FIREANT_TOKEN=<bearer jwt>.\n" +
        "  Local:  export FIREANT_TOKEN='eyJ...'\n" +
        "  GitHub: Settings -> Secrets and variables -> Actions -> New secret FIREANT_TOKEN"
    );
  }
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: authHeaders(), signal: ctrl.signal });
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `FireAnt tu choi (${res.status}). Token het han hoac sai. Lay lai token moi tu fireant.vn.`
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`FireAnt ${res.status} @ ${path}: ${body.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchFundamental(sym) {
  return apiGet(`/symbols/${sym}/fundamental`);
}

async function fetchHistory(sym) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - Math.ceil(LOOKBACK_SESSIONS * 1.6)); // du bu cuoi tuan/le
  const q =
    `?startDate=${fmtDate(start)}&endDate=${fmtDate(end)}` +
    `&offset=0&limit=${LOOKBACK_SESSIONS}`;
  const rows = await apiGet(`/symbols/${sym}/historical-quotes${q}`);
  // FireAnt tra moi -> cu; sap xep cu -> moi de tinh MA
  const arr = Array.isArray(rows) ? rows.slice() : [];
  arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  return arr;
}

// Ky bao cao gan nhat (BCTC tre 1 quy so voi lich)
function reportPeriod() {
  const d = new Date();
  return { year: d.getFullYear(), quarter: Math.floor(d.getMonth() / 3) + 1 };
}
async function tryGet(path) {
  try {
    return await apiGet(path);
  } catch {
    return null;
  }
}
async function fetchIndicators(sym) {
  return tryGet(`/symbols/${sym}/financial-indicators`);
}
async function fetchIncome(sym) {
  const { year, quarter } = reportPeriod();
  return tryGet(
    `/symbols/${sym}/financial-reports?type=IncomeStatement&year=${year}&quarter=${quarter}&limit=8`
  );
}
async function fetchFull(sym, type) {
  const { year, quarter } = reportPeriod();
  return tryGet(
    `/symbols/${sym}/full-financial-reports?type=${type}&year=${year}&quarter=${quarter}&limit=8`
  );
}
// Luu chuyen tien: type=3 va type=4 deu co the co CFO, NHUNG voi vai ma (HPG/PVD/CII/CEO)
// type=3 tra chuoi CU (Q1 2007 / Q1 2014...) con type=4 moi co ky gan nhat -> KHONG the
// chi "type=3 neu khong rong". Fix: lay CA HAI, chon nguon co ky CFO MOI NHAT.
function periodKey(p) {
  const m = /Q([1-4])\D*(\d{4})/.exec(String(p || ""));
  return m ? Number(m[2]) * 4 + Number(m[1]) : -1; // "Q3 2024" -> 8099
}
function cfoLatestKey(arr) {
  const pf = parseFull(arr);
  const s = pf && pf.find("Lưu chuyển tiền thuần từ hoạt động kinh doanh", "hoạt động kinh doanh");
  if (!s || !s.periods || !s.periods.length) return -1;
  return Math.max(...s.periods.map(periodKey));
}
async function fetchCashFlow(sym) {
  const [a, b] = await Promise.all([
    fetchFull(sym, 3).catch(() => null),
    fetchFull(sym, 4).catch(() => null),
  ]);
  const okA = Array.isArray(a) && a.length, okB = Array.isArray(b) && b.length;
  if (!okA && !okB) return null;
  if (!okA) return b;
  if (!okB) return a;
  // Ca hai co du lieu -> uu tien nguon co ky gan nhat (tie -> type=3 chuan).
  return cfoLatestKey(b) > cfoLatestKey(a) ? b : a;
}
async function fetchDividends(sym) {
  return tryGet(`/symbols/${sym}/dividends`);
}
// Lich SU KIEN QUYEN (co tuc/thuong/phat hanh) — endpoint /events/search (do tu JS bundle fireant.vn).
// Tra [{eventID, symbol, title, recordDate=GDKHQ, registrationDate=DKCC, executionDate=thuc hien, type}]
// type: 1=co tuc TIEN · 2=co tuc CO PHIEU · 3=phat hanh CP cho CDHH (quyen mua).
async function fetchEvents(sym) {
  const start = new Date(); start.setFullYear(start.getFullYear() - 1);
  const end = new Date(); end.setFullYear(end.getFullYear() + 1);
  const rows = await tryGet(
    `/events/search?symbol=${sym}&startDate=${fmtDate(start)}&endDate=${fmtDate(end)}&offset=0&limit=50`
  );
  return Array.isArray(rows) ? rows : [];
}
const EVENT_TYPE = { 1: "co tuc tien", 2: "co tuc CP", 3: "phat hanh CP (quyen mua)" };
// Giao dich co dong lon / noi bo (tab "Co dong" tren fireant) — tin hieu insider.
async function fetchHolderTransactions(sym) {
  return tryGet(`/symbols/${sym}/holder-transactions`);
}
// Co cau co dong (Nha nuoc/ngoai/to chuc) + room ngoai chi tiet.
async function fetchHolders(sym) {
  return tryGet(`/symbols/${sym}/holders`);
}
async function fetchRooms(sym) {
  return tryGet(`/symbols/${sym}/rooms`);
}
async function fetchNews(sym, limit = 5) {
  return tryGet(`/posts?symbol=${sym}&type=1&offset=0&limit=${limit}`);
}
// Chi tiet 1 bai — /posts/{id} tra TOAN VAN (list chi co tieu de). Field: content/originalContent/summary/link/files.
async function fetchPostDetail(postID) {
  return tryGet(`/posts/${postID}`);
}
// TIN day du tu FireAnt (thay Google): list + lay noi dung tung bai (cat snippetLen ky tu).
async function fetchNewsFull(sym, limit = 6, snippetLen = 700) {
  const list = await tryGet(`/posts?symbol=${sym}&type=1&offset=0&limit=${limit}`);
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const p of list) {
    const pid = p.postID || p.id;
    let text = "", link = "";
    try {
      const d = await fetchPostDetail(pid);
      if (d && typeof d === "object") {
        const raw = d.summary || d.content || d.originalContent || d.description || "";
        text = String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, snippetLen);
        const cands = [d.link, d.contentURL, d.postSourceUrl, Array.isArray(d.files) && d.files[0] && d.files[0].url];
        link = cands.find((x) => typeof x === "string" && x) || "";
      }
    } catch { /* bo qua bai loi */ }
    out.push({ postID: pid, title: p.title || "", date: (p.date || "").slice(0, 10), sentiment: p.sentiment ?? null, text, link });
  }
  return out;
}
async function fetchProfile(sym) {
  return tryGet(`/symbols/${sym}/profile`);
}

// Tu gan nganh tu ma ICB (4 chu so) — fallback cho ma ngoai universe.json.
// Refine nhom Tai chinh (8xxx) vi VN nhieu bank/CK/BDS.
function icbSector(code) {
  if (code == null) return null;
  const c = String(code);
  if (c.startsWith("835")) return "Ngan hang";
  if (c.startsWith("853") || c.startsWith("857")) return "Bao hiem"; // 853 phi nhan tho, 857 nhan tho
  if (c.startsWith("877") || c.startsWith("830")) return "Chung khoan";
  if (c.startsWith("863") || c.startsWith("864") || c.startsWith("867")) return "BDS";
  const ind = {
    "0": "Dau khi", "1": "Vat lieu", "2": "Cong nghiep", "3": "Tieu dung", "4": "Y te",
    "5": "Dich vu TD", "6": "Vien thong", "7": "Tien ich", "8": "Tai chinh", "9": "Cong nghe",
  };
  return ind[c[0]] || null;
}
async function resolveSector(sym, universe) {
  if (universe[sym]) return universe[sym];
  const pr = await fetchProfile(sym);
  return icbSector(pr && pr.icbCode) || "?";
}

// Nhom TAI CHINH (ngan hang / chung khoan / bao hiem): "CFO am" la CAU TRUC binh thuong
// — margin, tai san FVTPL, tin dung nam trong HDKD nen dong tien HDKD am khi mo rong. KHONG
// phai co do dong tien. Dung de TAT canh bao duong-tinh-gia (VCI/VIX/VDS/SSI...). Phi tai
// chinh (KBC/NVL/CII...) CFO am van la co do that.
function isFinSector(name) {
  // "tai chinh" = nhan fallback tu icbSector cho ma 8xxx chua refine (vd BVH ngoai universe).
  return /ngan hang|chung khoan|bao hiem|tai chinh/i.test(name || "");
}

// --------------------------- PARSERS ----------------------------------
// financial-indicators: [{name, shortName, value, industryValue, groupName}]
function parseIndicators(arr) {
  if (!Array.isArray(arr)) return null;
  const m = {};
  for (const it of arr) {
    const k = (it.shortName || it.name || "").trim().toUpperCase();
    if (k) m[k] = { value: num(it.value), industry: num(it.industryValue), name: it.name };
  }
  const get = (...keys) => {
    for (const k of keys) if (m[k.toUpperCase()]) return m[k.toUpperCase()];
    return null;
  };
  return { map: m, get };
}
// financial-reports {columns:[Name,Symbol,Q..], rows:[[vi,en,v..]]}
function parseReport(obj) {
  if (!obj || !Array.isArray(obj.columns) || !Array.isArray(obj.rows)) return null;
  const periods = obj.columns.slice(2);
  const rows = obj.rows.map((r) => ({
    vi: (r[0] || "").trim(),
    en: (r[1] || "").trim(),
    vals: r.slice(2).map(num),
  }));
  const find = (...keys) => {
    for (const k of keys) {
      const hit = rows.find((r) => r.en === k || r.vi === k);
      if (hit) return hit.vals;
    }
    for (const k of keys) {
      const kl = k.toLowerCase();
      const hit = rows.find(
        (r) => r.en.toLowerCase().includes(kl) || r.vi.toLowerCase().includes(kl)
      );
      if (hit) return hit.vals;
    }
    return null;
  };
  return { periods, find };
}
// full-financial-reports: [{name, values:[{period,value}]}]
function parseFull(arr) {
  if (!Array.isArray(arr)) return null;
  const find = (...names) => {
    for (const nm of names) {
      const it = arr.find((x) => (x.name || "").toLowerCase().includes(nm.toLowerCase()));
      if (it && Array.isArray(it.values))
        return { periods: it.values.map((v) => v.period), vals: it.values.map((v) => num(v.value)) };
    }
    return null;
  };
  return { find };
}

// Gom cac endpoint co ban + tin tuc -> object "extra"
async function enrich(sym, fund, last) {
  const [indRaw, incRaw, cfRaw, bsRaw, divRaw, newsRaw, holdersRaw, htxRaw] = await Promise.all([
    fetchIndicators(sym),
    fetchIncome(sym),
    fetchCashFlow(sym), // luu chuyen tien (type=3, fallback type=4)
    fetchFull(sym, 1), // can doi
    fetchDividends(sym),
    fetchNews(sym),
    fetchHolders(sym).catch(() => null), // co dong lon
    fetchHolderTransactions(sym).catch(() => null), // GD noi bo
  ]);

  const ind = parseIndicators(indRaw);
  const inc = parseReport(incRaw);
  const cf = parseFull(cfRaw);
  const bs = parseFull(bsRaw);

  // Co dong lon (top theo ty le) + giao dich noi bo gan nhat.
  const holders = Array.isArray(holdersRaw)
    ? holdersRaw
        .filter((h) => h && h.ownership != null)
        .sort((a, b) => b.ownership - a.ownership)
        .slice(0, 4)
        .map((h) => ({ name: h.name, position: h.position, pct: h.ownership * 100, foreign: !!h.isForeigner }))
    : null;
  const insider = Array.isArray(htxRaw)
    ? htxRaw
        .slice()
        .sort((a, b) => String(b.executionDate || "").localeCompare(String(a.executionDate || "")))
        .slice(0, 3)
        // KHONG doan mua/ban (type chua giai ma) — chi hien KL dang ky/thuc hien + nguoi + ngay.
        .map((t) => ({ name: t.name, position: t.position, exec: t.executionVolume, reg: t.registeredVolume, date: (t.executionDate || "").slice(0, 10), type: t.type }))
    : null;

  // Chi so + so voi nganh
  const pickInd = (...k) => {
    const x = ind && ind.get(...k);
    return x ? { v: x.value, ind: x.industry } : null;
  };
  const roe = pickInd("ROE", "ROEA", "ROE (%)");
  const roa = pickInd("ROA", "ROAA");
  const pb = pickInd("P/B", "PB");
  const pe = pickInd("P/E", "PE");
  const ros = pickInd("ROS", "Bien loi nhuan rong");

  // Quy gan nhat (lay 4 ky cuoi)
  let quarters = null;
  if (inc) {
    const dt = inc.find("Sales", "DT thuần", "Doanh thu thuần");
    const gp = inc.find("GrossProfit", "LN gộp", "Lợi nhuận gộp");
    const np = inc.find(
      "ProfitAfterTaxOfParent",
      "AttributableToParentCompany",
      "NetProfit",
      "ProfitAfterTax",
      "Cổ đông của công ty mẹ",
      "LNST của cổ đông",
      "sau thuế"
    );
    const n = inc.periods.length;
    const k = Math.max(0, n - 4);
    quarters = {
      periods: inc.periods.slice(k),
      dt: dt ? dt.slice(k) : null,
      gp: gp ? gp.slice(k) : null,
      np: np ? np.slice(k) : null,
    };
  }

  // Dong tien (quy gan nhat + TTM ~ tong 4 quy)
  const cfoS = cf && cf.find("Lưu chuyển tiền thuần từ hoạt động kinh doanh", "hoạt động kinh doanh");
  // Uu tien dong "thuan" (net) — tranh khop nham section-header/sub-line.
  const cfiS = cf && cf.find("Lưu chuyển tiền thuần từ hoạt động đầu tư", "tiền thuần từ hoạt động đầu tư");
  const cffS = cf && cf.find("Lưu chuyển tiền thuần từ hoạt động tài chính", "tiền thuần từ hoạt động tài chính");
  const ttm = (o) => (o && o.vals ? o.vals.slice(-4).reduce((a, b) => a + (b || 0), 0) : null);
  const lastq = (o) => (o && o.vals ? o.vals.at(-1) : null);
  const cash = {
    cfo: lastq(cfoS), cfoTtm: ttm(cfoS),
    cfi: lastq(cfiS), cff: lastq(cffS),
  };

  // No / VCSH
  const liab = bs && bs.find("NỢ PHẢI TRẢ", "Nợ phải trả");
  const eq = bs && bs.find("VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu");
  const liabV = liab && liab.vals ? liab.vals.at(-1) : null;
  const eqV = eq && eq.vals ? eq.vals.at(-1) : null;
  const de = liabV != null && eqV ? liabV / eqV : null;

  // Co tuc + yield + ROE fallback tu netProfit_TTM/VCSH
  let dividends = null, divYield = null, roeFallback = null;
  if (Array.isArray(divRaw) && divRaw.length) {
    dividends = divRaw
      .slice()
      .sort((a, b) => b.year - a.year)
      .slice(0, 3)
      .map((d) => ({ year: d.year, cash: num(d.cashDividend), stock: num(d.stockDividend) }));
    const lastCash = dividends[0] && dividends[0].cash;
    if (lastCash != null && last) divYield = (lastCash / last) * 100;
    const eqDiv = num(divRaw[0] && divRaw[0].stockHolderEquity);
    const npTtm = pick(fund || {}, ["netProfit_TTM"]);
    if (npTtm != null && eqDiv) roeFallback = (npTtm / eqDiv) * 100;
  }

  // Tin tuc (untrusted external — chi lay title/date/sentiment)
  let news = null;
  if (Array.isArray(newsRaw)) {
    news = newsRaw
      .filter((p) => p && p.title)
      .slice(0, 3)
      .map((p) => {
        const ps = p.postSource;
        const source =
          (typeof ps === "string" ? ps : ps && (ps.name || ps.shortName || ps.title)) ||
          (p.user && p.user.name) ||
          "";
        return {
          title: String(p.title).slice(0, 110),
          date: (p.date || "").slice(0, 10),
          sentiment: p.sentiment ?? null,
          source,
        };
      });
  }

  return {
    ind: { roe, roa, pb, pe, ros },
    fundExtra: {
      eps: pick(fund || {}, ["eps"]),
      dividend: pick(fund || {}, ["dividend"]),
      dividendYield: pick(fund || {}, ["dividendYield"]),
      foreignOwnership: pick(fund || {}, ["foreignOwnership"]),
      salesTtm: pick(fund || {}, ["sales_TTM"]),
      netProfitTtm: pick(fund || {}, ["netProfit_TTM"]),
      priceChange1y: pick(fund || {}, ["priceChange1y"]),
    },
    quarters,
    cash,
    debt: { liab: liabV, equity: eqV, de },
    dividends,
    divYield,
    roeFallback,
    news,
    holders,
    insider,
  };
}

// Sinh khuyen nghi ngan tu du lieu + swap trong positions.json
function recommend(a, pos, ex, sector) {
  const parts = [];
  const s = a.signal || {};
  const q = a.valuation || {};
  // dinh gia + huong
  if (q.drLabel === "DISCOUNT" && s.netDir === "LONG") parts.push("re + dong tien vao → canh mua/GIU");
  else if (q.drLabel === "PREMIUM" && s.netDir === "SHORT") parts.push("dat + dong tien ra → than trong/khong duoi gia");
  // co ban co — CFO am chi la co do voi ma PHI TAI CHINH (bank/CK CFO am la cau truc)
  if (ex && ex.cash && ex.cash.cfoTtm != null && ex.cash.cfoTtm < 0 && !isFinSector(sector))
    parts.push("CFO ttm AM → co do dong tien");
  // No/VCSH vo nghia voi nhom tai chinh (bank/CK/bao hiem): "no" chu yeu la du phong ky thuat/
  // tien gui/repo, khong phai no vay rui ro. Bo cai co don bay cho ho (vd BVH 10.9x binh thuong).
  if (ex && ex.debt && ex.debt.de != null && ex.debt.de > 2 && !isFinSector(sector))
    parts.push(`don bay cao (No/VCSH ${ex.debt.de.toFixed(1)}x)`);
  if (ex && ex.quarters && ex.quarters.gp && ex.quarters.dt) {
    const m = ex.quarters.gp.map((g, i) => (ex.quarters.dt[i] ? g / ex.quarters.dt[i] : null)).filter((x) => x != null);
    if (m.length >= 2) parts.push(m.at(-1) >= m[0] ? "bien LN gop cai thien" : "bien LN gop co lai");
  }
  // P&L
  if (a.pnl && a.pnl.gainPct != null) parts.push(`dang ${a.pnl.gainPct >= 0 ? "lai" : "lo"} ${a.pnl.gainPct.toFixed(1)}%`);
  const swap = pos && pos.swap ? `Y DINH (file): ${pos.swap}` : "";
  const rule = pos && pos.review_rule ? `MOC REVIEW: ${pos.review_rule}` : "";
  return { line: parts.join(" · "), swap, rule };
}

// --------------------------- METRIC CALC ------------------------------
function num(v) {
  const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return num(obj[k]);
  }
  return null;
}

function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sma(closes, n) {
  if (closes.length < n) return null;
  const slice = closes.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

/** Rut chi so tu 1 dong lich su, chiu duoc khac biet ten field. */
function rowClose(r) {
  const p = pick(r, ["priceClose", "close", "adjClose", "priceAverage"]);
  return p == null ? null : p * PRICE_SCALE; // quy ve dong
}
function rowVol(r) {
  return pick(r, ["totalVolume", "dealVolume", "volume", "nmVolume"]);
}
function rowForeignNet(r) {
  const buy = pick(r, ["buyForeignQuantity", "foreignBuyVolume", "buyForeignVolume"]);
  const sell = pick(r, ["sellForeignQuantity", "foreignSellVolume", "sellForeignVolume"]);
  if (buy == null && sell == null) return null;
  return (buy || 0) - (sell || 0);
}
function rowForeignNetVal(r) {
  const buy = pick(r, ["buyForeignValue"]);
  const sell = pick(r, ["sellForeignValue"]);
  if (buy == null && sell == null) return null;
  return (buy || 0) - (sell || 0); // dong
}
function rowProp(r) {
  return pick(r, ["propTradingNetValue"]); // tu doanh rong (dong)
}
function sumLast(hist, n, fn) {
  const a = hist.slice(-n).map(fn).filter((v) => v != null);
  return a.length ? a.reduce((x, y) => x + y, 0) : null;
}

function analyze(sym, pos, fund, hist) {
  const closes = hist.map(rowClose).filter((v) => v != null);
  const vols = hist.map(rowVol).filter((v) => v != null);
  const last = closes.at(-1) ?? null;
  const prev = closes.at(-2) ?? null;
  const changePct = last != null && prev ? ((last - prev) / prev) * 100 : null;

  const ma20 = sma(closes, 20);
  const ma50 = sma(closes, 50);
  const hi52 = closes.length ? Math.max(...closes) : null;
  const lo52 = closes.length ? Math.min(...closes) : null;

  // Vi tri trong bien 52w (0=day, 1=dinh) -> DR proxy
  let drPos = null,
    drLabel = null;
  if (last != null && hi52 != null && lo52 != null && hi52 > lo52) {
    drPos = (last - lo52) / (hi52 - lo52);
    drLabel = drPos <= CFG.drDiscount ? "DISCOUNT" : drPos >= CFG.drPremium ? "PREMIUM" : "EQ";
  }

  // Dong tien ngoai rong N phien gan nhat (don vi: cp)
  const fnet = hist.slice(-CFG.foreignWindow).map(rowForeignNet).filter((v) => v != null);
  const foreignNet = fnet.length ? fnet.reduce((a, b) => a + b, 0) : null;
  const foreignNet5 = (() => {
    const a = hist.slice(-5).map(rowForeignNet).filter((v) => v != null);
    return a.length ? a.reduce((x, y) => x + y, 0) : null;
  })();

  // KL median + so voi phien gan nhat
  const volMed = median(vols.slice(-CFG.volMedianWindow));
  const lastVol = vols.at(-1) ?? null;
  const volVsMed = volMed && lastVol != null ? lastVol / volMed : null;

  // Huong (net LONG/SHORT proxy): ket hop xu huong gia (MA20 vs MA50)
  // + dong tien ngoai rong. Diem [-1..1], >0 = thien LONG.
  let dir = 0,
    dirParts = 0;
  if (ma20 != null && ma50 != null) {
    dir += ma20 >= ma50 ? 1 : -1;
    dirParts++;
  }
  if (foreignNet != null) {
    dir += foreignNet > 0 ? 1 : -1;
    dirParts++;
  }
  if (last != null && ma20 != null) {
    dir += last >= ma20 ? 0.5 : -0.5;
    dirParts += 0.5;
  }
  const dirScore = dirParts ? dir / dirParts : null; // -1..1
  const netDir = dirScore == null ? null : dirScore >= 0 ? "LONG" : "SHORT";
  const netConf = dirScore == null ? null : Math.min(1, Math.abs(dirScore));

  // Verdict heuristic:
  //  - DISCOUNT + huong LONG            -> TAKE LONG
  //  - PREMIUM + huong SHORT            -> TAKE SHORT (canh gia cao)
  //  - con lai                          -> SKIP / WATCH
  let verdict = "SKIP";
  if (drLabel === "DISCOUNT" && netDir === "LONG") verdict = "TAKE LONG";
  else if (drLabel === "PREMIUM" && netDir === "SHORT") verdict = "TAKE SHORT";
  else if (netDir === "LONG" && drLabel === "EQ") verdict = "WATCH LONG";
  else if (netDir === "SHORT" && drLabel === "DISCOUNT") verdict = "WATCH (re nhung dong tien yeu)";

  // Co ban tu fundamental (defensive keys)
  const f = fund || {};
  const fundamental = {
    marketCap: pick(f, ["marketCap"]),
    pe: pick(f, ["pe", "priceToEarnings"]),
    pb: pick(f, ["pb", "priceToBook"]),
    eps: pick(f, ["eps"]),
    roe: pick(f, ["roe", "returnOnEquity"]),
    beta: pick(f, ["beta"]),
    dividendYield: pick(f, ["dividendYield"]),
    high52: pick(f, ["high52Week", "priceHigh52Week"]),
    low52: pick(f, ["low52Week", "priceLow52Week"]),
  };

  // P&L so voi vi the
  let pnl = null;
  if (pos && last != null && pos.avg_cost) {
    const gainPct = ((last - pos.avg_cost) / pos.avg_cost) * 100;
    const marketValue = pos.shares ? last * pos.shares : null;
    const gainVnd = pos.shares ? (last - pos.avg_cost) * pos.shares : null;
    pnl = { avg_cost: pos.avg_cost, shares: pos.shares, gainPct, marketValue, gainVnd };
  }

  // Khoang cach den ho tro/khang cu/target (neu positions.json co levels)
  let levels = null;
  if (pos && pos.levels && last != null) {
    const L = pos.levels;
    levels = {
      khang_cu: L.khang_cu ?? null,
      ho_tro: L.ho_tro ?? null,
      target: L.target ?? null,
      distTargetPct: L.target ? ((L.target - last) / last) * 100 : null,
    };
  }

  // Dong tien: khoi ngoai (theo tien), tu doanh, room, GT giao dich
  const flow = {
    frgnNetVal20: sumLast(hist, CFG.foreignWindow, rowForeignNetVal), // dong
    frgnNetVal5: sumLast(hist, 5, rowForeignNetVal),
    propNet20: sumLast(hist, CFG.foreignWindow, rowProp), // tu doanh rong, dong
    propNet5: sumLast(hist, 5, rowProp),
    room: pick(hist.at(-1) || {}, ["currentForeignRoom"]),
    lastValue: pick(hist.at(-1) || {}, ["totalValue"]), // GT giao dich phien gan nhat
  };

  return {
    symbol: sym,
    asof: new Date().toISOString(),
    price: { last, changePct, ma20, ma50, hi52, lo52 },
    volume: { last: lastVol, median: volMed, vsMedian: volVsMed },
    foreign: { net20: foreignNet, net5: foreignNet5 },
    flow,
    valuation: { drPos, drLabel },
    signal: { verdict, netDir, netConf },
    fundamental,
    pnl,
    levels,
  };
}

// ----------------------------- OUTPUT ---------------------------------
function pctStr(v, d = 1) {
  if (v == null) return "n/a";
  const s = v.toFixed(d);
  return `${v >= 0 ? "+" : ""}${s}%`;
}
function kStr(v) {
  if (v == null) return "n/a";
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(2) + "ngh.ty"; // nghin ty
  if (abs >= 1e9) return (v / 1e9).toFixed(2) + "ty";
  if (abs >= 1e6) return (v / 1e6).toFixed(2) + "tr";
  if (abs >= 1e3) return (v / 1e3).toFixed(1) + "k";
  return String(Math.round(v));
}

function iStr(x, pct = true) {
  // chi so + so nganh
  if (!x || x.v == null) return "n/a";
  const u = pct ? "%" : "";
  const base = `${x.v.toFixed(pct ? 1 : 2)}${u}`;
  return x.ind != null ? `${base} (nganh ${x.ind.toFixed(pct ? 1 : 2)}${u})` : base;
}

function printSnapshot(a, pos) {
  const p = a.price;
  console.log(`\n═══ ${a.symbol} ═══  ${pos?.swap ? "(" + pos.swap + ")" : ""}`);
  console.log(
    `  Gia:    ${kStr(p.last)}  ${pctStr(p.changePct)}   ` +
      `MA20 ${kStr(p.ma20)} / MA50 ${kStr(p.ma50)}   52w ${kStr(p.lo52)}..${kStr(p.hi52)}`
  );
  console.log(
    `  KL/GT:  ${kStr(a.volume.last)} cp (x${a.volume.vsMedian != null ? a.volume.vsMedian.toFixed(2) : "n/a"} median)  ` +
      `| GT ${a.flow?.lastValue != null ? kStr(a.flow.lastValue) + "d" : "n/a"}`
  );
  console.log(
    `  Ngoai:  rong 20p ${a.foreign.net20 != null ? kStr(a.foreign.net20) + " cp" : "n/a"}` +
      `${a.flow?.frgnNetVal20 != null ? " (" + kStr(a.flow.frgnNetVal20) + "d)" : ""}  ` +
      `| 5p ${a.foreign.net5 != null ? kStr(a.foreign.net5) + " cp" : "n/a"}` +
      `${a.flow?.room != null ? "  | room " + kStr(a.flow.room) : ""}`
  );
  console.log(
    `  Tu doanh: rong 20p ${a.flow?.propNet20 != null ? kStr(a.flow.propNet20) + "d" : "n/a"}  ` +
      `| 5p ${a.flow?.propNet5 != null ? kStr(a.flow.propNet5) + "d" : "n/a"}`
  );
  console.log(
    `  Dinh gia: ${a.valuation.drLabel || "n/a"}` +
      (a.valuation.drPos != null ? ` (DR ${Math.round(a.valuation.drPos * 100)}% bien 52w)` : "")
  );
  const f = a.fundamental;
  const ex = a.extra;
  const ind = ex && ex.ind ? ex.ind : {};
  console.log(
    `  Co ban: ROE ${iStr(ind.roe)}  ROA ${iStr(ind.roa)}  ` +
      `PE ${iStr(ind.pe, false) !== "n/a" ? iStr(ind.pe, false) : f.pe ?? "n/a"}  PB ${iStr(ind.pb, false)}`
  );
  console.log(
    `          EPS ${ex?.fundExtra?.eps != null ? kStr(ex.fundExtra.eps) : "n/a"}  ` +
      `cap ${kStr(f.marketCap)}  beta ${f.beta ?? "n/a"}  ` +
      `SH ngoai ${ex?.fundExtra?.foreignOwnership != null ? (ex.fundExtra.foreignOwnership * 100).toFixed(1) + "%" : "n/a"}`
  );
  // Quy gan nhat
  if (ex && ex.quarters && ex.quarters.periods && ex.quarters.periods.length) {
    const q = ex.quarters;
    const cells = q.periods.map((per, i) => {
      const dt = q.dt ? q.dt[i] : null;
      const gp = q.gp ? q.gp[i] : null;
      const np = q.np ? q.np[i] : null;
      const gm = dt && gp != null ? ((gp / dt) * 100).toFixed(0) + "%" : "-";
      return `${per}: DT ${kStr(dt)} GP ${kStr(gp)}(${gm}) LNST ${kStr(np)}`;
    });
    console.log(`  Quy:    ${cells.join("  |  ")}`);
  }
  // Dong tien DN
  if (ex && ex.cash && (ex.cash.cfo != null || ex.cash.cfoTtm != null)) {
    const c = ex.cash;
    console.log(
      `  DongtienDN: CFO ${kStr(c.cfo)}d (ttm ${kStr(c.cfoTtm)}d)  CFI ${kStr(c.cfi)}d  CFF ${kStr(c.cff)}d`
    );
  }
  // No
  if (ex && ex.debt && ex.debt.de != null) {
    console.log(
      `  No:     No/VCSH ${ex.debt.de.toFixed(2)}x  (no ${kStr(ex.debt.liab)}d / VCSH ${kStr(ex.debt.equity)}d)`
    );
  }
  // Co tuc
  if (ex && ex.dividends && ex.dividends.length) {
    const dv = ex.dividends
      .map((d) => `${d.year}: ${d.cash != null ? kStr(d.cash) + "d" : "-"}${d.stock ? "+" + d.stock + "%cp" : ""}`)
      .join(" · ");
    console.log(
      `  Co tuc: yield ~${ex.divYield != null ? ex.divYield.toFixed(1) + "%" : "n/a"}  [${dv}]`
    );
  }
  // Co dong lon + giao dich noi bo (tab "Co dong" tren fireant)
  if (ex && ex.holders && ex.holders.length) {
    const hs = ex.holders
      .map((h) => `${h.name}${h.position ? " (" + h.position + ")" : ""} ${h.pct.toFixed(1)}%${h.foreign ? " [ngoai]" : ""}`)
      .join(" · ");
    console.log(`  Co dong lon: ${hs}`);
  }
  if (ex && ex.insider && ex.insider.length) {
    const ts = ex.insider
      .map((t) => `${t.name}${t.position ? " (" + t.position + ")" : ""} DK ${kStr(t.reg)}cp${t.exec ? "/TH " + kStr(t.exec) : ""} ${t.date || ""}`)
      .join("  |  ");
    console.log(`  GD noi bo (mua/ban XEM TIN): ${ts}`);
  }
  const s = a.signal;
  console.log(
    `  TIN HIEU: ${s.verdict}  | net ${s.netDir || "-"} ${
      s.netConf != null ? s.netConf.toFixed(2) : ""
    }`
  );
  if (a.pnl) {
    console.log(
      `  VI THE: ${kStr(a.pnl.shares)}cp @ von ${kStr(a.pnl.avg_cost)}  ->  ` +
        `P&L ${pctStr(a.pnl.gainPct)} (${a.pnl.gainVnd != null ? kStr(a.pnl.gainVnd) + "d" : "n/a"})  ` +
        `| GT thi truong ${kStr(a.pnl.marketValue)}d`
    );
  }
  if (a.levels) {
    console.log(
      `  Levels: ho_tro ${JSON.stringify(a.levels.ho_tro)}  khang_cu ${a.levels.khang_cu}  ` +
        `target ${a.levels.target}${
          a.levels.distTargetPct != null ? " (" + pctStr(a.levels.distTargetPct) + ")" : ""
        }`
    );
  }
  // Tin tuc
  if (ex && ex.news && ex.news.length) {
    console.log(`  Tin tuc:`);
    for (const n of ex.news) {
      const sent = n.sentiment ? ` [${n.sentiment > 0 ? "+" : ""}${n.sentiment}]` : "";
      console.log(`   - ${n.date} ${n.title}${sent}${n.source ? " (" + n.source + ")" : ""}`);
    }
  }
  // Khuyen nghi
  if (a.rec) {
    if (a.rec.line) console.log(`  >> NHAN DINH: ${a.rec.line}`);
    if (a.rec.swap) console.log(`  >> ${a.rec.swap}`);
    if (a.rec.rule) console.log(`  >> ${a.rec.rule}`);
  }
}

// ------------------------------ PEERS (screener) ----------------------
// Chay dong thoi co gioi han
async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

async function loadUniverse() {
  try {
    const raw = await readFile(join(__dirname, "universe.json"), "utf8");
    return JSON.parse(raw).sectors || {};
  } catch {
    return {};
  }
}

// Yeu to cham diem: [key, trong so]. Value da bake huong (cao=tot).
// CFI khong cham (huong tot/xau khong ro) — chi hien thi trong phan tich tung ma.
const PEER_FACTORS = [
  ["roe", 1], ["roa", 0.5], ["roic", 0.8], ["roce", 0.5], ["roeVsInd", 0.5], // hieu qua von
  ["netMargin", 0.5], ["ros", 0.3], // bien loi nhuan
  ["lnGrowth", 1], ["revGrowth", 0.5], // tang truong
  ["iPE", 1], ["iPB", 1], ["iPS", 0.5], ["divYield", 0.3], // dinh gia + co tuc
  ["cfoYield", 1], ["cfoQuality", 1], ["negCFF", 0.5], // dong tien + chat luong LN
  ["frgnFlow", 0.5], ["propFlow", 0.3], // dong tien ngoai + tu doanh vao ma
  ["negDE", 1], ["intCov", 0.7], ["currentRatio", 0.4], // an toan tai chinh
  ["liq", 0.5], ["capZ", 0.5], ["negBeta", 0.3], // thanh khoan/quy mo/bien dong
];

// Lay day du yeu to (nhieu call/ma) de cham diem da chieu
async function fetchFactors(sym) {
  const [indRaw, fund, cfRaw, bsRaw, incRaw, hist] = await Promise.all([
    fetchIndicators(sym),
    fetchFundamental(sym).catch(() => null),
    fetchCashFlow(sym),
    fetchFull(sym, 1),
    fetchIncome(sym),
    fetchHistory(sym).catch(() => []),
  ]);
  const ind = parseIndicators(indRaw);
  const g = (...k) => {
    const x = ind && ind.get(...k);
    return x ? x.value : null;
  };
  const cap = pick(fund || {}, ["marketCap"]);
  const shares = pick(fund || {}, ["sharesOutstanding"]);
  const beta = pick(fund || {}, ["beta"]);
  const avgVol = pick(fund || {}, ["avgVolume3m", "avgVolume10d"]);
  const price = cap && shares ? cap / shares : null;
  const cf = parseFull(cfRaw), bs = parseFull(bsRaw), inc = parseReport(incRaw);
  const ttm = (o) => (o && o.vals ? o.vals.slice(-4).reduce((a, b) => a + (b || 0), 0) : null);
  const cfoTtm = ttm(cf && cf.find("Lưu chuyển tiền thuần từ hoạt động kinh doanh", "hoạt động kinh doanh"));
  const cffTtm = ttm(cf && cf.find("Lưu chuyển tiền thuần từ hoạt động tài chính", "tiền thuần từ hoạt động tài chính"));
  const cfiTtm = ttm(cf && cf.find("Lưu chuyển tiền thuần từ hoạt động đầu tư", "tiền thuần từ hoạt động đầu tư"));
  const liab = bs && bs.find("NỢ PHẢI TRẢ", "Nợ phải trả");
  const eq = bs && bs.find("VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu");
  const liabV = liab && liab.vals ? liab.vals.at(-1) : null;
  const eqV = eq && eq.vals ? eq.vals.at(-1) : null;
  const de = liabV != null && eqV ? liabV / eqV : null;
  let lnGrowth = null;
  if (inc) {
    const np = inc.find(
      "ProfitAfterTaxOfParent", "AttributableToParentCompany", "NetProfit",
      "ProfitAfterTax", "Cổ đông của công ty mẹ", "sau thuế"
    );
    if (np && np.length >= 8) {
      const l4 = np.slice(-4).reduce((a, b) => a + (b || 0), 0);
      const p4 = np.slice(-8, -4).reduce((a, b) => a + (b || 0), 0);
      if (p4 > 0) lnGrowth = ((l4 - p4) / p4) * 100;
    }
  }
  const pe = g("P/E", "PE"), pb = g("P/B", "PB");
  const ps = g("P/S");
  const roic = g("ROIC");
  const roce = g("ROCE");
  const netMargin = g("%Lãi ròng", "Bien lai rong");
  const currentRatio = g("TT Hiện hành");
  const intCovRaw = g("TT Lãi vay"); // kha nang tra lai
  const intCov = intCovRaw != null ? Math.min(intCovRaw, 20) : null; // chan tran (0 no = vo cuc)
  // Dong tien ngoai + tu doanh vao ma (chuan hoa theo von hoa)
  const capV = pick(fund || {}, ["marketCap"]);
  const closesF = Array.isArray(hist) ? hist.map(rowClose).filter((v) => v != null) : [];
  const priceF = closesF.at(-1) ?? null;
  const frgnNet20 = Array.isArray(hist) ? sumLast(hist, 20, rowForeignNetVal) : null;
  const frgnNet5 = Array.isArray(hist) ? sumLast(hist, 5, rowForeignNetVal) : null;
  const propNet20 = Array.isArray(hist) ? sumLast(hist, 20, rowProp) : null;
  const npTtm = pick(fund || {}, ["netProfit_TTM"]);
  const salesTtm = pick(fund || {}, ["sales_TTM"]);
  const divY = pick(fund || {}, ["dividendYield"]);
  const roeInd = ind && ind.get("ROE");
  let revGrowth = null;
  if (inc) {
    const dt = inc.find("Sales", "DT thuần", "Doanh thu thuần");
    if (dt && dt.length >= 8) {
      const l4 = dt.slice(-4).reduce((a, b) => a + (b || 0), 0);
      const p4 = dt.slice(-8, -4).reduce((a, b) => a + (b || 0), 0);
      if (p4 > 0) revGrowth = ((l4 - p4) / p4) * 100;
    }
  }
  return {
    sym,
    roe: g("ROE"), roa: g("ROA"), pe, pb, de, beta,
    lnGrowth, revGrowth,
    ros: npTtm != null && salesTtm ? (npTtm / salesTtm) * 100 : null,
    cfoQuality: cfoTtm != null && npTtm && npTtm > 0 ? cfoTtm / npTtm : null,
    divYield: divY != null ? divY * 100 : null,
    roeVsInd: roeInd && roeInd.value != null && roeInd.industry != null ? roeInd.value - roeInd.industry : null,
    cfo: cfoTtm, cfi: cfiTtm, cff: cffTtm, cap,
    // gia tri da bake huong (cao = tot)
    iPE: pe && pe > 0 ? 1 / pe : null,
    iPB: pb && pb > 0 ? 1 / pb : null,
    cfoYield: cfoTtm != null && cap ? cfoTtm / cap : null,
    negCFF: cffTtm != null && cap ? -cffTtm / cap : null,
    negDE: de != null ? -de : null,
    liq: avgVol != null && price ? avgVol * price : null,
    capZ: cap != null && cap > 0 ? Math.log(cap) : null,
    negBeta: beta != null ? -beta : null,
    roic, roce, netMargin, currentRatio, intCov,
    iPS: ps && ps > 0 ? 1 / ps : null,
    frgnFlow: frgnNet20 != null && capV ? frgnNet20 / capV : null,
    propFlow: propNet20 != null && capV ? propNet20 / capV : null,
    // tho — cho daily_brief + loc thanh khoan
    price: priceF, frgnNet20, frgnNet5, propNet20, avgVol,
  };
}

function zStat(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sd = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) || 1;
  return { m, sd };
}

// Diem = trung binh z-score co trong so tren cac yeu to CO du lieu.
// Luu y: NHOM TAI CHINH (bank/CK/bao hiem) — truc "chat luong dong tien" (cfoYield/
// cfoQuality/negCFF) KHONG so sanh duoc voi doanh nghiep thuong (CFO am + CFF duong la
// cau truc margin/FVTPL/tin dung, khong phai lai giay/dot tien). -> null 3 yeu to nay cho
// nhom tai chinh: vua khong phat oan diem cua ho, vua khong lam meo z-score cua ca universe.
// Yeu cau: rows da gan r.sector TRUOC khi goi (2 callsite deu da gan).
function scoreUniverse(rows) {
  const valid = rows.filter(Boolean);
  if (valid.length < 3) return [];
  for (const r of valid) {
    if (isFinSector(r.sector)) { r.cfoYield = null; r.cfoQuality = null; r.negCFF = null; }
  }
  const zs = {};
  for (const [k] of PEER_FACTORS) {
    const vals = valid.map((r) => r[k]).filter((v) => v != null && Number.isFinite(v));
    if (vals.length >= 3) zs[k] = zStat(vals);
  }
  for (const r of valid) {
    let s = 0, w = 0;
    for (const [k, wt] of PEER_FACTORS) {
      if (zs[k] && r[k] != null && Number.isFinite(r[k])) {
        s += wt * ((r[k] - zs[k].m) / zs[k].sd);
        w += wt;
      }
    }
    r.score = w ? s / w : null;
  }
  return valid.filter((r) => r.score != null);
}

function fmtPeer(r) {
  const cq = r.cfoQuality != null ? r.cfoQuality.toFixed(1) : "n/a";
  return `${r.sym.padEnd(5)} diem ${r.score >= 0 ? "+" : ""}${r.score.toFixed(2)}  ` +
    `| ROE ${r.roe != null ? r.roe.toFixed(0) + "%" : "-"}  PE ${r.pe != null ? r.pe.toFixed(1) : "-"}  ` +
    `PB ${r.pb != null ? r.pb.toFixed(1) : "-"}  No/VCSH ${r.de != null ? r.de.toFixed(1) + "x" : "-"}  ` +
    `CFO/LN ${cq}  tangLN ${r.lnGrowth != null ? (r.lnGrowth >= 0 ? "+" : "") + r.lnGrowth.toFixed(0) + "%" : "-"}`;
}

function printPeers(targetSym, res) {
  const { scored, target, universe } = res;
  const sector = res.resolvedSector || universe[targetSym] || null;
  const liq = (r) => r.avgVol != null && r.avgVol >= CFG.minLiqShares; // >= 1tr cp
  console.log(
    `\n  ─── TIM CO PHIEU TOT HON (diem = TB z-score co trong so; loc KL >= ${(CFG.minLiqShares / 1e6).toFixed(0)}tr cp) ───\n` +
      `  Yeu to: ROE/ROA/ROIC/ROE-vs-nganh · tangLN/tangDT · re-PE/re-PB/re-PS/co tuc · CFO & CFO-LN & CFF · it no/tra lai/thanh khoan/von hoa/beta`
  );
  if (!scored.length) {
    console.log(`  (khong du du lieu universe de cham diem)`);
    return;
  }
  if (!target) {
    console.log(`  ${targetSym} khong du du lieu de cham diem — chi liet ke top universe.`);
  } else {
    console.log(`  ${targetSym} (${sector || "?"}) diem = ${target.score.toFixed(2)}`);
  }
  const ts = target ? target.score : -Infinity;
  if (sector && sector !== "?") {
    const same = scored
      .filter((r) => r.sector === sector && r.sym !== targetSym && r.score > ts && liq(r))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    console.log(`  • Cung nganh (${sector}) tot hon:`);
    if (same.length) same.forEach((r) => console.log(`     ${fmtPeer(r)}`));
    else console.log(`     (khong co ma nao diem cao hon + du thanh khoan trong nganh)`);
  }
  const cross = scored
    .filter((r) => r.sector !== sector && r.sym !== targetSym && r.score > ts && liq(r))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  console.log(`  • Khac nganh tot hon (top diem toan universe):`);
  if (cross.length) cross.forEach((r) => console.log(`     ${r.sector.padEnd(18)} ${fmtPeer(r)}`));
  else console.log(`     (khong co)`);
  console.log(
    `  * "Tot hon" = diem chat luong+dinh gia cao hon, KHONG xet chu ky/cau chuyen rieng. Tham khao.`
  );
}

// ------------------------------ PROBE ---------------------------------
// Do cau truc cac endpoint FireAnt (chi de discovery — chay 1 lan roi go).
async function probe(sym) {
  const candidates = [
    // Do endpoint DANH SACH MA (de tu build universe)
    `/groups`,
    `/groups/VN30/symbols`,
    `/groups/VNINDEX/symbols`,
    `/indexes`,
    `/indexes/VN30/constituents`,
    `/symbols`,
    `/symbols?exchange=HOSE`,
    `/watchlists`,
    `/industries`,
    `/icb`,
    `/markets/HOSE/symbols`,
    `/companies?exchange=HOSE&limit=5`,
  ];
  for (const path of candidates) {
    try {
      const r = await fetch(API_BASE + path, { headers: authHeaders() });
      let info = `HTTP ${r.status}`;
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j)) {
          info += ` array[${j.length}]`;
          if (j[0] && typeof j[0] === "object")
            info += `\n    keys(item0): ${Object.keys(j[0]).join(", ")}` +
              `\n    sample0: ${JSON.stringify(j[0]).slice(0, 320)}`;
        } else if (j && typeof j === "object") {
          info += `\n    keys: ${Object.keys(j).join(", ")}` +
            `\n    sample: ${JSON.stringify(j).slice(0, 320)}`;
        }
      }
      console.log(`\n[${path}]\n  ${info}`);
    } catch (e) {
      console.log(`\n[${path}]\n  ERR ${e.message}`);
    }
  }
  try {
    const h = await fetchHistory(sym);
    if (h && h[0]) {
      console.log(
        `\n[historical-quotes row keys]\n  keys: ${Object.keys(h.at(-1)).join(", ")}` +
          `\n  sample: ${JSON.stringify(h.at(-1)).slice(0, 500)}`
      );
    }
  } catch (e) {
    console.log(`\n[historical-quotes row] ERR ${e.message}`);
  }
  try {
    const arr = await fetchIndicators(sym);
    if (Array.isArray(arr)) {
      console.log(
        `\n[financial-indicators names]\n  ` +
          arr.map((it) => `${it.shortName || it.name}=${it.value}`).join(" | ")
      );
    }
  } catch (e) {
    console.log(`\n[financial-indicators] ERR ${e.message}`);
  }
}

// ------------------------------ MAIN ----------------------------------
async function loadPositions() {
  const raw = await readFile(join(__dirname, "positions.json"), "utf8");
  return JSON.parse(raw);
}

function parseArgs(argv) {
  const flags = new Set();
  const tickers = [];
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) flags.add(a.slice(2));
    else tickers.push(a.toUpperCase());
  }
  return { flags, tickers };
}

async function main() {
  const { flags, tickers } = parseArgs(process.argv);
  const pf = await loadPositions();
  const positions = pf.positions || {};

  let targets = tickers;
  // --universe: quet TOAN BO universe.json (∪ holdings) — dung cho lich screening hang ngay.
  if (flags.has("universe")) {
    const uni = await loadUniverse().catch(() => ({}));
    targets = [...new Set([...Object.keys(uni), ...Object.keys(positions)])];
  } else if (flags.has("all") || targets.length === 0) {
    targets = Object.keys(positions);
  }
  // Cac mode STANDALONE khong can danh sach ma (doc file/universe.json san co).
  // Truoc day guard duoi day chan het chung khi positions.json rong (danh muc moi khoi tao)
  // -> discover/prune/rodp im lang, file analysis/* ra rong ma workflow van bao success.
  const STANDALONE = ["discover", "pruneuniverse", "rodp", "tiers"];
  const isStandalone = STANDALONE.some((f) => flags.has(f));
  if (targets.length === 0 && !isStandalone) {
    console.error("Khong co ma nao. Dung: node extract_ticker.js FPT HPG  |  --all  |  --universe");
    process.exit(1);
  }

  // rodp/tiers/pruneuniverse chi DOC file san co -> khong can token.
  const NEEDS_TOKEN = !["rodp", "tiers", "pruneuniverse"].some((f) => flags.has(f));
  if (!TOKEN && NEEDS_TOKEN) {
    console.error(
      "\n⚠️  Thieu FIREANT_TOKEN.\n" +
        "   export FIREANT_TOKEN='eyJ...'   (local)\n" +
        "   hoac them secret FIREANT_TOKEN tren GitHub (workflow da doc san).\n"
    );
    process.exit(2);
  }

  if (flags.has("probe")) {
    console.log(`=== PROBE FireAnt endpoints (sym=${targets[0]}) ===`);
    await probe(targets[0]);
    console.log("\n=== HET PROBE ===");
    return;
  }

  // --discover: quet FEED TIN toan thi truong (/posts?type=1), rut taggedSymbols -> tim ma
  // XUAT HIEN NHIEU trong tin ma CHUA co trong universe -> ung vien lam giau universe.
  if (flags.has("discover")) {
    const uni = await loadUniverse().catch(() => ({}));
    const inUni = new Set([...Object.keys(uni), ...Object.keys(positions)]);
    const isStock = (s) => /^[A-Z]{3}$/.test(s); // ma co phieu 3 chu; loai index/futures (VNINDEX, VN30F1M...)
    const posts = [];
    for (const off of [0, 20, 40, 60, 80]) {
      const r = await tryGet(`/posts?type=1&offset=${off}&limit=20`).catch(() => []);
      if (Array.isArray(r)) posts.push(...r);
    }
    const stat = {};
    for (const p of posts) {
      const tags = Array.isArray(p.taggedSymbols) ? p.taggedSymbols : [];
      const title = String(p.title || "").replace(/\s+/g, " ").trim();
      if (!title) continue; // bo post rong (chi snapshot gia)
      for (const t of tags) {
        const s = t.symbol;
        if (!isStock(s)) continue;
        if (!stat[s]) stat[s] = { count: 0, titles: [], price: t.price, chg: t.percentChange };
        stat[s].count++;
        if (stat[s].titles.length < 2 && !stat[s].titles.includes(title)) stat[s].titles.push(title.slice(0, 75));
      }
    }
    const rows = Object.entries(stat)
      .map(([s, d]) => ({ s, ...d, isnew: !inUni.has(s) }))
      .sort((a, b) => (b.isnew - a.isnew) || (b.count - a.count));
    console.log("=== DISCOVER START === (tu /posts?type=1; * = CHUA co trong universe -> ung vien them)");
    for (const r of rows) {
      const px = r.price != null ? `${r.price}k ${r.chg >= 0 ? "+" : ""}${(r.chg || 0).toFixed(1)}%` : "";
      console.log(`${r.isnew ? "*" : " "} ${r.s} x${r.count} (${px}) | ${r.titles.join("  //  ")}`);
    }
    const fresh = rows.filter((r) => r.isnew);
    console.log(`=== DISCOVER END === (${rows.length} ma trong tin, ${fresh.length} CHUA co universe: ${fresh.map((r) => r.s).join(" ")})`);
    return;
  }

  // --pruneuniverse: ra soat tang WATCH -> de xuat PROMOTE (da mua)/REMOVE (qua han)/KEEP (con han).
  // Chong "sot rac": ma watch qua review_by ma chua mua + het catalyst -> loai.
  if (flags.has("pruneuniverse")) {
    let uni = {};
    try { uni = JSON.parse(await readFile(join(__dirname, "universe.json"), "utf8")); } catch { /* trong */ }
    const watch = (uni.tiers && uni.tiers.watch) || {};
    const today = fmtDate(new Date());
    const held = new Set(Object.keys(positions));
    const promote = [], remove = [], keep = [];
    for (const [sym, m] of Object.entries(watch)) {
      const o = { sym, added: m.added || "?", review_by: m.review_by || "", reason: m.reason || "" };
      if (held.has(sym)) promote.push(o);
      else if (o.review_by && o.review_by < today) remove.push(o);
      else keep.push(o);
    }
    console.log(`=== PRUNE START === (ra soat WATCH tier, hom nay ${today})`);
    console.log(`-- PROMOTE len CORE (da mua): ${promote.map((x) => x.sym).join(" ") || "(khong)"}`);
    for (const x of promote) console.log(`  + ${x.sym} | them ${x.added} | ${x.reason}`);
    console.log(`-- REMOVE (qua han, chua mua, xet loai): ${remove.map((x) => x.sym).join(" ") || "(khong)"}`);
    for (const x of remove) console.log(`  - ${x.sym} | them ${x.added}, han ${x.review_by} DA QUA | ${x.reason}`);
    console.log(`-- KEEP (con han): ${keep.map((x) => x.sym).join(" ") || "(khong)"}`);
    for (const x of keep) console.log(`  = ${x.sym} | han ${x.review_by} | ${x.reason}`);
    console.log(`=== PRUNE END === (${promote.length} promote / ${remove.length} remove / ${keep.length} keep)`);
    return;
  }

  // --rodp: RO DU PHONG tu dong (DICH mua). Doc analysis/universe-latest.md (da tao cung run),
  // loc ma CHAT ngoai danh muc theo nguong IN. CO CHE CHONG RAC: tai tao moi lan chay ->
  // ma chi hien khi DANG dat chuan; da mua hoac tut chuan -> TU BIEN MAT (khong tich rac).
  if (flags.has("rodp")) {
    const IN = { roeMin: 15, peMax: 15, pbMax: 2.5, deMax: 2.0 }; // nguong vao ro
    let txt = "";
    try { txt = await readFile(join(__dirname, "analysis/universe-latest.md"), "utf8"); }
    catch { console.log("=== RODP START ===\n(chua co analysis/universe-latest.md — chay --universe truoc)\n=== RODP END ==="); return; }
    const held = new Set(Object.keys(positions));
    const blocks = txt.split(/═══ ([A-Z0-9]+) ═══/);
    const g = (b, re) => { const m = b.match(re); return m ? m[1] : null; };
    const rows = [], graduated = [], dropped = [];
    for (let i = 1; i < blocks.length; i += 2) {
      const sym = blocks[i], b = blocks[i + 1] || "";
      const roe = parseFloat(g(b, /ROE ([0-9.]+)%/));
      const pe = parseFloat(g(b, /PE ([0-9.]+)/));
      const pb = parseFloat(g(b, /PB ([0-9.]+)/));
      const deS = g(b, /No\/VCSH ([0-9.]+)x/); const de = deS ? parseFloat(deS) : null;
      const price = g(b, /Gia:\s+([0-9.]+k)/) || "?";
      const sig = (g(b, /TIN HIEU: ([A-Z ]+?)\s*[|\n]/) || "").trim();
      if (!isFinite(roe)) continue;
      const pass = roe >= IN.roeMin && isFinite(pe) && pe > 0 && pe <= IN.peMax
        && isFinite(pb) && pb <= IN.pbMax && (de == null || de <= IN.deMax);
      if (held.has(sym)) { if (pass) graduated.push(sym); continue; } // da mua -> roi ro (OUT)
      if (!pass) { dropped.push(sym); continue; } // tut chuan -> khong vao (OUT)
      rows.push({ sym, roe, pe, pb, de, price, sig, score: roe / pe });
    }
    rows.sort((a, b) => b.score - a.score);
    console.log(`=== RODP START === (IN: ROE>=${IN.roeMin}%, 0<PE<=${IN.peMax}, PB<=${IN.pbMax}, No<=${IN.deMax}x; NGOAI danh muc; tu tai tao chong rac)`);
    console.log("MA    | ROE   | PE   | PB   | No   | gia    | sc  | tin hieu");
    for (const r of rows) {
      console.log(`${r.sym.padEnd(5)} | ${String(r.roe.toFixed(1)).padStart(4)}% | ${String(r.pe.toFixed(1)).padStart(4)} | ${r.pb.toFixed(2)} | ${(r.de != null ? r.de.toFixed(1) + "x" : "-").padStart(4)} | ${r.price.padStart(6)} | ${String(Math.round(r.score)).padStart(2)} | ${r.sig}`);
    }
    console.log(`-- OUT (da mua -> graduated): ${graduated.join(" ") || "(khong)"}`);
    console.log(`=== RODP END === (${rows.length} ung vien dat chuan / da loai ${dropped.length} tut chuan)`);
    return;
  }

  // --tiers: in phan tang universe (H=held/so huu THAT, W=watch, U=universe theo doi) - derive live tu positions.json.
  if (flags.has("tiers")) {
    let uni = {};
    try { uni = JSON.parse(await readFile(join(__dirname, "universe.json"), "utf8")); } catch { /* trong */ }
    const sectors = uni.sectors || {};
    const watch = new Set(Object.keys((uni.tiers && uni.tiers.watch) || {}));
    const held = new Set(Object.keys(positions));
    const heldA = [...held].sort();
    const watchA = [...watch].sort();
    const uniA = Object.keys(sectors).filter((s) => !held.has(s) && !watch.has(s)).sort();
    console.log("=== TIERS START ===");
    console.log(`[H] HELD (CAM - hang minh, ${heldA.length}): ${heldA.join(" ")}`);
    console.log(`[W] WATCH (thu viec, ${watchA.length}): ${watchA.join(" ")}`);
    console.log(`[U] UNIVERSE (theo doi, chua mua, ${uniA.length}): ${uniA.join(" ")}`);
    console.log(`=== TIERS END === (tong universe ${Object.keys(sectors).length}; danh muc ${heldA.length})`);
    return;
  }

  // --news: doc TIN tu FireAnt (list /posts + noi dung day du tu /posts/{id}) — thay Google.
  if (flags.has("news")) {
    for (const s of targets) {
      console.log(`\n########## TIN ${s} ##########`);
      const items = await fetchNewsFull(s, 8, 900);
      if (!items.length) { console.log("  (khong co tin)"); continue; }
      for (const n of items) {
        console.log(`\n[${n.date}] ${n.title}${n.sentiment != null ? "  (sentiment " + n.sentiment + ")" : ""}`);
        if (n.text) console.log(`  ${n.text}`);
        if (n.link) console.log(`  link: ${n.link}`);
      }
    }
    return;
  }

  // --cfo: chuoi CFO (Luu chuyen tien HDKD) 8 quy gan nhat, GON 1 dong/ma (tiet kiem token doc log).
  if (flags.has("cfo")) {
    const uni = await loadUniverse().catch(() => ({}));
    console.log("=== CFO8 START ===  (don vi: ty dong)");
    for (const sym of targets) {
      const cfRaw = await fetchCashFlow(sym).catch(() => null);
      const cf = parseFull(cfRaw);
      const s = cf && cf.find("Lưu chuyển tiền thuần từ hoạt động kinh doanh", "hoạt động kinh doanh");
      const sec = uni[sym] || (positions[sym] && positions[sym].sector) || "?";
      if (!s) { console.log(`CFO8 ${JSON.stringify({ sym, fin: isFinSector(sec) ? 1 : 0, p: [], v: [] })}`); continue; }
      const n = s.periods.length, k = Math.max(0, n - 8);
      const p = s.periods.slice(k);
      const v = s.vals.slice(k).map((x) => (x == null ? null : Math.round(x / 1e9)));
      console.log(`CFO8 ${JSON.stringify({ sym, fin: isFinSector(sec) ? 1 : 0, p, v })}`);
    }
    console.log("=== CFO8 END ===");
    return;
  }

  // --divcal: LICH CO TUC/QUYEN sap toi cho toan bo targets (mac dinh universe ∪ holdings).
  // Quet /events/search moi ma, loc su kien co GDKHQ >= hom nay, sap tang dan theo ngay.
  // GDKHQ (recordDate) = ngay giao dich khong huong quyen -> phai MUA TRUOC ngay nay moi duoc quyen.
  if (flags.has("divcal")) {
    if (tickers.length === 0) {
      const uni = await loadUniverse().catch(() => ({}));
      targets = [...new Set([...Object.keys(uni), ...Object.keys(positions)])];
    }
    const today = fmtDate(new Date());
    // Nhan tier: H=held(so huu THAT, trong positions.json), W=watch(thu viec),
    // U=universe(theo doi, CHUA mua), *=ngoai universe. Derive live. Chi [H] = hang minh cam.
    let uniRaw = {};
    try { uniRaw = JSON.parse(await readFile(join(__dirname, "universe.json"), "utf8")); } catch { /* trong */ }
    const watchSet = new Set(Object.keys((uniRaw.tiers && uniRaw.tiers.watch) || {}));
    const heldSet = new Set(Object.keys(positions));
    const uniSet = new Set(Object.keys(uniRaw.sectors || {}));
    const tierTag = (s) => heldSet.has(s) ? "H" : watchSet.has(s) ? "W" : uniSet.has(s) ? "U" : "*";
    const pick = (o, keys) => { for (const k of keys) if (o && o[k]) return String(o[k]).slice(0, 10); return ""; };
    const rows = [];
    for (const sym of targets) {
      const evs = await fetchEvents(sym).catch(() => []);
      for (const e of (Array.isArray(evs) ? evs : [])) {
        const gdkhq = pick(e, ["recordDate", "exrightDate", "exRightDate", "gdkhqDate", "exDate"]);
        const dkcc = pick(e, ["registrationDate", "regDate", "recordDate2"]);
        const exec = pick(e, ["executionDate", "paymentDate", "payDate"]);
        const key = gdkhq || dkcc;
        if (!key || key < today) continue; // chi giu su kien SAP TOI
        const typ = EVENT_TYPE[e.type] || (e.type != null ? `type${e.type}` : "?");
        const title = String(e.title || e.eventTitle || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
        rows.push({ gdkhq, dkcc, exec, sym, typ, title });
      }
    }
    rows.sort((a, b) => String(a.gdkhq || a.dkcc).localeCompare(String(b.gdkhq || b.dkcc)));
    console.log("=== DIVCAL START === (GDKHQ = mua TRUOC ngay nay moi duoc quyen; [H]=CAM (hang minh) [W]=watch [U]=universe theo doi [*]=ngoai)");
    console.log("GDKHQ | DKCC | thuc.hien | tier | ma | loai | noi dung");
    for (const r of rows) {
      console.log(`${r.gdkhq || "?"} | ${r.dkcc || "?"} | ${r.exec || "?"} | [${tierTag(r.sym)}] | ${r.sym} | ${r.typ} | ${r.title}`);
    }
    console.log(`=== DIVCAL END === (${rows.length} su kien sap toi tren ${targets.length} ma)`);
    return;
  }

  // --series: xuat chuoi gia dong cua (JSON) de ve bieu do so sanh. Moi sym 1 dong JSON.
  if (flags.has("series")) {
    console.log("=== SERIES START ===");
    for (const sym of targets) {
      const hist = await fetchHistory(sym).catch(() => []);
      const pts = hist
        .map((r) => ({ d: (r.date || "").slice(0, 10), c: rowClose(r) }))
        .filter((p) => p.d && p.c != null);
      console.log(`SERIES ${JSON.stringify({ sym, dates: pts.map((p) => p.d), closes: pts.map((p) => Math.round(p.c)) })}`);
    }
    console.log("=== SERIES END ===");
    return;
  }

  // Screener --peers: quet universe 1 lan, dung chung cho moi ma
  let peersCtx = null;
  if (flags.has("peers")) {
    const universe = await loadUniverse();
    const allSyms = [...new Set([...Object.keys(universe), ...targets])];
    console.error(`  [peers] cham diem ${allSyms.length} ma universe (da yeu to)...`);
    const rows = (await pool(allSyms, 8, (t) => fetchFactors(t).catch(() => null))).filter(Boolean);
    for (const r of rows) r.sector = universe[r.sym] || "?"; // gan nganh TRUOC khi cham diem
    const scored = scoreUniverse(rows);
    peersCtx = { scored, universe };
  }

  // Ban do nganh (ticker -> nganh) de nhan dien nhom tai chinh khi gan co CFO.
  const secMap = peersCtx ? peersCtx.universe : await loadUniverse().catch(() => ({}));

  const results = [];
  for (const sym of targets) {
    const pos = positions[sym] || null;
    // resolveSector: universe truoc, roi fallback icbCode (bat duoc ma NGOAI universe nhu BVH).
    const sector = (pos && pos.sector) || await resolveSector(sym, secMap).catch(() => secMap[sym] || "?");
    try {
      const [fund, hist] = await Promise.all([
        fetchFundamental(sym).catch((e) => {
          console.error(`  [${sym}] fundamental loi: ${e.message}`);
          return null;
        }),
        fetchHistory(sym).catch((e) => {
          console.error(`  [${sym}] history loi: ${e.message}`);
          return [];
        }),
      ]);
      if (!hist || hist.length === 0) {
        console.error(`  [${sym}] khong co du lieu lich su -> bo qua.`);
        continue;
      }
      const a = analyze(sym, pos, fund, hist);
      // Bo sung co ban / dong tien DN / co tuc / tin tuc (bo qua neu --fast)
      if (!flags.has("fast")) {
        a.extra = await enrich(sym, fund, a.price.last).catch((e) => {
          console.error(`  [${sym}] enrich loi: ${e.message}`);
          return null;
        });
        a.rec = recommend(a, pos, a.extra, sector);
      }
      results.push(a);
      if (!flags.has("json")) printSnapshot(a, pos);
      if (peersCtx && !flags.has("json")) {
        const resolvedSector = await resolveSector(sym, peersCtx.universe);
        printPeers(sym, {
          scored: peersCtx.scored,
          target: peersCtx.scored.find((r) => r.sym === sym),
          universe: peersCtx.universe,
          resolvedSector,
        });
      }
    } catch (e) {
      console.error(`  [${sym}] LOI: ${e.message}`);
      if (/token|401|403/i.test(e.message)) process.exit(3); // token hong -> dung han
    }
  }

  if (flags.has("json")) {
    console.log(JSON.stringify(results, null, 2));
  }

  if (flags.has("save")) {
    const dir = join(__dirname, "data", "snapshots");
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const file = join(dir, `snapshot-${stamp}.json`);
    await writeFile(file, JSON.stringify({ asof: new Date().toISOString(), results }, null, 2));
    console.log(`\n💾 Da luu snapshot: ${file}`);
  }

  console.log(`\n✔ Xong ${results.length}/${targets.length} ma.`);
}

// Chi chay main khi goi truc tiep (khong chay khi import tu daily_brief.js)
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("LOI:", e.message);
    process.exit(1);
  });
}

export {
  loadPositions, loadUniverse, pool,
  fetchFundamental, fetchHistory, fetchFactors, enrich,
  analyze, recommend, scoreUniverse, kStr, pctStr, PEER_FACTORS, isFinSector,
  fetchEvents, EVENT_TYPE, fetchHolders, fetchHolderTransactions, fetchRooms,
  fetchNewsFull, fetchPostDetail, fetchNews,
};
