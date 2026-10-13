/* ═══════════════════════════════════════════════════════════════
   NỐI THƯ MỤC: trình Dựng video ↔ thư mục dự án trên máy ↔ Claude Code
   Nạp sau phần script chính của dung-video.html, dùng chung P, agentXuLy, agentTomTat, duAnJson, themFile.

   Bấm "Nối thư mục" (Chrome/Edge máy tính) → chọn thư mục dự án:
     footage/            trình dựng nạp mọi video/ảnh trong này
     du-an.tmxk.json     trình dựng tự lưu dòng thời gian (2s một lần khi có đổi)
     xuat/               video, phụ đề xuất ra
     CLAUDE.md           hướng dẫn cho Claude Code (chỉ ghi khi chưa có)
     .tmxk/tmxk.mjs      bộ lệnh dòng lệnh cho Claude, .tmxk/CONG-CU.md danh sách lệnh
     .tmxk/lenh/*.json   Claude ghi lệnh → trình dựng chạy bằng agentXuLy → .tmxk/ket-qua/*.json
     .tmxk/trang-thai.json  tóm tắt dự án + nhịp (để Claude biết tab còn mở)
   Claude chỉ ra lệnh qua bộ lệnh của trợ lý dựng, không sửa thẳng file dự án, nên mọi thay đổi
   đều qua kiểm tra tham số và có hoàn tác như khi bấm tay.
   ═══════════════════════════════════════════════════════════════ */
