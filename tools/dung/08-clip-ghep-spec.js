/* ═════════ CLIP GHÉP (compound clip) theo spec 9.1: một TIMELINE CON (track chính + phủ + chữ + âm thanh) bọc thành một "nguồn ảo".
   Mục ngoài trỏ tới nó như trỏ một video: đoạn trên track chính (P.clips) hoặc video phủ (P.broll), có vào/ra (bd/kt = giây trong timeline con), tốc độ, đủ thuộc tính video
   (biến đổi, độ mờ, bộ lọc, mặt nạ, hoạt ảnh, keyframe) áp lên KẾT QUẢ vẽ của timeline con. Ctrl+G tạo · Ctrl+Shift+G tách · nháy đúp để vào sửa, thanh "Dự án › Clip ghép" để ra. ═════════ */
function laGhep(m) { return !!(m && m.kieu === 'ghep' && m.con); }
function conGhep(m) { const c = m.con || (m.con = {}); ['clips', 'gfx', 'broll', 'am3'].forEach(k => { if (!Array.isArray(c[k])) c[k] = []; }); return c; }
function daiCon(con) { const v1 = con.clips.reduce((a, c) => a + daiC(c), 0); return Math.max(0.1, v1, ...con.gfx.map(g => g.kt), ...con.broll.map(b => b.t_bd + (b.kt - b.bd) / tocC(b)), ...con.am3.map(a => a.t_bd + (a.kt - a.bd) / (a.toc || 1))); }
const GHEP_NGUON = new Map();
/* nguồn ảo của clip ghép: srcCua('ghep:<id mục>') trả về như một footage có độ dài = timeline con, ảnh = canvas vẽ timeline con */
function timMucGhep(id) { const tim = (cl, br) => cl.find(c => c.id === id) || br.find(b => b.id === id); let m = tim(P.clips, P.broll); if (!m) for (const f of (P.ghepNgan || [])) { m = tim(f.ngoai.clips, f.ngoai.broll); if (m) break; } return m || null; }
function nguonGhep(id) {
  const m = timMucGhep(id.slice(5)); if (!m || !laGhep(m)) return null; let s = GHEP_NGUON.get(id);
  if (!s) { s = { id, loai: 'ghep', el: document.createElement('canvas'), tu: [], cau: [], canh: [], mat: [], khoanh_khac: [], song: null, tt: 'xong' }; GHEP_NGUON.set(id, s); }
  s.ten = m.ten || 'Clip ghép'; s.giay = conGhep(m).dai || daiCon(m.con); s.w = s.el.width || cv.width; s.h = s.el.height || cv.height; s.m = m; return s;
}
/* vẽ timeline con tại giây cục bộ vào canvas của nguồn ảo (trong suốt ở chỗ trống) */
let ghepSau = 0;
function veConGhep(m, local, W, H) {
  const s = nguonGhep('ghep:' + m.id); if (!s) return null; const cvx = s.el; if (cvx.width !== W || cvx.height !== H) { cvx.width = W; cvx.height = H; } s.w = W; s.h = H;
  const g = cvx.getContext('2d'); g.clearRect(0, 0, W, H); if (ghepSau > 6) return s;
  const con = conGhep(m), cu = { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: P.am3 }; ghepSau++;
  try { P.clips = con.clips; P.gfx = con.gfx; P.broll = con.broll; P.am3 = con.am3; const { clip } = viTri(local), tong = con.clips.reduce((a, c) => a + daiC(c), 0); if (clip >= 0 && local < tong && !con.clips[clip].trong) { const ch = chuyenTai(local); if (ch) veChuyenConGhep(g, W, H, local, ch); else veNen(g, W, H, local, 'ghep'); } veCacLop(g, W, H, local); }
  catch (e) { console.warn('veConGhep', e); } finally { Object.assign(P, cu); ghepSau--; }
  return s;
}
const localGhep = (m, off) => m.bd + off * tocC(m);
/* chuyển cảnh giữa các đoạn bên trong timeline con (cùng cách tính spec 5.1: cửa sổ giữa điểm nối, đoạn bên kia lấy khung trước điểm vào / sau điểm ra) */
const GHEP_TAM = [];
function canvasTam(i, W, H) { const c = GHEP_TAM[i] || (GHEP_TAM[i] = document.createElement('canvas')); if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } const g = c.getContext('2d'); g.clearRect(0, 0, W, H); return [c, g]; }
function tSrcBenKia(ch, local) { const k = ch.nua === 1 ? ch.sau : ch.truoc, c = P.clips[k], s = c && srcCua(c.src); if (!s) return null; const lech = (local - ch.noi) * tocC(c), het = (s.giay || c.kt) - 0.04; return { c, s, k, t: ch.nua === 1 ? Math.max(0, Math.min(het, c.bd + lech)) : Math.max(0, Math.min(het, c.kt + lech - 0.001)) }; }
function veChuyenConGhep(g, W, H, local, ch) {
  const [A, gA] = canvasTam(ghepSau * 2, W, H), [B, gB] = canvasTam(ghepSau * 2 + 1, W, H); veNen(gA, W, H, local, 'ghep');
  const bk = tSrcBenKia(ch, local); if (bk && !bk.c.trong) { let im = null; if (laGhep(bk.c)) { const s2 = veConGhep(bk.c, bk.t, W, H); im = s2 && s2.el; } else im = bk.s.loai === 'video' ? elPhu(bk.s, 'elGs') : bk.s.el; if (im) { try { veNguon(gB, W, H, bk.s, im, bk.t, 1); } catch { } } }
  const tu = ch.nua === 1 ? A : B, den = ch.nua === 1 ? B : A, gl = typeof gltVe === 'function' ? gltVe(ch.kieu, tu, den, ch.p, W, H) : null;
  if (gl) g.drawImage(gl, 0, 0); else { g.drawImage(tu, 0, 0); g.globalAlpha = ch.p; g.drawImage(den, 0, 0); g.globalAlpha = 1; }
}
/* âm thanh bên trong clip ghép: trải thành các mục A3 ảo (đoạn video con + âm con), cắt theo vào/ra, nhân tốc độ → phát xem trước và xuất đều nghe được */
function amAo() {
  const out = [];
  const trai = (m, O, gan) => { const con = conGhep(m), tX = tocC(m) * (gan.toc || 1), w0 = m.bd, w1 = m.kt, amX = (m.am == null ? 1 : m.am) * (gan.am == null ? 1 : gan.am); if (m.an) return;
    const phan = (L0, L1, mk) => { const a = Math.max(L0, w0), b = Math.min(L1, w1); if (b - a < 0.01) return; mk(a, b, O + (a - w0) / tX); };
    let acc = 0; con.clips.forEach(c => { const d = daiC(c), s = srcCua(c.src); if (laGhep(c)) phan(acc, acc + d, (a, b, T) => trai({ ...c, bd: c.bd + (a - acc) * tocC(c), kt: c.bd + (b - acc) * tocC(c) }, T, { toc: tX, am: amX })); else if (s && s.loai === 'video' && !c.an) phan(acc, acc + d, (a, b, T) => out.push({ id: 'ao', kho: 'src:' + s.id, t_bd: T, bd: c.bd + (a - acc) * tocC(c), kt: c.bd + (b - acc) * tocC(c), toc: tX * tocC(c), am: (c.am == null ? 1 : c.am) * amX, fi: 0, fo: 0, ao: true })); acc += d; });
    con.am3.forEach(x => { const d = (x.kt - x.bd) / (x.toc || 1); phan(x.t_bd, x.t_bd + d, (a, b, T) => out.push({ ...x, id: 'ao', t_bd: T, bd: x.bd + (a - x.t_bd) * (x.toc || 1), kt: x.bd + (b - x.t_bd) * (x.toc || 1), toc: tX * (x.toc || 1), am: (x.am == null ? 1 : x.am) * amX, fi: a > x.t_bd ? 0 : x.fi, fo: b < x.t_bd + d ? 0 : x.fo, ao: true })); });
    con.broll.forEach(b => { if (laGhep(b)) { const d = (b.kt - b.bd) / tocC(b); phan(b.t_bd, b.t_bd + d, (a, c2, T) => trai({ ...b, bd: b.bd + (a - b.t_bd) * tocC(b), kt: b.bd + (c2 - b.t_bd) * tocC(b) }, T, { toc: tX, am: amX })); } }); };
  let acc = 0; P.clips.forEach(c => { if (laGhep(c) && !trTat('v1')) trai(c, acc, {}); acc += daiC(c); });
  P.broll.forEach(b => { if (laGhep(b)) trai(b, b.t_bd, {}); });
  return out;
}
const amTatCa = () => [...(P.am3 || []), ...amAo()];
/* trải track chính: đoạn clip ghép → các đoạn video con thật (để phụ đề theo lời vẫn hiện) */
function traiV1(ds) { const out = []; ds.forEach(c => { if (!laGhep(c)) { out.push(c); return; } const con = conGhep(c), t = tocC(c); let acc = 0, phu = 0; const con2 = traiV1(con.clips); con2.forEach(x => { const d = daiC(x), a = Math.max(acc, c.bd), b = Math.min(acc + d, c.kt); if (b - a > 0.005) { if (x.trong) out.push({ trong: true, src: '', bd: 0, kt: +((b - a) / t).toFixed(4) }); else { const k = tocC(x); out.push({ ...x, bd: x.bd + (a - acc) * k, kt: x.bd + (b - acc) * k, toc: k * t, cong: undefined, kfs: undefined }); } phu += (b - a) / t; } acc += d; }); const du = daiC(c) - phu; if (du > 0.005) out.push({ trong: true, src: '', bd: 0, kt: +du.toFixed(4) }); }); return out; }
/* video bên trong clip ghép: tua đúng khung khi đứng / khi xuất; khi phát thì chạy song song (tắt tiếng — tiếng đi qua A3 ảo) */
function mucTuaGhep(t) {
  const out = [];
  const vao = (m, local, sau) => { if (sau > 6) return; const con = conGhep(m), cu = { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: P.am3 };
    try { P.clips = con.clips; P.gfx = con.gfx; P.broll = con.broll; P.am3 = con.am3; const { clip, tSrc, bdTl } = viTri(local), tong = con.clips.reduce((a, c) => a + daiC(c), 0);
      if (clip >= 0 && local < tong) { const c = con.clips[clip], s = srcCua(c.src); if (laGhep(c)) vao(c, localGhep(c, local - bdTl), sau + 1); else if (s && s.loai === 'video') out.push({ el: elPhu(s, 'elG'), t: tSrc, toc: tocC(c) * tocC(m) }); const ch = chuyenTai(local), bk = ch && tSrcBenKia(ch, local); if (bk && !bk.c.trong) { if (laGhep(bk.c)) vao(bk.c, bk.t, sau + 1); else if (bk.s.loai === 'video') out.push({ el: elPhu(bk.s, 'elGs'), t: bk.t, toc: tocC(bk.c) * tocC(m) }); } }
      con.broll.forEach(b => { const d = (b.kt - b.bd) / tocC(b); if (local < b.t_bd || local >= b.t_bd + d) return; if (laGhep(b)) vao(b, localGhep(b, local - b.t_bd), sau + 1); else { const sb = srcCua(b.src); if (sb && sb.loai === 'video') out.push({ el: elPhu(sb, 'elB'), t: b.bd + (local - b.t_bd) * tocC(b), toc: tocC(b) * tocC(m) }); } });
    } finally { Object.assign(P, cu); } };
  const { clip, bdTl } = viTri(t); if (clip >= 0 && laGhep(P.clips[clip])) vao(P.clips[clip], localGhep(P.clips[clip], t - bdTl), 0);
  P.broll.forEach(b => { const d = (b.kt - b.bd) / tocC(b); if (laGhep(b) && t >= b.t_bd && t < b.t_bd + d) vao(b, localGhep(b, t - b.t_bd), 0); });
  return out;
}
const doiSanSang = v => v.readyState >= 2 ? Promise.resolve() : new Promise(ok => { const h = () => { v.removeEventListener('loadeddata', h); ok(); }; v.addEventListener('loadeddata', h); setTimeout(h, 3000); });   // phần tử video phụ mới tạo: chờ nạp xong rồi mới tua
async function ghepTuaVideo(t) { for (const x of mucTuaGhep(t == null ? P.t : t)) { try { await doiSanSang(x.el); await seekTo(x.el, x.t); if (Math.abs(x.el.currentTime - x.t) > 0.04) await seekTo(x.el, x.t); } catch { } } }
let ghepDangChay = new Set();
function ghepPhatVideo() { const nay = new Set(); mucTuaGhep(P.t).forEach(x => { nay.add(x.el); try { x.el.muted = true; const r = Math.max(0.0625, Math.min(16, x.toc || 1)); if (Math.abs(x.el.playbackRate - r) > 0.01) x.el.playbackRate = r; if (x.el.paused || Math.abs(x.el.currentTime - x.t) > 0.35) { x.el.currentTime = x.t; x.el.play().catch(() => { }); } } catch { } }); ghepDangChay.forEach(el => { if (!nay.has(el)) { try { el.pause(); } catch { } } }); ghepDangChay = nay; }
/* ── tạo / tách ── */
function demGhep() { let n = 0; const dem = arr => arr.forEach(m => { if (laGhep(m)) { n++; const c = conGhep(m); dem(c.clips); dem(c.broll); } }); dem(P.clips); dem(P.broll); (P.ghepNgan || []).forEach(f => { dem(f.ngoai.clips); dem(f.ngoai.broll); }); return n; }
function taoClipGhep() {
  let ds = dsNhieu().filter(o => 'vbga'.includes(o.k) && o.m && !o.m.trong);
  if (!ds.length && P.chon && 'vbga'.includes(P.chon.k) && mucChon() && !mucChon().trong) ds = [{ k: P.chon.k, m: mucChon() }];
  if (!ds.length) { toast('Chọn mục (đoạn video, video phủ, chữ, sticker, âm thanh…) rồi nhấn Ctrl+G'); return null; }
  if (ds.length === 1 && laGhep(ds[0].m)) { toast('Mục này đã là clip ghép — nháy đúp để sửa bên trong'); return null; }
  const bdM = o => o.k === 'v' ? batDauC(o.m) : batDauMuc(o.k, o.m), ktM = o => bdM(o) + (o.k === 'v' ? daiC(o.m) : daiMuc(o.k, o.m));
  luuHoanTac();
  // track chính: lấy dải liền từ đoạn đầu tới đoạn cuối được chọn
  const iv = ds.filter(o => o.k === 'v').map(o => P.clips.indexOf(o.m)).filter(i => i >= 0), i0 = iv.length ? Math.min(...iv) : -1, i1 = iv.length ? Math.max(...iv) : -1;
  const v1 = i0 >= 0 ? P.clips.slice(i0, i1 + 1) : [], ngoaiV = ds.filter(o => o.k !== 'v');
  const v1Bd = i0 >= 0 ? batDauC(P.clips[i0]) : 0, v1Kt = i0 >= 0 ? batDauC(P.clips[i1]) + daiC(P.clips[i1]) : 0;
  const S = Math.min(...(i0 >= 0 ? [v1Bd] : []), ...ngoaiV.map(bdM)), E = Math.max(...(i0 >= 0 ? [v1Kt] : []), ...ngoaiV.map(ktM));
  const sao = x => JSON.parse(JSON.stringify(x)), con = { clips: [], gfx: [], broll: [], am3: [] };
  if (v1.length) { if (v1Bd - S > 0.001) con.clips.push({ trong: true, src: '', bd: 0, kt: +(v1Bd - S).toFixed(3) }); v1.forEach(c => { const x = sao(c); delete x.chuyenSau; con.clips.push(x); }); const cuoi = con.clips[con.clips.length - 1]; if (cuoi) { delete cuoi.chuyen; delete cuoi.chuyen_dai; } }
  ngoaiV.forEach(o => { const x = sao(o.m); delete x.nhom; if (o.k === 'g') { x.bd = +(x.bd - S).toFixed(3); x.kt = +(x.kt - S).toFixed(3); con.gfx.push(x); } else { x.t_bd = +(x.t_bd - S).toFixed(3); (o.k === 'b' ? con.broll : con.am3).push(x); } });
  con.dai = +Math.max(0.1, E - S, daiCon(con)).toFixed(3); con.id = 'tl' + uid();
  P.gfx = P.gfx.filter(g => !ngoaiV.some(o => o.m === g)); P.broll = P.broll.filter(b => !ngoaiV.some(o => o.m === b)); P.am3 = P.am3.filter(a => !ngoaiV.some(o => o.m === a));
  const id = uid(), ten = 'Clip ghép ' + (demGhep() + 1); con.chu = [id]; let m, k;
  if (v1.length) {   // nằm trên track chính tại chỗ đoạn đầu tiên, vào = phần trước đoạn đầu (giữ nguyên thời điểm nội dung), dồn như đoạn thường
    m = { id, kieu: 'ghep', ten, src: 'ghep:' + id, bd: +(v1Bd - S).toFixed(3), kt: con.dai, con }; const cu = v1Kt - v1Bd, moi = (m.kt - m.bd); P.clips.splice(i0, v1.length, m); if (moi - cu > 0.001) ripple(v1Kt, moi - cu); k = 'v';
  } else {   // chỉ có mục phủ / âm: nằm ở hàng phủ thấp nhất trong nhóm
    const lops = ngoaiV.filter(o => o.k !== 'a').map(o => lopCua(o.k, o.m)); m = { id, kieu: 'ghep', ten, src: 'ghep:' + id, t_bd: +S.toFixed(3), bd: 0, kt: con.dai, vua: 'contain', con }; const l = lops.length ? Math.min(...lops) : null; if (l != null && l < 100) m.lop = l; P.broll.push(m); k = 'b';
  }
  P.nhieu = []; P.chon = { k, i: (k === 'v' ? P.clips : P.broll).indexOf(m) }; veTl(); veLoi(); veKhung(); veProp();
  toast('Đã tạo “' + ten + '” từ ' + ds.length + ' mục · nháy đúp để sửa bên trong, Ctrl+Shift+G để tách'); return m;
}
/* tách: trả các mục về timeline gốc đúng chỗ, giữ keyframe bên trong; thuộc tính đặt lên clip ghép (biến đổi, bộ lọc…) mất như CapCut */
function tachClipGhep(m) {
  if (!laGhep(m)) return; const k = P.clips.includes(m) ? 'v' : P.broll.includes(m) ? 'b' : null; if (!k) return; luuHoanTac();
  const con = conGhep(m), sao = x => JSON.parse(JSON.stringify(x)), toc = tocC(m), O = k === 'v' ? batDauC(m) : m.t_bd, lech = O - m.bd / toc, coId = id => id && [...P.clips, ...P.gfx, ...P.broll, ...P.am3].some(y => y.id === id), moiId = x => { if (!x.id || coId(x.id)) x.id = uid(); return x; }, dai = daiC(m);   /* giữ id cũ nếu chưa trùng (bản nhân đôi thì cấp id mới) */
  const trong = (a, d) => a + d > m.bd + 0.001 && a < m.kt - 0.001;   // chỉ trả lại phần đang hiện trong vào/ra
  con.gfx.filter(g => trong(g.bd, g.kt - g.bd)).forEach(g => { const x = moiId(sao(g)); x.bd = +Math.max(O, lech + g.bd).toFixed(3); x.kt = +Math.min(O + dai, lech + g.kt).toFixed(3); P.gfx.push(x); });
  con.broll.filter(b => trong(b.t_bd, (b.kt - b.bd) / tocC(b))).forEach(b => { const x = moiId(sao(b)); x.t_bd = +(lech + b.t_bd).toFixed(3); P.broll.push(x); });
  con.am3.filter(a => trong(a.t_bd, (a.kt - a.bd) / (a.toc || 1))).forEach(a => { const x = moiId(sao(a)); x.t_bd = +(lech + a.t_bd).toFixed(3); P.am3.push(x); });
  if (k === 'v') { const i = P.clips.indexOf(m), ra = []; let acc = 0; con.clips.forEach(c => { const d = daiC(c), a = Math.max(acc, m.bd), b = Math.min(acc + d, m.kt); if (b - a > 0.005) { const x = sao(c), kc = tocC(c); x.bd = +(c.bd + (a - acc) * kc).toFixed(3); x.kt = +(c.bd + (b - acc) * kc).toFixed(3); if (x.id && (coId(x.id) || ra.some(y => y.id === x.id))) x.id = uid(); ra.push(x); } acc += d; }); const du = dai - ra.reduce((a, c) => a + daiC(c), 0); if (du > 0.01) ra.push({ trong: true, src: '', bd: 0, kt: +du.toFixed(3) }); P.clips.splice(i, 1, ...ra); }
  else { P.broll.splice(P.broll.indexOf(m), 1); con.clips.forEach(() => { }); let acc = 0; con.clips.forEach(c => { const d = daiC(c); if (!c.trong && trong(acc, d)) { const x = moiId(sao(c)); delete x.chuyen; delete x.chuyen_dai; delete x.chuyenSau; Object.assign(x, { t_bd: +(lech + acc).toFixed(3), lop: m.lop }); P.broll.push(x); } acc += d; }); }   // đoạn video con của clip ghép phủ → video phủ
  GHEP_NGUON.delete('ghep:' + m.id); P.nhieu = []; P.chon = null; veTl(); veLoi(); veKhung(); veProp(); toast('Đã tách clip ghép');
}
/* chia sẻ timeline con: hai nửa của một lần tách đôi cùng id timeline (con.id) và cùng nằm trong danh sách chủ (con.chu);
   bản nhân đôi / dán thì không nằm trong danh sách chủ → được cấp timeline riêng (độc lập như CapCut) */
