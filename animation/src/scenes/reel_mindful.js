// reel_mindful.js: TEMPLATE for a 30 s vertical (1080×1920) mindfulness reel. See STORYBOARD_REEL.md.
//
// Star: "Brote", a sage-green sprout built on Clawd's body (same eyes, emotions, moves) with a leafy sprout on top.
// Story: sleeps on a cushion → a butterfly wakes it → plays across a pond → stops, breathes, levitates → returns at
// night and falls asleep. Colour arc: dawn → day → dusk → night.
//
// HOW TO REUSE IT
//   1. Restyle: change the colours in C (palette) and BODY (the character).
//   2. Retime: every shot keeps its key times as named constants at its top; shots are registered at the bottom.
//   3. New story: keep the set pieces (sky, land, cushion, pond, lotus, butterfly, fireflies, brote) and write new
//      shot functions. Keep the action inside the Reels safe zone, y ≈ 300..1500.
(() => {
  // ===================== TEMPLATE SETTINGS =====================
  const C = {
    leaf: '#7DB86F', leafDk: '#4C8A52',
    cushion: '#D98C8C', cushionDk: '#A8616A',
    wing: '#F2B84B', wing2: '#E27A92',
    dawn: ['#F2BFAE', '#F8E8D6'], day: ['#A7D6D0', '#EAF4EC'], dusk: ['#8F7FC0', '#F2C6B4'], night: ['#1E2A55', '#3D4383'],
    hillFar: '#B9B3D6', hillNear: '#9CC5A6', ground: '#86B58F',
    water: '#86C6C0', waterDk: '#4F9C9A', stone: '#A9AEA6', lotus: '#F2A7B8', lotusLt: '#FBE1E6', pad: '#6FA672',
    mint: '#DFEDE5', cream: '#FFF5E2',
  };
  const BODY = { col: '#8DB89A', dk: '#5B8A72', lt: '#D3EAD5' };   // Brote's body colours

  // Brote is Clawd recoloured: every emotion and cross-fade now starts from BODY instead of terracotta.
  tintCols = function (o) {
    const c = { col: o.col || BODY.col, dk: o.dk || BODY.dk, lt: o.lt || BODY.lt };
    const tc = o.tint && (TINT[o.tint] || o.tint), k = clamp(o.tintK ?? 1);
    if (!tc || k <= 0) return c;
    return { col: mixCol(c.col, tc, .45 * k), dk: mixCol(c.dk, mixCol(tc, PAL.ink, .35), .4 * k), lt: mixCol(c.lt, mixCol(tc, '#FFFFFF', .4), .4 * k) };
  };

  // ===================== CHARACTER =====================
  const HX = { front: 0, q: .6, side: .3, qback: -.4, back: 0 };   // top-centre of the body per view (in u)
  // A pointed leaf from its base (bx, by), len long, wid half-width, pointing at angle ang.
  function leafPts(bx, by, len, wid, ang, n = 8) {
    const c = Math.cos(ang), s = Math.sin(ang), L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, w = wid * Math.sin(Math.PI * k) * (1 - .25 * k), px = k * len;
      L.push([bx + px * c - w * s, by + px * s + w * c]); R.push([bx + px * c + w * s, by + px * s - w * c]);
    }
    return L.concat(R.reverse().slice(1, -1));
  }
  function sprout(u, sw, hx, sway) {
    const bx = hx * u, by = -8 * u, tx = bx + sway * u, ty = by - 2.2 * u;
    inkLine([[bx, by + .15 * u], [bx + sway * u * .35, by - 1.1 * u], [tx, ty]], sw * 1.2, C.leafDk, 'ink', .5);
    for (const s of [-1, 1]) {
      const a = -Math.PI / 2 + s * (1.0 + .15 * Math.sin(T * 1.3 + s)) + sway * .5;
      paint(leafPts(tx, ty, 2.1 * u, .6 * u, a), { wash: s < 0 ? C.leaf : mixCol(C.leaf, C.leafDk, .35), ink: PAL.ink, sw: sw * .7 });
    }
  }
  // brote(x, y, u, o): Clawd options plus sit (legs tucked, for sitting: pass y = seat + 2u) and sway (sprout lean, in u).
  function brote(x, y, u, o = {}) {
    const extra = o.draw;
    clawd(x, y, u, { ...o, noLegs: o.sit || o.noLegs, noShadow: o.noShadow ?? !!o.sit,
      draw: (uu, sw) => { sprout(uu, sw, HX[o.view] ?? 0, o.sway || 0); if (extra) extra(uu, sw); } });
  }
  // World position of the sprout's tip (where a butterfly can land), for the same x, y, u and options.
  function sproutTip(x, y, u, o = {}) {
    const dir = o.flip ? -1 : 1, sq = o.sq || 0;
    return [x + (o.dx || 0) * u + dir * ((HX[o.view] ?? 0) + (o.sway || 0)) * u * (1 + sq * .6), y + (o.dy || 0) * u - 10.4 * u * (1 - sq)];
  }
  const swayOf = (t, kicks = []) => .12 * Math.sin(t * 1.7) + .55 * ring(t, kicks, 4.5, 13);

  // ===================== SET PIECES =====================
  function sky(top, bot) {
    boilSeed('sky');
    paint(rectPts(-400, -1000, W + 800, H + 1600), { wash: bot, ink: null });
    for (let i = 0; i < 5; i++) {
      boilSeed('skyband' + i);
      paint(rectPts(-400, -1000, W + 800, 1000 + H * (.62 - i * .11), 18), { fill: top, fillOp: 75, bleed: .25, tex: .3, border: .2, ink: null });
    }
  }
  function stars(t, k, n = 40, yMax = 900) {
    if (k <= 0) return;
    for (let i = 0; i < n; i++) {
      boilSeed('star' + i);
      const x = hash(i) * W, y = hash(i + 70) * (yMax + 700) - 700, tw = .55 + .45 * Math.sin(t * (1.5 + 2 * hash(i + 9)) + i);
      paint(starPts(x, y, (3 + 6 * hash(i + 30)) * tw * k, .35, 4), { wash: C.cream, washOp: Math.min(255, 140 + 110 * tw), ink: null });
    }
  }
  function tufts(t, col, y0 = 1430, y1 = 1720, n = 12) {
    for (let i = 0; i < n; i++) {
      boilSeed('tuft' + i);
      const x = hash(i + 3) * (W + 100) - 50, y = lerp(y0, y1, hash(i + 40)), s = wob(t, .35, hash(i) * 3) * 6, h = 22 + 14 * hash(i + 8);
      for (const k of [-1, 0, 1]) inkLine([[x + k * 7, y], [x + k * 12 + s, y - h - 6 * hash(i + k)]], .8, col, 'inkfine', .4);
    }
  }
  // The meadow of shots A and D. dark 0..1 tints it toward night.
  function land(t, dark = 0) {
    const d = c => mixCol(c, C.night[0], dark);
    boilSeed('hillFar');  paint(ellPts(160, 1360, 620, 250, 36, 2), { wash: d(C.hillFar), fill: d(mixCol(C.hillFar, PAL.ink, .15)), fillOp: 60, bleed: .1, tex: .5, ink: PAL.ink, sw: .8 });
    boilSeed('hillNear'); paint(ellPts(960, 1390, 560, 280, 36, 2), { wash: d(C.hillNear), fill: d(mixCol(C.hillNear, PAL.ink, .15)), fillOp: 60, bleed: .1, tex: .5, ink: PAL.ink, sw: .8 });
    boilSeed('ground');   paint(rectPts(-400, 1392, W + 800, 1000, 3), { wash: d(C.ground), fill: d(mixCol(C.ground, PAL.ink, .2)), fillOp: 70, bleed: .05, tex: .6, ink: null });
    boilSeed('groundline'); inkLine([[-200, 1394], [W / 2, 1388], [W + 200, 1396]], 1, PAL.ink, 'ink', .5);
    tufts(t, d(mixCol(C.ground, C.cream, .35)));
  }
  // Meditation cushion (zafu); (x, y) = the top centre, where Brote sits.
  function cushion(x, y) {
    boilSeed('cushion');
    paint(ellPts(x, y + 92, 250, 24, 24), { fill: PAL.ink, fillOp: 80, bleed: .2, ink: null });
    paint(ellPts(x, y + 40, 230, 58, 30, 1.5), { wash: C.cushionDk, fill: mixCol(C.cushionDk, PAL.ink, .2), fillOp: 60, tex: .5, ink: PAL.ink, sw: 1 });
    paint(ellPts(x, y + 8, 222, 42, 30, 1.5), { wash: C.cushion, fill: mixCol(C.cushion, '#FFFFFF', .35), fillOp: 90, bleed: .1, tex: .5, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (.12 + i * .095); inkLine([[x + Math.cos(a) * 222, y + 8 + Math.sin(a) * 42], [x + Math.cos(a) * 230, y + 40 + Math.sin(a) * 58]], .6, mixCol(C.cushionDk, PAL.ink, .4), 'inkfine', 0); }
  }
  function stone(x, y, rx, key) {
    boilSeed('stone' + key);
    paint(ellPts(x, y + rx * .16, rx, rx * .34, 22, 1.5), { wash: mixCol(C.stone, PAL.ink, .3), ink: PAL.ink, sw: .8 });
    paint(ellPts(x, y, rx * .94, rx * .28, 22, 1.5), { wash: C.stone, fill: mixCol(C.stone, '#FFFFFF', .3), fillOp: 80, tex: .6, ink: PAL.ink, sw: .8 });
  }
  function lotus(x, y, s, t, key = 'lotus') {
    boilSeed(key + 'pad');
    paint(ellPts(x, y + 14 * s, 150 * s, 42 * s, 26, 1.5), { wash: C.pad, fill: mixCol(C.pad, PAL.ink, .2), fillOp: 70, tex: .5, ink: PAL.ink, sw: clamp(.8 * s, .6, 1.2) });
    boilSeed(key + 'petals');
    const br = .03 * Math.sin(t * 1.2);
    for (const [a, len, c] of [[-2.6, 78, C.lotus], [-.54, 78, C.lotus], [-2.15, 92, mixCol(C.lotus, C.lotusLt, .3)], [-1, 92, mixCol(C.lotus, C.lotusLt, .3)], [-1.57, 100, C.lotusLt]])
      paint(leafPts(x, y + 8 * s, len * s, 26 * s, a + br * (a + 1.57)), { wash: c, ink: PAL.ink, sw: clamp(.7 * s, .5, 1.1) });
  }
  // The lotus's front petals, drawn after whoever sits in it.
  function lotusFront(x, y, s, t, key = 'lotus') {
    boilSeed(key + 'front');
    const br = .03 * Math.sin(t * 1.2 + 1);
    for (const [a, len, dx] of [[-2.85, 70, -40], [-.29, 70, 40], [-1.95, 52, -22], [-1.19, 52, 22]])
      paint(leafPts(x + dx * s, y + 18 * s, len * s, 22 * s, a + br), { wash: mixCol(C.lotus, C.lotusLt, .15), ink: PAL.ink, sw: clamp(.7 * s, .5, 1.1) });
  }
  function ripples(x, y, t0, t, o = {}) {
    const n = o.n ?? 3, life = o.life ?? 1.6, sp = o.speed ?? 120, sq = o.sq ?? .32;
    for (let i = 0; i < n; i++) {
      const a = t - t0 - i * (o.gap ?? .35); if (a <= 0 || a > life) continue;
      boilSeed('ripple' + x + '_' + i);
      const r = 20 + a * sp;
      paint(ellPts(x, y, r, r * sq, 36), { ink: mixCol(C.cream, o.base || C.water, seg(a, 0, life)), sw: 1.4 * (1 - a / life) + .3 });
    }
  }
  // Butterfly at (x, y), s = size in px. rest: wings fold slowly instead of flapping.
  function butterfly(x, y, s, t, o = {}) {
    boilSeed(o.key || 'bfly');
    const w = o.rest ? .55 + .35 * Math.sin(t * 2.2) : .18 + .82 * Math.abs(Math.sin(t * TAU * 3.2));
    push(); translate(x, y); rotate(o.rot || 0);
    for (const sd of [-1, 1]) {
      push(); scale(sd * w, 1);
      paint(ellPts(s * .5, -s * .3, s * .55, s * .45, 16), { wash: C.wing, fill: mixCol(C.wing, '#FFFFFF', .3), fillOp: 80, ink: PAL.ink, sw: .6 });
      paint(ellPts(s * .36, s * .28, s * .36, s * .3, 14), { wash: C.wing2, ink: PAL.ink, sw: .6 });
      pop();
    }
    paint(ellPts(0, 0, s * .09, s * .42, 10), { wash: PAL.ink, ink: null });
    for (const sd of [-1, 1]) inkLine([[0, -s * .38], [sd * s * .12, -s * .62], [sd * s * .28, -s * .78]], .6, PAL.ink, 'inkfine', .5);
    pop();
  }
  // Fluttering flight through keyframes [[t, [x, y]], ...]; wobble 0..1 calms the flutter (0 when landing).
  const flight = (t, keys, wobble = 1) => { const [x, y] = kf(t, keys); return [x + wobble * 28 * Math.sin(t * 5.3), y + wobble * 22 * Math.sin(t * 8.1 + 1)]; };
  function fireflies(t, k, cx, cy, spread, n = 14) {
    if (k <= 0) return;
    for (let i = 0; i < n; i++) {
      const life = 3 + 2 * hash(i + 5), a = frac((t + hash(i) * life) / life), x = cx + (hash(i + 11) - .5) * spread + 30 * Math.sin(t * 1.3 + i), y = cy - a * 700;
      const f = k * Math.sin(Math.PI * a);
      glow(x, y, 40 * f, '#FFE6A0', .8 * f);
      boilSeed('ff' + i); paint(ellPts(x, y, 5 * f + 1, 5 * f + 1, 8), { wash: '#FFF3C4', ink: null });
    }
  }
  const WIPE_DAY = [C.leaf, BODY.col], WIPE_NIGHT = [C.night[0], C.dusk[0]];

  // ===================== SHOT A (0–7): wake up =====================
  const CUSH = [540, 1300];   // cushion top centre: same place in shots A and D (the ending rhymes with the opening)
  function shotA(t, lt, dur) {
    const u = 30, tIn = 1.0, tLand = 2.6, tWake = 3.1, tHappy = 4.1, tOff = 4.7, tPlay = 4.9, tTurn = 5.15, tHop0 = 5.55, tHop1 = 6.1;
    camBegin(540, kf(lt, [[0, 1180], [dur, 1150]]), kf(lt, [[0, 1.28], [dur, 1.15]]));
    const k = seg(lt, 0, dur);
    sky(mixCol(C.dawn[0], C.day[0], .35 * k), C.dawn[1]);
    const sunY = lerp(1220, 1060, ease(k));
    glow(780, sunY, 300, '#FFD9A0', .9);
    boilSeed('sun'); paint(ellPts(780, sunY, 72, 72, 26, 1.5), { wash: '#FFE3B0', ink: null });
    land(t);
    cushion(...CUSH);

    const mood = emotions(lt, [[0, 'sleepy'], [tWake, 'surprised', { lookY: -1, lookX: .2 }], [tHappy, 'happy', { lookY: -.8, lookX: .5 }], [tPlay, 'playful', { lookX: .8, lookY: -.5 }]]);
    let x = CUSH[0], y = CUSH[1] + 8 + 2 * u, pose = { sit: true }, view = lt >= tTurn ? turn(lt, tTurn, tTurn + .2, 0, .25) : {};
    if (lt >= tHop0 - .15) {   // hop off the cushion, then trot out to the right (screen direction carries into shot B)
      const kk = seg(lt, tHop0, tHop1), j = jump(lt, tHop0, tHop1, 0), p = arcPt([CUSH[0], y], [760, 1405], 190, kk);
      x = p[0]; y = p[1]; pose = { sit: kk < .25, sq: j.sq }; view = { view: 'side' };
      if (lt > tHop1 + .15) { const w = stroll(lt, tHop1 + .15, dur + .2, 760, 1300, u); x = w.x; pose = { sq: j.sq, walk: w.walk, dy: w.dy }; }
    }
    const o = { ...mood, ...view, ...pose, sq: (mood.sq || 0) + (pose.sq || 0), dy: (mood.dy || 0) * (lt > tHop0 ? .3 : 1) + (pose.dy || 0), sway: swayOf(lt, [tLand, tWake, tHop1]) };
    brote(x, y, u, o);

    const tip = sproutTip(x, y, u, o);
    if (lt > tIn && lt < tOff) {
      const p = flight(lt, [[tIn, [1250, 420]], [tLand, [tip[0], tip[1] - 10]]], 1 - seg(lt, tLand - .6, tLand));
      butterfly(lt < tLand ? p[0] : tip[0], lt < tLand ? p[1] : tip[1] - 10, 40, t, { rest: lt > tLand });
    } else if (lt >= tOff) {
      const p = flight(lt, [[tOff, [tip[0], tip[1] - 10]], [tOff + 2.3, [1350, 760]]], seg(lt, tOff, tOff + .4));
      butterfly(...p, 40, t);
    }
    const eye = toScreen(x, y - 4 * u);
    camEnd();
    if (lt < .6) iris(...eye, lerp(0, 1800, easeIn(lt / .6)));
    boilSeed('transition');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, WIPE_DAY);
  }

  // ===================== SHOT B (7–14): play across the pond =====================
  const STONES = [[300, 1330, 82], [560, 1218, 72], [790, 1126, 64]];
  const LOTUS_B = [400, 1030];
  function shotB(t, lt, dur) {
    const hops = [[1.2, 1.7], [2.2, 2.7], [3.2, 3.7]], tTurn = 3.95, tLand = 4.4, tRings = 5.0, tCalm = 5.3, tFill = 6.3;
    camBegin(540 + 14 * Math.sin(lt * .5), 1150, 1.12 + .008 * lt);
    sky(C.day[0], C.day[1]);
    boilSeed('hillsB'); paint(ellPts(300, 940, 700, 200, 36, 2), { wash: C.hillFar, fill: mixCol(C.hillFar, PAL.ink, .15), fillOp: 60, bleed: .1, tex: .5, ink: PAL.ink, sw: .8 });
    boilSeed('groundB'); paint(rectPts(-400, 900, W + 800, 1400, 3), { wash: C.ground, fill: mixCol(C.ground, PAL.ink, .2), fillOp: 60, bleed: .05, tex: .6, ink: null });
    boilSeed('groundlineB'); inkLine([[-200, 902], [W / 2, 896], [W + 200, 904]], 1, PAL.ink, 'ink', .5);
    boilSeed('pond'); paint(ellPts(560, 1180, 520, 235, 40, 3), { wash: C.water, fill: C.waterDk, fillOp: 70, bleed: .15, tex: .6, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 5; i++) { boilSeed('glint' + i); const gx = 250 + hash(i + 2) * 600, gy = 1020 + hash(i + 6) * 300; inkLine([[gx - 30, gy], [gx + 30 + 8 * Math.sin(t + i), gy]], .7, mixCol(C.water, C.cream, .6), 'inkfine', .3); }
    tufts(t, mixCol(C.ground, C.cream, .35), 1440, 1700, 10);
    STONES.forEach(([sx, sy, r], i) => stone(sx, sy, r, i));
    lotus(...LOTUS_B, .8, t, 'lotusB');
    // ripples where Brote lands, and from the lotus once the butterfly settles
    hops.forEach(([, b], i) => ripples(STONES[i][0], STONES[i][1] + 10, b, lt, { n: 2, life: 1.2, speed: 110 }));
    ripples(LOTUS_B[0], LOTUS_B[1] + 20, tRings, lt, { n: 6, life: 2.6, gap: .4, speed: 260 + 260 * seg(lt, tRings, dur) });

    // Brote: walks in along the bank, then hops stone to stone (smaller as it goes back), then stops and calms down
    const uAt = y => lerp(23, 29, seg(y, 1126, 1480));
    let x, y, pose = {};
    if (lt < hops[0][0]) { const w = stroll(lt, 0, 1.1, -160, 170, 29); x = w.x; y = 1480; pose = { view: 'side', walk: w.walk, dy: w.dy }; }
    else {
      const pts = [[170, 1480], ...STONES.map(s => [s[0], s[1] + 6])];
      let i = 0; while (i < 2 && lt >= hops[i + 1][0] - .12) i++;
      const [a, b] = hops[i], kk = seg(lt, a, b), p = arcPt(pts[i], pts[i + 1], 150, kk), j = jump(lt, a, b, 0);
      x = p[0]; y = p[1]; pose = { view: 'side', sq: j.sq };
      if (lt > tTurn) pose = { ...turn(lt, tTurn, tTurn + .2, .25, -.125), sq: j.sq };
    }
    const u = uAt(y);
    const mood = emotions(lt, [[0, 'happy', { lookX: .6, lookY: -.5 }], [1.0, 'playful', { lookX: .7, lookY: -.6 }], [tTurn + .1, 'hopeful', { lookX: .5, lookY: -.4 }],
                               [tCalm, 'relieved', { eyes: 'closed', mouth: 'smile', blush: .4, emote: null }]]);
    const o = { ...mood, ...pose, sq: (mood.sq || 0) + (pose.sq || 0), dy: (mood.dy || 0) * (lt < tCalm ? .35 : .5), dx: 0, sway: swayOf(lt, hops.map(h => h[1])) };
    brote(x, y, u, o);

    // the butterfly leads, always a little ahead, then lands on the lotus
    const top = [LOTUS_B[0] - 4, LOTUS_B[1] - 70];
    const bp = lt < tLand ? flight(lt, [[0, [260, 980]], [1.4, [520, 900]], [2.4, [760, 860]], [3.4, [650, 780]], [tLand, top]], 1 - seg(lt, tLand - .6, tLand)) : top;
    butterfly(...bp, 36, t, { rest: lt >= tLand });
    camEnd();
    boilSeed('transition');
    if (lt < .3) brushWipe(.5 + lt / .6, WIPE_DAY);
    flash(easeIn(seg(lt, tFill, dur)), C.mint);   // the rings swell into a wash of mint: it becomes the breathing circle
  }

  // ===================== SHOT C (14–24): breathe =====================
  function shotC(t, lt, dur) {
    const u = 40, tIn = 1.0, tLand = 2.6, tPeek = 3.0, tClose = 4.2, tOff = 5.0, tLift = 5.4, tRise = 8.0;
    const breath = lt < .4 ? 0 : .5 - .5 * Math.cos(TAU * (lt - .4) / 7);   // 3.5 s in, 3.5 s out
    const rise = 2.2 * ease(seg(lt, tLift, tRise)) + 16 * easeIn(seg(lt, tRise, dur + .3));   // levitation, in u
    camBegin(540, 1120 - 420 * easeIn(seg(lt, tRise - .2, dur)), lerp(1.14, 1.05, seg(lt, 0, dur)));
    const k = ease(seg(lt, 2, dur));
    sky(mixCol(C.day[0], C.dusk[0], k), mixCol(C.day[1], C.dusk[1], k));
    stars(t, seg(lt, 6.5, dur), 30, 500);
    boilSeed('waterC'); paint(rectPts(-400, 1240, W + 800, 1200, 3), { wash: mixCol(C.water, C.dusk[0], .4 * k), fill: C.waterDk, fillOp: 70, bleed: .1, tex: .6, ink: null });
    boilSeed('waterlineC'); inkLine([[-200, 1242], [W / 2, 1236], [W + 200, 1244]], 1, PAL.ink, 'ink', .5);
    ripples(540, 1330, .2, lt % 3.5, { n: 2, life: 3, speed: 140, sq: .25, base: mixCol(C.water, C.dusk[0], .4 * k) });

    // the breathing circle, behind Brote: the shape the pond's rings swelled into
    const seat = 1300, y = seat + 2 * u, cy = y - rise * u - 5 * u;
    boilSeed('breath');
    const r = 230 + 170 * breath;
    glow(540, cy, r * 1.3, '#FFF1D0', .25 + .35 * breath + .4 * seg(lt, tLift, tRise));
    paint(ellPts(540, cy, r, r, 48, 2), { fill: C.mint, fillOp: 110, bleed: .15, tex: .4, border: .3, ink: mixCol(C.mint, PAL.ink, .25), sw: 1.2 });
    paint(ellPts(540, cy, r * .72, r * .72, 40, 2), { fill: C.cream, fillOp: 60, bleed: .2, tex: .3, ink: null });
    lotus(540, seat + 10, 1.5, t, 'lotusC');
    fireflies(t, seg(lt, tLift, tLift + 1), 540, seat, 700, 16);

    const mood = emotions(lt, [[0, 'relieved', { eyes: 'closed', mouth: null, emote: null }], [tPeek, 'neutral', { eyes: ['closed', 'normal'], mouth: null, lookY: -1, lookX: .5 }],
                               [tClose, 'relieved', { eyes: 'closed', mouth: 'smile', blush: .5, emote: null }]], { take: .5 });
    const arms = -.55 + .4 * breath + 1.2 * ease(seg(lt, tRise, dur));
    const o = { ...mood, sit: true, dx: 0, rot: .02 * Math.sin(lt * .9), aL: arms, aR: arms + .04 * Math.sin(lt * 2),
                sx: 1 - .03 * breath, sy: 1 + .06 * breath, dy: -rise + (mood.dy || 0) * .3, sway: swayOf(lt, [tLand, tOff]) };
    brote(540, y, u, o);
    lotusFront(540, seat + 10, 1.5, t, 'lotusC');   // front petals over the body: Brote sits IN the flower

    // the butterfly comes back, lands on the sprout (Brote peeks), then circles round as Brote lifts off
    const tip = sproutTip(540, y, u, o);
    if (lt > tIn && lt < tOff) {
      const p = lt < tLand ? flight(lt, [[tIn, [1200, 600]], [tLand, [tip[0], tip[1] - 12]]], 1 - seg(lt, tLand - .6, tLand)) : [tip[0], tip[1] - 12];
      butterfly(...p, 44, t, { rest: lt >= tLand });
    } else if (lt >= tOff) {
      const a = (lt - tOff) * 1.3, rad = 300 * ease(seg(lt, tOff, tOff + 1)), c = [540, cy - 40];
      const p = [lerp(tip[0], c[0] + Math.cos(a - 1.6) * rad, ease(seg(lt, tOff, tOff + 1))), lerp(tip[1] - 12, c[1] + Math.sin(a - 1.6) * rad * .6, ease(seg(lt, tOff, tOff + 1)))];
      butterfly(...p, 44, t);
    }
    camEnd();
    flash(1 - ease(seg(lt, 0, .6)), C.mint);
    boilSeed('transition');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, WIPE_NIGHT);
  }

  // ===================== SHOT D (24–30): home, goodnight =====================
  function shotD(t, lt, dur) {
    const u = 30, tDown = 2.2, tBf0 = 1.6, tBf = 2.9, tLook = 3.4, tLove = 3.9, tSleep = 4.9, tIris = 5.0;
    camBegin(540, 1150, 1.15 + .015 * lt);
    sky(C.night[0], C.night[1]);
    stars(t, 1, 46, 1000);
    glow(300, 660, 220, '#FFF0C8', .8);
    boilSeed('moon'); paint(ellPts(300, 660, 66, 66, 26, 1.5), { wash: C.cream, fill: PAL.ochre, fillOp: 35, ink: PAL.ink, sw: .8 });
    land(t, .55);
    fireflies(t, .8, 540, 1500, 1000, 10);
    cushion(...CUSH);

    const fall = 1 - ease(seg(lt, 0, tDown));   // floats down onto the cushion, arms out like a feather
    const y = CUSH[1] + 8 + 2 * u, settle = spring(lt, tDown, 5, 12);
    const mood = emotions(lt, [[0, 'relieved', { eyes: 'closed', mouth: 'smile', emote: null }], [tLook, 'happy', { lookX: .8, lookY: .3 }], [tLove, 'love', { lookX: .6, lookY: .3 }],
                               [tSleep, 'sleepy']], { take: .6 });
    const arms = lerp(-.55, .9, fall) + (lt < tDown ? .15 * Math.sin(lt * 4) : 0);
    const o = { ...mood, sit: true, dx: lt < tDown ? .6 * Math.sin(lt * 2.2) * fall : 0, aL: lt < tLook ? arms : mood.aL, aR: lt < tLook ? arms : mood.aR,
                dy: -18 * fall + (mood.dy || 0) * .4, sq: (mood.sq || 0) + .14 * settle, sway: swayOf(lt, [tDown]) + .3 * fall };
    brote(CUSH[0], y, u, o);

    const rest = [720, CUSH[1] + 4];
    if (lt > tBf0) {
      const p = lt < tBf ? flight(lt, [[tBf0, [1200, 900]], [tBf, rest]], 1 - seg(lt, tBf - .5, tBf)) : rest;
      butterfly(...p, 36, t, { rest: lt >= tBf, key: 'bflyD' });
    }
    const at = toScreen(600, CUSH[1] - 60);
    camEnd();
    boilSeed('transition');
    if (lt < .3) brushWipe(.5 + lt / .6, WIPE_NIGHT);
    if (lt > tIris) {   // close in on both of them, hold a breath, shut
      const r = lt < tIris + .5 ? lerp(1800, 340, ease(seg(lt, tIris, tIris + .5))) : lt < dur - .3 ? lerp(340, 320, seg(lt, tIris + .5, dur - .3)) : lerp(320, 0, easeIn(seg(lt, dur - .3, dur - .04)));
      iris(...at, r, C.night[0]);
    }
  }

  shots([[0, shotA], [7, shotB], [14, shotC], [24, shotD]]);
})();