const NTM = (() => {
  const DUOI_MEDIA = /\.(mp4|mov|webm|m4v|jpe?g|png|webp)$/i;
  const NHIP_MS = 2000, QUET_MS = 700;
  const KHO = 'tmxk_noi', KHOA = 'thu_muc';
  let goc = null, tmxk = null, dangChay = false, hen = null, khoaLuu = '', demNhip = 0;

  /* ── lưu handle thư mục vào IndexedDB để lần sau chỉ cần một chạm "Nối lại" ── */
  function moKho() { return new Promise((ok, loi) => { const r = indexedDB.open(KHO, 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error); }); }
  async function khoGhi(v) { try { const db = await moKho(); db.transaction('h', 'readwrite').objectStore('h').put(v, KHOA); } catch { } }
  async function khoDoc() { try { const db = await moKho(); return await new Promise(ok => { const r = db.transaction('h').objectStore('h').get(KHOA); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch { return null; } }

  /* ── đọc / ghi file trong thư mục ── */
  async function thuMuc(cha, ten) { return cha.getDirectoryHandle(ten, { create: true }); }
  async function ghi(cha, ten, noiDung) { const f = await cha.getFileHandle(ten, { create: true }); const w = await f.createWritable(); await w.write(noiDung); await w.close(); }
  async function doc(cha, ten) { try { return await (await (await cha.getFileHandle(ten)).getFile()).text(); } catch { return null; } }
  async function coFile(cha, ten) { try { await cha.getFileHandle(ten); return true; } catch { return false; } }
  async function dsMedia(dir) { const ds = []; for await (const [ten, h] of dir.entries()) if (h.kind === 'file' && DUOI_MEDIA.test(ten)) ds.push(await h.getFile()); return ds.sort((a, b) => a.name.localeCompare(b.name)); }

  function veNut() {
    const b = $('#btnNoiTM'), tt = $('#noiTMTt'); if (!b) return;
    b.textContent = goc ? '🔗 Đã nối: ' + goc.name : '🔗 Nối thư mục trên máy';
    if (tt) tt.textContent = goc ? 'Claude Code mở thư mục này là ra lệnh dựng được. Thêm footage vào footage/ rồi bấm lại nút để nạp.' : 'Nối một thư mục để Claude Code trên máy dựng cùng bạn (Chrome/Edge máy tính).';
  }

  /* ── ghi các file hướng dẫn cho Claude ── */
  async function ghiCongCu() {
    const ten = typeof AGENT_TEN === 'object' ? AGENT_TEN : {};
    let md = '';
    try {
      if (MC.url) { const r = await fetch(MC.url + '/agent_tools'); const j = await r.json(); if (j.ok) md = '# Lệnh của trình Dựng video\n\nChạy: `node .tmxk/tmxk.mjs <ten> \'<json tham số>\'`\n\n' + j.tools.map(t => '## ' + t.ten + (ten[t.ten] ? ' · ' + ten[t.ten] : '') + '\n\n' + t.mo_ta + '\n\nTham số: `' + JSON.stringify(t.tham_so) + '`' + (t.bat_buoc.length ? ' · bắt buộc: ' + t.bat_buoc.join(', ') : '')).join('\n\n') + '\n\n## Quy tắc gốc của trợ lý dựng\n\n' + j.he_thong + '\n'; }
    } catch { }
    if (!md) md = '# Lệnh của trình Dựng video\n\nMáy chủ chưa trả mô tả chi tiết, đây là tên lệnh. Gọi thử với tham số thiếu, lỗi trả về sẽ nói cần gì.\n\n' + Object.keys(ten).map(k => '- `' + k + '`: ' + ten[k]).join('\n') + '\n';
    await ghi(tmxk, 'CONG-CU.md', md);
  }
  async function ghiFileCau() {
    const lay = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u); return r.text(); };
    await ghi(tmxk, 'tmxk.mjs', await lay('claude-noi/tmxk.mjs'));
    if (!(await coFile(goc, 'CLAUDE.md'))) await ghi(goc, 'CLAUDE.md', await lay('claude-noi/CLAUDE.md'));
    await ghiCongCu();
  }

  /* ── nạp footage + dự án từ thư mục ── */
  async function napThuMuc() {
    const footage = await thuMuc(goc, 'footage');
    let files = await dsMedia(footage); if (!files.length) files = await dsMedia(goc);
    const daCo = new Set(P.srcs.map(s => s.ten + '|' + (s.file ? s.file.size : '')));
    const moi = files.filter(f => !daCo.has(f.name + '|' + f.size));
    const txt = !P.srcs.length && !P.clips.length ? await doc(goc, 'du-an.tmxk.json') : null;
    if (txt) {
      try {
        const o = JSON.parse(txt); P.duAnCho = o; $('#tenDuAn').value = o.ten || goc.name;
        Object.keys(o.cai || {}).forEach(k => { const x = $('#' + k); if (!x) return; if (x.type === 'checkbox') x.checked = !!o.cai[k]; else x.value = o.cai[k]; });
      } catch { toast('du-an.tmxk.json bị hỏng, mở footage như dự án mới'); }
    } else if (!P.srcs.length && !$('#tenDuAn').value.trim()) $('#tenDuAn').value = goc.name;
    if (moi.length) await themFile(moi);
    return { tong: files.length, moi: moi.length };
  }

  /* ── vòng chạy lệnh của Claude ── */
  async function chayLo(tep) {
    const h = await tmxk.getDirectoryHandle('lenh');
    let goi; try { goi = JSON.parse(await (await (await h.getFileHandle(tep)).getFile()).text()); } catch { return; }
    await h.removeEntry(tep).catch(() => { });                 // xoá trước khi chạy để không bao giờ chạy hai lần
    const id = String(goi.id || tep.replace(/\.json$/, '')).replace(/[^\w-]/g, '').slice(0, 40) || 'x';
    const ds = Array.isArray(goi.lenh) ? goi.lenh.slice(0, 30) : [], ket = [];
    for (const g of ds) {
      const ten = String(g && g.ten || ''), nhan = (AGENT_TEN[ten] || ten);
      let res; try { res = await agentXuLy(ten, (g && g.a) || {}); } catch (e) { res = { isError: true, text: String(e && e.message || e) }; }
      ket.push({ ten, text: res.text, image: res.image, isError: !!res.isError });
      toast((res.isError ? '⚠ Claude: ' : '✓ Claude: ') + nhan);
      if (res.isError) break;                                    // lệnh sau thường dựa vào lệnh trước, dừng để Claude sửa
    }
    try { veDs(); veTl(); veLoi(); if (!P.dang) veKhung(); docTuNhan(); } catch { }
    await ghi(await thuMuc(tmxk, 'ket-qua'), id + '.json', JSON.stringify({ id, ket_qua: ket }));
    await ghiTrangThai(true);
  }
  async function ghiTrangThai(ep) {
    let du_an = null; try { du_an = agentTomTat(); } catch { }
    await ghi(tmxk, 'trang-thai.json', JSON.stringify({ nhip: Date.now(), du_an }));
    if (!P.srcs.length && !P.clips.length) return;
    const j = JSON.stringify(duAnJson());
    if (ep || j !== khoaLuu) { await ghi(goc, 'du-an.tmxk.json', j); khoaLuu = j; }
  }
  async function vong() {
    if (!goc || dangChay) return;
    dangChay = true;
    try {
      const h = await thuMuc(tmxk, 'lenh'), tep = [];
      for await (const [ten, x] of h.entries()) if (x.kind === 'file' && ten.endsWith('.json')) tep.push(ten);
      for (const t of tep.sort()) await chayLo(t);
      if (++demNhip * QUET_MS >= NHIP_MS) { demNhip = 0; await ghiTrangThai(false); }
    } catch (e) {
      console.warn('[nối thư mục]', e);
      if (e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError')) { dung(); toast('Mất quyền thư mục, bấm "Nối lại thư mục"'); }
    } finally { dangChay = false; }
  }
  function dung() { clearInterval(hen); hen = null; goc = tmxk = null; veNut(); }

  async function batDau(h) {
    if ((await h.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await h.requestPermission({ mode: 'readwrite' })) !== 'granted') { toast('Cần cho phép đọc ghi thư mục'); return; }
    goc = h; tmxk = await thuMuc(goc, '.tmxk'); await thuMuc(goc, 'xuat');
    await khoGhi(h);
    try { await ghiFileCau(); } catch (e) { console.warn('ghi file cầu nối', e); toast('Không ghi được file hướng dẫn cho Claude, thử lại'); }
    const n = await napThuMuc();
    await ghiTrangThai(true);
    clearInterval(hen); hen = setInterval(vong, QUET_MS);
    veNut();
    toast('Đã nối “' + goc.name + '” · ' + n.tong + ' footage' + (n.moi ? ', nạp mới ' + n.moi : ''));
  }

  async function bam() {
    if (!window.showDirectoryPicker) { toast('Trình duyệt này chưa nối thư mục được. Dùng Chrome hoặc Edge trên máy tính.'); return; }
    try {
      if (goc) { const n = await napThuMuc(); await ghiFileCau(); toast(n.moi ? 'Đã nạp thêm ' + n.moi + ' footage' : 'Thư mục không có footage mới'); return; }
      const cu = await khoDoc();
      if (cu && confirm('Nối lại thư mục “' + cu.name + '”?\n(Bấm Huỷ để chọn thư mục khác)')) { await batDau(cu); return; }
      await batDau(await showDirectoryPicker({ id: 'tmxk_du_an', mode: 'readwrite' }));
    } catch (e) { if (e && e.name !== 'AbortError') { console.warn(e); toast('Không nối được thư mục: ' + (e.message || e)); } }
  }

  /* video xuất xong: lưu thêm một bản vào xuat/ của thư mục dự án */
  async function ghiXuat(blob, ten) { if (!goc) return; try { await ghi(await thuMuc(goc, 'xuat'), ten, blob); toast('Đã lưu thêm vào ' + goc.name + '/xuat/' + ten); } catch (e) { console.warn('ghi xuất', e); } }

  function khoiTao() {
    const b = $('#btnNoiTM'); if (!b) return;
    b.onclick = bam; veNut();
    if (!window.showDirectoryPicker) { b.disabled = true; b.title = 'Cần Chrome hoặc Edge trên máy tính'; }
  }
  return { khoiTao, ghiXuat, daNoi: () => !!goc };
})();
NTM.khoiTao();