function anhEmGhep(m) { const c = conGhep(m); if (!c.id) return []; return [...P.clips, ...P.broll].filter(x => x !== m && laGhep(x) && x.con.id === c.id && (c.chu || []).includes(x.id)); }
function noiLien(a, b, ds) { if (Math.abs(a.kt - b.bd) > 0.002) return false; if (ds === P.clips) return ds.indexOf(b) === ds.indexOf(a) + 1; const ea = a.t_bd + (a.kt - a.bd) / tocC(a); return Math.abs(ea - b.t_bd) < 0.002; }
function chuanHoaGhepChung() {
  [P.clips, P.broll].forEach(ds => ds.forEach(m => { if (!laGhep(m)) return; if (m.id && m.src !== 'ghep:' + m.id) m.src = 'ghep:' + m.id; const c = conGhep(m); if (!c.id) { c.id = 'tl' + uid(); c.chu = [m.id]; return; } if (!Array.isArray(c.chu)) c.chu = []; if (c.chu.includes(m.id)) return;
    const anh = ds.find(x => x !== m && laGhep(x) && x.con.id === c.id && (x.con.chu || []).includes(x.id) && (noiLien(x, m, ds) || noiLien(m, x, ds)));
    if (anh) { const chu = [...new Set([...(anh.con.chu || []), m.id])]; [P.clips, P.broll].forEach(d2 => d2.forEach(x => { if (laGhep(x) && x.con.id === c.id) x.con.chu = chu.slice(); })); }
    else { m.con = JSON.parse(JSON.stringify(c)); m.con.id = 'tl' + uid(); m.con.chu = [m.id]; GHEP_NGUON.delete('ghep:' + m.id); } }));
}
function tachClipGhepChon() { const m = mucChon(); if (P.chon && (P.chon.k === 'v' || P.chon.k === 'b') && laGhep(m)) { tachClipGhep(m); return true; } return false; }
/* ── vào / ra sửa bên trong: timeline chuyển sang timeline con (giây cục bộ), thanh "Dự án › Clip ghép 1 › …" để quay ra; Hoàn tác bên trong tách riêng, ra ngoài thành 1 bước ── */
function moClipGhep(m, yen) {
  if (!laGhep(m)) return; const k = P.clips.includes(m) ? 'v' : P.broll.includes(m) ? 'b' : null; if (!k) return;
  const O = k === 'v' ? batDauC(m) : m.t_bd, local = Math.max(0, Math.min(conGhep(m).dai || daiCon(m.con), localGhep(m, P.t - O)));
  (P.ghepNgan = P.ghepNgan || []).push({ m, k, ngoai: { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: P.am3 }, chon: P.chon, hoanTac: P.hoanTac, lamLai: P.lamLai, truoc: chupTT() });
  const con = JSON.parse(JSON.stringify(conGhep(m))); P.clips = con.clips; P.gfx = con.gfx; P.broll = con.broll; P.am3 = typeof am3Day === 'function' ? am3Day(con.am3) : con.am3;
  P.hoanTac = []; P.lamLai = []; P.chon = null; P.nhieu = []; P.t = local; P.ghepMo = true; $('#ed').classList.add('ghepMo'); veDuongGhep();
  if (!yen) { veTl(); veLoi(); veKhung(); veProp(); toast('Đang sửa bên trong “' + (m.ten || 'Clip ghép') + '” · bấm “Dự án” ở thanh trên để quay ra'); }
}
function dongClipGhep(yen) {
  const f = (P.ghepNgan || []).pop(); if (!f) return; const m = f.m, local = P.t;
  const con = { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: typeof am3Nhe === 'function' ? JSON.parse(JSON.stringify(P.am3)) : P.am3 }; con.dai = +daiCon(con).toFixed(3); const cuCon = conGhep(m); if (cuCon.id) con.id = cuCon.id; if (cuCon.chu) con.chu = cuCon.chu.slice();
  const noiDung = c => JSON.stringify([c.clips, c.gfx, c.broll, c.am3]), thayDoi = noiDung(cuCon) !== noiDung(con);
  P.clips = f.ngoai.clips; P.gfx = f.ngoai.gfx; P.broll = f.ngoai.broll; P.am3 = f.ngoai.am3; P.hoanTac = f.hoanTac; P.lamLai = f.lamLai;
  if (thayDoi) { P.hoanTac.push(f.truoc); P.lamLai = []; const daiCu = cuCon.dai || 0; [m, ...anhEmGhep(m)].forEach(x => { x.con = x === m ? con : JSON.parse(JSON.stringify(con)); if (x.kt >= daiCu - 0.01 || x.kt > con.dai) x.kt = con.dai; if (x.bd > x.kt - 0.05) x.bd = Math.max(0, x.kt - 0.05); GHEP_NGUON.delete('ghep:' + x.id); }); }   /* các nửa tách đôi cùng trỏ một timeline con: sửa một nửa thì nửa kia đổi theo */
  const O = f.k === 'v' ? batDauC(m) : m.t_bd; P.t = Math.max(0, O + (Math.max(m.bd, Math.min(m.kt, local)) - m.bd) / tocC(m));
  const i = (f.k === 'v' ? P.clips : P.broll).indexOf(m); P.chon = i >= 0 ? { k: f.k, i } : null; P.nhieu = [];
  P.ghepMo = P.ghepNgan.length > 0; $('#ed').classList.toggle('ghepMo', P.ghepMo); veDuongGhep();
  if (!yen) { veTl(); veLoi(); veKhung(); veProp(); }
}
function dongTatCaGhep(yen) { while ((P.ghepNgan || []).length) dongClipGhep(true); if (!yen) { veTl(); veLoi(); veKhung(); veProp(); } }
function veDuongGhep() {
  let bar = $('#ghepBar'); const ngan = P.ghepNgan || [];
  if (!bar) { bar = el('div', 'ghepBar'); bar.id = 'ghepBar'; const tl = $('.etl'); (tl || $('#ed')).insertBefore(bar, (tl || $('#ed')).firstChild); }
  bar.hidden = !ngan.length; bar.innerHTML = ''; if (!ngan.length) return;
  const nut = (t, cap) => { const b = el('button', 'btn nho ' + (cap < ngan.length ? 'ghost' : 'xanh'), t); b.type = 'button'; b.onclick = () => { while (P.ghepNgan.length > cap) dongClipGhep(true); veTl(); veLoi(); veKhung(); veProp(); }; return b; };
  bar.appendChild(nut('◀ Dự án', 0)); ngan.forEach((f, i) => { bar.appendChild(el('span', 'sep', '›')); const s = el('span', 'ten', f.m.ten || 'Clip ghép'); if (i < ngan.length - 1) { s.classList.add('bam'); s.onclick = () => { while (P.ghepNgan.length > i + 1) dongClipGhep(true); veTl(); veLoi(); veKhung(); veProp(); }; } bar.appendChild(s); });
  bar.appendChild(el('span', 'quota', 'Đang sửa bên trong clip ghép · sửa xong bấm “Dự án” để quay ra'));
}
/* trạng thái gốc (đã gộp các chỉnh sửa đang mở bên trong) mà không đóng — dùng cho lưu dự án / tự lưu */
function trangThaiGoc() { let cur = { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: P.am3 }; for (let i = (P.ghepNgan || []).length - 1; i >= 0; i--) { const f = P.ghepNgan[i], ng = JSON.parse(JSON.stringify(f.ngoai)), con = JSON.parse(JSON.stringify(cur)); con.dai = +daiCon(con).toFixed(3); const m = [...ng.clips, ...ng.broll].find(x => x.id === f.m.id); if (m) { const cu = conGhep(m); if (cu.id) con.id = cu.id; if (cu.chu) con.chu = cu.chu.slice(); [m, ...[...ng.clips, ...ng.broll].filter(x => x !== m && laGhep(x) && cu.id && x.con.id === cu.id && (cu.chu || []).includes(x.id))].forEach(x => { x.con = JSON.parse(JSON.stringify(con)); if (x.kt > con.dai) x.kt = con.dai; }); } cur = ng; } return cur; }
function veThuocTinhGhep(box, m) {
  const con = conGhep(m), n = el('div', 'nhom2 ghepNhom'); n.appendChild(el('b', null, '▣ Clip ghép')); box.insertBefore(n, box.firstChild);
  const lt = el('label', 'full'); lt.appendChild(el('span', null, 'Tên clip')); const it = el('input'); it.type = 'text'; it.value = m.ten || ''; it.oninput = () => { m.ten = it.value; veTl(); }; lt.appendChild(it); n.appendChild(lt);
  n.appendChild(el('div', 'quota', 'Bên trong: ' + con.clips.filter(c => !c.trong).length + ' đoạn video · ' + con.broll.length + ' video phủ · ' + con.gfx.length + ' chữ/đồ hoạ · ' + con.am3.length + ' âm thanh · timeline con ' + fmt1(con.dai || daiCon(con)) + 's, đang lấy ' + fmt1(m.bd) + '–' + fmt1(m.kt) + 's'));
  const r = el('div', 'row'); const b1 = el('button', 'btn nho xanh', '✎ Sửa bên trong'); b1.type = 'button'; b1.title = 'Hoặc nháy đúp vào clip trên dòng thời gian'; b1.onclick = () => moClipGhep(m); const b2 = el('button', 'btn nho', '⇲ Tách clip ghép'); b2.type = 'button'; b2.title = 'Ctrl+Shift+G · thuộc tính đặt lên clip ghép sẽ mất'; b2.onclick = () => tachClipGhep(m); r.appendChild(b1); r.appendChild(b2); n.appendChild(r);
}
/* dự án cũ: clip ghép kiểu cũ nằm trong P.gfx (chỉ chữ / phủ) → đổi sang video phủ trỏ timeline con */
function doiGhepCu(ds, br) { for (let i = ds.length - 1; i >= 0; i--) { const g = ds[i]; if (g.kieu !== 'ghep' || !g.con || g.src) continue; const con = { clips: [], gfx: g.con.gfx || [], broll: g.con.broll || [], am3: [] }; con.dai = +Math.max(g.kt - g.bd, daiCon(con)).toFixed(3); const m = { ...g, src: 'ghep:' + (g.id || (g.id = uid())), t_bd: g.bd, bd: 0, kt: +(g.kt - g.bd).toFixed(3), vua: 'contain', con }; delete m.text; delete m.phu; ds.splice(i, 1); br.push(m); } }
function khoiTaoClipGhep() {
  const st = document.createElement('style'); st.textContent = '.ed .item.ghep{background:linear-gradient(90deg,#2b6cb0,#4f8fe0)!important;color:#fff}.ed .item.ghep>b::before{content:"▣ "}.ed .item.ghep canvas.phim{display:none}.ghepBar{display:flex;align-items:center;gap:6px;padding:4px 8px;font-size:12px}.ghepBar .sep{opacity:.5}.ghepBar .ten{font-weight:700}.ghepBar .ten.bam{cursor:pointer;text-decoration:underline;font-weight:500}.ghepBar .quota{margin:0 0 0 8px}'; document.head.appendChild(st);
  const veNenCu = veNen; veNen = function (ctx, W, H, t, nguon) { const { clip, bdTl } = viTri(t); const c = clip >= 0 ? P.clips[clip] : null; if (c && laGhep(c)) veConGhep(c, localGhep(c, t - bdTl), W, H); return veNenCu.apply(this, arguments); };
  const veBrCu = veMotBroll; veMotBroll = function (ctx, W, H, t, b) { if (laGhep(b) && !b.an) { const d = (b.kt - b.bd) / tocC(b); if (t >= b.t_bd && t < b.t_bd + d) veConGhep(b, localGhep(b, t - b.t_bd), W, H); } return veBrCu.apply(this, arguments); };
  const laySnapCu = laySnapCh; laySnapCh = async function (W, H, ch, t) { const k = ch.nua === 1 ? ch.sau : ch.truoc, c = P.clips[k]; if (laGhep(c)) { const lech = (t - ch.noi) * tocC(c); veConGhep(c, Math.max(0, Math.min(conGhep(c).dai, ch.nua === 1 ? c.bd + lech : c.kt + lech)), W, H); } return laySnapCu.apply(this, arguments); };
  const vePhimCu = vePhimItem; vePhimItem = function (d, s) { if (s && s.loai === 'ghep') return; return vePhimCu.apply(this, arguments); };
  const veKxCu = veKhungXuat; veKhungXuat = async function (ctx, W, H, t) { await ghepTuaVideo(t); return veKxCu.apply(this, arguments); };
  /* âm thanh ảo của clip ghép vào cả xem trước và xuất */
  const am3BdCu = am3BatDau; am3BatDau = function () { const cu = P.am3; P.am3 = amTatCa(); try { return am3BdCu.apply(this, arguments); } finally { P.am3 = cu; } };
  const am3NtCu = am3NapThieu; am3NapThieu = async function () { for (const a of amTatCa()) { try { await am3NapKho(a.kho); } catch { } } };
  /* phụ đề theo lời: tính trên track chính đã trải clip ghép */
  const cumCu = cumTu; cumTu = function () { if (!P.clips.some(laGhep) || (P.pdNgoai && P.pdNgoai.length)) return cumCu.apply(this, arguments); const cu = P.clips; P.clips = traiV1(cu); try { return cumCu.apply(this, arguments); } finally { P.clips = cu; } };
  /* vẽ dòng thời gian: đổi clip ghép kiểu cũ, đánh dấu ô clip ghép, nạp sẵn âm thanh bên trong */
  const veTlCu = veTl; veTl = function () { doiGhepCu(P.gfx, P.broll); try { chuanHoaGhepChung(); } catch (e) { console.warn(e); } const r = veTlCu.apply(this, arguments); try {
    $$('#tlIn .item[data-k="v"], #tlIn .item[data-k="b"]').forEach(d => { const m = (d.dataset.k === 'v' ? P.clips : P.broll)[+d.dataset.i]; if (!laGhep(m)) return; d.classList.add('ghep'); const b = d.querySelector('b'); if (b) b.textContent = (m.ten || 'Clip ghép') + ' · ' + fmt1(d.dataset.k === 'v' ? daiC(m) : (m.kt - m.bd) / tocC(m)) + 's' + (tocC(m) !== 1 ? ' · ' + tocC(m) + '×' : ''); const sm = d.querySelector('small'); if (sm) sm.textContent = 'timeline con ' + fmt1(conGhep(m).dai || 0) + 's'; });
    amAo().forEach(a => { const k = AM3_KHO[a.kho]; if (!k || (!k.buf && !k.dang)) am3NapKho(a.kho).catch(() => { }); });
    if (P.clips.some(laGhep) || P.broll.some(laGhep)) P.srcs.forEach(s => { if (s.loai === 'video') { elPhu(s, 'elG'); elPhu(s, 'elGs'); } });   /* tạo sẵn phần tử video phụ cho clip ghép để lần vẽ đầu đã nạp xong */ } catch (e) { console.warn(e); } return r; };
  /* nháy đúp clip ghép → vào trong */
  const tin = $('#tlIn'); if (tin) tin.addEventListener('dblclick', e => { const it = e.target.closest('.item.ghep'); if (!it) return; const m = (it.dataset.k === 'v' ? P.clips : P.broll)[+it.dataset.i]; if (laGhep(m)) { e.preventDefault(); e.stopPropagation(); moClipGhep(m); } }, true);
  /* thuộc tính: đoạn / video phủ là clip ghép → thêm mục Clip ghép ở đầu, đủ thuộc tính video như thường */
  const vePropCu = veProp; veProp = function () { const r = vePropCu.apply(this, arguments); try { const m = mucChon(); if (P.chon && (P.chon.k === 'v' || P.chon.k === 'b') && laGhep(m) && dsNhieu().length <= 1) { const box = $('#propChon'); if (box && !box.querySelector('.ghepNhom')) { veThuocTinhGhep(box, m); const h = box.querySelector('h3'); if (h) h.textContent = '▣ ' + (m.ten || 'Clip ghép'); const tde = $('#phaiTieuDe'); if (tde) tde.textContent = 'Clip ghép'; } } } catch (e) { console.warn(e); } return r; };
  /* lưu dự án: gộp chỉnh sửa đang mở bên trong; xuất: đóng hết rồi xuất cả dự án */
  const djCu = duAnJson; duAnJson = function () { if (!(P.ghepNgan || []).length) return djCu.apply(this, arguments); const cu = { clips: P.clips, gfx: P.gfx, broll: P.broll, am3: P.am3 }, goc = trangThaiGoc(); Object.assign(P, goc); try { return djCu.apply(this, arguments); } finally { Object.assign(P, cu); } };
  ['batDauXuat', 'moHopXuat'].forEach(ten => { const cu = window[ten]; if (typeof cu !== 'function') return; window[ten] = function () { if ((P.ghepNgan || []).length) dongTatCaGhep(); return cu.apply(this, arguments); }; });
}


/* ═════════ KÉO THẢ NHƯ CAPCUT: hiệu ứng / bộ lọc / mẫu chữ kéo thẳng vào đoạn video (áp cho đoạn đó) hoặc xuống dòng thời gian (thành lớp / chữ mới).
   Đoạn có hiệu ứng hiện huy hiệu ✨ ở mép trên — bấm vào là mở đúng chỗ chỉnh. ═════════ */
