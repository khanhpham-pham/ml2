#!/usr/bin/env node
/**
 * cafef.js — RAY TIN CAFEF (bo tro FireAnt)
 * ------------------------------------------------------------------
 * Vi sao can: FireAnt cho FILING chinh thong theo MA (nghi quyet HDQT, GD noi bo,
 * BCTC) — do la nguon GOC. CafeF cho TIN BAO CHI real-time theo NGANH, thuong
 * nhanh hon FireAnt vai tieng. Ghep hai nguon thi cai ray chat hon.
 *
 * KHONG CAN API KEY. CafeF chan theo User-Agent, khong chan IP —
 * chi can gui UA trinh duyet la doc duoc ca RSS lan full bai.
 *
 * Dung:
 *   node cafef.js                 # ray: chi in tin TRUNG ma DM/watchlist + truc theo doi
 *   node cafef.js --all           # in tat ca tin (khong loc)
 *   node cafef.js --full          # tin trung MA CAM -> tai full bai + trich noi dung
 *   node cafef.js --hours 12      # chi tin trong N gio gan nhat (mac dinh 24)
 *   node cafef.js --json          # xuat JSON
 *
 * KET QUA THAM DO ENDPOINT DU LIEU (27/8/2026) — ghi lai de khoi lam lai:
 *   - apiweb.cafef.vn/cafefdata/api/v1/*   -> DOI "Header X-Api-Key la bat buoc".
 *     Day chinh la "key cua cafef" — KHONG phat hanh cong khai. Khong can thiet:
 *     du lieu co ban (ROE/PE/PB/ngoai/CFO/4 quy) FireAnt da cover day du hon.
 *   - s.cafef.vn/Ajax/PageNew/DataHistory/GDKhoiNgoai.ashx -> MO, tra JSON that,
 *     nhung BO QUA tham so Symbol: luon tra TOAN THI TRUONG (20 dong/trang, ~26.600 dong).
 *   - s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx -> tra "symbol is null or empty"
 *     voi moi bien the tham so da thu (Symbol/symbol/code/MaCK/centerId). Da doi, chua ro param.
 *   => Ket luan: CafeF dung cho TIN (RSS, mo hoan toan). Du lieu so van dung FireAnt.
 */

import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FEEDS = [
  ["thi-truong-chung-khoan", "CK"],
  ["doanh-nghiep",           "DN"],
  ["tai-chinh-ngan-hang",    "BANK"],
  ["bat-dong-san",           "BDS"],
  ["vi-mo-dau-tu",           "MACRO"],
];

/* Ten cong ty -> ma. Bao thuong goi TEN chu khong goi MA, nen map nay bat
   duoc nhieu tin hon la chi match ma viet hoa. */
const ALIAS = {
  SSI:["chứng khoán ssi","ssi securities"], VCI:["vietcap","bản việt"],
  VIX:["chứng khoán vix"], MBB:["mbbank","ngân hàng quân đội","mb bank"],
  VCB:["vietcombank"], ACB:["ngân hàng á châu"], HDB:["hdbank"],
  CTG:["vietinbank"], BID:["bidv"], TCB:["techcombank"], VPB:["vpbank"],
  HPG:["hòa phát","hoà phát"], HSG:["hoa sen"], NKG:["nam kim"],
  MWG:["thế giới di động","thegioididong"], MSN:["masan"], VNM:["vinamilk"],
  FPT:["fpt"], REE:["cơ điện lạnh"], KBC:["kinh bắc"], IDC:["idico"],
  ANV:["thủy sản nam việt","navico","nam việt (anv)"], VHC:["vĩnh hoàn"], FMC:["sao ta"],
  NVL:["novaland"], VHM:["vinhomes"], VIC:["vingroup"], VRE:["vincom retail"],
  KDH:["khang điền"], NLG:["nam long"], DXG:["đất xanh"], PDR:["phát đạt"],
  CII:["hạ tầng kỹ thuật"], PNJ:["phú nhuận","pnj"],
  DGC:["đức giang"], PVT:["pvtrans","vận tải dầu khí"], PVD:["pv drilling"],
  PVS:["dịch vụ kỹ thuật dầu khí"], BSR:["lọc hoá dầu bình sơn","bình sơn"],
  GAS:["pv gas"], POW:["pv power"], HAH:["hải an"], GMD:["gemadept"],
  DCM:["đạm cà mau"], DPM:["đạm phú mỹ"], VCG:["vinaconex"], VGC:["viglacera"],
  GEX:["gelex"], SCS:["dịch vụ hàng hoá sài gòn"], ACV:["cảng hàng không"],
};

