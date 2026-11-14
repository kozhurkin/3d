// «Обход»: вид от первого лица, ходьба, стены, двери, шкафы, прыжок, присед, высота камеры.
const { runPage, PAGES, check, near, assert } = require('./harness');

const eye = (p) => p.run('[camera.position.x, camera.position.y, camera.position.z]');
// a key held for n frames of 16 ms
const hold = (p, code, n) => { p.key('keydown', code); p.tick(n); p.key('keyup', code); };
// a drag on the scene by dx, dy pixels (the mouse not taken: the browser in the checks has no pointer lock)
function drag(p, dx, dy = 0) {
  const c = p.document.getElementById('c');
  c.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  c.dispatch('pointermove', { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
  c.dispatch('pointerup', { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
}
// the direction of the eyes, 0…2π
const yaw = (p) => { const t = p.run('goal.theta') % (2 * Math.PI); return t < -1e-9 ? t + 2 * Math.PI : t; };
const open = (storage) => { const p = runPage(PAGES.app, { parentWin: { appView: 'walk' }, storage }); p.tick(); return p; };

check('обход: вид от первого лица у входа, в панели только высота камеры', () => {
  const p = open();
  const [x, y, z] = eye(p);
  near(x, 0.6, 'middle of the hall'); near(y, 1.65, 'eye height'); near(z, 0.45, 'by the entrance');
  const r = p.run(`({view, fov:camera.fov, ceil:ceiling.visible, aim:document.getElementById('walkAim').hidden, hint:document.getElementById('walkHint').hidden,
    rooms:["hall","bath","kitchen"].map(presence), lines:wallLines.length, arcs:arcs.visible, doors:doorGroup.visible, shared:document.getElementById('shared').hidden})`);
  assert.deepStrictEqual(r, { view: 'walk', fov: 62, ceil: true, aim: false, hint: false, rooms: [1, 1, 1], lines: 12, arcs: false, doors: true, shared: true });
  const panel = p.document.querySelector('[data-panel="walk"]');
  assert.deepStrictEqual([panel.hidden, panel.querySelectorAll('input').map((i) => i.id), panel.querySelector('#walkEyeOut').textContent], [false, ['walkEye'], '1650 мм']);
  assert.strictEqual(panel.querySelector('[data-wm]'), null, 'no wall modes in the walk');
  const info = (k) => p.document.querySelector(`#infoBtn [data-info="${k}"]`).hidden;
  assert.deepStrictEqual([info('orbit'), info('walk')], [true, false], 'the hint of the walk under «i»');
});

check('обход: W A S D идут, мышь поворачивает взгляд, колесо и орбита не действуют', () => {
  const p = open();
  hold(p, 'KeyW', 60);   // about a second forward: toward the kitchen
  let [x, y, z] = eye(p);
  near(x, 0.6, 'straight'); near(y, 1.65, 'on the floor');
  assert.ok(z > 1.9 && z < 2.9, 'a second at 2.4 m/s: ' + z);
  p.tick(30);
  const z1 = eye(p)[2]; assert.ok(z1 - z < 0.15, 'stops when the key is let go');
  // a quarter turn to the left, the eyes stay where they are
  drag(p, -Math.PI / 2 / 0.0025);
  p.tick();
  near(yaw(p), Math.PI * 1.5, 'turned left'); near(eye(p)[0], 0.6, 'the eyes did not move'); near(eye(p)[2], z1, 'the eyes did not move');
  // a look up: the pitch stops short of the vertical
  drag(p, 0, -5000); p.tick();
  assert.ok(Math.abs(p.run('goal.phi') - (Math.PI - 0.08)) < 1e-9, 'pitch clamped');
  drag(p, 0, (Math.PI / 2 - 0.08) / 0.0025); p.tick();
  near(p.run('goal.phi'), Math.PI / 2, 'level again');
  hold(p, 'KeyD', 20); assert.ok(eye(p)[2] > z1 + 0.2, 'D: to the right, facing +x that is on toward the window');
  const r0 = p.run('goal.r');
  p.document.getElementById('c').dispatch('wheel', { deltaY: 300, clientX: 10, clientY: 10 });
  p.tick();
  assert.deepStrictEqual([r0, p.run('goal.r'), p.run('camDrive===walkCam')], [1, 1, true], 'no zoom in the walk');
  // typing into a field: the keys are not the game's
  p.tick(30); const z2 = eye(p)[2]; p.key('keydown', 'KeyS', { target: { tagName: 'INPUT' } }); p.tick(20); p.key('keyup', 'KeyS');
  near(eye(p)[2], z2, 'no walk while typing');
});

check('обход: стены и закрытая дверь не пускают, открытая — пускает', () => {
  const p = open();
  drag(p, Math.PI / 2 / 0.0025); p.tick();   // a quarter turn to the right: facing the hall's left wall (−x)
  near(yaw(p), Math.PI / 2, 'facing −x');
  hold(p, 'KeyW', 90);
  // by the entrance: the hall cabinet's cladding of the reveal ends 50 mm before the eyes (z 0.4, x up to 99 mm): its corner stops the body
  near(eye(p)[0], 0.099 + Math.sqrt(0.15 ** 2 - 0.05 ** 2), 'stops at the corner of the cladding');
  // past the bathroom door, nothing along the wall: up to the wall itself
  p.run('setEye(0.6,1.65,1.55)'); p.tick();
  hold(p, 'KeyW', 90);
  near(eye(p)[0], 0.15, 'stops at the wall, the body\'s radius away');
  // in front of the bathroom door: closed, it is a wall
  p.run('setEye(0.6,1.65,0.95)'); p.tick();
  hold(p, 'KeyW', 90);
  near(eye(p)[0], 0.15, 'the closed door stops');
  p.run('doors.find(d=>d.hole==="hallBath:0").t=1.5'); p.tick(60);
  hold(p, 'KeyW', 60);
  assert.ok(eye(p)[0] < -0.12, 'through the open door into the bathroom: ' + eye(p)[0]);
  // the door closes on the walker standing in it: they can still walk out
  p.run('setEye(0,1.65,0.95)'); p.run('doors.find(d=>d.hole==="hallBath:0").t=0'); p.tick(120);
  drag(p, Math.PI / 0.0025); p.tick();
  hold(p, 'KeyW', 40);
  assert.ok(eye(p)[0] > 0.3, 'out of the closed doorway back into the hall: ' + eye(p)[0]);
  // the window is never a way out
  assert.ok(p.run('walkObstacles().some(b=>b[0]===(winX-A.winW/2)*MM&&b[1]===(winX+A.winW/2)*MM&&b[2]===zEnd*MM&&b[4]===0&&b[5]===H*MM)'), 'the window opening is in the way');
});

check('обход: шкафы мешают пройти', () => {
  const p = open();
  const r = p.run(`(()=>{
    const fb=furnBoxes(),lo=STEP,hi=1.75,out={n:fb.length,free:true,inside:0,stopped:0};
    ROOMS.forEach(rm=>{
      // from the middle of the room toward the middle of each of its cabinet's parts that stands in the way, in 5 cm steps
      // (the room's name lies by the kitchen's worktop: from the middle of the floor there)
      const s0=rm.id==='kitchen'?[(rm.r[0]+rm.r[1])/2,(rm.r[2]+rm.r[3])/2]:rm.at;
      fb.filter(b=>b[4]<hi&&b[5]>lo).forEach(b=>{let x=s0[0]*MM,z=s0[1]*MM;
        if(fb.some(c=>hits(c,x,z,lo,hi)))out.free=false;
        const cx=(b[0]+b[1])/2,cz=(b[2]+b[3])/2,n=Math.ceil(Math.hypot(cx-x,cz-z)/.05);
        for(let i=0;i<n;i++)[x,z]=walkSlide(x,z,(cx-x)/(n-i),(cz-z)/(n-i),lo,hi);
        if(fb.some(c=>hits(c,x,z,lo,hi)))out.inside++;
        if(Math.hypot(cx-x,cz-z)>.05)out.stopped++;});});
    return out;})()`);
  assert.ok(r.n > 50, 'parts of the three rooms: ' + r.n);
  assert.deepStrictEqual([r.free, r.inside], [true, 0], 'never inside a cabinet');
  assert.ok(r.stopped > 0, 'stopped short of the cabinets');
});

check('обход: прыжок, присед, высота камеры сохраняется', () => {
  const storage = new Map();
  let p = open(storage);
  p.key('keydown', 'Space'); p.tick(12);
  const top = eye(p)[1]; assert.ok(top > 1.95 && top < 2.15, 'in the air: ' + top);
  p.tick(60); near(eye(p)[1], 1.65, 'landed');
  p.tick(30); near(eye(p)[1], 1.65, 'a held Space does not jump again');
  p.key('keyup', 'Space');
  p.key('keydown', 'KeyC'); p.tick(60);
  near(eye(p)[1], 1.65 * (1 - 0.32), 'crouched');
  const z0 = eye(p)[2]; p.key('keydown', 'KeyW'); p.tick(60); p.key('keyup', 'KeyW');
  assert.ok(eye(p)[2] - z0 < 1, 'crouching is slow: ' + (eye(p)[2] - z0));
  p.key('keyup', 'KeyC'); p.tick(60); near(eye(p)[1], 1.65, 'up again');
  p.key('keydown', 'ControlLeft'); p.tick(60); near(eye(p)[1], 1.65 * (1 - 0.32), 'crouched with Ctrl');
  p.key('keyup', 'ControlLeft'); p.tick(60); near(eye(p)[1], 1.65, 'up again');
  const s = p.document.getElementById('walkEye'); s.value = '1200'; s.dispatch('input'); p.tick();
  near(eye(p)[1], 1.2, 'the eye height from the panel');
  assert.strictEqual(p.document.getElementById('walkEyeOut').textContent, '1200 мм');
  assert.strictEqual(JSON.parse(storage.get('apt-view-walk-v1')).eye, 1200);
  p = open(storage); near(eye(p)[1], 1.2, 'remembered');
});

check('обход: перелёт с плана и обратно, камера и угол обзора', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  assert.deepStrictEqual(p.run('[camera.fov, ceiling.visible, presence("walk")]'), [35, false, 0]);
  p.run('showView("walk")'); p.tick(25, 17);
  near(p.run('camera.fov'), 48.5, 'halfway to the wide angle');
  assert.strictEqual(p.run('camDrive===driveCam'), true, 'the flight drives the camera');
  p.fly();
  const [x, y, z] = eye(p); near(x, 0.6, 'at the entrance'); near(y, 1.65, 'at eye height'); near(z, 0.45, 'at the entrance');
  assert.deepStrictEqual(p.run('[camera.fov, ceiling.visible, camDrive===walkCam]'), [62, true, true]);
  hold(p, 'KeyW', 30); const zw = eye(p)[2];
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(p.run(`[camera.fov, ceiling.visible, camDrive, document.getElementById('walkAim').hidden, presence("walk"), presence("bath"), document.getElementById('shared').hidden]`),
    [35, false, null, true, 0, 1, false]);
  // the keys are the walk's only
  const t0 = p.run('goalT.z'); hold(p, 'KeyW', 20); near(p.run('goalT.z'), t0, 'no walking on the plan');
  // back: where the walk was left
  p.run('showView("walk")'); p.fly();
  near(eye(p)[2], zw, 'the walk goes on where it was left');
});

check('обход: от входа можно дойти в душ, санузел и на кухню (двери открыты)', () => {
  const p = open();
  p.run('doors.forEach(d=>{d.t=d.a=d.max;})'); p.tick();
  // the floor in 2 cm cells: which the walker standing can be in, reached step by step from the entrance
  const r = p.run(`(()=>{
    const bs=walkObstacles(),lo=STEP,hi=eyeH()+.1,S=.02,x0=BOX.x0*MM,z0=BOX.z0*MM,nx=Math.ceil((BOX.x1-BOX.x0)*MM/S),nz=Math.ceil((BOX.z1-BOX.z0)*MM/S);
    const cell=(x,z)=>[Math.round((x-x0)/S),Math.round((z-z0)/S)],free=(i,j)=>!bs.some(b=>hits(b,x0+i*S,z0+j*S,lo,hi));
    const seen=new Uint8Array(nx*nz),q=[cell(eyeNow()[0],eyeNow()[2])];seen[q[0][0]*nz+q[0][1]]=1;
    while(q.length){const [i,j]=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const u=i+a,v=j+b;
      if(u<0||v<0||u>=nx||v>=nz||seen[u*nz+v])return;seen[u*nz+v]=1;if(free(u,v))q.push([u,v]);else seen[u*nz+v]=2;});}
    const at=(x,z)=>{const [i,j]=cell(x*MM,z*MM);return seen[i*nz+j]===1;};
    // the shower: between the wall at the niche end, the shower partition, the kitchen wall and the left wall
    const xSh=bx(A.bWs+A.bGap);
    return {shower:at((xL+xSh)/2,(bz(A.bL+A.wt)+kZ0)/2),bath:at(...ROOMS.find(r=>r.id==='bath').at),kitchen:at((xL+A.hallW)/2,(kZ1+zEnd)/2)};
  })()`);
  assert.deepStrictEqual(r, { shower: true, bath: true, kitchen: true });
});