function tenFxNgan(c) { const ds = []; if (c.hu2 && c.hu2 !== 'khong') ds.push('Hiệu ứng: ' + (HIEU_UNG[c.hu2] || c.hu2)); if (c.lut && P.luts && P.luts[c.lut]) ds.push('Bộ lọc: ' + P.luts[c.lut].ten); else if (c.loc && c.loc !== 'khong' && typeof LOC === 'object' && LOC[c.loc]) ds.push('Bộ lọc: ' + LOC[c.loc][0]); return ds; }
function apFxVaoDoan(k, i, o) {
  const m = MANG()[k][i]; if (!m) return false; luuHoanTac(); P.nhieu = []; P.chon = { k, i };
  if (o.loai === 'bo_loc') { const id = String(o.fx).replace(/^kho:/, ''); if (typeof dangKyLutKho === 'function') dangKyLutKho(id); if (typeof apLutChon === 'function') apLutChon('kho:' + id); else m.lut = 'kho:' + id; }
  else { m.hu2 = o.fx; if (m.huMuc == null) m.huMuc = 1; }
  veTl(); veKhung(); veProp(); moTabProp('Điều chỉnh'); moPhaiNeuCan(); cuonToiFx();
  toast((o.loai === 'bo_loc' ? 'Đã áp bộ lọc' : 'Đã áp hiệu ứng') + ' cho đoạn ' + (k === 'v' ? 'V1' : 'V2') + ' · bấm ✨ trên đoạn để chỉnh'); return true;
}
function cuonToiFx() { setTimeout(() => { const l = [...$('#propChon').querySelectorAll('label')].find(x => x.firstElementChild && /^(Hiệu ứng|LUT|Bộ lọc)$/.test(x.firstElementChild.textContent.trim())); if (l) { const n = l.closest('.nhom2'); if (n && n.classList.contains('gap')) { const c = n.querySelector('.ccHd .caret'); if (c) c.click(); } l.scrollIntoView({ block: 'center', behavior: 'smooth' }); l.classList.add('nhay'); setTimeout(() => l.classList.remove('nhay'), 1200); } }, 60); }
function themChuTai(t, mau) {
  const tCu = P.t; P.t = Math.max(0, +t.toFixed(2));
  let g = null; if (mau === 'moi' || mau == null) { luuHoanTac(); g = { id: uid(), kieu: 'chu', bd: +P.t.toFixed(2), kt: +(P.t + 3).toFixed(2), text: 'Chữ của bạn', phu: '', ...GX_MD.chu }; P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); veKhung(); toast('Đã thêm chữ tại ' + fmt1(P.t) + 's'); }
  else g = themMauChu(+mau);
  moPhaiNeuCan(); return g;
}
function khoiTaoKeoTha() {
  const tin = $('#tlIn'); if (!tin) return;
  // thẻ mẫu chữ + nút Thêm chữ kéo được
  const ganChu = () => { $$('#mauChu button').forEach(b => { if (b.dataset.keoChu) return; const i = MAU_CHU.findIndex(([ten]) => ten === b.title); if (i < 0) return; b.dataset.keoChu = 1; b.draggable = true; b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', JSON.stringify({ chu: i })); e.dataTransfer.effectAllowed = 'copy'; }); });
    ['#btnThemChu', '.theChuMacDinh'].forEach(s => $$(s).forEach(b => { if (b.dataset.keoChu) return; b.dataset.keoChu = 1; b.draggable = true; b.title = (b.title ? b.title + ' · ' : '') + 'kéo thả xuống dòng thời gian cũng được'; b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', JSON.stringify({ chu: 'moi' })); e.dataTransfer.effectAllowed = 'copy'; }); })); };
  ganChu(); const mc = $('#mauChu'); if (mc) new MutationObserver(ganChu).observe(mc, { childList: true }); const cp = $('[data-pane="chu"]'); if (cp) new MutationObserver(ganChu).observe(cp, { childList: true, subtree: true });
  // rê qua đoạn nào thì đoạn đó sáng viền
  let hot = null; const boHot = () => { if (hot) { hot.classList.remove('dropHot'); hot = null; } };
  tin.addEventListener('dragover', e => { const it = e.target.closest('.item[data-k="v"],.item[data-k="b"]'); if (it !== hot) { boHot(); if (it) { it.classList.add('dropHot'); hot = it; } } });
  tin.addEventListener('dragleave', e => { if (!tin.contains(e.relatedTarget)) boHot(); });
  // thả: vào đoạn → áp cho đoạn; vào chỗ trống → lớp hiệu ứng / chữ mới tại giây đó
  /* bắt ở phần tử cha (capture) để chạy TRƯỚC bộ xử lý thả-thành-lớp đã gắn trên #tlIn */
  (tin.parentElement || document).addEventListener('drop', e => {
    if (!tin.contains(e.target)) return; let o = null; try { o = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { } if (!o) { boHot(); return; }
    const it = e.target.closest('.item[data-k="v"],.item[data-k="b"]'), r = tin.getBoundingClientRect(), t = Math.max(0, (e.clientX - r.left - LB) / PX()); boHot();
    if (o.fx && it) { e.preventDefault(); e.stopImmediatePropagation(); apFxVaoDoan(it.dataset.k, +it.dataset.i, o); return; }
    if (o.chu != null) { e.preventDefault(); e.stopImmediatePropagation(); themChuTai(t, o.chu); return; }
  }, true);
  // huy hiệu ✨ ở mép trên đoạn có hiệu ứng / bộ lọc
  const veTlFx = veTl; veTl = function () { const r = veTlFx.apply(this, arguments); try { $$('#tlIn .item[data-k="v"],#tlIn .item[data-k="b"]').forEach(it => { const m = MANG()[it.dataset.k][+it.dataset.i]; if (!m) return; const ds = tenFxNgan(m); if (!ds.length) return; const tag = el('i', 'fxTag', '✨'); tag.title = ds.join(' · ') + ' — bấm để chỉnh'; it.appendChild(tag); }); } catch { } return r; };
  tin.addEventListener('pointerdown', e => { const tag = e.target.closest('.fxTag'); if (!tag) return; e.preventDefault(); e.stopPropagation(); const it = tag.closest('.item'); P.nhieu = []; P.chon = { k: it.dataset.k, i: +it.dataset.i }; chonHien && chonHien(); veProp(); moTabProp('Điều chỉnh'); moPhaiNeuCan(); cuonToiFx(); }, true);
  tin.addEventListener('click', e => { if (e.target.closest('.fxTag')) { e.preventDefault(); e.stopPropagation(); } }, true);
}


/* ═════════ spec CapCut 1.7 / 1.12: chọn khoảng trống trên track phủ + Delete (dồn mục sau lên), giữ Alt khi kéo = tắt hít tạm thời ═════════ */
function mucCuaLan(l) { return moiMuc().filter(o => (o.k === 'b' || o.k === 'g') && lopCua(o.k, o.m) === l); }
function veKhoangChon() { $$('#tlIn .gapChon').forEach(x => x.remove()); const g = P.gapChon; if (!g) return; const tr = hangCua(g.lop); if (!tr) return; const d = el('div', 'gapChon'); d.style.left = g.t0 * PX() + 'px'; d.style.width = Math.max(2, (g.t1 - g.t0) * PX()) + 'px'; d.title = 'Khoảng trống ' + fmt1(g.t1 - g.t0) + 's · Delete để dồn các mục phía sau lên'; tr.appendChild(d); }
function xoaKhoangTrong() {
  const g = P.gapChon; if (!g) return false; if (trKhoa(keyLop(g.lop))) { baoKhoa(); return false; } const d = g.t1 - g.t0; if (!(d > 1e-3)) { P.gapChon = null; veKhoangChon(); return false; }
  luuHoanTac(); mucCuaLan(g.lop).forEach(o => { const [a] = khoangMuc(o.k, o.m); if (a >= g.t1 - 1e-3) datBatDau(o.k, o.m, a - d); });
  P.gapChon = null; veTl(); veKhung(); toast('Đã xoá khoảng trống ' + fmt1(d) + 's'); return true;
}
function khoiTaoKhoangTrong() {
  const tin = $('#tlIn'); if (!tin) return;
  tin.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; if (e.target.closest('.item, .trn')) { if (P.gapChon) { P.gapChon = null; veKhoangChon(); } return; }
    const tr = e.target.closest('.track[data-lop]'); if (!tr) { if (P.gapChon) { P.gapChon = null; veKhoangChon(); } return; }
    const l = +tr.dataset.lop, r = tr.getBoundingClientRect(), t = (e.clientX - r.left) / PX(); let t0 = 0, t1 = null;
    mucCuaLan(l).forEach(o => { const [a, b] = khoangMuc(o.k, o.m); if (b <= t + 1e-6) t0 = Math.max(t0, b); if (a >= t - 1e-6) t1 = t1 == null ? a : Math.min(t1, a); });
    P.gapChon = t1 != null && t1 - t0 > 1e-3 ? { lop: l, t0: +t0.toFixed(3), t1: +t1.toFixed(3) } : null; setTimeout(veKhoangChon, 0);
  }, true);   // pha capture: mục trên dòng thời gian chặn bubble nên phải bắt trước
  document.addEventListener('keydown', e => { const a = document.activeElement; if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return; if (P.gapChon && !P.chon && !dsNhieu().length && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); e.stopImmediatePropagation(); xoaKhoangTrong(); } }, true);
  const veTlG = veTl; veTl = function () { const r = veTlG.apply(this, arguments); try { veKhoangChon(); } catch { } return r; };
  // Alt giữ khi kéo → tắt hít
  ['keydown', 'keyup'].forEach(ev => document.addEventListener(ev, e => { P.giuAlt = e.altKey; }, true));
  document.addEventListener('pointermove', e => { P.giuAlt = e.altKey; }, true); document.addEventListener('pointerdown', e => { P.giuAlt = e.altKey; }, true);
  const hitCu = hit; hit = function (t) { if (P.giuAlt) { const sl = $('#snapLine'); if (sl) sl.style.display = 'none'; return t; } return hitCu.apply(this, arguments); };
}

/* ═════════ XUẤT + PHỤ ĐỀ THEO SPEC: M4A, file phụ đề kèm, % + thời gian còn lại; tách/gộp phụ đề vẫn bám footage, tiếng đệm, nhập .lrc ═════════ */
/* spec 7: chỉ âm thanh MP3 — bộ mã lamejs nạp khi cần (trình duyệt không có sẵn MP3), mã hoá từng khúc, có % và Huỷ */
const LAME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
let lameCho = null; function napLame() { if (window.lamejs) return Promise.resolve(window.lamejs); return lameCho || (lameCho = new Promise((ok, loi) => { const sc = document.createElement('script'); sc.src = LAME_URL; sc.crossOrigin = 'anonymous'; sc.onload = () => window.lamejs ? ok(window.lamejs) : loi(new Error('không nạp được bộ mã MP3')); sc.onerror = () => { lameCho = null; loi(new Error('không tải được bộ mã MP3')); }; document.head.appendChild(sc); })); }
async function xuatMp3(o) { const phien = P.phienXuat;
  const L = await napLame(), [ka, kb] = khoangXuat(o), mix = catBuf(await tronAmThanh(tongGiay()), ka, kb); if ((P.huyXuat || phien !== P.phienXuat)) return null;
  const sr = mix.sampleRate, ch = Math.min(2, mix.numberOfChannels), kbps = [128, 192, 320].includes(o.am) ? o.am : 192, enc = new L.Mp3Encoder(ch, sr, kbps), toI16 = f => { const o2 = new Int16Array(f.length); for (let i = 0; i < f.length; i++) { const v = Math.max(-1, Math.min(1, f[i])); o2[i] = v < 0 ? v * 0x8000 : v * 0x7fff; } return o2; };
  const Lc = toI16(mix.getChannelData(0)), Rc = ch > 1 ? toI16(mix.getChannelData(1)) : null, out = [], buoc = 1152 * 40, t0 = performance.now();
  for (let i = 0; i < Lc.length; i += buoc) { if ((P.huyXuat || phien !== P.phienXuat)) return null; const a = Lc.subarray(i, i + buoc), b = Rc ? Rc.subarray(i, i + buoc) : null, d = b ? enc.encodeBuffer(a, b) : enc.encodeBuffer(a); if (d.length) out.push(new Uint8Array(d)); const pc = Math.min(1, (i + buoc) / Lc.length), tg = (performance.now() - t0) / 1000; $('#xuatBar').style.width = (pc * 100).toFixed(1) + '%'; $('#xuatTt').textContent = Math.floor(pc * 100) + '% · còn ~' + tgCon(tg / pc * (1 - pc)) + ' · MP3 ' + kbps + ' kbps'; await new Promise(r => setTimeout(r, 0)); }
  const cuoi = enc.flush(); if (cuoi.length) out.push(new Uint8Array(cuoi)); return new Blob(out, { type: 'audio/mpeg' });
}
function tgCon(g) { g = Math.max(0, Math.ceil(g)); return g < 60 ? g + 's' : Math.floor(g / 60) + ':' + String(g % 60).padStart(2, '0'); }
async function xuatM4a(o) { const phien = P.phienXuat;
  const M = await napMB(), [ka, kb] = khoangXuat(o), fmt = new M.Mp4OutputFormat({ fastStart: 'in-memory' });
  const acd = await M.getFirstEncodableAudioCodec(['aac'], { numberOfChannels: 2, sampleRate: 48000 }); if (!acd) throw new Error('máy không mã hoá được AAC');
  const out = new M.Output({ format: fmt, target: new M.BufferTarget() }), as = new M.AudioBufferSource({ codec: acd, bitrate: (o.am || 192) * 1000 }); out.addAudioTrack(as); await out.start();
  const mix = catBuf(await tronAmThanh(tongGiay()), ka, kb); if ((P.huyXuat || phien !== P.phienXuat)) { await out.cancel(); return null; }
  $('#xuatBar').style.width = '60%'; $('#xuatTt').textContent = '60% · đang mã hoá AAC ' + (o.am || 192) + ' kbps…'; await as.add(mix); as.close(); await out.finalize();
  return new Blob([out.target.buffer], { type: 'audio/mp4' });
}
function pdTrongKhoang(a, b) { return cumTu().filter(c => c.kt > a + 0.01 && c.bd < b - 0.01).map(c => ({ bd: +Math.max(0, c.bd - a).toFixed(3), kt: +(Math.min(b, c.kt) - a).toFixed(3), text: c.tu.map(w => w.w).join(' ') })); }
function xuatPdKem(ten) {
  const o = caiXuat(); P.pdKemTen = null; if (o.pd === 'khong' || o.dd === 'gif') return;
  const [ka, kb] = khoangXuat(o), ds = pdTrongKhoang(ka, kb); if (!ds.length) { toast('Không có phụ đề trong khoảng xuất nên không lưu file phụ đề'); return; }
  const goc = ten.replace(/\.[a-z0-9]+$/i, ''), noi = o.pd === 'srt' ? ds.map((c, i) => (i + 1) + '\n' + srtTg(c.bd) + ' --> ' + srtTg(c.kt) + '\n' + c.text + '\n').join('\n') : ds.map(c => c.text).join('\n') + '\n';
  P.pdKemTen = goc + '.' + o.pd; P.pdKemNoi = noi; luuText(P.pdKemTen, noi); $('#xuatTt').textContent += ' Kèm ' + P.pdKemTen + ' (' + ds.length + ' câu).';
}
/* nhập .lrc: [mm:ss.xx]câu — câu kết thúc ở mốc kế tiếp */
function docLrc(txt) {
  const mk = []; String(txt).replace(/\r/g, '').split('\n').forEach(d => { const ts = [...d.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)]; if (!ts.length) return; const text = d.replace(/\[[^\]]*\]/g, '').replace(/<[^>]+>/g, '').trim(); ts.forEach(m => mk.push({ bd: +m[1] * 60 + parseFloat(m[2].replace(':', '.')), text })); });
  mk.sort((a, b) => a.bd - b.bd); const out = [];
  mk.forEach((m, i) => { if (!m.text) return; const kt = mk[i + 1] ? mk[i + 1].bd : m.bd + Math.min(5, Math.max(1.5, m.text.split(/\s+/).length * 0.4)); if (kt > m.bd) out.push({ bd: +m.bd.toFixed(3), kt: +kt.toFixed(3), text: m.text }); });
  return out;
}
const docSrtGoc = docSrt; docSrt = function (txt) { const r = docSrtGoc(txt); return r.length ? r : docLrc(txt); };
/* tách / gộp câu phụ đề bám footage: đổi nhóm từ (w.nhom) thay vì tách phụ đề ra đoạn chữ riêng → cắt V1 vẫn cắt phụ đề theo */
function chiaNhomPd(c, k) { const A = 'n' + uid(), B = 'n' + uid(); c.w.forEach((w, j) => { w.nhom = j < k ? A : B; }); }
const tachPdTaiChuGoc = tachPdTaiChu; tachPdTaiChu = function (i, pos) {
  const c = dsPd()[i]; if (!c || c.ng != null || !c.w || c.w.length !== c.tu.length) return tachPdTaiChuGoc(i, pos);
  const text = c.tu.map(w => w.w).join(' '); if (pos <= 0 || pos >= text.length) { toast('Đặt con trỏ vào giữa câu rồi Enter để tách'); return; }
  const truoc = text.slice(0, pos).trim().split(/\s+/).filter(Boolean).length; if (!truoc || truoc >= c.tu.length) { toast('Đặt con trỏ giữa hai từ'); return; }
  luuHoanTac(); chiaNhomPd(c, truoc); lamMoiPd(); P.chon = { k: 'pd', i: i + 1 }; veProp(); veDsPd(); toast('Đã tách câu');
};
const tachPdGoc = tachPd; tachPd = function (i, t) {
  const c = dsPd()[i]; if (!c || c.ng != null || !c.w || c.w.length !== c.tu.length) return tachPdGoc(i, t);
  const k = c.tu.filter(w => (w.bd + w.kt) / 2 < t).length; if (t <= c.bd + 0.05 || t >= c.kt - 0.05 || !k || k >= c.tu.length) { toast('Đưa đầu phát vào giữa hai từ của câu rồi bấm Tách'); return; }
  luuHoanTac(); chiaNhomPd(c, k); lamMoiPd(); P.chon = { k: 'pd', i: i + 1 }; veProp(); toast('Đã tách câu phụ đề');
};
const gopPdGoc = gopPd; gopPd = function (i) {
  const ds = dsPd(), a = ds[i - 1], b = ds[i]; if (i <= 0 || !a || !b) return;
  if (a.ng != null || b.ng != null || a.s !== b.s || a.ci !== b.ci || !a.w || !b.w) return gopPdGoc(i);
  const s = srcCua(a.s), i0 = s.tu.indexOf(a.w[0]), i1 = s.tu.indexOf(b.w[b.w.length - 1]); if (i0 < 0 || i1 < i0) return gopPdGoc(i);
  luuHoanTac(); const nh = 'n' + uid(); for (let k = i0; k <= i1; k++) s.tu[k].nhom = nh; lamMoiPd(); P.chon = { k: 'pd', i: i - 1 }; veProp(); veDsPd(); toast('Đã gộp với câu trước');
};
/* tiếng đệm: đánh dấu trong danh sách câu (đỏ = sẽ cắt, vàng = nghe lại) + xoá hết (cắt V1, dồn khoảng trống) */
function laDem(w) { w = String(w || '').trim(); return FILLER.test(w) ? 'chac' : FILLER_NGO.test(w) ? 'ngo' : ''; }
function tinhXoaDem() {
  const moi = [], cat = []; let acc = 0, bot = 0; const dem = [];
  P.clips.forEach(c => {
    const s = srcCua(c.src), dai = daiC(c), k = tocC(c) || 1, ws = s && s.tu ? s.tu.filter(w => !w.an && laDem(w.w) === 'chac' && w.bd >= c.bd - 0.02 && w.kt <= c.kt + 0.02) : [];
    if (!ws.length) { moi.push(c); acc += dai; return; }
    const bo = []; ws.forEach(w => { dem.push(w); const x = Math.max(c.bd, w.bd - 0.02), y = Math.min(c.kt, w.kt + 0.02), l = bo[bo.length - 1]; if (l && x - l[1] < 0.04) l[1] = y; else bo.push([x, y]); });
    const giu = []; let tr = c.bd; bo.forEach(([x, y]) => { if (x - tr > 0.04) giu.push([tr, x]); tr = y; }); if (c.kt - tr > 0.04) giu.push([tr, c.kt]);
    let truoc = c.bd; giu.forEach(([x, y], j) => { if (x > truoc) { cat.push([acc + (truoc - c.bd) / k, (x - truoc) / k]); bot += (x - truoc) / k; } moi.push({ ...c, id: j ? uid() : c.id, bd: +x.toFixed(3), kt: +y.toFixed(3) }); truoc = y; });
    if (c.kt > truoc + 0.001) { cat.push([acc + (truoc - c.bd) / k, (c.kt - truoc) / k]); bot += (c.kt - truoc) / k; }
    acc += dai;
  });
  return { moi, cat, bot, dem };
}
function xoaHetDem() {
  const r = tinhXoaDem(); if (!r.dem.length) { toast('Không thấy tiếng ờ, ừ, ừm nào'); return { so: 0, bot: 0 }; }
  luuHoanTac(); r.dem.forEach(w => { w.an = true; }); r.cat.slice().sort((a, b) => b[0] - a[0]).forEach(([diem, len]) => ripple(diem + len, -len)); P.clips = r.moi.filter(c => c.kt - c.bd > 0.04);
  cumKey = ''; veTl(); veLoi(); veKhung(); veDsPd(); toast('Đã xoá ' + r.dem.length + ' tiếng đệm · ngắn đi ' + fmt1(r.bot) + 's'); return { so: r.dem.length, bot: r.bot };
}
const veDsPdGoc = veDsPd; veDsPd = function () {
  veDsPdGoc(); const box = $('#pdDs'); if (!box || !$('#pdDanhDem') || !$('#pdDanhDem').checked) return;
  const ds = dsPd(); box.querySelectorAll('.pdHang').forEach(h => { const c = ds[+h.dataset.i], t = h.querySelector('.t'); if (!c || !t || document.activeElement === t) return; t.innerHTML = c.tu.map(w => { const l = laDem(w.w), e = String(w.w).replace(/[&<>"]/g, z => '&#' + z.charCodeAt(0) + ';'); return l ? '<mark class="dem ' + l + '">' + e + '</mark>' : e; }).join(' '); });
};
function khoiTaoXuatPd() {
  const st = document.createElement('style'); st.textContent = '#xuatCaiHop .xcKhoi{border:1px solid var(--eb,#2b2b30);border-radius:8px;padding:6px 8px;margin:6px 0}#xuatCaiHop .xcKhoi.tat .xcThan{display:none}#xuatCaiHop .xcBat{display:flex!important;gap:8px;align-items:center;cursor:pointer}#xuatCaiHop .xcBat b{font-size:13px}.pdHang mark.dem{background:rgba(255,90,36,.28);color:inherit;border-radius:3px;padding:0 2px;text-decoration:line-through}.pdHang mark.dem.ngo{background:rgba(255,212,0,.28);text-decoration:none}'; document.head.appendChild(st);
  const d = $('#pdDanhDem'); if (d) d.onchange = () => veDsPd(); const x = $('#btnXoaDem'); if (x) x.onclick = () => xoaHetDem();
  const cl = $('#xc_xuatCL'); if (cl) cl.addEventListener('change', capNhatHopXuat);
  $('#xuatMbpsHang').hidden = $('#xuatCL').value !== 'tuy'; $('#pdTim').oninput = () => veDsPd();
}
/* ═════════ CHUYỂN CẢNH THEO SPEC 5.1: cửa sổ nằm giữa điểm nối [nối − d/2, nối + d/2] (tại điểm nối trộn 50/50), lấy thêm khung nguồn hai bên, tự co khi đoạn ngắn, ô vuông trên mép nối, kéo đoạn đi / xoá đoạn thì mất chuyển cảnh ═════════ */
const snapSauCv = document.createElement('canvas'); let snapSauSan = false;
function chuyenDai(k) { const a = P.clips[k], b = P.clips[k + 1]; if (!a || !b || !a.chuyen || a.chuyen === 'cat') return 0; return Math.max(0.04, Math.min(a.chuyen_dai || (P.cai && P.cai.chuyen) || MAC_DINH.chuyenGiay, daiC(a), daiC(b))); }
chuyenTai = function (t) {
  const { clip, bdTl } = viTri(t); if (clip < 0) return null; const c = P.clips[clip], dai = daiC(c), kep = x => Math.max(0, Math.min(1, x));
  let d = chuyenDai(clip); if (d && t >= bdTl + dai - d / 2) { const noi = bdTl + dai; return { kieu: c.chuyen, p: kep((t - (noi - d / 2)) / d), truoc: clip, sau: clip + 1, nua: 1, noi, d }; }
  d = clip > 0 ? chuyenDai(clip - 1) : 0; if (d && t < bdTl + d / 2) return { kieu: P.clips[clip - 1].chuyen, p: kep((t - (bdTl - d / 2)) / d), truoc: clip - 1, sau: clip, nua: 2, noi: bdTl, d };
  return null;
};
/* khung của đoạn bên kia tại cùng thời điểm: đoạn sau lấy trước điểm vào (handle), đoạn trước lấy sau điểm ra; nguồn không đủ thì giữ khung mép */
async function laySnapCh(W, H, ch, t) {
  const k = ch.nua === 1 ? ch.sau : ch.truoc, c = P.clips[k], s = c && srcCua(c.src); if (!s) return null; const cv2 = ch.nua === 1 ? snapSauCv : snapCv;
  if (cv2.width !== W || cv2.height !== H) { cv2.width = W; cv2.height = H; } const g = cv2.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const lech = (t - ch.noi) * tocC(c), het = (s.giay || c.kt) - 0.04, tSrc = ch.nua === 1 ? Math.max(0, Math.min(het, c.bd + lech)) : Math.max(0, Math.min(het, c.kt + lech - 0.001));
  if (s.loai === 'video') await seekTo(elPhu(s, 'el2'), tSrc); veNguon(g, W, H, s, s.loai === 'video' ? s.el2 : s.el, tSrc, 1); return cv2;
}
function napSnapSauPhat(k, W, H) { const d = chuyenDai(k), noi = P.clips.slice(0, k + 1).reduce((a, c) => a + daiC(c), 0); laySnapCh(W, H, { nua: 1, sau: k + 1, noi }, noi - d / 2).then(x => { snapSauSan = !!x; }).catch(() => {}); }
function kiemChuyen() { P.clips.forEach((c, i) => { if (!c.chuyen || c.chuyen === 'cat') { delete c.chuyenSau; return; } const sau = P.clips[i + 1]; if (!sau) { if (c.chuyenSau) { delete c.chuyen; delete c.chuyen_dai; delete c.chuyenSau; } return; } if (!sau.id) return; if (c.chuyenSau == null) c.chuyenSau = sau.id; else if (c.chuyenSau !== sau.id) { delete c.chuyen; delete c.chuyen_dai; delete c.chuyenSau; } }); }
function veDauChuyen() {
  $$('#tlIn .tjoin').forEach(x => x.remove()); if (P.chonChuyen != null && !chuyenDai(P.chonChuyen)) P.chonChuyen = null;
  P.clips.forEach((c, i) => { if (!chuyenDai(i)) return; const it = $('#tlIn .item[data-k="v"][data-i="' + i + '"]'); if (!it || !it.offsetParent) return; const d = el('div', 'tjoin' + (P.chonChuyen === i ? ' chon' : '')); d.dataset.i = i; d.title = CHUYEN_TEN[c.chuyen] + ' · ' + fmt1(chuyenDai(i)) + 's — bấm để chỉnh, Delete để xoá';
    Object.assign(d.style, { left: (it.offsetLeft + it.offsetWidth - 7) + 'px', top: (it.offsetTop + it.offsetHeight / 2 - 7) + 'px' }); d.innerHTML = ic('trans');
    d.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); P.chonChuyen = i; P.chon = { k: 'v', i }; P.nhieu = []; veTl(); veProp(); moPhaiNeuCan(); }, true); it.offsetParent.appendChild(d); });
}
function xoaChuyenChon() { const c = P.clips[P.chonChuyen]; if (!c) return; luuHoanTac(); delete c.chuyen; delete c.chuyen_dai; delete c.chuyenSau; P.chonChuyen = null; veTl(); veKhung(); toast('Đã xoá chuyển cảnh'); }
/* phím tắt còn thiếu theo bảng spec 6 */
async function lienKetAm() {
  const ch = P.chon; if (!ch) { toast('Chọn đoạn video hoặc âm thanh đã tách'); return; }
  const gop = (a, c) => { luuHoanTac(); c.am = a.am == null ? 1 : a.am; P.am3.splice(P.am3.indexOf(a), 1); P.chon = { k: 'v', i: P.clips.indexOf(c) }; veTl(); veProp(); toast('Đã liên kết lại âm thanh với đoạn video'); };
  if (ch.k === 'v') { const c = P.clips[ch.i], a = c && P.am3.find(x => x.lienClip && x.lienClip === c.id); if (a) return gop(a, c); const moi = await tachAmClip(ch.i); if (moi && c.id) moi.lienClip = c.id; if (moi) toast('Đã tách âm thanh (Ctrl+Shift+L lần nữa để liên kết lại)'); return; }
  if (ch.k === 'a') { const a = P.am3[ch.i], c = a && P.clips.find(x => x.id && x.id === a.lienClip); if (a && c) return gop(a, c); toast('Âm thanh này không liên kết với đoạn video nào'); }
}
function veVachTam(dx, dy) { const k = $('.khung'); if (!k) return; let v = $('#vachTamD'), h = $('#vachTamN'); if (!v) { v = el('div', 'vachTam d'); v.id = 'vachTamD'; h = el('div', 'vachTam n'); h.id = 'vachTamN'; k.appendChild(v); k.appendChild(h); } const r = cv.getBoundingClientRect(), rk = k.getBoundingClientRect(); Object.assign(v.style, { display: dx ? 'block' : 'none', left: (r.left - rk.left + r.width / 2) + 'px', top: (r.top - rk.top) + 'px', height: r.height + 'px' }); Object.assign(h.style, { display: dy ? 'block' : 'none', top: (r.top - rk.top + r.height / 2) + 'px', left: (r.left - rk.left) + 'px', width: r.width + 'px' }); P.vachTam = [!!dx, !!dy]; }
/* spec 1.2 / 2.4: bấm vật thể trên khung xem trước → chọn mục đó ở dòng thời gian; bấm chỗ không có gì → bỏ chọn */
function chonTrenKhung(e) {
  if (P.dang || e.button !== 0 || P.cheDo === 'cat') return; P.lanBamCv = performance.now(); const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, tV1 = P.clips.reduce((a, c) => a + daiC(c), 0); let chon = null, dm = 0.14;
  P.gfx.forEach((g, i) => { if (P.t < g.bd || P.t >= g.kt || trAn(keyLop(lopCua('g', g))) || trKhoa(keyLop(lopCua('g', g)))) return; const off = P.t - g.bd, kx = g.kfs && g.kfs.x && g.kfs.x.length ? giaTriKf(g, 'x', off) : g.x, ky = g.kfs && g.kfs.y && g.kfs.y.length ? giaTriKf(g, 'y', off) : g.y, gx = kx == null ? 0.5 : kx, gy = ky == null ? (g.kieu === 'chu' ? 0.32 : 0.5) : ky, d = Math.hypot(x - gx, (y - gy) * 1.4); if (d <= dm) { dm = d; chon = { k: 'g', i }; } });
  if (!chon && $('#phuDe').checked && cumHienTai(P.t) && Math.abs(y - (P.pdY || 0.78)) < 0.09) return;   // vùng phụ đề: để bộ kéo phụ đề xử lý
  if (!chon) for (let i = P.broll.length - 1; i >= 0; i--) { const b = P.broll[i]; if (P.t < b.t_bd || P.t >= b.t_bd + daiMuc('b', b) || trAn(keyLop(lopCua('b', b))) || trKhoa(keyLop(lopCua('b', b)))) continue; const h = tinhHop('b', b); if (Math.abs(x - h.cx) <= h.w / 2 && Math.abs(y - h.cy) <= h.h / 2) { chon = { k: 'b', i }; break; } }
  if (!chon && P.t < tV1) { const { clip } = viTri(P.t); if (clip >= 0 && !trKhoa('v1')) { const h = tinhHop('v', P.clips[clip]); if (Math.abs(x - h.cx) <= h.w / 2 && Math.abs(y - h.cy) <= h.h / 2) chon = { k: 'v', i: clip }; } }
  if (JSON.stringify(chon) === JSON.stringify(P.chon)) return; P.chon = chon; P.nhieu = []; veTl(); veProp(); if (!P.dang) veKhung();
}
function suaChuChon() { P.propTab = 'Văn bản'; veProp(); moPhaiNeuCan(); const tieu = () => { const o = $('#propChon textarea.ccChuNoi') || $('#propChon textarea') || $('#propChon input[type="text"]'); if (o && document.activeElement !== o) { o.focus(); o.select(); } }; tieu(); setTimeout(tieu, 30); }
function khoiTaoSpecCon() {
  const st = document.createElement('style'); st.textContent = '.vachTam{position:absolute;display:none;background:#ff3ea5;pointer-events:none;z-index:30}.vachTam.d{width:1px}.vachTam.n{height:1px}#tlIn .tjoin{position:absolute;width:14px;height:14px;border-radius:3px;background:#f2f2f2;color:#222;display:grid;place-items:center;z-index:6;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.45)}#tlIn .tjoin svg{width:10px;height:10px}#tlIn .tjoin.chon{background:var(--em,#99DF00);box-shadow:0 0 0 2px #fff}'; document.head.appendChild(st);
  const veTlCu = veTl; veTl = function () { kiemChuyen(); const r = veTlCu.apply(this, arguments); try { veDauChuyen(); } catch { } return r; };
  $('#tlIn').addEventListener('pointerdown', e => { if (!e.target.closest('.tjoin') && P.chonChuyen != null) { P.chonChuyen = null; $$('#tlIn .tjoin.chon').forEach(x => x.classList.remove('chon')); } }, true);
  window.addEventListener('keydown', e => {
    const a = document.activeElement; if (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable || $('.xuat.mo')) return;
    const ctrl = e.ctrlKey || e.metaKey, sh = e.shiftKey, alt = e.altKey, c = e.code, xong = f => { e.preventDefault(); e.stopImmediatePropagation(); f(); };
    if (ctrl && sh && !alt && c === 'KeyM') return xong(tatTiengChon);
    if (ctrl && sh && !alt && c === 'KeyL') return xong(lienKetAm);
    if (ctrl && sh && !alt && c === 'KeyF') return xong(() => dongBang());
    if (!ctrl && !sh && !alt && c === 'KeyF') return xong(() => $('#btnToanManHinh').click());
    if (!ctrl && !sh && !alt && e.key === 'Enter' && P.chon && P.chon.k === 'g' && P.gfx[P.chon.i] && P.gfx[P.chon.i].kieu === 'chu') return xong(suaChuChon);
    if (!ctrl && (e.key === 'Delete' || e.key === 'Backspace') && P.chonChuyen != null) return xong(xoaChuyenChon);
  }, true);
  const bang = $('#phimHop table.phim'); if (bang) [['Alt + kéo mép đoạn V1', 'Dời điểm nối (roll): đoạn này dài ra thì đoạn kế ngắn lại, tổng không đổi'], ['Alt + kéo đoạn V1', 'Trượt đoạn (slide): giữ nguyên đoạn, đoạn trước và sau co giãn theo'], ['F · Ctrl/⌘ + F', 'Xem toàn màn hình (Esc thoát)'], ['Ctrl/⌘ + Shift + F', 'Đóng băng khung tại đầu phát'], ['Ctrl/⌘ + Shift + M', 'Tắt / bật tiếng mục đang chọn'], ['Ctrl/⌘ + Shift + L', 'Tách / liên kết lại âm thanh của đoạn video'], ['Enter (đang chọn chữ)', 'Sửa chữ'], ['Ctrl/⌘ + T', 'Thêm chữ mặc định 3s tại đầu phát'], ['Bấm ô vuông ở mép nối + Delete', 'Xoá chuyển cảnh']].forEach(([k, v]) => { const tr = document.createElement('tr'); tr.innerHTML = '<td>' + k + '</td><td>' + v + '</td>'; bang.appendChild(tr); });
  cv.addEventListener('pointerdown', chonTrenKhung, true);
  cv.addEventListener('dblclick', e => { if (P.chon && P.chon.k === 'g' && P.gfx[P.chon.i] && P.gfx[P.chon.i].kieu === 'chu') { e.preventDefault(); suaChuChon(); } });   /* spec 2.4: bấm đúp chữ trên khung → sửa chữ */
  ['#tg2', '#tg', '#tgXem'].forEach(id => { const o = $(id); if (o) o.addEventListener('click', moNhapTc); }); datTg(tongGiay()); st.textContent += '#tg2,#tg,#tgXem{cursor:text;font-variant-numeric:tabular-nums}.tcIn{width:92px;font:inherit;background:var(--ep2,#222);color:inherit;border:1px solid var(--em,#99DF00);border-radius:4px;padding:1px 4px}';
  const nut = $('#btnDongBang'); if (nut) nut.title = 'Đóng băng khung 3 giây (Ctrl+Shift+F)';
}
/* ═════════ KHUNG BAO CHO CHỮ / STICKER TRÊN KHUNG XEM TRƯỚC (spec 2.4 + 4.1): khung theo đúng vùng chữ đang vẽ, góc = cỡ chữ (đều), mép trái/phải = độ rộng tối đa (tự xuống dòng),
   núm xoay (Shift = bước 15°), kéo bên trong để dời (hít tâm khung 5 px), có keyframe thì tự thêm keyframe tại đầu phát ═════════ */
function ngatDong(ctx, d, maxW) { const out = []; let cur = ''; String(d).split(/\s+/).filter(Boolean).forEach(w => { const th = cur ? cur + ' ' + w : w; if (ctx.measureText(th).width > maxW && cur) { out.push(cur); cur = w; } else cur = th; }); out.push(cur); return out; }
const hopChuCv = document.createElement('canvas');
function hopChu(g, t) {   // vùng chữ thật (quét điểm ảnh) theo tỉ lệ 0..1 của khung
  const W = 270, H = Math.max(2, Math.round(270 * cv.height / cv.width)); if (hopChuCv.width !== W || hopChuCv.height !== H) { hopChuCv.width = W; hopChuCv.height = H; }
  const c = hopChuCv.getContext('2d', { willReadFrequently: true }); c.clearRect(0, 0, W, H); try { veDoHoa(c, W, H, g, t); } catch { return null; }
  const d = c.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null; const pad = 2; return { cx: (x0 + x1 + 1) / 2 / W, cy: (y0 + y1 + 1) / 2 / H, w: (x1 - x0 + 1 + pad * 2) / W, h: (y1 - y0 + 1 + pad * 2) / H, xoay: 0 };
}
function veTayChu() {
  const lop = $('#tayCam'); if (!lop || P.keoTay || P.dang || !P.chon || P.chon.k !== 'g' || P.cheDoMn) return; const g = mucChon(); if (!g || (g.kieu !== 'chu' && g.kieu !== 'sticker')) return;
  if (P.t < g.bd - 0.01 || P.t >= g.kt) return; const b0 = hopChu(g, P.t); if (!b0) return; const hop = el('div', 'tay tayChu'); datHop(hop, b0);
  ['tl', 'tr', 'bl', 'br'].forEach(x => hop.appendChild(el('i', 'goc ' + x))); if (g.kieu === 'chu') ['l', 'r'].forEach(x => { const i = el('i', 'mepTay m_' + x); i.dataset.mep = x; hop.appendChild(i); }); hop.appendChild(el('i', 'xoay')); lop.appendChild(hop);
  hop.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); if (P.lanBamCv && performance.now() - P.lanBamCv < 450) { P.lanBamCv = 0; suaChuChon(); return; }   /* lần bấm thứ hai của bấm đúp (lần đầu trúng khung xem trước) → sửa chữ */
    const r = lop.getBoundingClientRect(), cl = e.target.classList, loai = cl.contains('goc') ? 'co' : cl.contains('xoay') ? 'xoay' : e.target.dataset.mep ? 'rong' : 'doi';
    try { hop.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); P.keoTay = true;
    const off = P.t - g.bd, kf = ten => g.kfs && g.kfs[ten] && g.kfs[ten].length, lay = ten => kf(ten) ? giaTriKf(g, ten, off) : g[ten], dat = (ten, v) => { if (kf(ten)) datKf(g, ten, off, v); else g[ten] = v; };
    const gx = lay('x') == null ? 0.5 : lay('x'), gy = lay('y') == null ? 0.32 : lay('y'), tamX = r.left + b0.cx * r.width, tamY = r.top + b0.cy * r.height, x0 = e.clientX, y0 = e.clientY, d0 = Math.hypot(x0 - tamX, y0 - tamY) || 1, a0 = Math.atan2(y0 - tamY, x0 - tamX);
    const co0 = g.co || (g.kieu === 'sticker' ? 0.16 : 0.075), sc0 = giaTriKf(g, 'sc', off), xo0 = lay('xoay') || 0;
    let cho = false; const mv = ev => {
      if (loai === 'doi') { let nx = gx + (ev.clientX - x0) / r.width, ny = gy + (ev.clientY - y0) / r.height; const hx = !ev.altKey && Math.abs(b0.cx + nx - gx - 0.5) * r.width < MAC_DINH.hutKhungPx, hy = !ev.altKey && Math.abs(b0.cy + ny - gy - 0.5) * r.height < MAC_DINH.hutKhungPx; if (hx) nx = gx + 0.5 - b0.cx; if (hy) ny = gy + 0.5 - b0.cy; veVachTam(hx, hy); dat('x', +nx.toFixed(4)); dat('y', +ny.toFixed(4)); }
      else if (loai === 'co') { const k = Math.hypot(ev.clientX - tamX, ev.clientY - tamY) / d0; if (kf('sc')) datKf(g, 'sc', off, +Math.max(0.05, sc0 * k).toFixed(3)); else g.co = +Math.max(0.01, Math.min(0.6, co0 * k)).toFixed(4); }
      else if (loai === 'rong') { g.rongMax = +Math.max(0.08, Math.min(1.2, Math.abs(ev.clientX - tamX) * 2 / r.width)).toFixed(3); }
      else { let a = xo0 + (Math.atan2(ev.clientY - tamY, ev.clientX - tamX) - a0) * 180 / Math.PI; if (ev.shiftKey) a = Math.round(a / 15) * 15; else { const q = Math.round(a / 15) * 15; if (Math.abs(a - q) < 3) a = q; } dat('xoay', Math.round(a)); }
      if (!cho) { cho = true; requestAnimationFrame(() => { cho = false; veFrame(cx, cv.width, cv.height, P.t, null); const b = hopChu(g, P.t); if (b) datHop(hop, b); }); } };
    const up = () => { veVachTam(false, false); hop.removeEventListener('pointermove', mv); hop.removeEventListener('pointerup', up); hop.removeEventListener('pointercancel', up); P.keoTay = false; veProp(); veTl(); veKhung(); };
    hop.addEventListener('pointermove', mv); hop.addEventListener('pointerup', up); hop.addEventListener('pointercancel', up);
  });
  hop.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation(); suaChuChon(); });   // bấm đúp → sửa chữ
}
function khoiTaoTayChu() { const st = document.createElement('style'); st.textContent = '#tayCam .tay.tayChu .xoay,.ed.ccw #tayCam .tay.tayChu .xoay{top:auto;bottom:-30px}'; document.head.appendChild(st);   /* núm xoay nằm dưới khung chữ, không đè lên chữ */
  const veTayCu = veTay; veTay = function () { const r = veTayCu.apply(this, arguments); try { veTayChu(); } catch (e) { console.warn('veTayChu', e); } return r; }; }