/* Truc theo doi: tin khong trung ma nhung trung truc -> vao CHAIN LOG. */
const TRUC = {
  "NANG HANG/FTSE": ["ftse","nâng hạng","msci","mới nổi","emerging","dòng vốn ngoại","etf"],
  "MARGIN/THANH KHOAN": ["margin","dư nợ","thanh khoản thị trường","cho vay ký quỹ"],
  "TRAI PHIEU": ["trái phiếu","đáo hạn","tất toán"],
  "LAI SUAT/TY GIA": ["lãi suất","tỷ giá","ngân hàng nhà nước","sbv","tín dụng"],
  "THUE/XUAT KHAU": ["thuế","chống bán phá giá","xuất khẩu","áp thuế","hải quan"],
  "DAU TU CONG": ["đầu tư công","cao tốc","sân bay","giải ngân vốn"],
};

/* Tin rac that: PR rong, quang cao, clickbait. */
const RAC = ["tử vi","xổ số","bóng đá","sao việt","showbiz","giảm cân","mẹo vặt",
             "khuyến mãi","ưu đãi","tri ân khách hàng","ra mắt sản phẩm mới"];

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i+1] ? args[i+1] : d; };
const HOURS = Number(val("--hours", 24));

/* CafeF chan theo TLS FINGERPRINT cua Node/undici (fetch tra 403 voi MOI bo header,
   trong khi curl cung UA tra 200) -> phai goi qua curl. curl co san tren
   ubuntu-latest cua GitHub Actions, khong can cai them. */
async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const { stdout } = await run("curl", [
        "-sSL", "--compressed", "-m", "25",
        "-A", UA,
        "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "-H", "Accept-Language: vi-VN,vi;q=0.9,en;q=0.8",
        "-H", "Referer: https://cafef.vn/",
        url,
      ], { maxBuffer: 32 * 1024 * 1024 });
      if (!stdout || stdout.length < 200) throw new Error(`rong (${stdout.length}b)`);
      return stdout;
    } catch (e) {
      if (i === tries) { console.error(`  ! ${url} -> ${e.message}`); return ""; }
      await new Promise(s => setTimeout(s, 800 * i));
    }
  }
  return "";
}

const clean = (s) => (s || "")
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();

function parseRss(xml, kenh) {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const g = (t) => { const r = it.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)); return r ? clean(r[1]) : ""; };
    const title = g("title"); if (!title) continue;
    const pub = g("pubDate");
    out.push({ kenh, title, link: g("link"), desc: g("description"), pub, ts: Date.parse(pub) || 0 });
  }
  return out;
}

/* Nhan dien ma: uu tien ALIAS (ten cong ty), sau do ma VIET HOA dung rieng.
   CEO/PAN/... de trung tu thuong -> chi nhan khi co ALIAS hoac di kem "cổ phiếu". */
const MO_HO = new Set(["CEO","PAN","GAS","APG","HAH","TIP","ELC","VN","US","EU","HCM","SAM","TMS","HAX","BAF","VN30"]);
function detect(text, codes) {
  const hit = new Set();
  const low = text.toLowerCase();
  for (const c of codes) {
    const al = ALIAS[c];
    if (al && al.some(a => low.includes(a))) { hit.add(c); continue; }
    if (new RegExp(`(^|[^A-Z0-9])${c}([^A-Z0-9]|$)`).test(text)) {
      if (MO_HO.has(c) && !/cổ phiếu|mã |doanh nghiệp|công ty/i.test(text)) continue;
      hit.add(c);
    }
  }
  return [...hit];
}

function trucOf(text) {
  const low = text.toLowerCase(), hit = [];
  for (const [ten, kws] of Object.entries(TRUC)) if (kws.some(k => low.includes(k))) hit.push(ten);
  return hit;
}

