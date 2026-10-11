// reel_30dias.js: three watercolour inserts for Eli's "Mindfulness 30 días" reel (1080×1920). See STORYBOARD_30DIAS.md.
//
// The three shots play back to back (0–4, 4–8, 8–12.5) and are cut into separate clips for the montage, where Eli's
// voice runs under them. Transitions to and from the live video happen in the montage, so each shot opens and closes
// on a full scene.
//
// Render budget: this machine paints WebGL in software, where every wash costs ~0.5 s and every watercolour fill ~3 s
// a frame, while ink lines are nearly free. So the sets are paper + a few washes, and detail is linework.
(() => {
  const C = {
    leaf: '#7DB86F', leafDk: '#4C8A52',
    cushion: '#FF8F7C', cushionDk: '#C9655A',
    coral: '#FF8F7C', coralLt: '#FFC6AD', peach: '#FFD6BD',
    sage: '#94CDC5', sageDk: '#6AA7A1', mint: '#C3E6DF', turq: '#3FD6C6',
    floor: '#ECE4D6', cream: '#FFF5E2', gold: '#F6DEAF', ochre: '#E8AA38',
    phone: '#2F3C7A', screen: '#BFE7F0', steel: '#C9CED6', steelDk: '#9AA1AD',
  };
  const BODY = { col: '#8DB89A', dk: '#5B8A72', lt: '#D3EAD5' };

  // Brote is Clawd recoloured: every emotion and cross-fade starts from BODY instead of terracotta.
  tintCols = function (o) {
    const c = { col: o.col || BODY.col, dk: o.dk || BODY.dk, lt: o.lt || BODY.lt };
    const tc = o.tint && (TINT[o.tint] || o.tint), k = clamp(o.tintK ?? 1);
    if (!tc || k <= 0) return c;
    return { col: mixCol(c.col, tc, .45 * k), dk: mixCol(c.dk, mixCol(tc, PAL.ink, .35), .4 * k), lt: mixCol(c.lt, mixCol(tc, '#FFFFFF', .4), .4 * k) };
  };

  // ===================== CHARACTER =====================
  // Brote: a soft, slightly squashed ball with little ball hands that float beside her, and a sprout on top. The face,
  // emotions and emotes are Clawd's (eyes(), mouth(), blush(), emote() from clawd.js); only the body is new.
  // Body-local units, like Clawd: (0, 0) is the seat, the ball spans x ±BR.rx·u and y from -2u (bottom) to BR.top·u.
  const BR = { rx: 4.9, ry: 3.6, cy: -5.6 }; BR.top = BR.cy - BR.ry;
  function leafPts(bx, by, len, wid, ang, n = 8) {
    const c = Math.cos(ang), s = Math.sin(ang), L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, w = wid * Math.sin(Math.PI * k) * (1 - .25 * k), px = k * len;
      L.push([bx + px * c - w * s, by + px * s + w * c]); R.push([bx + px * c + w * s, by + px * s - w * c]);
    }
    return L.concat(R.reverse().slice(1, -1));
  }
  // The sprout on Brote's head. grow 0..1 makes the stem taller; bloom 0..1 opens a coral flower at the tip.
  function sprout(u, sw, sway, grow = 0, bloom = 0) {
    const h = 2.2 + 1.8 * grow, by = (BR.top + .25) * u, tx = sway * u, ty = by - h * u;
    inkLine([[0, by + .15 * u], [sway * u * .35, by - h * .5 * u], [tx, ty]], sw * 1.2, C.leafDk, 'ink', .5);
    const ls = 1 + .25 * grow;
    for (const s of [-1, 1]) {
      const a = -Math.PI / 2 + s * (1.0 + .15 * Math.sin(T * 1.3 + s)) + sway * .5;
      paint(leafPts(tx, ty + (bloom > 0 ? .5 * u : 0), 2.1 * u * ls, .6 * u * ls, a), { wash: s < 0 ? C.leaf : mixCol(C.leaf, C.leafDk, .35), ink: PAL.ink, sw: sw * .7 });
    }
    if (bloom > 0) {
      const r = 2 * u * backOut(bloom), fy = ty - .3 * u;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5 + .2 * Math.sin(T * .9);
        paint(leafPts(tx, fy, r, r * .42, a, 6), { wash: i % 2 ? C.coral : mixCol(C.coral, C.coralLt, .4), ink: PAL.ink, sw: sw * .6 });
      }
      paint(ellPts(tx, fy, r * .28 + 1, r * .28 + 1, 12), { wash: C.ochre, ink: PAL.ink, sw: sw * .5 });
    }
  }
  // brote(x, y, u, o): (x, y) is the seat. Takes Clawd's pose and face options (dx, dy, sq, rot, sx, sy, aL, aR, eyes,
  // mouth, look, squint, blush, tint, emote...) plus sway (sprout lean), grow and bloom (see sprout()).
  function brote(x, y, u, o = {}) {
    const rs = part => boilSeed('brote ' + part);
    x += (o.dx || 0) * u;
    const dy = (o.dy || 0) * u, sq = o.sq || 0, sw = clamp(u / 15, .45, 2.4) * .75, { col, dk, lt } = tintCols(o);   // a softer outline than Clawd's
    push(); translate(x, y + dy); if (o.rot) rotate(o.rot);
    scale((o.sx ?? 1) * (1 + sq * .6), (o.sy ?? 1) * (1 - sq));
    // ball hands: they float just off the body; a = 0 straight out, + up, - down (like Clawd's arms)
    const hands = [[-1, o.aL ?? .2], [1, o.aR ?? .2]].map(([d, a]) => [d * (BR.rx + 1.35 * Math.cos(a)) * u, (-4.4 - 1.6 * Math.sin(a)) * u]);
    rs('body');
    const body = ellPts(0, BR.cy * u, BR.rx * u, BR.ry * u, 40, u * .04);
    paint(body, { wash: col, washOp: 255, ink: null });
    paint(ellPts(-1.5 * u, (BR.cy - 1.5) * u, 2.6 * u, 1.3 * u, 22, u * .05, -.3), { fill: lt, fillOp: 130, bleed: .2, tex: .85, border: .8, ink: null });
    paint(ellPts(.3 * u, -3.0 * u, 3.6 * u, .8 * u, 22, u * .04), { wash: dk, washOp: 70, ink: null });
    paint(body, { ink: PAL.ink, sw });
    const F = { cx: 0, fw: 1, sides: [-1, 1], mx: 0, bx: 3.2 };
    if (o.blush) blush(u, sw, F, o.blush === true ? 1 : o.blush);
    rs('eyes'); eyes(u, o, sw, F.sides, 0);
    rs('mouth'); mouth(u, o.mouth, sw);
    hands.forEach(([hx, hy], i) => { rs('hand' + i);
      paint(ellPts(hx, hy, .95 * u, .9 * u, 18, u * .03), { wash: i ? col : mixCol(col, dk, .15), washOp: 255, ink: PAL.ink, sw: sw * .8 }); });
    rs('sprout'); sprout(u, sw, o.sway || 0, o.grow || 0, o.bloom || 0);
    pop();
    rs('emote');
    if (o.emote) {
      const top = EMOTE_TOP.includes(o.emote);
      emote(o.emote, x + (top ? 0 : (BR.rx + .6) * u), y + dy + (top ? BR.top - 2.2 : BR.top + .6) * u * (1 - sq), u * .9, o.emoteK ?? 1, o.emoteAge ?? T);
    }
    rs('after');
  }
  const swayOf = (t, kicks = []) => .12 * Math.sin(t * 1.7) + .55 * ring(t, kicks, 4.5, 13);

  // ===================== SET =====================
  const U = 44, CS = U / 30;                   // Brote's size; the cushion scales with her
  const CUSH = [540, 1170];                    // cushion top centre, the same in all three shots
  const BY = CUSH[1] + 8 * CS + 2 * U + 10;    // Brote's seat line: the ball sinks a little into the cushion
  const MID = [540, BY - 5.6 * U];             // the middle of Brote's body: centre of the orbit and the ring
  const FLOOR = CUSH[1] + 70 * CS;

  // Paper, a floor and one big soft patch of colour behind Brote that carries the mood (coral = rush, turquoise = calm).
  function room(t, mood) {
    boilSeed('floor'); paint(rectPts(-100, FLOOR, W + 200, 900, 4), { wash: C.floor, ink: null });
    boilSeed('floorline'); inkLine([[-60, FLOOR + 4], [W / 2, FLOOR - 2], [W + 60, FLOOR + 6]], 1, PAL.ink, 'ink', .5);
    boilSeed('moodblob');
    const r = 500 + 12 * Math.sin(t * 1.1);
    paint(ellPts(MID[0], MID[1] - 60, r, r * 1.05, 36, 6), { wash: mood, washOp: 150, ink: null });
    plants(t);
  }
  // Pothos vines hanging into the frame, like the plants behind Eli. Linework only.
  function plants(t) {
    for (const [x0, side, n] of [[40, 1, 7], [1040, -1, 5]]) {
      boilSeed('vine' + x0);
      const pts = []; for (let i = 0; i <= n; i++) pts.push([x0 + side * (30 * Math.sin(i * .9) + 10 * i), -20 + i * 70 + 6 * Math.sin(t * .8 + i)]);
      inkLine(pts, .9, C.leafDk, 'ink', .6);
      for (let i = 1; i <= n; i++) {
        const [px, py] = pts[i], a = (i % 2 ? .6 : 2.5) + .12 * Math.sin(t * 1.1 + i);
        boilSeed('vleaf' + x0 + i);
        inkLine([[px, py], [px + Math.cos(a) * 26, py + Math.sin(a) * 26 + 6], [px + Math.cos(a) * 46, py + Math.sin(a) * 46]], 3.2, i % 3 ? C.leaf : C.leafDk, 'dry', .7);
      }
    }
  }
  function cushion(x, y, k = CS) {
    boilSeed('cushion');
    paint(ellPts(x, y + 90 * k, 250 * k, 22 * k, 24), { wash: PAL.ink, washOp: 40, ink: null });
    paint(ellPts(x, y + 40 * k, 230 * k, 58 * k, 30, 1.5), { wash: C.cushionDk, ink: PAL.ink, sw: 1 });
    paint(ellPts(x, y + 8 * k, 222 * k, 42 * k, 30, 1.5), { wash: C.cushion, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (.12 + i * .095); inkLine([[x + Math.cos(a) * 222 * k, y + (8 + Math.sin(a) * 42) * k], [x + Math.cos(a) * 230 * k, y + (40 + Math.sin(a) * 58) * k]], .6, mixCol(C.cushionDk, PAL.ink, .4), 'inkfine', 0); }
  }

  // ===================== THE TASKS =====================
  // Each is drawn around (0, 0), s px tall, in its own boil seed. They're the "todo" Brote can't put down.
  const TASKS = ['phone', 'laptop', 'list', 'cup', 'clock'], TS = 135;   // TS: a task's size in px
  function task(kind, x, y, s, rot, t) {
    if (s < 2) return;
    boilSeed('task' + kind);
    push(); translate(x, y); rotate(rot);
    const k = s / 100;
    if (kind === 'phone') {
      paint(rrPts(-28 * k, -50 * k, 56 * k, 100 * k, 10 * k), { wash: C.phone, ink: PAL.ink, sw: .8 });
      paint(rrPts(-21 * k, -40 * k, 42 * k, 74 * k, 4 * k), { wash: C.screen, ink: null });
      for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) {     // buzz
        const r = (44 + i * 16 + 5 * Math.sin(t * 40 + i)) * k;
        inkLine([[sd * r, -22 * k], [sd * (r + 6 * k), 0], [sd * r, 22 * k]], .7, PAL.ink, 'inkfine', .6);
      }
    } else if (kind === 'laptop') {
      paint(rrPts(-60 * k, -48 * k, 120 * k, 76 * k, 6 * k), { wash: C.steel, ink: PAL.ink, sw: .8 });
      paint(rrPts(-50 * k, -40 * k, 100 * k, 60 * k, 3 * k), { wash: C.sage, ink: null });
      paint([[-62 * k, 28 * k], [62 * k, 28 * k], [76 * k, 46 * k], [-76 * k, 46 * k]], { wash: C.steelDk, ink: PAL.ink, sw: .8 });
      for (let i = 0; i < 3; i++) inkLine([[-38 * k, (-26 + i * 16) * k], [(10 - 14 * i) * k, (-26 + i * 16) * k]], .6, PAL.ink, 'inkfine', 0);
    } else if (kind === 'list') {
      paint(rectPts(-40 * k, -54 * k, 80 * k, 108 * k, 2 * k), { wash: C.cream, ink: PAL.ink, sw: .7 });
      for (let i = 0; i < 4; i++) {
        const yy = (-34 + i * 22) * k;
        paint(rectPts(-30 * k, yy - 6 * k, 12 * k, 12 * k), { ink: PAL.ink, sw: .5 });
        inkLine([[-10 * k, yy], [6 * k, yy + 2 * k], [(24 - 6 * (i % 2)) * k, yy - 1 * k]], .6, PAL.ink, 'inkfine', .5);
      }
    } else if (kind === 'cup') {
      paint([[-34 * k, -30 * k], [34 * k, -30 * k], [26 * k, 40 * k], [-26 * k, 40 * k]], { wash: C.coral, ink: PAL.ink, sw: .8 });
      inkLine([[32 * k, -16 * k], [52 * k, -10 * k], [50 * k, 12 * k], [28 * k, 18 * k]], 1, PAL.ink, 'ink', .7);
      for (let i = 0; i < 2; i++) { const xx = (-10 + 20 * i) * k, w = 6 * k * Math.sin(t * 6 + i);
        inkLine([[xx, -38 * k], [xx + w, -54 * k], [xx - w, -70 * k]], .6, PAL.ink, 'inkfine', .7); }
    } else if (kind === 'clock') {
      for (const sd of [-1, 1]) paint(ellPts(sd * 30 * k, -40 * k, 15 * k, 12 * k, 12, 0, sd * .5), { wash: C.ochre, ink: PAL.ink, sw: .6 });
      paint(ellPts(0, 0, 46 * k, 46 * k, 26, 1), { wash: C.cream, ink: PAL.ink, sw: .9 });
      const a = t * 9, b = t * 1.2;
      inkLine([[0, 0], [Math.cos(a) * 32 * k, Math.sin(a) * 32 * k]], .8, PAL.ink, 'ink', 0);
      inkLine([[0, 0], [Math.cos(b) * 22 * k, Math.sin(b) * 22 * k]], 1.1, PAL.ink, 'ink', 0);
    }
    pop();
  }
  // A flattened orbit around Brote: the back half passes behind her (smaller), the front half in front.
  const ORB = { rx: 450, ry: 230 };
  const orbitPos = (a, rx = ORB.rx, ry = ORB.ry) => [MID[0] + rx * Math.cos(a), MID[1] + ry * Math.sin(a)];
  // Draws the tasks on one side of the orbit: back (sin < 0) before Brote, front after. list = [{kind, a, s, rot, x?, y?}]
  function drawTasks(list, t, back) {
    for (const o of list) {
      const behind = Math.sin(o.a) < 0;
      if (behind !== back) continue;
      const [x, y] = o.x != null ? [o.x, o.y] : orbitPos(o.a);
      task(o.kind, x, y, o.s * (behind ? .82 + .18 * (1 + Math.sin(o.a)) : 1), o.rot, t);
    }
  }
  const PHASE = [0, TAU * .2, TAU * .4, TAU * .6, TAU * .8].map(p => p + .9);
  const POP = [.75, 1.6, 1.95, 2.3, 2.65];            // shot 1: when each task arrives
  const spin1 = lt => .55 * lt + .22 * lt * lt;       // shot 1: the orbit's angle, accelerating
  const SPIN1_END = spin1(4), SPEED1_END = .55 + .44 * 4;
  const glint = (x, y, k, key) => { if (k <= 0 || k >= 1) return; boilSeed('glint' + key);
    paint(starPts(x, y, 46 * Math.sin(Math.PI * k), .3, 4, k * 1.5), { wash: C.cream, ink: PAL.ink, sw: .5 }); };

  // ===================== SHOT 1 (0–4): the rush =====================
  function shot1(t, lt, dur) {
    camBegin(540 + 8 * Math.sin(lt * .7), 1000, 1.02 + .02 * ease(seg(lt, 0, dur)));
    room(t, mixCol(C.peach, C.coral, ease(seg(lt, 1.6, 3.6))));
    cushion(...CUSH);
    const list = TASKS.map((kind, i) => {
      const p = seg(lt, POP[i], POP[i] + .35), a = PHASE[i] + spin1(lt);
      // the phone first pops up beside Brote and buzzes, then gets pulled into the orbit
      if (i === 0 && lt < 1.25) { const q = ease(seg(lt, 1.0, 1.25)), home = orbitPos(PHASE[0] + spin1(1.25));
        return { kind, a: .5, s: TS * backOut(p), rot: .25 * Math.sin(lt * 30) * (1 - q), x: lerp(870, home[0], q), y: lerp(CUSH[1] - 10, home[1], q) }; }
      return { kind, a, s: TS * backOut(p), rot: .25 * Math.sin(a * 1.3 + i) };
    }).filter(o => o.s > 1);
    drawTasks(list, t, true);
    const mood = emotions(lt, [[0, 'relieved', { mouth: null, emote: null }], [.95, 'neutral', { eyes: ['closed', 'normal'], mouth: null, lookX: .9, lookY: .3 }],
                               [1.5, 'nervous'], [2.85, 'dizzy']], { take: .7 });
    brote(MID[0], BY, U, { ...mood, sit: true, dy: (mood.dy || 0) * .5, sway: swayOf(lt, [.75, 1.5, 2.85]) });
    drawTasks(list, t, false);
    camEnd();
  }

  // ===================== SHOT 2 (4–8): the pause =====================
  function shot2(t, lt, dur) {
    const tStop = .6, tIn = .9, tOut = 2.2, tGone = 3.4, tSmile = 3.0, tau = .35;
    // the orbit carries on from shot 1, then brakes from tStop (speed decays exponentially: closed form)
    const spin = SPIN1_END + SPEED1_END * Math.min(lt, tStop) + (lt > tStop ? SPEED1_END * tau * (1 - Math.exp(-(lt - tStop) / tau)) : 0);
    const inhale = ease(seg(lt, tIn, tOut)), exhale = ease(seg(lt, tOut, tGone + .2)), breath = inhale * (1 - .55 * exhale);
    camBegin(540, 1000, 1.04 - .02 * ease(seg(lt, 0, dur)));
    const calm = ease(seg(lt, 1.4, 3.4));   // coral → pale → turquoise (straight across, the two mix to a muddy grey)
    room(t, calm < .5 ? mixCol(C.coral, C.cream, calm * 2) : mixCol(C.cream, C.sage, calm * 2 - 1));
    // the breathing circle behind Brote (it carries into shot 3)
    if (inhale > 0) {
      boilSeed('breath');
      const r = 410 * Math.sqrt(inhale) * (1 - .12 * exhale) + 8 * Math.sin(lt * 2);
      glow(MID[0], MID[1] - 60, r * 1.2, '#FFF6E0', .35 * inhale);
      paint(ellPts(MID[0], MID[1] - 60, r, r, 40, 2), { wash: C.mint, washOp: 170, ink: mixCol(C.sage, PAL.ink, .2), sw: 1 });
    }
    cushion(...CUSH);
    // the tasks: whirl, brake and hover, then float up and away, shrinking, each gone with a glint
    const list = TASKS.map((kind, i) => {
      const a = PHASE[i] + spin, base = orbitPos(a), away = seg(lt, tOut + i * .12, tGone - .3 + i * .1), k = easeIn(away);
      const out = [base[0] + (base[0] - MID[0]) * .9 * k, base[1] - 520 * k - 40 * Math.sin(Math.PI * away)];
      const hover = 10 * Math.sin(lt * 2.4 + i) * seg(lt, 1.2, 1.8);
      return { kind, a, s: TS * (1 - ease(away)), rot: .25 * Math.sin(a * 1.3 + i) * (1 - seg(lt, tStop, 1.6)) + .3 * k * (i % 2 ? 1 : -1), x: out[0], y: out[1] + hover, away };
    });
    drawTasks(list.filter(o => o.s > 1), t, true);
    const mood = emotions(lt, [[0, 'dizzy'], [tStop, 'relieved', { mouth: null, emote: null, squint: 0 }], [tSmile, 'relieved', { mouth: 'smile', blush: .45, emote: null }]], { take: .5 });
    const arms = -.7 + 1.3 * breath;
    brote(MID[0], BY, U, { ...mood, sit: true, aL: lt > tStop ? arms : mood.aL, aR: lt > tStop ? arms + .05 * Math.sin(lt * 2) : mood.aR,
      sx: 1 - .04 * breath, sy: 1 + .08 * breath, dy: (mood.dy || 0) * .4 - .6 * breath, sway: swayOf(lt, [tStop]) });
    drawTasks(list.filter(o => o.s > 1), t, false);
    list.forEach((o, i) => glint(o.x, o.y, seg(lt, tGone - .45 + i * .1, tGone + i * .1), i));
    camEnd();
  }

  // ===================== SHOT 3 (4.5 s): 30 days =====================
  const RING = { rx: 450, ry: 420, cy: MID[1] - 60 }, DAYS = 30;
  const ringPos = i => { const a = -Math.PI / 2 + i * TAU / DAYS; return [MID[0] + RING.rx * Math.cos(a), RING.cy + RING.ry * Math.sin(a), a]; };
  function sproutling(i, g, bud, t) {   // one day: a stem and two leaves growing outward from the ring; bud = coral tip
    const [x, y, a] = ringPos(i), sw = Math.sin(t * 1.4 + i) * .08;
    boilSeed('day' + i);
    if (g <= 0) { inkLine([[x - 3, y], [x + 3, y + 1]], 2.4, C.leafDk, 'ink', 0); return; }
    const L = 46 * backOut(g), dir = a + sw, tip = [x + Math.cos(dir) * L, y + Math.sin(dir) * L];
    inkLine([[x, y], [x + Math.cos(dir) * L * .5 + Math.cos(dir + 1.57) * 4, y + Math.sin(dir) * L * .5 + Math.sin(dir + 1.57) * 4], tip], 1, C.leafDk, 'ink', .5);
    for (const s of [-1, 1]) {
      const la = dir + s * .9, m = [x + Math.cos(dir) * L * .62, y + Math.sin(dir) * L * .62];
      inkLine([m, [m[0] + Math.cos(la) * 14 * g, m[1] + Math.sin(la) * 14 * g], [m[0] + Math.cos(la - s * .3) * 26 * g, m[1] + Math.sin(la - s * .3) * 26 * g]], 3, s < 0 ? C.leaf : C.leafDk, 'dry', .8);
    }
    if (bud > 0) inkLine([[tip[0] - 4, tip[1]], [tip[0] + 4, tip[1] + 1]], 4.5 * backOut(bud), C.coral, 'ink', 0);
  }
  function shot3(t, lt, dur) {
    const t0 = .6, t1 = 3.1, tBloom = 3.1, tLook = 3.55;
    const run = ease(seg(lt, t0, t1)), day = run * DAYS;                  // the sun's position along the ring, in days
    camBegin(540, 1000 - 20 * ease(seg(lt, 2.6, dur)), 1.0 + .03 * ease(seg(lt, 0, dur)));
    room(t, mixCol(C.sage, C.mint, ease(seg(lt, 1.5, 3.5))));
    // the breathing circle from shot 2, still breathing slowly
    const br = .5 - .5 * Math.cos(TAU * lt / 4);
    boilSeed('breath');
    glow(MID[0], MID[1] - 60, 480, '#FFF6E0', .3 + .15 * br + .45 * seg(lt, tBloom, tBloom + .5));
    paint(ellPts(MID[0], MID[1] - 60, 350 + 20 * br, 350 + 20 * br, 40, 2), { wash: C.mint, washOp: 150, ink: mixCol(C.sage, PAL.ink, .2), sw: 1 });
    // the ring of 30 days, and the sun that walks it: each day sprouts as the sun passes
    for (let i = 0; i < DAYS; i++) sproutling(i, seg(day, i + .2, i + 1.4), seg(lt, tBloom + .05 + i * .012, tBloom + .4 + i * .012), t);
    if (lt > t0 - .3 && lt < t1 + .5) {
      const [sx, sy] = ringPos(Math.min(day, DAYS - .001)), k = seg(lt, t0 - .3, t0) * (1 - seg(lt, t1, t1 + .5));
      glow(sx, sy, 110 * k, '#FFE6A0', .9 * k);
      boilSeed('sun'); paint(ellPts(sx, sy, 22 * k + 1, 22 * k + 1, 16), { wash: C.gold, ink: PAL.ink, sw: .6 });
    }
    cushion(...CUSH);
    const mood = emotions(lt, [[0, 'relieved', { mouth: 'smile', blush: .35, emote: null }], [tLook, 'hopeful', { lookY: -1, lookX: .15, emote: null }]], { take: .6 });
    brote(MID[0], BY, U, { ...mood, sit: true, aL: lt < tLook ? -.55 : mood.aL, aR: lt < tLook ? -.55 : mood.aR, sy: 1 + .04 * br,
      dy: (mood.dy || 0) * .5, grow: run, bloom: seg(lt, tBloom, tBloom + .45), sway: swayOf(lt, [tBloom]) });
    // a few sparkles around the flower once it opens
    for (let i = 0; i < 4; i++) {
      const a = seg(lt, tBloom + .25 + i * .18, tBloom + 1.05 + i * .18); if (a <= 0 || a >= 1) continue;
      boilSeed('spark' + i);
      const ang = -2.4 + i * 1.2, d = 120 + 60 * a;
      paint(starPts(MID[0] + Math.cos(ang) * d, BY - 13.3 * U + Math.sin(ang) * d * .6, 22 * Math.sin(Math.PI * a), .3, 4), { wash: C.cream, ink: PAL.ink, sw: .5 });
    }
    camEnd();
  }

  shots([[0, shot1], [4, shot2], [8, shot3]]);
})();