/* ═════════ ĐỔI PHÍM TẮT (spec 6: Cài đặt → Phím tắt xem và đổi được). Bấm tổ hợp mới → phát lại đúng phím mặc định cho các bộ xử lý sẵn có; phím mặc định đã bị đổi đi thì không còn tác dụng ═════════ */
const PHIM_HD = [['tach', 'Tách tại đầu phát', 'Ctrl+B'], ['xoaTrai', 'Xoá phần trái đầu phát', 'Q'], ['xoaPhai', 'Xoá phần phải đầu phát', 'W'], ['phat', 'Phát / dừng', 'Space'], ['xoa', 'Xoá mục', 'Delete'],
  ['hoanTac', 'Hoàn tác', 'Ctrl+Z'], ['lamLai', 'Làm lại', 'Ctrl+Shift+Z'], ['chep', 'Sao chép', 'Ctrl+C'], ['cat', 'Cắt', 'Ctrl+X'], ['dan', 'Dán tại đầu phát', 'Ctrl+V'], ['nhan', 'Nhân đôi', 'Ctrl+D'], ['chonHet', 'Chọn tất cả', 'Ctrl+A'],
  ['luiKhung', 'Lùi 1 khung', 'ArrowLeft'], ['toiKhung', 'Tới 1 khung', 'ArrowRight'], ['moc', 'Thêm mốc', 'M'], ['vao', 'Đặt điểm vào (In)', 'I'], ['ra', 'Đặt điểm ra (Out)', 'O'],
  ['zoomTo', 'Phóng to dòng thời gian', 'Ctrl+='], ['zoomNho', 'Thu nhỏ dòng thời gian', 'Ctrl+-'], ['vuaKhung', 'Vừa khung dòng thời gian', 'Shift+Z'], ['chu', 'Thêm chữ', 'Ctrl+T'], ['tatTieng', 'Tắt / bật tiếng mục', 'Ctrl+Shift+M'],
  ['lienKet', 'Tách / liên kết âm thanh', 'Ctrl+Shift+L'], ['dongBang', 'Đóng băng khung', 'Ctrl+Shift+F'], ['ghep', 'Tạo clip ghép', 'Ctrl+G'], ['tachGhep', 'Tách clip ghép', 'Ctrl+Shift+G'], ['toanMH', 'Xem toàn màn hình', 'F'], ['xuat', 'Mở hộp Xuất', 'Ctrl+E'], ['luu', 'Lưu dự án', 'Ctrl+S'], ['nhap', 'Nhập footage', 'Ctrl+I']];