async function fullText(url) {
  const h = await get(url);
  if (!h) return "";
  let raw = h.replace(/<(script|style)[\s\S]*?<\/\1>/g, "");
  const m = raw.match(/id="mainContent"([\s\S]*?)(?:<div[^>]*class="[^"]*(?:relate|tag|share|comment))/i)
         || raw.match(/class="detail-content[^"]*"([\s\S]*?)(?:<div[^>]*class="[^"]*(?:relate|tag|share))/i);
  const body = m ? m[1] : raw;
  const seen = new Set();
  return clean(body.replace(/<\/(p|div|h\d)>/gi, "\n")).split("\n")
    .map(s => s.trim()).filter(s => s.length > 60 && !seen.has(s) && seen.add(s))
    .slice(0, 12).join("\n");
}

(async () => {
  const pos = JSON.parse(await readFile("positions.json", "utf8"));
  const CAM = Object.keys(pos.positions);
  let WATCH = [];
  try {
    const uni = JSON.parse(await readFile("universe.json", "utf8"));
    WATCH = Object.keys(uni.sectors || {}).filter(c => !CAM.includes(c));
  } catch {}
  const CODES = [...new Set([...CAM, ...WATCH, ...Object.keys(ALIAS)])];

  console.log(`=== RAY TIN CAFEF === ${new Date().toISOString()}`);
  console.log(`Dang cam (${CAM.length}): ${CAM.join(" ")}`);
  console.log(`Cua so: ${HOURS}h | nguon: ${FEEDS.length} kenh RSS (khong can API key)\n`);

  let all = [];
  for (const [slug, ten] of FEEDS) {
    const xml = await get(`https://cafef.vn/${slug}.rss`);
    const items = parseRss(xml, ten);
    console.log(`  ${ten.padEnd(6)} ${String(items.length).padStart(3)} tin`);
    all.push(...items);
  }

  const cut = Date.now() - HOURS * 3600 * 1000;
  const seen = new Set();
  all = all.filter(x => !seen.has(x.link) && seen.add(x.link))
           .filter(x => !x.ts || x.ts >= cut)
           .filter(x => !RAC.some(r => x.title.toLowerCase().includes(r)))
           .sort((a, b) => b.ts - a.ts);

  for (const x of all) {
    const t = `${x.title}\n¦\n${x.desc}`;   // dai phan cach: tranh ghep chu tao cum gia ("...Việt Nam" + "Việt Nam..." -> "Nam Việt")
    x.ma = detect(t, CODES);
    x.cam = x.ma.filter(c => CAM.includes(c));
    x.truc = trucOf(t);
  }

  const hangCam = all.filter(x => x.cam.length);
  const hangWatch = all.filter(x => !x.cam.length && x.ma.length);
  const chain = all.filter(x => !x.ma.length && x.truc.length);

  if (has("--json")) { console.log(JSON.stringify({ hangCam, hangWatch, chain }, null, 1)); return; }

  const gio = (x) => x.pub.replace(/^\w+, /, "").slice(0, 18);

  console.log(`\n########## 1. TIN DUNG HANG DANG CAM (${hangCam.length}) ##########`);
  for (const x of hangCam) {
    console.log(`\n[${gio(x)}] [${x.cam.join(",")}] ${x.title}`);
    if (x.truc.length) console.log(`   truc: ${x.truc.join(" · ")}`);
    console.log(`   ${x.link}`);
    if (x.desc && x.desc !== x.title) console.log(`   ${x.desc.slice(0, 240)}`);
    if (has("--full")) {
      const body = await fullText(x.link);
      if (body) console.log(body.split("\n").map(l => "   | " + l.slice(0, 300)).join("\n"));
    }
  }

  console.log(`\n########## 2. TIN MA WATCHLIST/UNIVERSE (${hangWatch.length}) ##########`);
  for (const x of hangWatch.slice(0, 40))
    console.log(`[${gio(x)}] [${x.ma.slice(0, 4).join(",")}] ${x.title}`);

  console.log(`\n########## 3. CHAIN LOG - theo TRUC (${chain.length}) ##########`);
  const byTruc = {};
  for (const x of chain) for (const t of x.truc) (byTruc[t] ||= []).push(x);
  for (const [t, xs] of Object.entries(byTruc)) {
    console.log(`\n--- ${t} (${xs.length}) ---`);
    for (const x of xs.slice(0, 8)) console.log(`  [${gio(x)}] ${x.title}`);
  }

  const bo = all.length - hangCam.length - hangWatch.length - chain.length;
  console.log(`\n=== TONG: ${all.length} tin/${HOURS}h -> ${hangCam.length} dung hang cam · ${hangWatch.length} watchlist · ${chain.length} chain · ${bo} khong lien quan ===`);
})();
