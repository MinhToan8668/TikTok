/* ═══════════════════════════════════════════════════════════════
   SANG FILMCRAFT: mở dòng thời gian TMXK trong FilmCraft (tools/filmcraft/) để dựng chuyên nghiệp
   FilmCraft (github.com/storytold/filmcraft, MIT/Apache) là trình dựng kiểu Premiere chạy bằng WebAssembly:
   chỉnh màu Lumetri + scopes, trim ripple/roll/slip/slide, keyframe Bezier, mixer, đo loudness, 93 hiệu ứng.
   Cùng origin nên điều khiển thẳng qua window.filmcraft của tab đó (execute / importFiles / screenshot).

   Chuyển được: V1 (cắt, tốc độ, chuyển cảnh mờ), b-roll V2, phụ đề (track C1), chữ/đồ hoạ (track C2), mốc.
   Chưa chuyển: hình động đồ hoạ, màu/bộ lọc, keyframe, âm thanh A2/A3, nhạc — dựng lại bên FilmCraft.
   ═══════════════════════════════════════════════════════════════ */
const NFC = (() => {
  const TICK = 254016000000;                                  // tick mỗi giây của FilmCraft
  const KHUNG = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080], '4:3': [1440, 1080], '3:4': [1080, 1440], '21:9': [2520, 1080], '2.35:1': [2538, 1080], '1.85:1': [1998, 1080] };
  const CHO_TOI_DA = 120000;
  let cuaSo = null;

  const tk = giay => Math.round(giay * TICK);
  const fc = () => cuaSo && !cuaSo.closed && cuaSo.filmcraft && cuaSo.filmcraftLoad && cuaSo.filmcraftLoad.readyMs ? cuaSo.filmcraft : null;

  async function choSanSang() {
    const t0 = Date.now();
    while (Date.now() - t0 < CHO_TOI_DA) {
      if (!cuaSo || cuaSo.closed) throw new Error('Tab FilmCraft đã đóng');
      const ld = cuaSo.filmcraftLoad;
      if (ld && (ld.fatal || ld.error)) throw new Error('FilmCraft không chạy được trên máy này: ' + String(ld.fatal || ld.error).slice(0, 160));
      if (fc()) return fc();
      await new Promise(r => setTimeout(r, 400));
    }
    throw new Error('FilmCraft tải quá lâu (mạng chậm?), thử lại');
  }

  /* mở tab trước (phải ngay trong lúc bấm, kẻo trình duyệt chặn popup), rồi mới chờ */
  function moTab() {
    if (fc()) { cuaSo.focus(); return cuaSo; }
    cuaSo = window.open('filmcraft/index.html?empty&norecover', 'tmxk_filmcraft');
    if (!cuaSo) throw new Error('Trình duyệt chặn mở tab mới, cho phép popup của trang này rồi bấm lại');
    return cuaSo;
  }

  async function nhapFootage(F, srcs) {
    const id = new Map(), loi = [];
    for (const s of srcs) {
      if (!s.file) { loi.push(s.ten + ' (chưa có file)'); continue; }
      /* File phải tạo trong chính tab FilmCraft: wasm kiểm instanceof File theo window của tab đó */
      const f = new cuaSo.File([s.file], s.file.name, { type: s.file.type, lastModified: s.file.lastModified });
      const r = await F.importFiles([f]);
      if (r.items && r.items.length) id.set(s.id, r.items[0]); else loi.push(s.ten + ': ' + (r.errors || []).join(', '));
    }
    return { id, loi };
  }

  async function chuyen() {
    if (!P.clips.length) throw new Error('Chưa có đoạn nào trên V1');
    const F = await choSanSang(), bo = [], dem = { v1: 0, broll: 0, pd: 0, chu: 0, moc: 0 };
    const chay = async (lenh, ts) => { try { return await F.execute(lenh, ts); } catch (e) { bo.push(lenh + ': ' + String(e && e.message || e).slice(0, 80)); return null; } };

    const dung = P.srcs.filter(s => P.clips.some(c => c.src === s.id) || P.broll.some(b => b.src === s.id));
    const { id, loi } = await nhapFootage(F, dung); bo.push(...loi);
    const [w, h] = KHUNG[$('#tiLe').value] || KHUNG['9:16'];
    const seq = await chay('file.newSequence', { name: ($('#tenDuAn').value.trim() || 'Video TMXK').slice(0, 60), width: w, height: h, fps: +$('#xuatFps').value || 30 });
    if (!seq) throw new Error('Không tạo được sequence: ' + bo.join('; '));

    /* V1: đặt nối đuôi theo thứ tự, mỗi đoạn xong thì chỉnh tốc độ ngay (chưa có gì phía sau nên không cần ripple) */
    let acc = 0;
    for (const c of P.clips) {
      const item = id.get(c.src);
      if (item == null) { acc += daiC(c); bo.push('đoạn từ footage chưa nhập'); continue; }
      const r = await chay('timeline.place', { item, track: 'V1', seconds: +acc.toFixed(4), sourceIn: tk(c.bd), duration: tk(c.kt - c.bd) });
      const clips = r && r.clips;
      if (clips && clips.length) {
        dem.v1++;
        const toc = tocC(c);
        if (Math.abs(toc - 1) > 0.001) await chay('clip.speedDuration', { clips, speed: +(toc * 100).toFixed(2), ripple: false });
        if (c.chuyen && c.chuyen !== 'cat' && acc > 0) await chay('sequence.applyVideoTransition', { clip: clips[0], effect: 'cross_dissolve', edge: 'in', frames: Math.round((c.chuyen_dai || 0.4) * (+$('#xuatFps').value || 30)) });
      }
      acc += daiC(c);
    }

    if (P.broll.length) await chay('sequence.addTracks', { video: 1 });
    for (const b of P.broll) {
      const item = id.get(b.src); if (item == null) continue;
      const r = await chay('timeline.place', { item, track: 'V2', seconds: +b.t_bd.toFixed(4), sourceIn: tk(b.bd), duration: tk(b.kt - b.bd), audio: false });
      if (r) dem.broll++;
    }

    /* phụ đề → track C1; hook + chữ/đồ hoạ → track C2 (FilmCraft chỉnh tiếp thành Graphics được) */
    let cum = []; try { cum = $('#phuDe').checked ? cumTu() : []; } catch { }
    if (cum.length) {
      const tr = await chay('captions.newTrack', { format: 'Subtitle', name: 'Phụ đề' });
      if (tr) {
        await chay('captions.setStyle', { track: tr.track, size: 64, color: '#ffffffff', outline: 4, outlineColor: '#000000ff', anchor: 'bottom', margin: +(1 - (P.pdY || 0.78)).toFixed(2) });
        for (const k of cum) if (await chay('captions.add', { track: tr.track, text: k.tu.map(t => t.w).join(' '), seconds: +k.bd.toFixed(3), durationSeconds: +Math.max(0.2, k.kt - k.bd).toFixed(3) })) dem.pd++;
      }
    }
    const chu = P.gfx.filter(g => g.text || g.phu).map(g => ({ text: [g.text, g.phu].filter(Boolean).join(' · ').replace(/\|/g, ' '), bd: g.bd, kt: g.kt }));
    const hook = $('#hook').value.trim(); if (hook) chu.unshift({ text: hook, bd: 0, kt: 3 });
    /* một track caption không cho hai chữ chồng giờ: xếp chữ vào các làn, mỗi làn một track */
    const lan = [];
    for (const g of chu.sort((x, y) => x.bd - y.bd)) {
      let l = lan.find(x => x.het <= g.bd + 0.001);
      if (!l) {
        const tr = await chay('captions.newTrack', { format: 'Subtitle', name: 'Chữ & đồ hoạ ' + (lan.length + 1) });
        if (!tr) break;
        await chay('captions.setStyle', { track: tr.track, size: 80, anchor: 'top', margin: +(0.18 + lan.length * 0.1).toFixed(2), background: true, backgroundColor: '#000000b0' });
        l = { track: tr.track, het: 0 }; lan.push(l);
      }
      const dai = Math.max(0.3, g.kt - g.bd);
      if (await chay('captions.add', { track: l.track, text: g.text.slice(0, 200), seconds: +g.bd.toFixed(3), durationSeconds: +dai.toFixed(3) })) { dem.chu++; l.het = g.bd + dai; }
    }
    for (const m of P.moc || []) if (await chay('markers.add', { target: 'program', time: tk(m.t), name: m.ten })) dem.moc++;

    const chuaChuyen = [P.am3.length && P.am3.length + ' âm thanh A3', P.tieng.length && P.tieng.length + ' lồng tiếng', P.nhac && 'nhạc nền'].filter(Boolean);
    return { dem, bo, chuaChuyen };
  }

  async function bam() {
    try { moTab(); } catch (e) { toast(e.message); return; }
    toast('Đang mở FilmCraft và chuyển dòng thời gian…');
    try {
      const { dem, bo, chuaChuyen } = await chuyen();
      cuaSo.focus();
      toast('Đã chuyển sang FilmCraft: ' + dem.v1 + ' đoạn, ' + dem.broll + ' b-roll, ' + dem.pd + ' câu phụ đề, ' + dem.chu + ' chữ' + (chuaChuyen.length ? ' · chưa chuyển ' + chuaChuyen.join(', ') : '') + (bo.length ? ' · ' + bo.length + ' lỗi nhỏ (xem console)' : ''));
      if (bo.length) console.warn('[sang FilmCraft]', bo);
    } catch (e) { console.warn('[sang FilmCraft]', e); toast('Không chuyển được: ' + (e.message || e)); }
  }

  /* cho cầu nối thư mục: Claude ra lệnh thẳng cho FilmCraft */
  async function lenh(ten, a) {
    const F = fc(); if (!F) throw new Error('FilmCraft chưa mở. Bấm "🎬 Mở trong FilmCraft" trong trình dựng trước');
    if (ten === 'fc_ds') { const r = await F.commands(); const ds = r.commands || r, q = String(a.loc || '').toLowerCase(); return { text: ds.filter(x => !q || (x.id + ' ' + x.label).toLowerCase().includes(q)).map(x => x.id + ' ' + x.params + (x.enabled ? '' : ' (đang tắt)')).join('\n') }; }
    if (ten === 'fc_xem') return { text: { du_an: await F.execute('project.inspect', {}), sequence: await F.execute('sequence.inspect', {}) } };
    if (ten === 'fc_khung') { const r = await F.screenshot(a.panel ? { panel: a.panel } : {}); return { text: 'Ảnh ' + r.width + 'x' + r.height, image: { data: r.pngBase64, mime: 'image/png' } }; }
    if (ten === 'fc_chay') { if (!a.lenh) throw new Error('Thiếu lenh (id lệnh FilmCraft, xem fc_ds)'); return { text: await F.execute(String(a.lenh), a.tham_so || {}) }; }
    if (ten === 'fc_lo') { const kq = []; for (const b of a.buoc || []) kq.push({ lenh: b.lenh, kq: await F.execute(String(b.lenh), b.tham_so || {}) }); return { text: kq }; }
    throw new Error('Không có lệnh ' + ten);
  }

  function khoiTao() { const b = $('#btnFilmCraft'); if (b) b.onclick = bam; }
  return { khoiTao, lenh, laLenh: ten => /^fc_(ds|xem|khung|chay|lo)$/.test(ten), daMo: () => !!fc() };
})();
NFC.khoiTao();