const TEN_PHIM = { Space: 'Space', Delete: 'Delete', Backspace: 'Backspace', Enter: 'Enter', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Equal: '=', Minus: '-', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', BracketLeft: '[', BracketRight: ']', Backquote: '`', Home: 'Home', End: 'End' };
function phimTuSuKien(e) { const c = e.code; if (!c || /^(Control|Shift|Alt|Meta)/.test(c)) return null; const k = c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c; return [(e.ctrlKey || e.metaKey) ? 'Ctrl' : '', e.altKey ? 'Alt' : '', e.shiftKey ? 'Shift' : '', k].filter(Boolean).join('+'); }
function suKienTuPhim(ph) { const ps = ph.split('+'), k = ps.pop(), sh = ps.includes('Shift'), code = /^[A-Z]$/.test(k) ? 'Key' + k : /^[0-9]$/.test(k) ? 'Digit' + k : ({ '=': 'Equal', '-': 'Minus' }[k] || k), key = /^[A-Z]$/.test(k) ? (sh ? k : k.toLowerCase()) : k === 'Space' ? ' ' : ({ Equal: '=', Minus: '-' }[code] || k); return { code, key, ctrlKey: ps.includes('Ctrl'), metaKey: false, altKey: ps.includes('Alt'), shiftKey: sh }; }
const hienPhim = ph => ph.split('+').map(x => TEN_PHIM[x] || x).join(' + ');
let PHIM_RIENG = {}; try { PHIM_RIENG = JSON.parse(localStorage.getItem('dv_phim') || '{}') || {}; } catch { }
const phimCua = id => PHIM_RIENG[id] || (PHIM_HD.find(x => x[0] === id) || [])[2];
function luuPhim() { try { localStorage.setItem('dv_phim', JSON.stringify(PHIM_RIENG)); } catch { } }
let phimDangDoi = null;
window.addEventListener('keydown', e => {
  if (e.__phimAo) return; const ph = phimTuSuKien(e); if (!ph) return;
  if (phimDangDoi) { e.preventDefault(); e.stopImmediatePropagation(); const id = phimDangDoi; phimDangDoi = null; if (ph === 'Escape') { veBangPhim(); return; } const trung = PHIM_HD.find(x => x[0] !== id && phimCua(x[0]) === ph); if (trung) { toast('“' + hienPhim(ph) + '” đang dùng cho “' + trung[1] + '” — chọn tổ hợp khác'); veBangPhim(); return; } const md = PHIM_HD.find(x => x[0] === id)[2]; if (ph === md) delete PHIM_RIENG[id]; else PHIM_RIENG[id] = ph; luuPhim(); veBangPhim(); toast('Đã đặt ' + hienPhim(ph)); return; }
  const a = document.activeElement; if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
  const hd = PHIM_HD.find(x => PHIM_RIENG[x[0]] && PHIM_RIENG[x[0]] === ph);
  if (hd) { e.preventDefault(); e.stopImmediatePropagation(); const ev = new KeyboardEvent('keydown', { ...suKienTuPhim(hd[2]), bubbles: true, cancelable: true }); ev.__phimAo = true; (document.activeElement && document.activeElement !== document.documentElement ? document.activeElement : document.body).dispatchEvent(ev); return; }
  if (PHIM_HD.some(x => x[2] === ph && PHIM_RIENG[x[0]] && PHIM_RIENG[x[0]] !== ph)) { e.preventDefault(); e.stopImmediatePropagation(); }   // phím mặc định đã được đổi sang tổ hợp khác
}, true);
function veBangPhim() {
  const box = $('#phimTuy'); if (!box) return; box.innerHTML = '';
  PHIM_HD.forEach(([id, ten, md]) => { const h = el('div', 'phimHang'); h.appendChild(el('span', 'ten', ten)); const b = el('button', 'btn nho ' + (PHIM_RIENG[id] ? 'xanh' : 'ghost'), phimDangDoi === id ? 'Nhấn tổ hợp mới…' : hienPhim(phimCua(id))); b.type = 'button'; b.dataset.phim = id; b.title = 'Bấm rồi nhấn tổ hợp phím mới (Esc để huỷ)'; b.onclick = () => { phimDangDoi = id; veBangPhim(); }; h.appendChild(b);
    const r = el('button', 'btn nho ghost', '↺'); r.type = 'button'; r.title = 'Về mặc định ' + hienPhim(md); r.disabled = !PHIM_RIENG[id]; r.onclick = () => { delete PHIM_RIENG[id]; luuPhim(); veBangPhim(); }; h.appendChild(r); box.appendChild(h); });
  const all = el('button', 'btn nho ghost', 'Đặt lại tất cả phím'); all.type = 'button'; all.onclick = () => { PHIM_RIENG = {}; luuPhim(); veBangPhim(); toast('Đã về phím tắt mặc định'); }; box.appendChild(all);
}
function khoiTaoDoiPhim() {
  const hop = $('#phimHop .box'); if (!hop) return; const t = hop.querySelector('table.phim');
  const tieuDe = el('b', null, 'Tuỳ chỉnh phím'); tieuDe.style.cssText = 'display:block;margin:12px 0 6px'; const box = el('div'); box.id = 'phimTuy'; t.parentNode.insertBefore(tieuDe, t); t.parentNode.insertBefore(box, t);
  const xem = el('b', null, 'Tất cả phím tắt'); xem.style.cssText = 'display:block;margin:12px 0 6px'; t.parentNode.insertBefore(xem, t);
  const st = document.createElement('style'); st.textContent = '#phimTuy{display:grid;gap:4px;max-height:42vh;overflow:auto;padding-right:4px}#phimTuy .phimHang{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;font-size:12px}#phimTuy .phimHang .btn{min-width:110px}#phimTuy .phimHang .btn.ghost[title^="Về"]{min-width:0}#phimHop .box{max-height:90vh;overflow:auto}'; document.head.appendChild(st);
  veBangPhim(); const cd = $('#caiHop .row'); if (cd) { const b = el('button', 'btn nho ghost', '⌨ Phím tắt…'); b.type = 'button'; b.onclick = () => { $('#caiHop').classList.remove('mo'); $('#phimHop').classList.add('mo'); veBangPhim(); }; cd.insertBefore(b, cd.firstChild); }
}
/* ═════════ MẶT NẠ v2 — theo spec "Mask trong CapCut desktop": toạ độ trong KHÔNG GIAN MỤC (gốc = tâm mục, đơn vị = phần kích thước mục),
   alpha = 1 − smoothstep(0, feather, SDF) tính đúng pixel của mục gốc (phóng mục 200% thì dải mờ trên màn to gấp đôi), chế độ mặt nạ riêng trên khung xem trước. ═════════
   mn = { v: 2, kieu, x, y, w, h, xoay, mem (0–100), bo (0–100), dao }
   · x, y: tâm mặt nạ, phần của rộng / cao mục (0 = tâm mục) · w, h: Tròn = đường kính, Chữ nhật = cạnh (phần của rộng / cao mục); Gương: h = độ rộng dải; Tim / Sao: w = nửa cỡ (phần của cạnh ngắn mục)
   · mem: phần trăm của cạnh ngắn / 2 · bo: phần trăm của cạnh ngắn hình / 2 */
const MN_THAM = { tuyen: ['x', 'y', 'xoay', 'mem'], guong: ['x', 'y', 'xoay', 'h', 'mem'], tron: ['x', 'y', 'w', 'h', 'xoay', 'mem'], chu_nhat: ['x', 'y', 'w', 'h', 'xoay', 'mem', 'bo'], tim: ['x', 'y', 'w', 'xoay', 'mem'], sao: ['x', 'y', 'w', 'xoay', 'mem'] };
function hinhMucMn(k, m, off, W, H) {   // ma trận không gian mục (px, gốc = tâm mục) → khung (px), cỡ mục
  if (k === 'g') { const bb = m._mnHop; if (!bb) return null; const gx = (m.kfs && m.kfs.x && m.kfs.x.length ? giaTriKf(m, 'x', off) : (m.x == null ? 0.5 : m.x)) * W, gy = (m.kfs && m.kfs.y && m.kfs.y.length ? giaTriKf(m, 'y', off) : (m.y == null ? 0.32 : m.y)) * H, xo = m.kfs && m.kfs.xoay && m.kfs.xoay.length ? giaTriKf(m, 'xoay', off) : (m.xoay || 0);
    return { mat: new DOMMatrix().translate(gx, gy).rotate(xo).translate(bb.cx * W - gx, bb.cy * H - gy), Wi: Math.max(2, bb.w * W), Hi: Math.max(2, bb.h * H) }; }
  const h0 = hopMuc(k, m), sc = giaTriKf(m, 'sc', off), sx = giaTriKf(m, 'scX', off), sy = giaTriKf(m, 'scY', off), x = giaTriKf(m, 'x', off), y = giaTriKf(m, 'y', off), xo = giaTriKf(m, 'xoay', off);
  return { mat: new DOMMatrix().translate(W / 2 + x * W, H / 2 + y * H).rotate(xo).scale(sc * sx * (m.latX ? -1 : 1), sc * sy * (m.latY ? -1 : 1)).translate(-W / 2, -H / 2).translate(h0.cx * W, h0.cy * H), Wi: h0.w * W, Hi: h0.h * H };
}
/* khung chữ chưa xoay (để mặt nạ chữ tính trên khung chữ, sau phần đệm nền) — quét điểm ảnh ở 270px, nhớ theo nội dung */
const mnChuCv = document.createElement('canvas');
function hopChuMn(g, t, veGoc) {
  const W = 270, H = Math.max(2, Math.round(270 * cv.height / cv.width)), khoa = [g.text, g.co, g.sc, g.rongMax, g.font, g.nen, g.dam, g.can, g.hoa, g.vien_day, g.nen_pad, W, H, JSON.stringify(g.kfs && g.kfs.sc || 0)].join('|');
  if (g._mnHop && g._mnKhoa === khoa) return g._mnHop;
  if (mnChuCv.width !== W || mnChuCv.height !== H) { mnChuCv.width = W; mnChuCv.height = H; } const c = mnChuCv.getContext('2d', { willReadFrequently: true }); c.clearRect(0, 0, W, H);
  const luu = { mn: g.mn, xoay: g.xoay, boVao: g.boVao, boRa: g.boRa, kfs: g.kfs }; g.mn = null; g.xoay = 0; g.boVao = true; g.boRa = true; if (g.kfs) { const k2 = { ...g.kfs }; delete k2.xoay; g.kfs = k2; }
  try { veGoc(c, W, H, g, g.kt > g.bd ? (g.bd + g.kt) / 2 : g.bd + 0.01); } catch { } finally { Object.assign(g, luu); }
  const d = c.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bb = x1 < 0 ? { cx: g.x == null ? 0.5 : g.x, cy: g.y == null ? 0.32 : g.y, w: 0.2, h: 0.06 } : { cx: (x0 + x1 + 1) / 2 / W, cy: (y0 + y1 + 1) / 2 / H, w: (x1 - x0 + 1) / W, h: (y1 - y0 + 1) / H };
  Object.defineProperty(g, '_mnHop', { value: bb, writable: true, configurable: true, enumerable: false }); Object.defineProperty(g, '_mnKhoa', { value: khoa, writable: true, configurable: true, enumerable: false }); return bb;
}
/* SDF tim / sao: lưới khoảng cách dựng một lần (đơn vị = nửa cỡ hình) */
const MN_LUOI = {}; const LUOI_N = 160, LUOI_R = 1.6;
function daGiacMn(kieu) { if (kieu === 'sao') { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; }
  const p = [], bz = (a, b, c, d, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
  for (let i = 0; i < 32; i++) p.push(bz([0, 0.85], [-1.4, -0.1], [-0.55, -1.05], [0, -0.45], i / 32)); for (let i = 0; i < 32; i++) p.push(bz([0, -0.45], [0.55, -1.05], [1.4, -0.1], [0, 0.85], i / 32)); return p; }
function luoiMn(kieu) {
  if (MN_LUOI[kieu]) return MN_LUOI[kieu]; const P2 = daGiacMn(kieu), n = LUOI_N, g = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = (i / (n - 1) * 2 - 1) * LUOI_R, y = (j / (n - 1) * 2 - 1) * LUOI_R; let dmin = 1e9, trong = false;
    for (let a = 0, b = P2.length - 1; a < P2.length; b = a++) { const [x1, y1] = P2[a], [x2, y2] = P2[b]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) trong = !trong; const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))), ex = x1 + t * dx - x, ey = y1 + t * dy - y, dd = ex * ex + ey * ey; if (dd < dmin) dmin = dd; }
    g[j * n + i] = (trong ? -1 : 1) * Math.sqrt(dmin); }
  return (MN_LUOI[kieu] = g);
}
function mauLuoi(g, x, y) { const n = LUOI_N, fx = (x / LUOI_R + 1) / 2 * (n - 1), fy = (y / LUOI_R + 1) / 2 * (n - 1); if (fx < 0 || fy < 0 || fx > n - 1 || fy > n - 1) return Math.hypot(x, y) - 0.9; const i = Math.min(n - 2, Math.floor(fx)), j = Math.min(n - 2, Math.floor(fy)), u = fx - i, v = fy - j; return (g[j * n + i] * (1 - u) + g[j * n + i + 1] * u) * (1 - v) + (g[(j + 1) * n + i] * (1 - u) + g[(j + 1) * n + i + 1] * u) * v; }
/* khoảng cách có dấu (px của mục) từ điểm (u, v) — gốc tâm mục — tới biên mặt nạ; âm = bên trong (phần được giữ) */
function sdfMn(mn, Wi, Hi, u, v) {
  const cx = (mn.x || 0) * Wi, cy = (mn.y || 0) * Hi, th = (mn.xoay || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), dx = u - cx, dy = v - cy, qx = dx * c + dy * s, qy = -dx * s + dy * c, ngan = Math.min(Wi, Hi);
  switch (mn.kieu) {
    case 'tuyen': return qy;
    case 'guong': return Math.abs(qy) - (mn.h == null ? 0.5 : mn.h) * Hi / 2;
    case 'tron': { const rx = Math.max(0.5, (mn.w == null ? 1 : mn.w) * Wi / 2), ry = Math.max(0.5, (mn.h == null ? 1 : mn.h) * Hi / 2), k = Math.hypot(qx / rx, qy / ry); return (k - 1) * Math.min(rx, ry); }
    case 'chu_nhat': { const bx = (mn.w == null ? 0.5 : mn.w) * Wi / 2, by = (mn.h == null ? 0.5 : mn.h) * Hi / 2, r = Math.max(0, Math.min(100, mn.bo || 0)) / 100 * Math.min(bx, by), ax = Math.abs(qx) - bx + r, ay = Math.abs(qy) - by + r; return Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - r; }
    default: { const sz = Math.max(0.5, (mn.w == null ? 0.5 : mn.w) * ngan); return mauLuoi(luoiMn(mn.kieu), qx / sz, qy / sz) * sz; }
  }
}
const MN_NHO = document.createElement('canvas'); let mnNhoKhoa = '';
/* vẽ alpha mặt nạ của mục vào canvas M (cỡ khung), theo đúng biến đổi của mục; che = chế độ mặt nạ (vùng bị che còn mờ 30% để thấy mà chỉnh) */
function veMatNaMuc(M, W, H, k, m, off, che) {
  const gm = M.getContext('2d'); gm.setTransform(1, 0, 0, 1, 0, 0); gm.clearRect(0, 0, W, H); const mn = mnTai(m, off), geo = mn && hinhMucMn(k, m, off, W, H); if (!geo) return;
  const kk = Math.min(1, 480 / Math.max(geo.Wi, geo.Hi)), w = Math.max(2, Math.round(geo.Wi * kk)), h = Math.max(2, Math.round(geo.Hi * kk)), f = Math.max(0, Math.min(100, mn.mem || 0)) / 100 * Math.min(geo.Wi, geo.Hi) / 2;
  const khoa = [mn.kieu, mn.x, mn.y, mn.w, mn.h, mn.xoay, mn.mem, mn.bo, mn.dao, che ? 1 : 0, w, h, geo.Wi.toFixed(1), geo.Hi.toFixed(1)].join('|');
  if (khoa !== mnNhoKhoa) { if (MN_NHO.width !== w || MN_NHO.height !== h) { MN_NHO.width = w; MN_NHO.height = h; } const g2 = MN_NHO.getContext('2d'), id = g2.createImageData(w, h), d = id.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i + 0.5) / kk - geo.Wi / 2, v = (j + 0.5) / kk - geo.Hi / 2, s = sdfMn(mn, geo.Wi, geo.Hi, u, v); let a; if (f > 0.5) { const t = Math.max(0, Math.min(1, s / f)); a = 1 - t * t * (3 - 2 * t); } else a = Math.max(0, Math.min(1, 0.5 - s * kk)); if (mn.dao) a = 1 - a; if (che) a = 0.3 + 0.7 * a; const o = (j * w + i) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.round(a * 255); }
    g2.putImageData(id, 0, 0); mnNhoKhoa = khoa; }
  gm.setTransform(geo.mat); if (mn.dao) { gm.save(); gm.setTransform(1, 0, 0, 1, 0, 0); gm.globalAlpha = 1; gm.fillStyle = '#fff'; gm.fillRect(0, 0, W, H); gm.restore(); gm.clearRect(-geo.Wi / 2, -geo.Hi / 2, geo.Wi, geo.Hi); } gm.imageSmoothingEnabled = true; gm.drawImage(MN_NHO, -geo.Wi / 2, -geo.Hi / 2, geo.Wi, geo.Hi); gm.setTransform(1, 0, 0, 1, 0, 0);
}
const cheMn = m => !!(P.cheDoMn && !P.dang && !P.dangXuat && m && m === mucChon());
/* mặc định theo spec khi vừa bấm hình */
function mnMacDinhMuc(kk, k, m) { const geo = m && hinhMucMn(k, m, offMuc(k, m), cv.width, cv.height); return mnMacDinh(kk, geo); }
function mnMacDinh(kk, geo) {
  const ngan = geo ? Math.min(geo.Wi, geo.Hi) : 1, Wi = geo ? geo.Wi : 1, Hi = geo ? geo.Hi : 1, o = { v: 2, kieu: kk, x: 0, y: 0, xoay: 0, mem: 0, dao: false };
  if (kk === 'guong') o.h = 0.5; else if (kk === 'tron') { o.w = +(ngan / Wi).toFixed(4); o.h = +(ngan / Hi).toFixed(4); } else if (kk === 'chu_nhat') { o.w = 0.5; o.h = 0.5; o.bo = 0; } else if (kk === 'tim' || kk === 'sao') o.w = 0.5;
  return o;
}
/* mặt nạ cũ (toạ độ theo khung, mềm viền 0–1) → v2 */
function doiMnCu(m) { const mn = m && m.mn; if (!mn || mn.v === 2 || !mn.kieu) return; const n = { v: 2, kieu: mn.kieu, x: (mn.x || 0) / 2, y: (mn.y || 0) / 2, xoay: mn.xoay || 0, mem: +((mn.mem || 0) * 24).toFixed(1), dao: !!mn.dao };
  if (mn.kieu === 'guong') n.h = mn.h == null ? 0.3 : mn.h; else if (mn.kieu === 'tron' || mn.kieu === 'chu_nhat') { n.w = mn.w == null ? 0.6 : mn.w; n.h = mn.h == null ? 0.6 : mn.h; if (mn.kieu === 'chu_nhat') n.bo = +((mn.bo || 0) * 100).toFixed(1); } else if (mn.kieu === 'tim' || mn.kieu === 'sao') n.w = +(Math.min(mn.w == null ? 0.6 : mn.w, mn.h == null ? 0.6 : mn.h) / 2).toFixed(4);
  m.mn = n; const kf = m.kfs; if (kf) { const doi = (ten, f) => { if (kf[ten]) kf[ten].forEach(x => { x.v = f(x.v); }); }; doi('mn_x', v => v / 2); doi('mn_y', v => v / 2); doi('mn_mem', v => v * 24); doi('mn_bo', v => v * 100); if (mn.kieu === 'tim' || mn.kieu === 'sao') doi('mn_w', v => v / 2); } }
function doiMnCuTatCa(ds) { (ds || []).forEach(m => { if (!m) return; doiMnCu(m); if (m.con) ['clips', 'gfx', 'broll'].forEach(k => doiMnCuTatCa(m.con[k])); }); }
/* ── bảng thuộc tính: lưới hình, vị trí (px khung dự án), cỡ, xoay, mềm viền, bo góc, đảo ngược, đặt lại; ◇ từng thông số; chọn nhiều cùng loại → áp chung ── */
function mucCungMn(k, m) { const ds = dsNhieu().filter(o => o.k === k && o.m); return ds.length > 1 && ds.some(o => o.m === m) ? ds.map(o => o.m) : [m]; }
function doiHinhMn(k, m, kk) {
  luuHoanTac(); mucCungMn(k, m).forEach(x => { if (kk === 'khong') { delete x.mn; if (x.kfs) MN_KENH.forEach(c => delete x.kfs['mn_' + c]); return; }
    const md = mnMacDinhMuc(kk, k, x), cu = x.mn; if (cu && cu.kieu) { ['x', 'y', 'xoay', 'mem'].forEach(c => { if (cu[c] != null) md[c] = cu[c]; }); md.dao = !!cu.dao; if (x.kfs) MN_KENH.forEach(c => { if (!MN_THAM[kk].includes(c)) delete x.kfs['mn_' + c]; }); }   /* spec: đổi hình giữ tâm / xoay / mềm viền (+ keyframe của chúng), bỏ tham số không áp dụng */
    x.mn = md; });
  P.cheDoMn = kk !== 'khong'; veProp(); veKhung(); veTl();
}
function oTruotMn2(box, nhan, min, max, buoc, k, m, x, hien, quy, nguoc) {   // quy: giá trị lưu → hiển thị; nguoc: hiển thị → lưu
  const ten = 'mn_' + x, off = offMuc(k, m), co = coKenhMn(m, x), tai = co && kfTai(m, ten, off) >= 0, md = mnMacDinhMuc(m.mn.kieu, k, m)[x], cur = co ? giaTriKf(m, ten, off) : (m.mn[x] == null ? md : m.mn[x]);
  const r = oTruot(box, nhan, min, max, buoc, quy(cur), hien, v => { const g = nguoc(v); mucCungMn(k, m).forEach(it => { if (!it.mn) return; if (coKenhMn(it, x)) datKf(it, ten, offMuc(k, it), g); else it.mn[x] = g; }); });
  r.dataset.md = quy(md == null ? 0 : md); const st = batDauMuc(k, m), ngoai = P.t < st - 0.01 || P.t > st + daiMuc(k, m) + 0.01;
  const nut = el('button', 'kfn' + (tai ? ' co' : co ? ' nua' : ''), tai ? '◆' : '◇'); nut.type = 'button'; nut.disabled = ngoai; nut.dataset.kenh = ten; nut.title = ngoai ? 'Đưa đầu phát vào trong mục để đặt keyframe' : (tai ? 'Bỏ keyframe ' : 'Thêm keyframe ') + KF_TEN[ten] + ' tại đầu phát';
  nut.onclick = () => { luuHoanTac(); const o2 = offMuc(k, m); if (kfTai(m, ten, o2) >= 0) xoaKf(m, ten, o2); else datKf(m, ten, o2, coKenhMn(m, x) ? giaTriKf(m, ten, o2) : (m.mn[x] == null ? md : m.mn[x])); veProp(); veTl(); veKhung(); };
  r.parentNode.insertBefore(nut, r); return r;
}
function veThuocTinhMatNa(box, k, m) {
  if (m && m.mn) doiMnCu(m); const n = el('div', 'nhom2 mnMucBang'); n.appendChild(el('b', null, 'Mặt nạ')); box.appendChild(n); const mn = m.mn;
  const luoi = el('div', 'mauCong'); Object.keys(MAT_NA).forEach(kk => { const b = el('button', (mn ? mn.kieu === kk : kk === 'khong') ? 'on' : null); b.type = 'button'; b.dataset.mn = kk; const sv = '<svg viewBox="0 0 40 26"><rect width="40" height="26" fill="#1c1c20"/>' + (kk === 'khong' ? '<path d="M8 20L32 6" stroke="#666"/>' : kk === 'tuyen' ? '<rect width="40" height="13" fill="currentColor"/>' : kk === 'guong' ? '<rect y="8" width="40" height="10" fill="currentColor"/>' : kk === 'tron' ? '<circle cx="20" cy="13" r="9" fill="currentColor"/>' : kk === 'chu_nhat' ? '<rect x="9" y="5" width="22" height="16" rx="3" fill="currentColor"/>' : kk === 'tim' ? '<path d="M20 22C6 13 12 2 20 8C28 2 34 13 20 22Z" fill="currentColor"/>' : '<path d="M20 3l2.6 6.6 7 .5-5.4 4.5 1.7 6.9L20 17.7l-5.9 3.8 1.7-6.9-5.4-4.5 7-.5z" fill="currentColor"/>') + '</svg>'; b.innerHTML = sv + '<span>' + MAT_NA[kk] + '</span>'; b.onclick = () => doiHinhMn(k, m, kk); luoi.appendChild(b); }); n.appendChild(luoi);
  n.addEventListener('pointerdown', () => { if (m.mn && !P.cheDoMn) { P.cheDoMn = true; veKhung(); } });   // bấm vào mục Mặt nạ → vào chế độ mặt nạ
  if (!mn) return;
  const { W } = kichThuoc(+($('#doPhanGiai') || {}).value || 1080), geo = hinhMucMn(k, m, offMuc(k, m), cv.width, cv.height) || { Wi: cv.width, Hi: cv.height }, Wpx = geo.Wi / cv.width * W, Hpx = geo.Hi / cv.width * W, ngan = Math.min(Wpx, Hpx), T = MN_THAM[mn.kieu], pc = v => Math.round(v) + '%';
  oTruotMn2(n, 'Vị trí X', -Math.round(Wpx), Math.round(Wpx), 1, k, m, 'x', v => Math.round(v) + ' px', v => v * Wpx, v => v / Wpx);
  oTruotMn2(n, 'Vị trí Y', -Math.round(Hpx), Math.round(Hpx), 1, k, m, 'y', v => Math.round(v) + ' px', v => v * Hpx, v => v / Hpx);
  if (mn.kieu === 'tim' || mn.kieu === 'sao') oTruotMn2(n, 'Kích thước', 1, 150, 1, k, m, 'w', pc, v => v * 100, v => v / 100);
  else if (mn.kieu === 'guong') oTruotMn2(n, 'Độ rộng dải', 1, 200, 1, k, m, 'h', pc, v => v * 100, v => v / 100);
  else if (T.includes('w')) { oTruotMn2(n, 'Rộng', 1, 200, 1, k, m, 'w', pc, v => v * 100, v => v / 100); oTruotMn2(n, 'Cao', 1, 200, 1, k, m, 'h', pc, v => v * 100, v => v / 100); }
  oTruotMn2(n, 'Xoay', -360, 360, 1, k, m, 'xoay', v => Math.round(v) + '°', v => v, v => v);
  oTruotMn2(n, 'Mềm viền', 0, 100, 1, k, m, 'mem', v => Math.round(v), v => v, v => v);
  if (mn.kieu === 'chu_nhat') oTruotMn2(n, 'Bo góc', 0, 100, 1, k, m, 'bo', v => Math.round(v), v => v, v => v);
  const hang = el('div', 'row'); const lb = el('label'); lb.appendChild(el('span', null, 'Đảo ngược')); const cb = el('input'); cb.type = 'checkbox'; cb.className = 'mnDao'; cb.checked = !!mn.dao; cb.onchange = () => { luuHoanTac(); mucCungMn(k, m).forEach(x => { if (x.mn) x.mn.dao = cb.checked; }); veKhung(); }; lb.appendChild(cb); n.appendChild(lb);
  const rs = el('button', 'btn nho ghost', '↺ Đặt lại mặt nạ'); rs.type = 'button'; rs.title = 'Về mặc định của hình đang chọn (không bỏ mặt nạ), bỏ keyframe mặt nạ'; rs.onclick = () => datLaiMn(k, m); hang.appendChild(rs); n.appendChild(hang); nutApTatCa(n, k, ['mn']);
}
function datLaiMn(k, m) { luuHoanTac(); mucCungMn(k, m).forEach(x => { if (!x.mn) return; const dao = x.mn.dao; x.mn = { ...mnMacDinhMuc(x.mn.kieu, k, x), dao }; if (x.kfs) MN_KENH.forEach(c => delete x.kfs['mn_' + c]); }); veProp(); veKhung(); veTl(); }
/* ── tay cầm trên khung (chế độ mặt nạ): tâm, cực / góc / cạnh / đường, núm xoay, tay mềm viền, chấm bo góc; Shift = đều / bước 15°; bấm đúp tay = đặt lại tham số đó ── */
function veTayMatNa() {
  const lop = $('#tayCam'); if (!lop || P.keoTay || P.dang || !P.chon || !P.cheDoMn) return; const k = P.chon.k; if (!['v', 'b', 'g'].includes(k)) return;
  const m = mucChon(); if (!m || !m.mn || !m.mn.kieu) return; doiMnCu(m); const st = batDauMuc(k, m), dai = daiMuc(k, m); if (P.t < st - 0.01 || P.t > st + dai + 0.01) return;
  lop.innerHTML = ''; const off = offMuc(k, m), r = lop.getBoundingClientRect(), f = r.width / cv.width;
  if (k === 'g' && !m._mnHop) return; const geo = hinhMucMn(k, m, off, cv.width, cv.height); if (!geo) return; const mn = mnTai(m, off);
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'mnSvg'); svg.setAttribute('width', r.width); svg.setAttribute('height', r.height); lop.appendChild(svg);
  const veTay = () => {
    svg.innerHTML = ''; [...lop.querySelectorAll('.mnTay')].forEach(x => x.remove()); const mn = mnTai(m, off), Wi = geo.Wi, Hi = geo.Hi, cx = (mn.x || 0) * Wi, cy = (mn.y || 0) * Hi, th = (mn.xoay || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    const raKhung = (qx, qy) => { const u = cx + qx * c - qy * s, v = cy + qx * s + qy * c, p = geo.mat.transformPoint(new DOMPoint(u, v)); return [p.x * f, p.y * f]; };
    const duong = (pts, dong) => { const pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', pts.map((p, i) => (i ? 'L' : 'M') + raKhung(p[0], p[1]).map(v => v.toFixed(1)).join(' ')).join(' ') + (dong ? ' Z' : '')); svg.appendChild(pa); };
    const ngan = Math.min(Wi, Hi), L = Math.max(Wi, Hi) * 2, rx = (mn.w == null ? 1 : mn.w) * Wi / 2, ry = (mn.h == null ? 1 : mn.h) * Hi / 2, bx = (mn.w == null ? 0.5 : mn.w) * Wi / 2, by = (mn.h == null ? 0.5 : mn.h) * Hi / 2, hm = (mn.h == null ? 0.5 : mn.h) * Hi / 2, sz = (mn.w == null ? 0.5 : mn.w) * ngan, fpx = (mn.mem || 0) / 100 * ngan / 2;
    let bien = 0, tay = [];
    if (mn.kieu === 'tuyen') { duong([[-L, 0], [L, 0]]); tay = [['mui', 0, 40 / f], ['xoay', Math.min(L, Wi) / 2 + 24 / f, 0]]; }
    else if (mn.kieu === 'guong') { duong([[-L, -hm], [L, -hm]]); duong([[-L, hm], [L, hm]]); tay = [['dai_t', 0, -hm], ['dai_b', 0, hm], ['xoay', Wi / 2 + 24 / f, 0]]; bien = hm; }
    else if (mn.kieu === 'tron') { const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts.push([Math.cos(a) * rx, Math.sin(a) * ry]); } duong(pts, true); tay = [['cuc_t', 0, -ry], ['cuc_b', 0, ry], ['cuc_l', -rx, 0], ['cuc_r', rx, 0], ['xoay', 0, -ry - 28 / f]]; bien = ry; }
    else if (mn.kieu === 'chu_nhat') { const rr = Math.max(0, Math.min(100, mn.bo || 0)) / 100 * Math.min(bx, by), pts = []; [[bx - rr, by - rr, 0], [-bx + rr, by - rr, 90], [-bx + rr, -by + rr, 180], [bx - rr, -by + rr, 270]].forEach(([qx, qy, a0]) => { for (let i = 0; i <= 8; i++) { const a = (a0 + i * 90 / 8) * Math.PI / 180; pts.push([qx + Math.cos(a) * rr, qy + Math.sin(a) * rr]); } }); duong(pts, true);
      tay = [['goc_tl', -bx, -by], ['goc_tr', bx, -by], ['goc_bl', -bx, by], ['goc_br', bx, by], ['canh_t', 0, -by], ['canh_b', 0, by], ['canh_l', -bx, 0], ['canh_r', bx, 0], ['bo', -bx + rr + 10 / f, -by + rr + 10 / f], ['xoay', 0, -by - 28 / f]]; bien = by; }
    else { duong(daGiacMn(mn.kieu).map(([a, b]) => [a * sz, b * sz]), true); tay = [['co', sz * 0.75, -sz * 0.75], ['xoay', 0, -sz - 28 / f]]; bien = sz * 0.9; }
    tay.push(['tam', 0, 0]); tay.push(['mem', 0, bien + fpx + 18 / f]);
    tay.forEach(([ten, qx, qy]) => { const [px, py] = raKhung(qx, qy), d = el('i', 'mnTay mt_' + ten.replace(/_.*/, '') + ' mt_' + ten); d.dataset.tay = ten; d.style.left = px + 'px'; d.style.top = py + 'px'; if (ten === 'mem') d.textContent = '↕'; lop.appendChild(d); });
  };
  veTay();
  const tip = el('div', 'mnTip'); tip.hidden = true; lop.appendChild(tip);
  lop.onpointerdown = e => {
    const tay = e.target.dataset && e.target.dataset.tay; if (!tay) return; e.preventDefault(); e.stopPropagation(); try { lop.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); P.keoTay = true;
    const mn0 = { ...mnTai(m, off) }, inv = geo.mat.inverse(), raMuc = ev => { const p = inv.transformPoint(new DOMPoint((ev.clientX - r.left) / f, (ev.clientY - r.top) / f)); return [p.x, p.y]; }, Wi = geo.Wi, Hi = geo.Hi, ngan = Math.min(Wi, Hi);
    const cuc = (ev, mnx) => { const [u, v] = raMuc(ev), th = (mnx.xoay || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), dx = u - (mnx.x || 0) * Wi, dy = v - (mnx.y || 0) * Hi; return [dx * c + dy * s, -dx * s + dy * c, u, v]; };
    const [u0, v0] = raMuc(e), a0 = Math.atan2(v0 - (mn0.y || 0) * Hi, u0 - (mn0.x || 0) * Wi), kep = (v, a, b) => Math.max(a, Math.min(b, v)), dat = (x, v) => { m.mn[x] = +v.toFixed(4); };
    const mv = ev => { const sh = ev.shiftKey, [qx, qy, u, v] = cuc(ev, mn0); let ghi = '';
      if (tay === 'tam') { let nx = (mn0.x || 0) * Wi + (u - u0), ny = (mn0.y || 0) * Hi + (v - v0); const nguong = MAC_DINH.hutKhungPx / f; let hx = false, hy = false; if (!ev.altKey) { if (Math.abs(nx) < nguong) { nx = 0; hx = true; } if (Math.abs(ny) < nguong) { ny = 0; hy = true; } const ct = inv.transformPoint(new DOMPoint(cv.width / 2, cv.height / 2)); if (!hx && Math.abs(nx - ct.x) < nguong) { nx = ct.x; hx = true; } if (!hy && Math.abs(ny - ct.y) < nguong) { ny = ct.y; hy = true; } } veVachTam(hx, hy); dat('x', nx / Wi); dat('y', ny / Hi); ghi = Math.round(nx) + ', ' + Math.round(ny) + ' px'; }
      else if (tay === 'mui') { const th = (mn0.xoay || 0) * Math.PI / 180, nx0 = -Math.sin(th), ny0 = Math.cos(th), dd = (u - u0) * nx0 + (v - v0) * ny0; dat('x', ((mn0.x || 0) * Wi + nx0 * dd) / Wi); dat('y', ((mn0.y || 0) * Hi + ny0 * dd) / Hi); ghi = 'dời ' + Math.round(dd) + ' px'; }
      else if (tay === 'xoay') { let a = (mn0.xoay || 0) + (Math.atan2(v - (mn0.y || 0) * Hi, u - (mn0.x || 0) * Wi) - a0) * 180 / Math.PI; if (sh) a = Math.round(a / 15) * 15; dat('xoay', Math.round(a)); ghi = Math.round(a) + '°'; }
      else if (tay.startsWith('cuc')) { const ngang = tay === 'cuc_l' || tay === 'cuc_r', rr = Math.max(ngang ? Wi : Hi, 1) * 0.01; if (sh) { const rv = Math.max(Math.abs(ngang ? qx : qy), rr); dat('w', 2 * rv / Wi); dat('h', 2 * rv / Hi); } else if (ngang) dat('w', 2 * Math.max(Math.abs(qx), Wi * 0.005) / Wi); else dat('h', 2 * Math.max(Math.abs(qy), Hi * 0.005) / Hi); ghi = 'rx ' + Math.round(m.mn.w * Wi / 2) + ' · ry ' + Math.round(m.mn.h * Hi / 2) + ' px'; }
      else if (tay.startsWith('goc')) { let bw = Math.max(Math.abs(qx), Wi * 0.005), bh = Math.max(Math.abs(qy), Hi * 0.005); if (sh) { const k2 = Math.max(bw / ((mn0.w || 0.5) * Wi / 2), bh / ((mn0.h || 0.5) * Hi / 2)); bw = (mn0.w || 0.5) * Wi / 2 * k2; bh = (mn0.h || 0.5) * Hi / 2 * k2; } dat('w', 2 * bw / Wi); dat('h', 2 * bh / Hi); ghi = Math.round(m.mn.w * 100) + '% × ' + Math.round(m.mn.h * 100) + '%'; }
      else if (tay.startsWith('canh')) { if (tay === 'canh_l' || tay === 'canh_r') dat('w', 2 * Math.max(Math.abs(qx), Wi * 0.005) / Wi); else dat('h', 2 * Math.max(Math.abs(qy), Hi * 0.005) / Hi); ghi = Math.round(m.mn.w * 100) + '% × ' + Math.round(m.mn.h * 100) + '%'; }
      else if (tay.startsWith('dai')) { dat('h', 2 * Math.max(Math.abs(qy), Hi * 0.005) / Hi); ghi = 'dải ' + Math.round(m.mn.h * 100) + '%'; }
      else if (tay === 'co') { const sz = Math.max(Math.hypot(qx, qy) / Math.SQRT2 / 0.75, ngan * 0.01); dat('w', sz / ngan); ghi = Math.round(m.mn.w * 100) + '%'; }
      else if (tay === 'bo') { const bx = (mn0.w || 0.5) * Wi / 2, by = (mn0.h || 0.5) * Hi / 2, vao = Math.max(0, ((qx + bx) + (qy + by)) / 2 - 10 / f); dat('bo', kep(vao / Math.min(bx, by) * 100, 0, 100)); ghi = 'bo góc ' + Math.round(m.mn.bo); }
      else if (tay === 'mem') { const bien = mn0.kieu === 'tuyen' ? 0 : mn0.kieu === 'guong' ? (mn0.h || 0.5) * Hi / 2 : mn0.kieu === 'tron' ? (mn0.h || 1) * Hi / 2 : mn0.kieu === 'chu_nhat' ? (mn0.h || 0.5) * Hi / 2 : (mn0.w || 0.5) * ngan * 0.9; dat('mem', kep((qy - bien - 18 / f) / (ngan / 2) * 100, 0, 100)); ghi = 'mềm viền ' + Math.round(m.mn.mem); }
      mnGhiKf(m, k, false, '', null); tip.hidden = false; tip.textContent = ghi; tip.style.left = (ev.clientX - r.left + 14) + 'px'; tip.style.top = (ev.clientY - r.top + 14) + 'px';
      veTay(); veFrame(cx2(), cv.width, cv.height, P.t, null); };
    const up = () => { tip.hidden = true; veVachTam(false, false); lop.removeEventListener('pointermove', mv); lop.removeEventListener('pointerup', up); lop.removeEventListener('pointercancel', up); P.keoTay = false; veProp(); veKhung(); veTl(); };
    lop.addEventListener('pointermove', mv); lop.addEventListener('pointerup', up); lop.addEventListener('pointercancel', up);
  };
  lop.ondblclick = e => { const tay = e.target.dataset && e.target.dataset.tay; if (!tay) return; e.preventDefault(); e.stopPropagation(); luuHoanTac(); const md = mnMacDinhMuc(m.mn.kieu, k, m), ds = tay === 'tam' || tay === 'mui' ? ['x', 'y'] : tay === 'xoay' ? ['xoay'] : tay === 'mem' ? ['mem'] : tay === 'bo' ? ['bo'] : ['w', 'h'];
    ds.forEach(x => { if (md[x] != null) m.mn[x] = md[x]; if (m.kfs) delete m.kfs['mn_' + x]; }); veProp(); veKhung(); };
}
function khoiTaoMatNa2() {
  const st = document.createElement('style'); st.textContent = '#tayCam .mnSvg{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}#tayCam .mnSvg path{fill:none;stroke:#fff;stroke-width:1.5;stroke-dasharray:5 4;filter:drop-shadow(0 0 1px rgba(0,0,0,.8))}#tayCam .mnTay{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:2px solid var(--ea,#99DF00);pointer-events:auto;touch-action:none;z-index:3;font-style:normal;font-size:9px;line-height:8px;text-align:center;color:#111}#tayCam .mt_tam{cursor:move;width:14px;height:14px;margin:-7px 0 0 -7px;background:var(--ea,#99DF00)}#tayCam .mt_cuc_t,#tayCam .mt_cuc_b,#tayCam .mt_canh_t,#tayCam .mt_canh_b,#tayCam .mt_dai,#tayCam .mt_mui{cursor:ns-resize}#tayCam .mt_cuc_l,#tayCam .mt_cuc_r,#tayCam .mt_canh_l,#tayCam .mt_canh_r{cursor:ew-resize}#tayCam .mt_goc,#tayCam .mt_co{cursor:nwse-resize;border-radius:3px}#tayCam .mt_xoay{cursor:grab;background:#222;border-color:#fff}#tayCam .mt_mem{cursor:ns-resize;width:16px;height:16px;margin:-8px 0 0 -8px;background:#222;color:#fff;border-color:#fff}#tayCam .mt_bo{width:9px;height:9px;margin:-4.5px 0 0 -4.5px;cursor:se-resize;background:#ffd400}#tayCam .mnTip{position:absolute;background:rgba(0,0,0,.8);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:nowrap;z-index:4}'; document.head.appendChild(st);
  /* thoát chế độ mặt nạ: bấm khung xem trước (ngoài tay cầm), chọn mục khác */
  cv.addEventListener('pointerdown', () => { if (P.cheDoMn) { P.cheDoMn = false; if (!P.dang) veKhung(); } }, true);
  const vePropCu = veProp; veProp = function () { const m = mucChon(); if (P.cheDoMn && (!m || !m.mn || m !== P.mnMuc)) P.cheDoMn = false; P.mnMuc = m; const r = vePropCu.apply(this, arguments); return r; };
  const veTayCu = veTay; veTay = function () { if (P.cheDoMn && !P.dang) { const m = mucChon(); if (m && m.mn && m.mn.kieu) { const lop = $('#tayCam'); if (lop && !P.keoTay) lop.innerHTML = ''; try { veTayMatNa(); } catch (e) { console.warn('veTayMatNa', e); } return; } } const lop = $('#tayCam'); if (lop) { lop.onpointerdown = null; lop.ondblclick = null; } return veTayCu.apply(this, arguments); };
  const veKxCu = veKhungXuat; veKhungXuat = async function () { P.dangXuat = true; try { return await veKxCu.apply(this, arguments); } finally { P.dangXuat = false; } };
  /* chuột phải trên khung khi đang ở chế độ mặt nạ: Đặt lại / Đảo ngược / Bỏ mặt nạ */
  const ctxMn = e => { if (!P.cheDoMn) return; const m = mucChon(); if (!m || !m.mn) return; e.preventDefault(); e.stopPropagation(); const k = P.chon.k; moMenu(e.clientX, e.clientY, [{ ic: 'undo', t: 'Đặt lại mặt nạ', f: () => datLaiMn(k, m) }, { ic: 'mirror', t: 'Đảo ngược', f: () => { luuHoanTac(); m.mn.dao = !m.mn.dao; veProp(); veKhung(); } }, { ic: 'trash', t: 'Bỏ mặt nạ', f: () => doiHinhMn(k, m, 'khong') }]); };
  cv.addEventListener('contextmenu', ctxMn, true); const lop = $('#tayCam'); if (lop) lop.addEventListener('contextmenu', ctxMn, true);
  const veTlCu = veTl; veTl = function () { doiMnCuTatCa(P.clips); doiMnCuTatCa(P.broll); doiMnCuTatCa(P.gfx); return veTlCu.apply(this, arguments); };
}

/* ── Cắt khung (crop) kiểu CapCut: đổi vùng cắt mà phần hình còn lại đứng yên trên khung; chế độ cắt kéo tay ngay trên khung xem ── */
const CAT0 = { l: 0, t: 0, r: 0, b: 0 };
function catCua(m) { const c = (m && m.cat) || CAT0; return { l: c.l || 0, t: c.t || 0, r: c.r || 0, b: c.b || 0 }; }
function apDoiCat(k, m, moi) {
  const kp = v => Math.max(0, Math.min(0.95, +v || 0)); moi = { l: kp(moi.l), t: kp(moi.t), r: kp(moi.r), b: kp(moi.b) };
  if (moi.l + moi.r > 0.95) moi.r = 0.95 - moi.l; if (moi.t + moi.b > 0.95) moi.b = 0.95 - moi.t;
  const cu = catCua(m), W = cv.width, H = cv.height, coMoi = moi.l || moi.t || moi.r || moi.b, datCat = () => { if (coMoi) m.cat = moi; else delete m.cat; };
  if (k === 'b' && m.kieu === 'pip') { datCat(); return; }   // khung nhỏ cố định: chỉ đổi phần hình bên trong
  const h0 = hopMuc(k, m), kf = m.kfs || {}, mocs = new Set(); ['x', 'y'].forEach(p => (kf[p] || []).forEach(f => mocs.add(f.t)));
  const dl = t => { const s = giaTriKf(m, 'sc', t), sx = giaTriKf(m, 'scX', t) || 1, sy = giaTriKf(m, 'scY', t) || 1, a = (giaTriKf(m, 'xoay', t) || 0) * Math.PI / 180, Wu = h0.w * W * s * sx / (1 - cu.l - cu.r), Hu = h0.h * H * s * sy / (1 - cu.t - cu.b);
    const o = c => { let u = (c.l - c.r) / 2 * Wu, v = (c.t - c.b) / 2 * Hu; if (m.latX) u = -u; if (m.latY) v = -v; return [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]; }, p0 = o(cu), p1 = o(moi); return [(p1[0] - p0[0]) / W, (p1[1] - p0[1]) / H]; };
  const dNay = dl(offMuc(k, m)), dMoc = new Map([...mocs].map(t => [t, dl(t)]));
  datCat(); const h1 = hopMuc(k, m), f = h0.w * (1 - moi.l - moi.r) / ((1 - cu.l - cu.r) * h1.w);
  if (isFinite(f) && f > 0) { if (kf.sc && kf.sc.length) kf.sc.forEach(x => { x.v *= f; }); m.sc = (m.sc == null ? 1 : m.sc) * f; }
  ['x', 'y'].forEach((p, i) => { if (kf[p] && kf[p].length) kf[p].forEach(x => { x.v += dMoc.get(x.t)[i]; }); m[p] = (m[p] || 0) + dNay[i]; });
}
const CAT_TL = [['tu', 'Tự do', 0], ['goc', 'Gốc', -1], ['9:16', '9:16', 9 / 16], ['16:9', '16:9', 16 / 9], ['1:1', '1:1', 1], ['4:5', '4:5', 0.8], ['3:4', '3:4', 0.75], ['4:3', '4:3', 4 / 3]];
function batCheDoCat() {
  const k = P.chon && P.chon.k, m = mucChon(); if (!m || !['v', 'b'].includes(k)) { toast('Chọn một đoạn video / ảnh để cắt khung'); return; }
  const s = srcCua(m.src); if (!s || !s.w) { toast('Đoạn này không cắt khung được'); return; }
  if (P.dang) dung(); const st = batDauMuc(k, m), dai = daiMuc(k, m); if (P.t < st || P.t > st + dai) P.t = st + Math.min(0.1, dai / 2);
  luuHoanTac(); const c0 = catCua(m); P.cheDoCat = { k, m, c: c0, c0, tiLe: 0, chup: P.hoanTac[P.hoanTac.length - 1] }; P.cheDoMn = false;
  apDoiCat(k, m, CAT0); veKhung(); veProp();
}
function xongCat(giu) {
  const o = P.cheDoCat; if (!o) return; P.cheDoCat = null;
  const doi = ['l', 't', 'r', 'b'].some(p => Math.abs(o.c[p] - o.c0[p]) > 1e-4);
  if (giu && doi) apDoiCat(o.k, o.m, o.c);
  else { apTT(o.chup); if (P.hoanTac[P.hoanTac.length - 1] === o.chup) P.hoanTac.pop(); }
  veTl(); veProp(); veKhung(); if (giu && doi) toast('Đã cắt khung · Ctrl+Z để hoàn tác');
}
function veTayCat() {
  const o = P.cheDoCat, lop = $('#tayCam'); if (!o || !lop) return; lop.innerHTML = ''; lop.onpointerdown = null; lop.ondblclick = null;
  const { k, m } = o, b = tinhHop(k, m), hop = el('div', 'catHop'); datHop(hop, b); lop.appendChild(hop);
  const vung = el('div', 'catVung'); hop.appendChild(vung);
  const vis = () => { const c = o.c; let L = c.l, R = c.r, T = c.t, B = c.b; if (m.latX) [L, R] = [R, L]; if (m.latY) [T, B] = [B, T]; return { L, R, T, B }; };
  const datVis = v => { let { L, R, T, B } = v; if (m.latX) [L, R] = [R, L]; if (m.latY) [T, B] = [B, T]; o.c = { l: L, r: R, t: T, b: B }; };
  const s = srcCua(m.src), co = () => Math.round(s.w * (1 - o.c.l - o.c.r)) + ' × ' + Math.round(s.h * (1 - o.c.t - o.c.b)) + ' px';
  const nhan = el('span', 'catCo'); vung.appendChild(nhan);
  const ve = () => { const v = vis(); Object.assign(vung.style, { left: v.L * 100 + '%', top: v.T * 100 + '%', right: v.R * 100 + '%', bottom: v.B * 100 + '%' }); nhan.textContent = co(); };
  ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'].forEach(h => { const i = el('i', 'catTay c_' + h); i.dataset.h = h; vung.appendChild(i); }); ve();
  const R0 = lop.getBoundingClientRect(), bw = Math.max(1, b.w * R0.width), bh = Math.max(1, b.h * R0.height), th = -(b.xoay || 0) * Math.PI / 180, MIN = 0.05;
  const kp = (v, a, z) => Math.max(a, Math.min(z, v));
  const epTiLe = (v, h, giuTam) => {   // ép tỉ lệ (px) của vùng cắt; neo cạnh đối diện cạnh đang kéo
    const r = o.tiLe; if (!r) return v; let w = 1 - v.L - v.R, hh = 1 - v.T - v.B;
    if (h === 't' || h === 'b') { w = hh * bh * r / bw; if (w > 1) { w = 1; hh = bw / r / bh; } } else { hh = w * bw / r / bh; if (hh > 1) { hh = 1; w = r * bh / bw; } }
    if (giuTam || h === 'l' || h === 'r') { const cy = (v.T + 1 - v.B) / 2; v.T = kp(cy - hh / 2, 0, 1 - hh); v.B = 1 - v.T - hh; }
    else if (h.includes('t')) { v.T = kp(1 - v.B - hh, 0, 1 - hh); v.B = 1 - v.T - hh; } else { v.B = kp(1 - v.T - hh, 0, 1 - hh); v.T = 1 - v.B - hh; }
    if (!giuTam && h.includes('l')) { v.L = kp(1 - v.R - w, 0, 1 - w); v.R = 1 - v.L - w; } else if (!giuTam && h.includes('r')) { v.R = kp(1 - v.L - w, 0, 1 - w); v.L = 1 - v.R - w; } else { const cx = (v.L + 1 - v.R) / 2; v.L = kp(cx - w / 2, 0, 1 - w); v.R = 1 - v.L - w; }
    return v; };
  vung.onpointerdown = e => {
    if (e.button) return; e.preventDefault(); e.stopPropagation(); const h = e.target.dataset.h || '', v0 = vis(), x0 = e.clientX, y0 = e.clientY; try { vung.setPointerCapture(e.pointerId); } catch { }
    const tl0 = (1 - v0.L - v0.R) * bw / ((1 - v0.T - v0.B) * bh);
    const mv = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0, fu = (dx * Math.cos(th) - dy * Math.sin(th)) / bw, fv = (dx * Math.sin(th) + dy * Math.cos(th)) / bh; let v = { ...v0 };
      if (!h) { v.L = kp(v0.L + fu, 0, v0.L + v0.R); v.R = v0.L + v0.R - v.L; v.T = kp(v0.T + fv, 0, v0.T + v0.B); v.B = v0.T + v0.B - v.T; }
      else { if (h.includes('l')) v.L = kp(v0.L + fu, 0, 1 - v0.R - MIN); if (h.includes('r')) v.R = kp(v0.R - fu, 0, 1 - v0.L - MIN); if (h.includes('t')) v.T = kp(v0.T + fv, 0, 1 - v0.B - MIN); if (h.includes('b')) v.B = kp(v0.B - fv, 0, 1 - v0.T - MIN);
        if (o.tiLe) v = epTiLe(v, h); else if (ev.shiftKey && h.length === 2) { const tg = o.tiLe; o.tiLe = tl0; v = epTiLe(v, h); o.tiLe = tg; } }
      datVis(v); ve(); };
    const up = () => { vung.removeEventListener('pointermove', mv); vung.removeEventListener('pointerup', up); vung.removeEventListener('pointercancel', up); };
    vung.addEventListener('pointermove', mv); vung.addEventListener('pointerup', up); vung.addEventListener('pointercancel', up);
  };
  vung.ondblclick = e => { e.stopPropagation(); o.tiLe = 0; o.c = { ...CAT0 }; veTayCat(); };
  // thanh công cụ cắt
  const bar = el('div', 'catBar'); CAT_TL.forEach(([id, ten, r]) => { const bt = el('button', null, ten); bt.type = 'button'; bt.dataset.tl = id; bt.setAttribute('aria-pressed', String((o.tlId || 'tu') === id)); bt.onclick = e => { e.stopPropagation(); o.tlId = id;
      if (r === 0) { o.tiLe = 0; } else { const rr = r < 0 ? bw / bh : r; o.tiLe = rr; if (r < 0) o.c = { ...CAT0 }; else datVis(epTiLe({ L: 0, R: 0, T: 0, B: 0 }, '', true)); }
      veTayCat(); }; bar.appendChild(bt); });
  const nut = (t, cls, f) => { const bt = el('button', cls, t); bt.type = 'button'; bt.onclick = e => { e.stopPropagation(); f(); }; bar.appendChild(bt); return bt; };
  nut('↺ Đặt lại', 'catDl', () => { o.tiLe = 0; o.tlId = 'tu'; o.c = { ...CAT0 }; veTayCat(); }); nut('Huỷ', 'catHuy', () => xongCat(false)); nut('✓ Xong', 'catXong', () => xongCat(true));
  bar.onpointerdown = e => e.stopPropagation(); $$('.catBar').forEach(x => x.remove()); const tren = $('.ecol.giua'); if (tren && tren.offsetParent && $('#ed').classList.contains('ccw')) { bar.classList.add('catTren'); tren.appendChild(bar); } else lop.appendChild(bar);   /* thanh tỉ lệ nằm ở dải trên khung xem, không che hình */
}
function khoiTaoCatKhung() {
  const st = document.createElement('style'); st.textContent = '#tayCam .catHop{position:absolute;transform-origin:50% 50%;outline:1px dashed rgba(255,255,255,.55);pointer-events:none}#tayCam .catVung{position:absolute;box-shadow:0 0 0 9999px rgba(0,0,0,.58);outline:1.5px solid #fff;cursor:move;pointer-events:auto;touch-action:none;background-image:linear-gradient(to right,transparent calc(33.33% - .5px),rgba(255,255,255,.45) calc(33.33% - .5px),rgba(255,255,255,.45) calc(33.33% + .5px),transparent calc(33.33% + .5px),transparent calc(66.66% - .5px),rgba(255,255,255,.45) calc(66.66% - .5px),rgba(255,255,255,.45) calc(66.66% + .5px),transparent calc(66.66% + .5px)),linear-gradient(to bottom,transparent calc(33.33% - .5px),rgba(255,255,255,.45) calc(33.33% - .5px),rgba(255,255,255,.45) calc(33.33% + .5px),transparent calc(33.33% + .5px),transparent calc(66.66% - .5px),rgba(255,255,255,.45) calc(66.66% - .5px),rgba(255,255,255,.45) calc(66.66% + .5px),transparent calc(66.66% + .5px))}#tayCam .catTay{position:absolute;width:18px;height:18px;pointer-events:auto;touch-action:none;font-style:normal}#tayCam .catTay::after{content:"";position:absolute;inset:4px;border:0 solid #fff;filter:drop-shadow(0 0 1px rgba(0,0,0,.9))}#tayCam .c_tl{left:-5px;top:-5px;cursor:nwse-resize}#tayCam .c_tl::after{border-left-width:3px;border-top-width:3px}#tayCam .c_tr{right:-5px;top:-5px;cursor:nesw-resize}#tayCam .c_tr::after{border-right-width:3px;border-top-width:3px}#tayCam .c_bl{left:-5px;bottom:-5px;cursor:nesw-resize}#tayCam .c_bl::after{border-left-width:3px;border-bottom-width:3px}#tayCam .c_br{right:-5px;bottom:-5px;cursor:nwse-resize}#tayCam .c_br::after{border-right-width:3px;border-bottom-width:3px}#tayCam .c_t,#tayCam .c_b{left:calc(50% - 12px);width:24px;cursor:ns-resize}#tayCam .c_t{top:-8px}#tayCam .c_b{bottom:-8px}#tayCam .c_t::after,#tayCam .c_b::after{inset:7px 0;border-top-width:3px}#tayCam .c_l,#tayCam .c_r{top:calc(50% - 12px);height:24px;cursor:ew-resize}#tayCam .c_l{left:-8px}#tayCam .c_r{right:-8px}#tayCam .c_l::after,#tayCam .c_r::after{inset:0 7px;border-left-width:3px}#tayCam .catCo{position:absolute;left:4px;top:4px;font:600 10px/1.4 system-ui;color:#fff;background:rgba(0,0,0,.6);padding:1px 5px;border-radius:4px;pointer-events:none;white-space:nowrap}.catBar{position:absolute;left:6px;right:6px;bottom:8px;margin:auto;width:fit-content;max-width:calc(100% - 12px);display:flex;flex-wrap:wrap;justify-content:center;gap:4px;padding:5px;border-radius:10px;background:rgba(14,16,18,.92);pointer-events:auto;z-index:8}.catBar.catTren{top:8px;bottom:auto;left:8px;right:8px;width:auto;max-width:none;align-items:center;border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.4)}.ed.ccw .ecol.giua{position:relative}.catBar button{flex:none;font:600 11px/1 system-ui;color:#e8eaec;background:transparent;border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:5px 7px;cursor:pointer}.catBar button[aria-pressed="true"]{border-color:var(--ea,#99DF00);color:var(--ea,#99DF00)}.catBar .catXong{background:var(--ea,#99DF00);color:#111;border-color:transparent}.catBar .catDl{margin-left:6px}'; document.head.appendChild(st);
  const veTayGoc = veTay; veTay = function () { if (P.cheDoCat) { if (P.cheDoCat.m !== mucChon()) { xongCat(true); } else { veTayCat(); return; } } $$('.catBar').forEach(x => x.remove()); return veTayGoc.apply(this, arguments); };
  const vePropGoc = veProp; veProp = function () { if (P.cheDoCat && P.cheDoCat.m !== mucChon()) xongCat(true); return vePropGoc.apply(this, arguments); };
  const hoanTacGoc = hoanTac; hoanTac = function () { if (P.cheDoCat) { xongCat(false); return; } return hoanTacGoc.apply(this, arguments); };
  document.addEventListener('keydown', e => { if (!P.cheDoCat) return; if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); xongCat(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); xongCat(false); } }, true);
  cv.addEventListener('pointerdown', e => { if (P.cheDoCat) { e.preventDefault(); e.stopImmediatePropagation(); xongCat(true); } }, true);
  $('#btnCrop').onclick = () => { if (P.cheDoCat) { xongCat(true); return; } if (!mucChon() || !['v', 'b'].includes(P.chon.k)) { const { clip } = viTri(P.t); if (clip < 0) { toast('Chưa có đoạn nào'); return; } P.chon = { k: 'v', i: clip }; } batCheDoCat(); };
  $('#btnCrop').title = 'Cắt khung trên khung xem (kéo các góc / cạnh) · Enter xong · Esc huỷ';
}
/* ── Inspector theo spec: cuối mỗi tab có Đặt lại (cả tab) + Áp cho tất cả; chọn nhiều mục cùng loại → chỉnh một lần áp cho cả nhóm, ô khác nhau hiện “–”; lưới tỉ lệ khung ── */
const TAB_KHOA = {
  'Video': ['x', 'y', 'sc', 'scX', 'scY', 'khoaTiLe', 'xoay', 'latX', 'latY', 'mo', 'cat', 'blend', 'boGoc', 'vienDay', 'vienMau', 'vienMo', 'bongMo', 'bongKieu', 'bongNhoe', 'bongKc', 'bongGoc', 'bongMau', 'bongLan', 'mb', 'mn', 'chroma', 'chroma_mau', 'chroma_nguong', 'vua'],
  'Âm thanh': ['am', 'fi', 'fo', 'khuOn', 'pan', 'caoDo', 'giong'],
  'Tốc độ': ['toc', 'cong', 'doiCao'],
  'Hoạt ảnh': ['anVao', 'anRa', 'anLap', 'hu', 'ra', 'lap', 'dVao', 'dRa'],
  'Điều chỉnh': ['loc', 'locMuc', 'sang', 'tuong_phan', 'bao_hoa', 'lutMuc', 'hu2', 'huMuc', ...MAU_KEYS],
  'Văn bản': ['font', 'dam', 'nghieng', 'gach', 'can', 'mau', 'mau2', 'gocMau', 'nen', 'nen_mau', 'nen_mo', 'nen_bo', 'nen_pad', 'vien_mau', 'vien_day', 'phat_sang', 'gianChu', 'dongCao', 'co', 'cong', 'doc', 'bong', 'bongChu', 'hoa', 'blend', 'mn'],
  'Nhãn dán': ['x', 'y', 'sc', 'xoay', 'mo', 'latX', 'latY', 'blend', 'mn']
};
const KHONG_CHEP = new Set(['id', 'src', 'bd', 'kt', 't_bd', 'lop', 'nhom', 'con', 'kieu', 'el', 'gain', 'text', 'phu', 'ten', 'mau_id', 'trong', 'an', 'tuy']);
const kfCuaKhoa = (m, keys) => Object.keys(m.kfs || {}).filter(ch => keys.includes(ch) || (keys.includes('mn') && ch.startsWith('mn_')) || (keys.includes('am') && ch === 'am'));
function tabHienTai() { const b = $('#propChon > .ptabs button.on'); if (b) return b.textContent; const n = [...$$('#propChon > .nhom2')].find(x => !x.classList.contains('an')); return n ? (tenNhom(n) === '*' ? null : tenNhom(n)) : null; }
function cungLoai(k, a, b) { if (k === 'v') { const sa = srcCua(a.src), sb = srcCua(b.src); return !b.trong && (!!(sa && sa.loai === 'anh') === !!(sb && sb.loai === 'anh')); } if (k === 'b') return (a.lop || 2) === (b.lop || 2); if (k === 'g') return a.kieu === b.kieu; return false; }
function chepKhoa(nguon, dich, keys) {
  keys.forEach(p => { if (KHONG_CHEP.has(p)) return; if (nguon[p] === undefined) delete dich[p]; else dich[p] = JSON.parse(JSON.stringify(nguon[p])); });
  const chs = new Set([...kfCuaKhoa(nguon, keys), ...kfCuaKhoa(dich, keys)]); if (chs.size) { dich.kfs = dich.kfs || {}; chs.forEach(ch => { if (nguon.kfs && nguon.kfs[ch]) dich.kfs[ch] = JSON.parse(JSON.stringify(nguon.kfs[ch])); else delete dich.kfs[ch]; }); if (!Object.keys(dich.kfs).length) delete dich.kfs; }
}
/* đổi thuộc tính hàng loạt trên V1: đổi độ dài (tốc độ) thì dồn phần sau — làm từ cuối về đầu để vị trí phía trước không xê dịch */
function doiV1(ds, f) { const st = new Map(); let acc = 0; P.clips.forEach(c => { st.set(c, acc); acc += daiC(c); }); ds.slice().sort((a, b) => st.get(b) - st.get(a)).forEach(c => { const cu = daiC(c); f(c); const moi = daiC(c); if (Math.abs(moi - cu) > 1e-4) ripple(st.get(c) + cu, moi - cu); }); }
function datLaiTab(tab) {
  const k = P.chon && P.chon.k, m = mucChon(), keys = TAB_KHOA[tab]; if (!m || !keys) return; luuHoanTac();
  const xoa = c => { keys.forEach(p => { if (!KHONG_CHEP.has(p)) delete c[p]; }); kfCuaKhoa(c, keys).forEach(ch => delete c.kfs[ch]); if (c.kfs && !Object.keys(c.kfs).length) delete c.kfs; };
  const ds = (dsNhieu().length > 1 ? dsNhieu().filter(o => o.k === k).map(o => o.m) : [m]);
  if (k === 'v') doiV1(ds, xoa); else ds.forEach(xoa);
  veTl(); veProp(); veKhung(); toast('Đã đặt lại tab ' + tab + (ds.length > 1 ? ' cho ' + ds.length + ' mục' : ''));
}
function apTatCaTab(tab) {
  const k = P.chon && P.chon.k, m = mucChon(), keys = TAB_KHOA[tab]; if (!m || !keys) return;
  const mang = k === 'v' ? P.clips : k === 'b' ? P.broll : k === 'g' ? P.gfx : []; const ds = mang.filter(x => x !== m && cungLoai(k, m, x)); if (!ds.length) { toast('Không có mục cùng loại nào khác trên track này'); return; }
  luuHoanTac(); if (k === 'v') doiV1(ds, c => chepKhoa(m, c, keys)); else ds.forEach(c => chepKhoa(m, c, keys));
  veTl(); veKhung(); toast('Đã áp tab ' + tab + ' cho ' + ds.length + ' mục cùng loại');
}
function themCuoiTab() {
  const box = $('#propChon'); if (!box) return; box.querySelectorAll(':scope > .tabCuoi').forEach(x => x.remove());
  if (!P.chon || !['v', 'b', 'g'].includes(P.chon.k) || !mucChon()) return; const tab = tabHienTai(); if (!tab || !TAB_KHOA[tab]) return;
  const nhieu = dsNhieu().length > 1, d = el('div', 'tabCuoi'), b1 = el('button', 'btn nho ghost', '↺ Đặt lại'), b2 = el('button', 'btn nho', 'Áp cho tất cả');
  b1.type = b2.type = 'button'; b1.title = 'Đưa mọi thông số của tab ' + tab + ' về mặc định' + (nhieu ? ' (mọi mục đang chọn)' : ''); b2.title = 'Áp thông số tab ' + tab + ' cho mọi mục cùng loại trên track này';
  b1.onclick = () => datLaiTab(tab); b2.onclick = () => apTatCaTab(tab); d.appendChild(b1); if (!nhieu) d.appendChild(b2); box.appendChild(d);
}
/* chọn nhiều mục cùng loại: bảng thuộc tính của mục đầu, mỗi lần chỉnh áp cho cả nhóm */
function nhomCungLoai() { const ds = dsNhieu(); if (ds.length < 2) return null; const k = ds[0].k; if (!['v', 'b', 'g'].includes(k) || !ds.every(o => o.k === k && o.m && (k !== 'g' || o.m.kieu === ds[0].m.kieu))) return null; if (k === 'v' && ds.some(o => o.m.trong)) return null; return { k, ds: ds.map(o => o.m) }; }
let chupNhieu = null;
function chupDau() { const n = nhomCungLoai(); chupNhieu = n ? JSON.stringify({ ...n.ds[0], el: undefined, gain: undefined }) : null; }
function lanNhieu() {
  const n = nhomCungLoai(); if (!n || !chupNhieu) return; const dau = n.ds[0], cu = JSON.parse(chupNhieu), moi = JSON.parse(JSON.stringify({ ...dau, el: undefined, gain: undefined }));
  const keys = [...new Set([...Object.keys(cu), ...Object.keys(moi)])].filter(p => p !== 'kfs' && !KHONG_CHEP.has(p) && JSON.stringify(cu[p]) !== JSON.stringify(moi[p]));
  const chs = [...new Set([...Object.keys(cu.kfs || {}), ...Object.keys(moi.kfs || {})])].filter(ch => JSON.stringify((cu.kfs || {})[ch]) !== JSON.stringify((moi.kfs || {})[ch]));
  if (!keys.length && !chs.length) return;
  const ap = c => { keys.forEach(p => { if (dau[p] === undefined) delete c[p]; else c[p] = JSON.parse(JSON.stringify(dau[p])); }); if (chs.length) { c.kfs = c.kfs || {}; chs.forEach(ch => { if (dau.kfs && dau.kfs[ch]) c.kfs[ch] = JSON.parse(JSON.stringify(dau.kfs[ch])); else delete c.kfs[ch]; }); if (!Object.keys(c.kfs).length) delete c.kfs; } };
  const khac = n.ds.slice(1); if (n.k === 'v') doiV1(khac, ap); else khac.forEach(ap);
  chupNhieu = JSON.stringify(moi); if (!P.dang) veKhung();
}
function danhDauKhac(n) {   // ô có giá trị khác nhau giữa các mục → “–”
  const box = $('#propChon'), doc = () => { const dem = {}, o = {}; box.querySelectorAll('label').forEach(l => { const r = l.querySelector('input[type=range]'), sp = l.firstElementChild; if (!r || !sp) return; const t = sp.textContent.trim(); dem[t] = (dem[t] || 0) + 1; o[t + '#' + dem[t]] = r.value; }); return o; };
  const g0 = doc(), chon0 = P.chon, khac = new Set(); P.dangDoNhieu = true;
  try { n.ds.slice(1, 12).forEach(m => { const mang = n.k === 'v' ? P.clips : n.k === 'b' ? P.broll : P.gfx; P.chon = { k: n.k, i: mang.indexOf(m) }; vePropGocI(); const g = doc(); Object.keys(g0).forEach(kk => { if (g[kk] !== undefined && g[kk] !== g0[kk]) khac.add(kk); }); }); }
  finally { P.chon = chon0; P.dangDoNhieu = false; vePropGocI(); }
  const dem = {}; box.querySelectorAll('label').forEach(l => { const r = l.querySelector('input[type=range]'), sp = l.firstElementChild; if (!r || !sp) return; const t = sp.textContent.trim(); dem[t] = (dem[t] || 0) + 1; if (khac.has(t + '#' + dem[t])) { const o = l.querySelector('output'); if (o) { o.textContent = '–'; o.title = 'Các mục đang chọn có giá trị khác nhau · kéo hoặc gõ để đặt chung'; } l.classList.add('khacNhau'); } });
}
let vePropGocI = null;
/* tỉ lệ khung: thêm Gốc (theo footage đầu), 2:1, Tuỳ chỉnh (W × H) + lưới chọn nhanh ở tab Khung hình */
function tiLeGoc() { const c = P.clips.find(x => !x.trong && srcCua(x.src) && srcCua(x.src).w); const s = c && srcCua(c.src); return s ? [s.w, s.h] : [9, 16]; }
function veLuoiTiLe() {
  const sel = $('#tiLe'); if (!sel) return; let g = $('#luoiTiLe'); if (!g) { g = el('div', 'luoiTiLe'); g.id = 'luoiTiLe'; sel.closest('label').after(g); }
  g.innerHTML = ''; const ds = [['goc', 'Gốc'], ['9:16', '9:16'], ['16:9', '16:9'], ['1:1', '1:1'], ['4:3', '4:3'], ['3:4', '3:4'], ['4:5', '4:5'], ['21:9', '21:9'], ['2:1', '2:1'], ['2.35:1', '2.35:1'], ['tuy', 'Tuỳ chỉnh']];
  ds.forEach(([v, t]) => { const [a, b] = TI_LE[v] || [1, 1], o = el('button', null); o.type = 'button'; o.dataset.tl = v; o.setAttribute('aria-pressed', String(sel.value === v)); const hinh = el('i'); const k = 18 / Math.max(a, b); hinh.style.width = Math.max(4, a * k) + 'px'; hinh.style.height = Math.max(4, b * k) + 'px'; o.appendChild(hinh); o.appendChild(el('span', null, t)); o.onclick = () => { if (v === 'tuy') { const cu = P.tiLeTuy || [1080, 1350], s = prompt('Kích thước khung (rộng × cao, px)', cu[0] + ' × ' + cu[1]); if (!s) return; const m = s.match(/(\d+)\D+(\d+)/); if (!m || +m[1] < 16 || +m[2] < 16) { toast('Gõ dạng 1080 × 1350'); return; } P.tiLeTuy = [+m[1], +m[2]]; try { localStorage.setItem('dv_tiLeTuy', JSON.stringify(P.tiLeTuy)); } catch { } } datTiLe(v); veLuoiTiLe(); }; g.appendChild(o); });
  if (sel.value === 'tuy' && P.tiLeTuy) g.appendChild(el('small', 'quota', 'Tuỳ chỉnh: ' + P.tiLeTuy[0] + ' × ' + P.tiLeTuy[1] + ' px'));
}
function khoiTaoInspector2() {
  const st = document.createElement('style'); st.textContent = '#propChon .tabCuoi{display:flex;gap:6px;justify-content:flex-end;border-top:1px solid var(--el);margin-top:10px;padding-top:8px}#propChon .nhieuBan{font-size:11.5px;color:var(--em);background:var(--ep2,rgba(255,255,255,.04));border:1px solid var(--el);border-radius:8px;padding:6px 8px;margin:4px 0 6px}#propChon .nhieuNut{margin-top:6px;gap:4px;flex-wrap:wrap}#propChon label.khacNhau output{color:var(--ea,#99DF00)}.luoiTiLe{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:2px 0 8px}.luoiTiLe button{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;height:46px;border:1px solid var(--el);border-radius:8px;background:transparent;color:var(--em);font-size:10.5px;cursor:pointer;padding:4px 2px}.luoiTiLe button i{display:block;border:1.5px solid currentColor;border-radius:2px}.luoiTiLe button[aria-pressed="true"]{border-color:var(--ea,#99DF00);color:var(--ea,#99DF00)}.luoiTiLe small{grid-column:1/-1}'; document.head.appendChild(st);
  try { const t = JSON.parse(localStorage.getItem('dv_tiLeTuy') || 'null'); if (t && t[0] > 0) P.tiLeTuy = t; } catch { }
  Object.defineProperty(TI_LE, 'goc', { get: tiLeGoc, enumerable: true, configurable: true }); Object.defineProperty(TI_LE, 'tuy', { get: () => P.tiLeTuy || [1080, 1350], enumerable: true, configurable: true }); TI_LE['2:1'] = [2, 1];
  const sel = $('#tiLe'); [['2:1', '2:1'], ['goc', 'Gốc (theo footage)'], ['tuy', 'Tuỳ chỉnh…']].forEach(([v, t]) => { if (![...sel.options].some(o => o.value === v)) { const o = el('option', null, t); o.value = v; sel.appendChild(o); } const s2 = $('#tiLe2'); if (s2 && ![...s2.options].some(o => o.value === v)) { const o = el('option', null, v === 'goc' ? 'Gốc' : v === 'tuy' ? 'Tuỳ' : t); o.value = v; s2.appendChild(o); } });
  veLuoiTiLe(); sel.addEventListener('change', veLuoiTiLe);
  const tabGoc = tabHoaProp; tabHoaProp = function () { const r = tabGoc.apply(this, arguments); if (!P.dangDoNhieu) themCuoiTab(); return r; };
  vePropGocI = veProp;
  let kyNhieu = '';
  veProp = function () {
    if (P.dangDoNhieu) return vePropGocI.apply(this, arguments);
    const n = nhomCungLoai(); if (!n) { kyNhieu = ''; return vePropGocI.apply(this, arguments); }
    const mang = n.k === 'v' ? P.clips : n.k === 'b' ? P.broll : P.gfx; P.chon = { k: n.k, i: mang.indexOf(n.ds[0]) };
    const nhieuCu = P.nhieu, box = $('#propChon'); let r; P.nhieu = [];   // vẽ như chọn một mục
    try { r = vePropGocI.apply(this, arguments); try { danhDauKhac(n); } catch (e) { console.warn(e); } } finally { P.nhieu = nhieuCu; }
    const ban = el('div', 'nhieuBan', '✦ Đang chỉnh ' + n.ds.length + ' mục cùng lúc — giá trị theo mục đầu, ô hiện “–” là các mục khác nhau; kéo / gõ là áp cho cả ' + n.ds.length + ' mục.'), dau = box.querySelector(':scope > .psub') || box.querySelector(':scope > .ptabs') || box.querySelector(':scope > h3');
    const hang = el('div', 'row nhieuNut'); [['▣ Tạo clip ghép', () => taoClipGhep()], ['🔗 Gộp nhóm', () => gopNhom()], ['🗑 Xoá', () => xoaNhieu()], ['Bỏ chọn', () => { P.nhieu = []; veProp(); danhDauNhieu(); }]].forEach(([t, f]) => { const bt = el('button', 'btn nho ghost', t); bt.type = 'button'; bt.onclick = f; hang.appendChild(bt); }); ban.appendChild(hang);   /* thao tác nhóm vẫn ở đây */
    box.insertBefore(ban, dau ? dau.nextSibling : box.firstChild); const tde = $('#phaiTieuDe'); if (tde && !/ mục$/.test(tde.textContent)) tde.textContent += ' · ' + n.ds.length + ' mục';
    themCuoiTab(); const ky = n.ds.map(m => m.id || mang.indexOf(m)).join('|'); if (ky !== kyNhieu || !chupNhieu) { kyNhieu = ky; chupDau(); } return r;
  };
  const box = $('#propChon'); ['pointerdown', 'focusin', 'keydown'].forEach(ev => box.addEventListener(ev, () => { if (nhomCungLoai()) chupDau(); }, true));
  ['input', 'change', 'click'].forEach(ev => box.addEventListener(ev, () => { if (nhomCungLoai()) setTimeout(lanNhieu, 0); }));
}
khoiTaoB(); khoiTaoC(); khoiTaoUI(); khoiTaoLop(); khoiTaoBang(); khoiTaoDot1(); khoiTaoDot2(); khoiTaoDot3(); khoiTaoM1(); khoiTaoM2(); khoiTaoM3(); khoiTaoN(); khoiTaoMobi(); khoiTaoCCW(); khoiTaoKho(); khoiTaoDoc(); khoiTaoGon(); khoiTaoMediaCC(); khoiTaoCC2(); khoiTaoFsBar(); khoiTaoKfGfx(); khoiTaoVanBanCC(); khoiTaoBangFont(); khoiTaoLopFx(); khoiTaoKhoTrucTuyen(); khoiTaoMediaKho(); khoiTaoMauDoHoa(); khoiTaoMatNaEl(); khoiTaoTruotTo(); khoiTaoClipGhep(); khoiTaoKeoTha(); khoiTaoKhoangTrong(); khoiTaoXuatPd(); khoiTaoSpecCon(); khoiTaoTayChu(); khoiTaoDoiPhim(); khoiTaoMatNa2(); khoiTaoCatKhung(); khoiTaoInspector2(); veTl();
