/* ═══════════════════════════════════════════════════════════════
   KHO BỔ SUNG THEO DANH MỤC FILMCRAFT (Premiere): chuyển cảnh, hiệu ứng video có tham số chỉnh được,
   bộ lọc "look", hiệu ứng âm thanh tổng hợp. Viết lại từ đầu bằng GLSL / công thức âm, không chép code
   hay tài nguyên của FilmCraft. Nạp ngay sau kho.js, trước dung/nap.js.
   - Chuyển cảnh: kiểu gl-transitions (transition(uv), getFromColor, getToColor, progress, ratio).
   - Hiệu ứng: thân hàm vec4 hu(vec2 uv) như kho.js, có thêm p1 p2 p3 (khai báo ở 06), `ts` mô tả các thanh chỉnh.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (typeof KHO !== 'object' || !KHO) return;
  var R = 'float r2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}';
  var N = R + 'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(r2(i),r2(i+vec2(1.,0.)),f.x),mix(r2(i+vec2(0.,1.)),r2(i+vec2(1.,1.)),f.x),f.y);}';

  /* ── chuyển cảnh ── */
  var CC = [
    ['fc_film', 'Hoà tan phim', '🎞', 'vec4 transition(vec2 uv){vec4 a=getFromColor(uv),b=getToColor(uv);vec3 c=pow(mix(pow(a.rgb,vec3(2.2)),pow(b.rgb,vec3(2.2)),progress),vec3(1./2.2));return vec4(c,1.);}'],
    ['fc_cong_sang', 'Hoà tan cộng sáng', '✴️', 'vec4 transition(vec2 uv){vec4 a=getFromColor(uv),b=getToColor(uv);float p=progress;return vec4(clamp(a.rgb*min(1.,2.-2.*p)+b.rgb*min(1.,2.*p),0.,1.),1.);}'],
    ['fc_chon_sang', 'Hoà tan chọn sáng', '🌗', 'vec4 transition(vec2 uv){vec4 a=getFromColor(uv),b=getToColor(uv);float p=progress;vec3 x=a.rgb*(1.-p),y=b.rgb*p;float la=dot(x,vec3(.299,.587,.114)),lb=dot(y,vec3(.299,.587,.114));return vec4(mix(x,y,step(la,lb))/max(.5,max(1.-p,p)),1.);}'],
    ['fc_iris_vuong', 'Mống vuông', '⏹', 'vec4 transition(vec2 uv){vec2 q=abs(uv-.5);q.x*=ratio;float m=max(q.x/ratio,q.y)*2.;return mix(getFromColor(uv),getToColor(uv),1.-smoothstep(progress-.01,progress+.01,m));}'],
    ['fc_iris_thap', 'Mống chữ thập', '✚', 'vec4 transition(vec2 uv){vec2 q=abs(uv-.5)*2.;float m=min(q.x,q.y);float p=progress*1.05;float k=step(m,p*p)*step(max(q.x,q.y),p*2.);return mix(getFromColor(uv),getToColor(uv),k);}'],
    ['fc_iris_thoi', 'Mống hình thoi', '🔷', 'vec4 transition(vec2 uv){vec2 q=abs(uv-.5);float m=(q.x+q.y);return mix(getFromColor(uv),getToColor(uv),1.-smoothstep(progress-.01,progress+.01,m));}'],
    ['fc_dong_ho', 'Quét đồng hồ', '🕛', 'vec4 transition(vec2 uv){vec2 q=uv-.5;q.x*=ratio;float a=atan(q.x,q.y)/6.28318+.5;return mix(getFromColor(uv),getToColor(uv),step(a,progress));}'],
    ['fc_toa_goc', 'Quét toả từ góc', '◜', 'vec4 transition(vec2 uv){float a=atan(1.-uv.y,uv.x)/1.5708;return mix(getFromColor(uv),getToColor(uv),1.-smoothstep(progress-.02,progress+.02,1.-a));}'],
    ['fc_quat', 'Quét hình quạt', '🪭', 'vec4 transition(vec2 uv){vec2 q=uv-vec2(.5,0.);q.x*=ratio;float a=abs(atan(q.x,q.y))/3.14159;return mix(getFromColor(uv),getToColor(uv),step(a,progress));}'],
    ['fc_chong_chong', 'Chong chóng', '🎡', 'vec4 transition(vec2 uv){vec2 q=uv-.5;q.x*=ratio;float a=atan(q.y,q.x)+3.14159;float f=fract(a/1.5708);return mix(getFromColor(uv),getToColor(uv),step(f,progress));}'],
    ['fc_quet_co', 'Quét bàn cờ', '🏁', 'vec4 transition(vec2 uv){vec2 g=floor(uv*vec2(8.,12.));float o=mod(g.x+g.y,2.)*.5;float x=fract(uv.x*8.);return mix(getFromColor(uv),getToColor(uv),step(x,progress*2.-o));}'],
    ['fc_ban_co', 'Bàn cờ', '♟', 'vec4 transition(vec2 uv){vec2 g=floor(uv*vec2(6.,10.));float o=mod(g.x+g.y,2.);float p=o<.5?progress*2.:progress*2.-1.;return mix(getFromColor(uv),getToColor(uv),step(.001,p)*step(fract(uv.y*10.),p));}'],
    ['fc_zigzag', 'Khối zig-zag', '〰', R + 'vec4 transition(vec2 uv){vec2 g=floor(uv*vec2(8.,14.));float r=mod(g.y,2.)<.5?g.x:7.-g.x;float i=(g.y*8.+r)/112.;return mix(getFromColor(uv),getToColor(uv),step(i,progress));}'],
    ['fc_long_khung', 'Khung lồng', '🔲', 'vec4 transition(vec2 uv){vec2 p=vec2(progress);return (uv.x<p.x&&1.-uv.y<p.y)?getToColor(uv):getFromColor(uv);}'],
    ['fc_tach_giua', 'Tách bốn góc', '✳️', 'vec4 transition(vec2 uv){float p=progress;vec2 q=uv-.5;vec2 d=sign(q)*p*.5;vec2 f=uv-d;bool ra=abs(q.x)<p*.5||abs(q.y)<p*.5;return ra?getToColor(uv):getFromColor(f);}'],
    ['fc_tach_doi', 'Tách đôi ngang', '↕', 'vec4 transition(vec2 uv){float p=progress*.5;float d=abs(uv.y-.5);if(d<p)return getToColor(uv);return getFromColor(vec2(uv.x,uv.y+(uv.y>.5?-p:p)));}'],
    ['fc_dai_truot', 'Dải trượt', '🎚', 'vec4 transition(vec2 uv){float b=floor(uv.y*7.);float dir=mod(b,2.)<.5?1.:-1.;float x=uv.x+dir*(1.-progress);if(x>=0.&&x<=1.)return getToColor(vec2(x,uv.y));return getFromColor(uv);}'],
    ['fc_dai_quet', 'Dải quét', '📶', 'vec4 transition(vec2 uv){float b=floor(uv.y*7.);float x=mod(b,2.)<.5?uv.x:1.-uv.x;return mix(getFromColor(uv),getToColor(uv),step(x,progress));}'],
    ['fc_zoom_cheo', 'Zoom chéo nhoè', '💫', 'vec4 transition(vec2 uv){float p=progress;float s=sin(p*3.14159)*.35;vec2 c=vec2(.5);vec4 acc=vec4(0.);for(int i=0;i<12;i++){float k=float(i)/11.;vec2 q=c+(uv-c)*(1.-s*k);acc+=mix(getFromColor(q),getToColor(q),smoothstep(.3,.7,p));}return acc/12.;}'],
    ['fc_khoi_xoay', 'Xoay khối lập phương', '🧊', 'vec4 transition(vec2 uv){float p=progress;float e=1.-p;if(uv.x<e){vec2 q=vec2(uv.x/max(e,.001),.5+(uv.y-.5)*(1.+.15*p));if(q.y<0.||q.y>1.)return vec4(0.,0.,0.,1.);return getFromColor(q)*(1.-.5*p);}vec2 q=vec2((uv.x-e)/max(p,.001),.5+(uv.y-.5)*(1.+.15*e));if(q.y<0.||q.y>1.)return vec4(0.,0.,0.,1.);return getToColor(q)*(1.-.5*e);}'],
    ['fc_lat_the', 'Lật thẻ', '🃏', 'vec4 transition(vec2 uv){float p=progress;float s=abs(cos(p*3.14159));float x=(uv.x-.5)/max(s,.001)+.5;if(x<0.||x>1.)return vec4(0.,0.,0.,1.);vec2 q=vec2(x,uv.y);return (p<.5?getFromColor(q):getToColor(q))*(.6+.4*s);}'],
    ['fc_boc_trang', 'Bóc trang', '📄', 'vec4 transition(vec2 uv){float L=progress*1.25;float d=((1.-uv.x)+(1.-uv.y))*.5;if(d>=L)return getFromColor(uv);vec2 r=uv-vec2(2.*(L-d));if(r.x>=0.&&r.y>=0.)return getFromColor(r)*.78;return getToColor(uv);}'],
    ['fc_theo_sang', 'Quét theo độ sáng', '🌓', 'vec4 transition(vec2 uv){vec4 a=getFromColor(uv);float l=dot(a.rgb,vec3(.299,.587,.114));float p=progress*1.2-.1;return mix(a,getToColor(uv),smoothstep(l-.1,l+.1,p));}'],
    ['fc_vet_son', 'Vệt sơn', '🎨', N + 'vec4 transition(vec2 uv){float n=n2(uv*vec2(5.*ratio,5.))*.6+n2(uv*vec2(17.*ratio,17.))*.4;return mix(getFromColor(uv),getToColor(uv),smoothstep(n-.04,n+.04,progress*1.15-.05));}'],
    ['fc_ngau_nhien', 'Quét ngẫu nhiên', '🎲', R + 'vec4 transition(vec2 uv){float c=floor(uv.x*20.);float r=r2(vec2(c,3.))*.5;float y=uv.y*.5+r;return mix(getFromColor(uv),getToColor(uv),step(y,progress*1.5));}']
  ];
  CC.forEach(function (x) { KHO.chuyenCanh.push({ id: x[0], ten: x[1], ic: x[2], glsl: x[3], fc: 1 }); });

  /* ── hiệu ứng video có tham số (ts: [khoá, nhãn, min, max, bước, mặc định, đơn vị]) ── */
  Object.assign(KHO.nhomHieuUng, { fc_mo: 'Làm mờ · nét', fc_meo: 'Bóp méo', fc_cach: 'Cách điệu', fc_tao: 'Ánh sáng · màu' });
  var HU = [
    ['fc_gauss', 'Làm mờ Gauss', 'fc_mo', '🌫', [['p1', 'Bán kính', 0, 1, 0.01, 0.35, '%']], 'vec2 r=vec2(p1*muc*.03)*vec2(res.y/res.x,1.);vec4 a=vec4(0.);float w=0.;for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++){float k=exp(-float(i*i+j*j)/8.);a+=tx(uv+vec2(float(i),float(j))*r/3.)*k;w+=k;}return a/w;'],
    ['fc_mo_huong', 'Mờ theo hướng', 'fc_mo', '➖', [['p1', 'Góc', 0, 180, 1, 0, '°'], ['p2', 'Độ dài', 0, 1, 0.01, 0.4, '%']], 'float a=p1*PI/180.;vec2 d=vec2(cos(a),sin(a))*p2*muc*.06;vec4 s=vec4(0.);for(int i=0;i<15;i++){s+=tx(uv+d*(float(i)/14.-.5));}return s/15.;'],
    ['fc_net', 'Làm nét', 'fc_mo', '🔪', [['p1', 'Mức nét', 0, 2, 0.05, 0.8, 'x']], 'vec2 e=1./res;vec4 c=tx(uv);vec4 b=(tx(uv+vec2(e.x,0.))+tx(uv-vec2(e.x,0.))+tx(uv+vec2(0.,e.y))+tx(uv-vec2(0.,e.y)))*.25;return vec4(clamp(c.rgb+(c.rgb-b.rgb)*p1*muc*2.,0.,1.),1.);'],
    ['fc_xoay_xoan', 'Xoáy (Twirl)', 'fc_meo', '🌀', [['p1', 'Góc xoáy', -720, 720, 5, 180, '°'], ['p2', 'Bán kính', 0.1, 1, 0.01, 0.5, '%']], 'vec2 q=uv-.5;q.x*=res.x/res.y;float d=length(q);float k=max(0.,1.-d/p2);float a=p1*PI/180.*k*k*muc;q=mat2(cos(a),-sin(a),sin(a),cos(a))*q;q.x/=res.x/res.y;return tx(q+.5);'],
    ['fc_song_uon', 'Sóng uốn', 'fc_meo', '🌊', [['p1', 'Biên độ', 0, 1, 0.01, 0.3, '%'], ['p2', 'Bước sóng', 0.02, 0.5, 0.01, 0.12, '%']], 'return tx(uv+vec2(sin(uv.y/p2*6.283+t*4.)*p1*muc*.03,0.));'],
    ['fc_cau', 'Cầu lồi / lõm', 'fc_meo', '🔮', [['p1', 'Độ lồi', -1, 1, 0.01, 0.6, ''], ['p2', 'Bán kính', 0.1, 0.8, 0.01, 0.45, '%']], 'vec2 q=uv-.5;q.x*=res.x/res.y;float d=length(q);if(d<p2&&d>1e-4){float z=d/p2;q*=pow(z,1.+p1*muc*.8)/z;}q.x/=res.x/res.y;return tx(q+.5);'],
    ['fc_meo_ong', 'Méo ống kính', 'fc_meo', '📷', [['p1', 'Độ cong', -1, 1, 0.01, 0.5, '']], 'vec2 q=uv*2.-1.;float r=dot(q,q);q*=1.+p1*muc*.35*r;vec2 p=q*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return vec4(0.,0.,0.,1.);return tx(p);'],
    ['fc_dich', 'Dịch lặp (Offset)', 'fc_meo', '🔁', [['p1', 'Dịch ngang', -1, 1, 0.01, 0, '%'], ['p2', 'Dịch dọc', -1, 1, 0.01, 0, '%'], ['p3', 'Tự trôi', -1, 1, 0.01, 0.2, '']], 'return texture2D(s,fract(uv+vec2(p1,p2)*muc+vec2(t*p3*.3,0.)));'],
    ['fc_canh', 'Tìm cạnh', 'fc_cach', '✏️', [['p1', 'Đảo nền', 0, 1, 1, 0, '']], 'vec2 e=1./res;vec3 w=vec3(.299,.587,.114);float a=dot(tx(uv+vec2(-e.x,-e.y)).rgb,w),b=dot(tx(uv+vec2(0.,-e.y)).rgb,w),c=dot(tx(uv+vec2(e.x,-e.y)).rgb,w),d=dot(tx(uv+vec2(-e.x,0.)).rgb,w),f=dot(tx(uv+vec2(e.x,0.)).rgb,w),g=dot(tx(uv+vec2(-e.x,e.y)).rgb,w),h=dot(tx(uv+vec2(0.,e.y)).rgb,w),i=dot(tx(uv+e).rgb,w);float gx=-a-2.*d-g+c+2.*f+i,gy=-a-2.*b-c+g+2.*h+i;float v=clamp(length(vec2(gx,gy))*2.,0.,1.);vec3 o=p1>.5?vec3(v):vec3(1.-v);return vec4(mix(tx(uv).rgb,o,muc),1.);'],
    ['fc_cham_noi', 'Chạm nổi', 'fc_cach', '🗿', [['p1', 'Góc sáng', 0, 360, 5, 135, '°'], ['p2', 'Giữ màu', 0, 1, 0.01, 0.2, '%']], 'float a=p1*PI/180.;vec2 d=vec2(cos(a),sin(a))*1.5/res;vec3 w=vec3(.299,.587,.114);float v=.5+(dot(tx(uv+d).rgb,w)-dot(tx(uv-d).rgb,w))*2.;vec3 c=mix(vec3(v),tx(uv).rgb*v*1.6,p2);return vec4(mix(tx(uv).rgb,c,muc),1.);'],
    ['fc_phoi_nguoc', 'Phơi sáng ngược', 'fc_cach', '☀️', [['p1', 'Ngưỡng', 0, 1, 0.01, 0.5, '%']], 'vec4 c=tx(uv);vec3 o=mix(c.rgb,1.-c.rgb,step(vec3(p1),c.rgb));return vec4(mix(c.rgb,o,muc),1.);'],
    ['fc_nguong', 'Ngưỡng đen trắng', 'fc_cach', '◐', [['p1', 'Mức', 0, 1, 0.01, 0.5, '%'], ['p2', 'Độ mềm', 0, 0.3, 0.01, 0.03, '']], 'vec4 c=tx(uv);float l=dot(c.rgb,vec3(.299,.587,.114));float v=smoothstep(p1-p2,p1+p2+1e-3,l);return vec4(mix(c.rgb,vec3(v),muc),1.);'],
    ['fc_chop_den', 'Đèn chớp', 'fc_tao', '🚨', [['p1', 'Nháy/giây', 1, 20, 0.5, 6, 'Hz'], ['p2', 'Độ dài chớp', 0.05, 0.9, 0.01, 0.3, '%']], 'vec4 c=tx(uv);float f=step(fract(t*p1),p2);return vec4(mix(c.rgb,vec3(1.),f*muc*.85),1.);'],
    ['fc_giu_mau', 'Giữ một màu', 'fc_tao', '🎯', [['p1', 'Màu giữ (độ)', 0, 360, 1, 0, '°'], ['p2', 'Độ rộng', 0.02, 0.5, 0.01, 0.12, '']], 'vec4 c=tx(uv);vec3 x=c.rgb;float mx=max(x.r,max(x.g,x.b)),mn=min(x.r,min(x.g,x.b)),d=mx-mn;float h=0.;if(d>1e-4){if(mx==x.r)h=mod((x.g-x.b)/d,6.);else if(mx==x.g)h=(x.b-x.r)/d+2.;else h=(x.r-x.g)/d+4.;}h/=6.;float k=abs(h-p1/360.);k=min(k,1.-k);float giu=1.-smoothstep(p2,p2+.06,k);giu*=smoothstep(.05,.2,d);float l=dot(x,vec3(.299,.587,.114));return vec4(mix(x,mix(vec3(l),x,giu),muc),1.);'],
    ['fc_nhuom', 'Nhuộm màu (Tint)', 'fc_tao', '🫧', [['p1', 'Sắc (độ)', 0, 360, 1, 30, '°']], 'vec4 c=tx(uv);float l=dot(c.rgb,vec3(.299,.587,.114));vec3 h=clamp(abs(mod(p1/60.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);vec3 o=mix(vec3(0.),h,l)+l*.25;return vec4(mix(c.rgb,clamp(o*1.2,0.,1.),muc),1.);'],
    ['fc_loe', 'Loé ống kính', 'fc_tao', '🌟', [['p1', 'Vị trí ngang', 0, 1, 0.01, 0.25, '%'], ['p2', 'Vị trí dọc', 0, 1, 0.01, 0.2, '%']], 'vec4 c=tx(uv);vec2 a=res.x/res.y>1.?vec2(res.x/res.y,1.):vec2(1.,res.y/res.x);vec2 L=vec2(p1,1.-p2);vec2 q=(uv-L)*a;float d=length(q);vec3 f=vec3(1.,.85,.6)*(.025/(d+.02))*.6;f+=vec3(1.,.6,.3)*pow(max(0.,1.-abs(q.y)*40.),3.)*.5*max(0.,1.-abs(q.x)*1.5);for(int i=1;i<4;i++){vec2 g=(vec2(.5)-L)*float(i)*.6+L;float r=length((uv-g)*a);f+=vec3(.4,.7,1.)*(1.-smoothstep(0.,.06/float(i),r))*.18;}return vec4(clamp(c.rgb+f*muc,0.,1.),1.);'],
    ['fc_dai_mau', 'Dải màu chuyển', 'fc_tao', '🌈', [['p1', 'Sắc (độ)', 0, 360, 1, 280, '°'], ['p2', 'Góc', 0, 360, 5, 90, '°']], 'vec4 c=tx(uv);float a=p2*PI/180.;float k=dot(uv-.5,vec2(cos(a),sin(a)))+.5;vec3 h=clamp(abs(mod(p1/60.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);vec3 o=1.-(1.-c.rgb)*(1.-h*k*.8);return vec4(mix(c.rgb,o,muc),1.);'],
    ['fc_toi_goc', 'Tối góc tuỳ chỉnh', 'fc_tao', '⚫', [['p1', 'Độ tròn', 0, 1, 0.01, 0.6, '%'], ['p2', 'Độ mềm', 0.05, 1, 0.01, 0.45, '%']], 'vec4 c=tx(uv);vec2 q=uv-.5;q.x*=mix(1.,res.x/res.y,p1);float d=length(q)*1.4;float v=smoothstep(1.-p2,1.,d);return vec4(c.rgb*(1.-v*muc),1.);'],
    ['fc_nhieu', 'Nhiễu (Noise)', 'fc_cach', '📡', [['p1', 'Có màu', 0, 1, 0.01, 0.3, '%']], 'vec4 c=tx(uv);vec2 g=uv*res+t*91.;vec3 n=vec3(rnd(g),rnd(g+17.),rnd(g+31.))-.5;n=mix(vec3(n.r),n,p1);return vec4(clamp(c.rgb+n*.35*muc,0.,1.),1.);'],
    ['fc_guong_goc', 'Gương theo góc', 'fc_meo', '🪞', [['p1', 'Góc trục', 0, 180, 1, 90, '°'], ['p2', 'Tâm', 0, 1, 0.01, 0.5, '%']], 'float a=p1*PI/180.;vec2 n=vec2(cos(a),sin(a));vec2 q=uv-vec2(p2,.5);float d=dot(q,n);if(d<0.)q-=2.*d*n;return tx(mix(uv,q+vec2(p2,.5),step(.5,muc)));']
  ];
  HU.forEach(function (x) { KHO.hieuUng.push({ id: x[0], ten: x[1], nhom: x[2], ic: x[3], ts: x[4], glsl: x[5], fc: 1 }); });

  /* ── bộ lọc look ── */
  KHO.nhomBoLoc.fc = 'Look FilmCraft';
  [
    ['fc_tay_bac', 'Tẩy bạc', { bh: 0.45, tp: 0.25, scurve: 0.4 }],
    ['fc_kodak', 'Phim ấm 2383', { nhiet: 0.35, scurve: 0.3, cao: ['#ffcf8a', 0.2], bong: ['#1f3a4a', 0.2], bh: 1.05 }],
    ['fc_fuji', 'Phim dịu xanh', { tint: -0.15, bh: 0.92, phai: 0.06, cao: ['#e8ffe8', 0.1] }],
    ['fc_dem_xanh', 'Đêm xanh', { nhiet: -0.4, bong: ['#05324a', 0.35], tp: 0.1, sang: -0.04 }],
    ['fc_gio_vang', 'Giờ vàng', { nhiet: 0.5, cao: ['#ffb347', 0.3], bh: 1.1 }],
    ['fc_li', 'Mờ lì (matte)', { phai: 0.12, tp: -0.08, bh: 0.9, lift: [0.03, 0.03, 0.04] }],
    ['fc_bat_mau', 'Bật màu', { vib: 0.5, tp: 0.15, scurve: 0.2 }],
    ['fc_dt_gat', 'Đen trắng gắt', { mono: 1, tp: 0.35, scurve: 0.5 }],
    ['fc_phim_phai', 'Phim phai', { phai: 0.18, bh: 0.8, nhiet: 0.15, scurve: 0.15 }],
    ['fc_ruc_tu_nhien', 'Rực tự nhiên', { vib: 0.6 }],
    ['fc_trong_treo', 'Trong trẻo', { nhiet: -0.15, sang: 0.03, vib: 0.25 }],
    ['fc_neon_tim', 'Neon tím', { duo: ['#2b0a5a', '#ff4fd8', 0.35], tp: 0.1 }]
  ].forEach(function (x) { KHO.boLoc.push({ id: x[0], ten: x[1], nhom: 'fc', p: x[2], fc: 1 }); });

  /* ── hiệu ứng âm thanh tổng hợp ── */
  [
    ['bass_drop', 'Bass drop', '🔊', 'va', 1.6, [{ k: 'osc', w: 'sine', f: [180, 35], dai: 1.6, g: 1, a: 0.01 }, { k: 'nhieu', loc: ['lowpass', 300, 60, 1], dai: 0.5, g: 0.4, a: 0.005 }]],
    ['sub_boom', 'Sub boom', '💣', 'va', 2, [{ k: 'osc', w: 'sine', f: [62, 30], dai: 2, g: 1, a: 0.005 }]],
    ['bang_dung', 'Băng dừng (tape stop)', '📼', 'kich', 0.9, [{ k: 'osc', w: 'sawtooth', f: [440, 40], dai: 0.9, g: 0.25, a: 0.01 }, { k: 'osc', w: 'sine', f: [220, 20], dai: 0.9, g: 0.5, a: 0.01 }]],
    ['tua_nguoc', 'Tua ngược', '⏪', 'dong', 0.7, [{ k: 'nhieu', loc: ['bandpass', 6000, 700, 2], dai: 0.7, g: 0.7, a: 0.05 }, { k: 'osc', w: 'sawtooth', f: [300, 1400], dai: 0.7, g: 0.12, a: 0.05 }]],
    ['dia_xuoc', 'Đĩa xước', '💿', 'vui', 0.45, [{ k: 'nhieu', loc: ['bandpass', 700, 3500, 3], dai: 0.2, g: 0.9, a: 0.01 }, { k: 'nhieu', loc: ['bandpass', 3500, 600, 3], dai: 0.25, g: 0.9, a: 0.01, tre: 0.2 }]],
    ['glitch_so', 'Glitch số', '👾', 'kich', 0.45, [{ k: 'osc', w: 'square', f: [900, 900], dai: 0.04, g: 0.3, a: 0.002 }, { k: 'nhieu', loc: ['highpass', 3000, 3000, 1], dai: 0.03, g: 0.4, a: 0.002 }], { n: 8, moi: 0.05, ngau: 0.03 }],
    ['len_cap', 'Lên cấp', '🆙', 'ui', 0.55, [{ k: 'osc', w: 'square', f: [523, 523], dai: 0.12, g: 0.25, a: 0.005 }, { k: 'osc', w: 'square', f: [659, 659], dai: 0.12, g: 0.25, a: 0.005, tre: 0.1 }, { k: 'osc', w: 'square', f: [784, 784], dai: 0.12, g: 0.25, a: 0.005, tre: 0.2 }, { k: 'osc', w: 'square', f: [1046, 1046], dai: 0.25, g: 0.25, a: 0.005, tre: 0.3 }]],
    ['ting', 'Ting', '✨', 'ui', 1, [{ k: 'osc', w: 'sine', f: [2093, 2093], dai: 1, g: 0.45, a: 0.002 }, { k: 'osc', w: 'sine', f: [4186, 4186], dai: 0.6, g: 0.15, a: 0.002 }]],
    ['bloop', 'Bloop', '🫧', 'vui', 0.16, [{ k: 'osc', w: 'sine', f: [300, 900], dai: 0.16, g: 0.7, a: 0.005 }]],
    ['giot_nuoc', 'Giọt nước', '💧', 'moi', 0.14, [{ k: 'osc', w: 'sine', f: [1500, 480], dai: 0.14, g: 0.7, a: 0.002 }]],
    ['vut_xuyen', 'Vút xuyên', '🌪', 'dong', 0.9, [{ k: 'nhieu', loc: ['bandpass', 300, 7000, 2], dai: 0.45, g: 0.8, a: 0.3 }, { k: 'nhieu', loc: ['bandpass', 7000, 300, 2], dai: 0.45, g: 0.8, a: 0.02, tre: 0.45 }]],
    ['dia_than', 'Lách tách đĩa than', '📻', 'moi', 3, [{ k: 'nhieu', loc: ['highpass', 2500, 2500, 1], dai: 0.012, g: 0.35, a: 0.001 }], { n: 60, moi: 0.05, ngau: 0.05 }],
    ['chu_bat', 'Chữ bật', '🔤', 'ui', 0.12, [{ k: 'osc', w: 'triangle', f: [600, 1300], dai: 0.08, g: 0.5, a: 0.002 }, { k: 'nhieu', loc: ['highpass', 4000, 4000, 1], dai: 0.03, g: 0.3, a: 0.001 }]],
    ['bao_thuc', 'Chuông báo thức', '⏰', 'ui', 1.5, [{ k: 'osc', w: 'square', f: [880, 880], dai: 0.15, g: 0.25, a: 0.003 }], { n: 6, moi: 0.25 }],
    ['trong_don', 'Trống dồn', '🥁', 'kich', 1.2, [{ k: 'nhieu', loc: ['bandpass', 1800, 1800, 1.2], dai: 0.05, g: 0.6, a: 0.002 }, { k: 'osc', w: 'sine', f: [200, 140], dai: 0.05, g: 0.4, a: 0.002 }], { n: 28, moi: 0.042, ngau: 0.006 }],
    ['ta_da', 'Ta-da', '🎉', 'vui', 1.3, [{ k: 'osc', w: 'sawtooth', f: [392, 392], dai: 0.18, g: 0.18, a: 0.01 }, { k: 'osc', w: 'sawtooth', f: [523, 523], dai: 1.1, g: 0.18, a: 0.01, tre: 0.2 }, { k: 'osc', w: 'sawtooth', f: [659, 659], dai: 1.1, g: 0.14, a: 0.01, tre: 0.2 }, { k: 'osc', w: 'sawtooth', f: [784, 784], dai: 1.1, g: 0.12, a: 0.01, tre: 0.2 }]],
    ['song_radio', 'Dò sóng radio', '📶', 'moi', 1.5, [{ k: 'nhieu', loc: ['bandpass', 400, 3000, 6], dai: 1.5, g: 0.5, a: 0.05 }, { k: 'osc', w: 'sine', f: [1200, 400], dai: 1.5, g: 0.1, a: 0.1, ramp: 'lin' }]]
  ].forEach(function (x) { var r = { id: x[0], ten: x[1], ic: x[2], nhom: x[3], dai: x[4], cong: x[5], fc: 1 }; if (x[6]) r.lap = x[6]; KHO.amThanh.push(r); });
})();
