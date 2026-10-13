---
name: dung-video-xa
description: Điều khiển trình dựng video TMXK (Dựng nhanh kiểu CapCut, hoặc Dựng chuyên sâu lõi FilmCraft) đang mở trong trình duyệt của người dùng, từ bất kỳ phiên Claude Code nào (kể cả cloud), qua mã ghép nối 6 ký tự. Dùng khi người dùng nói "nối trình dựng mã XXXXXX", "dựng video giúp mình", "cắt / chỉnh màu / phụ đề clip này", hay gửi một mã 6 ký tự kèm yêu cầu dựng.
---

# Dựng video qua cầu nối xa

Người dùng mở trình dựng trên Chrome, bấm **📡 Nối với Claude Code**, trình dựng hiện mã 6 ký tự
(giữ nguyên giữa các lần mở trên cùng máy). Người dùng nói mã cho bạn. Từ đó, mọi lệnh đi qua:

```
node tools/claude-noi/tmxk-xa.mjs --ma <MÃ> xem                      # tab còn mở không, đang là trình dựng nào, tóm tắt dự án
node tools/claude-noi/tmxk-xa.mjs --ma <MÃ> <lenh> '<json tham số>'  # một lệnh
node tools/claude-noi/tmxk-xa.mjs --ma <MÃ> lo '[{"ten":"...","a":{...}}, ...]'   # nhiều lệnh theo thứ tự, dừng ở lệnh lỗi
```

Đặt `export TMXK_MA=<MÃ>` một lần thì khỏi `--ma`. Kết quả in ra ngay; ảnh khung lưu `.tmxk-xa/*.jpg`,
mở bằng Read để tự kiểm bố cục trước khi kết luận. Lệnh lỗi in `⚠` kèm lý do: đọc lý do rồi sửa
tham số, đừng lặp lại y nguyên.

Luôn chạy `xem` trước để biết `trinh_dung` là **Dựng video** (Dựng nhanh) hay **Dựng chuyên sâu**,
vì hai bên dùng bộ lệnh khác nhau.

## Dựng nhanh (kiểu CapCut)

Bộ lệnh của trợ lý dựng, khoảng 45 lệnh có mô tả và schema tại
`https://flat-wave-6907.minhtoantowork.workers.dev/agent_tools` (curl một lần rồi đọc). Hay dùng:
`xem_loi_thoai`, `them_doan {src_id,bd,kt}`, `sua_doan {i,bd,kt,toc,sc,x,y,nen…}`, `xoa_doan`,
`tach_doan {tl}`, `bo_vap`, `cat_khoang_lang {nguong}`, `dat_broll`, `them_do_hoa`, `mau_chu`,
`phu_de_mau`, `cai_dat {hook,phu_de,ti_le,phong_cach}`, `chuan_hoa_am`, `xem_khung {t}`,
`hoan_tac`, `xuat_video` (chỉ khi được yêu cầu, chờ tới 900 giây).
Đơn vị giây. `bd`/`kt` của đoạn là giây trong footage gốc; `tl`, `t_bd`, `bd`/`kt` của đồ hoạ là giây
trên dòng thời gian. Footage chỉ dùng được khi `trang_thai` là `xong`; `hieu_footage` tốn 1 lượt của
người dùng, hỏi trước khi gọi.

## Dựng chuyên sâu (FilmCraft, kiểu Premiere)

- `fc_ds {"loc":"lumetri"}`: tìm lệnh FilmCraft (≈700) theo từ khoá, trả id + schema. Chưa chắc tham số thì tìm trước, đừng đoán.
- `fc_xem {}`: project (items có `item` id) + sequence (track, clip với `clip` id, `bd`/`kt` giây trên timeline, `src_bd`/`src_kt`, `toc`, marker).
- `fc_chay {"lenh":"<id>","tham_so":{...}}`, `fc_lo {"buoc":[{"lenh","tham_so"}]}`.
- `fc_khung {"t":2.5}`: ảnh Program monitor; `fc_man_hinh {"panel":"Lumetri Color"}`: ảnh cửa sổ/panel.
- Thời gian là tick nguyên: **254016000000 tick = 1 giây**; nhiều lệnh nhận `seconds`/`frame` thay cho `time`/`duration`.
- Lệnh "đang tắt" thường vì chưa chọn clip hoặc chưa có sequence: dùng lệnh có tham số id. Hoàn tác: `fc_chay {"lenh":"edit.undo"}`.
- Ví dụ: `file.newSequence {name,width:1080,height:1920,fps:30}` → `timeline.place {item,track:"V1",seconds:0,sourceIn:0,duration:<tick>}` → `captions.newTrack {format:"Subtitle"}` → `captions.add {text,seconds,durationSeconds}`.

## Quy tắc

- Làm đúng yêu cầu, không tự ý làm quá. Không export, không xoá track, không tạo project mới khi chưa được bảo.
- Sau khi đặt chữ, đồ hoạ, đổi màu hay khung: xem khung hình ở thời điểm liên quan để tự kiểm, chữ không che mặt.
- Video ngắn TikTok/Reels: 3 giây đầu mạnh, mỗi ý 3–5 giây, tiếng quanh −14 LUFS.
- Mỗi lượt kết thúc bằng 1–3 câu tóm tắt đã làm gì và gợi ý bước tiếp.
- Lỗi `chua_co_tab` / `tab_khong_mo`: bảo người dùng mở trình dựng, bấm lại 📡 và đọc lại mã. Lỗi `unknown_action`: Apps Script chưa deploy bản có `CauNoi.gs`.
