#!/usr/bin/env node
/**
 * daily_brief.js — BAN TIN DANH MUC HANG NGAY (chay tren GitHub Actions 20:00 VN)
 * ------------------------------------------------------------------------------
 * Dung lai module extract_ticker.js. Mot lan quet universe (co san diem + co ban),
 * roi voi tung vi the trong positions.json:
 *   - Tinh P&L, canh bao (CFO ttm am, No/VCSH cao, ngoai/tu doanh dao chieu, thung ho tro)
 *   - Tim CO HOI SWAP: ma cung nganh diem cao hon dang giu
 * Xuat:
 *   - daily-brief.md            (ban tin nguoi doc)
 *   - history/metrics.jsonl     (moi ngay 1 dong/ma -> feedback loop cai tien trong so)
 *
 * TIMESTAMP: truyen qua env RUN_DATE (workflow set); neu thieu dung ISO hien tai.
 */
import { writeFile, mkdir, appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  loadPositions, loadUniverse, pool, fetchFactors, scoreUniverse, kStr, isFinSector,
  fetchEvents, EVENT_TYPE, fetchNews,
} from "./extract_ticker.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUN_DATE = process.env.RUN_DATE || new Date().toISOString();
const DAY = RUN_DATE.slice(0, 10);
const MIN_LIQ = Number(process.env.MIN_LIQ_SHARES || 1e6); // loc ma de xuat >= 1tr cp

function pct(v, d = 1) {
  return v == null ? "n/a" : `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;
}

async function main() {
  const pf = await loadPositions();
  const positions = pf.positions || {};
  const holdings = Object.keys(positions);
  const universe = await loadUniverse();

  // 1 lan quet: universe ∪ holdings
  const allSyms = [...new Set([...Object.keys(universe), ...holdings])];
  console.error(`[daily] quet ${allSyms.length} ma...`);
  const rows = (await pool(allSyms, 8, (t) => fetchFactors(t).catch(() => null))).filter(Boolean);
  for (const r of rows) r.sector = universe[r.sym] || "?"; // gan nganh TRUOC khi cham diem
  const scored = scoreUniverse(rows);
  const byS = Object.fromEntries(scored.map((r) => [r.sym, r]));

  // Tong hop danh muc
  let cost = 0, mval = 0;
  const lines = [];
  const alerts = [];
  const swaps = [];
  const hist = [];

  for (const sym of holdings) {
    const p = positions[sym];
    const r = byS[sym];
    const price = r && r.price != null ? r.price : null;
    const c = (p.avg_cost || 0) * (p.shares || 0);
    const m = price != null ? price * (p.shares || 0) : c;
    cost += c; mval += m;
    const gain = price != null && p.avg_cost ? ((price - p.avg_cost) / p.avg_cost) * 100 : null;

    lines.push({
      sym, price, gain, shares: p.shares, avg: p.avg_cost, mval,
      roe: r?.roe, de: r?.de, cfo: r?.cfo, score: r?.score,
      frgn5: r?.frgnNet5, sector: universe[sym] || p.sector || "?",
    });

    // Canh bao
    const a = [];
    const secName = universe[sym] || p.sector || "?";
    // CFO am chi la co do voi ma PHI TAI CHINH. Bank/CK CFO am la cau truc (margin/FVTPL) -> bo qua.
    if (r?.cfo != null && r.cfo < 0 && !isFinSector(secName)) a.push(`CFO ttm AM (${kStr(r.cfo)}d)`);
    // No/VCSH vo nghia voi nhom tai chinh (du phong ky thuat/repo, khong phai no vay) -> bo qua.
    if (r?.de != null && r.de > 2 && !isFinSector(secName)) a.push(`No/VCSH cao ${r.de.toFixed(1)}x`);
    if (r?.frgnNet5 != null && r.frgnNet5 < 0 && r?.frgnNet20 != null && r.frgnNet20 > 0)
      a.push(`ngoai dao chieu ban rong 5p (${kStr(r.frgnNet5)}d)`);
    if (p.levels?.ho_tro && price != null) {
      const sup = Array.isArray(p.levels.ho_tro) ? p.levels.ho_tro[0] : p.levels.ho_tro;
      if (sup && price < sup) a.push(`thung ho tro ${kStr(sup)}`);
    }
    if (a.length) alerts.push({ sym, msgs: a });

    // Co hoi swap: cung nganh diem cao hon
    const sector = universe[sym];
    if (sector && r) {
      const better = scored
        .filter((x) => x.sector === sector && x.sym !== sym && x.score > r.score &&
          !holdings.includes(x.sym) && x.avgVol != null && x.avgVol >= MIN_LIQ)
        .sort((x, y) => y.score - x.score)
        .slice(0, 2);
      if (better.length)
        swaps.push({ sym, sector, myScore: r.score, cands: better });
    }

    // History line (feedback loop)
    hist.push(JSON.stringify({
      date: DAY, sym, price, gain: gain != null ? +gain.toFixed(2) : null,
      score: r?.score != null ? +r.score.toFixed(3) : null,
      roe: r?.roe, de: r?.de, cfoTtm: r?.cfo, frgnNet20: r?.frgnNet20,
    }));
  }

  const totalPnl = cost ? ((mval - cost) / cost) * 100 : null;
  lines.sort((a, b) => (b.gain ?? -999) - (a.gain ?? -999));

  // ---- Lich chot quyen SAP TOI (holdings, GDKHQ trong 60 ngay toi) ----
  const EV_WINDOW = 60;
  const evLists = await pool(holdings, 6, (t) => fetchEvents(t).catch(() => []));
  const upcoming = [];
  holdings.forEach((sym, i) => {
    for (const e of evLists[i] || []) {
      const rd = (e.recordDate || "").slice(0, 10);
      if (!rd || rd < DAY) continue; // da qua
      const days = Math.round((new Date(rd) - new Date(DAY)) / 86400000);
      if (days > EV_WINDOW) continue;
      upcoming.push({ sym, rd, days, exec: (e.executionDate || "").slice(0, 10), title: e.title || "", type: e.type });
    }
  });
  upcoming.sort((a, b) => (a.rd < b.rd ? -1 : a.rd > b.rd ? 1 : 0));

  // ---- Quet cong bo "BCTC SOAT XET BAN NIEN" (moi mua bao cao soat xet ra ~cuoi 8) ----
  // Chi quet TIEU DE tin (re) — flag khi holding cong bo BCTC soat xet ban nien.
  const newsLists = await pool(holdings, 6, (t) => fetchNews(t, 12).catch(() => []));
  const semiAudit = [];
  holdings.forEach((sym, i) => {
    for (const p of newsLists[i] || []) {
      const t = String(p.title || "");
      if (/so[aá]t x[eé]t/i.test(t) && /(b[aá]n ni[eê]n|6 th[aá]ng|n[uử]a đ[aâ]̀u)/i.test(t))
        semiAudit.push({ sym, title: t.slice(0, 90), date: (p.date || "").slice(0, 10) });
    }
  });

  // ---- Ghi history ----
  await mkdir(join(__dirname, "history"), { recursive: true });
  await appendFile(join(__dirname, "history", "metrics.jsonl"), hist.join("\n") + "\n");

  // ---- Ghi brief.md ----
  const md = [];
  md.push(`# Ban tin danh muc — ${DAY}`);
  md.push(``);
  md.push(`**Tong von** ${kStr(cost)}d · **Gia tri TT** ${kStr(mval)}d · **P&L ${pct(totalPnl)}**  ·  ${holdings.length} vi the`);
  md.push(``);
  md.push(`## Bien dong (P&L)`);
  md.push(`| Ma | Gia | P&L | ROE | No/VCSH | Diem | Ngoai 5p |`);
  md.push(`|---|--:|--:|--:|--:|--:|--:|`);
  for (const l of lines) {
    md.push(
      `| ${l.sym} | ${l.price != null ? kStr(l.price) : "n/a"} | ${pct(l.gain)} | ` +
        `${l.roe != null ? l.roe.toFixed(0) + "%" : "-"} | ${l.de != null ? l.de.toFixed(1) + "x" : "-"} | ` +
        `${l.score != null ? l.score.toFixed(2) : "-"} | ${l.frgn5 != null ? kStr(l.frgn5) + "d" : "-"} |`
    );
  }
  md.push(``);
  md.push(`## ⚠️ Canh bao`);
  if (alerts.length) for (const al of alerts) md.push(`- **${al.sym}**: ${al.msgs.join(" · ")}`);
  else md.push(`- (khong co canh bao)`);
  md.push(``);
  md.push(`## 📅 Sap chot quyen (GDKHQ trong ${EV_WINDOW} ngay toi)`);
  if (upcoming.length) {
    md.push(`| Ma | GDKHQ | Con | Su kien | Thuc hien |`);
    md.push(`|---|---|--:|---|---|`);
    for (const e of upcoming)
      md.push(`| ${e.sym} | ${e.rd} | ${e.days}n | ${e.title} | ${e.exec || "-"} |`);
    md.push(``);
    md.push(`> Tren ngay GDKHQ gia bi dieu chinh giam ky thuat (KHONG phai mat gia). Nguon: FireAnt /events/search.`);
  } else md.push(`- (khong co ma dang giu chot quyen trong ${EV_WINDOW} ngay toi)`);
  md.push(``);
  md.push(`## 📋 BCTC soat xet ban nien moi cong bo`);
  if (semiAudit.length) {
    for (const s of semiAudit) md.push(`- **${s.sym}** (${s.date}): ${s.title} → SO lai soat xet vs tu lap (canh 'lai giay').`);
  } else md.push(`- (chua ma nao cong bo BCTC soat xet ban nien) — han ~cuoi 8; soi ky NVL/KDH (lai Q2 nho DT tai chinh/thoai von).`);
  md.push(``);
  md.push(`## 🔄 Co hoi swap (cung nganh diem cao hon)`);
  if (swaps.length) {
    for (const s of swaps) {
      const cs = s.cands
        .map((c) => `${c.sym} (diem ${c.score.toFixed(2)}, ROE ${c.roe != null ? c.roe.toFixed(0) + "%" : "-"}, PE ${c.pe != null ? c.pe.toFixed(1) : "-"})`)
        .join(" · ");
      md.push(`- **${s.sym}** (${s.sector}, diem ${s.myScore.toFixed(2)}) → cân nhắc: ${cs}`);
    }
  } else md.push(`- (khong co ma cung nganh diem cao hon dang giu ngoai danh muc)`);
  md.push(``);
  md.push(`---`);
  md.push(`*Tu dong tao boi extract_ticker.js @ ${RUN_DATE}. "Diem"/"tot hon" la proxy chat luong+dinh gia, KHONG xet chu ky/cau chuyen rieng — soi tung ma truoc khi hanh dong. Khong phai khuyen nghi dau tu.*`);

  await writeFile(join(__dirname, "daily-brief.md"), md.join("\n") + "\n");
  console.error(`[daily] xong: daily-brief.md + history (${hist.length} dong).`);
  console.log(md.join("\n"));
}

main().catch((e) => {
  console.error("LOI daily_brief:", e.message);
  process.exit(1);
});
