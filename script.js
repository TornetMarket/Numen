/* NUMEN — v2 refinements
   - Password: Venus
   - ATM terminal enlarged
   - NFC canvas: hundreds of particles with center gravity + damping
   - Floating CAM button (bottom-right) for easy press
*/
(() => {
  // ELs
  const login = document.getElementById('login');
  const main = document.getElementById('main');
  const pwd = document.getElementById('pwd');
  const enter = document.getElementById('enter');
  const notifications = document.getElementById('notifications');

  const sessionEl = document.getElementById('session-id');
  const cinema = document.getElementById('cinema');
  const camBtn = document.getElementById('cam');

  const navBtns = document.querySelectorAll('.thumb-btn');
  const panels = document.querySelectorAll('.panel');

  const applyBtn = document.getElementById('apply');
  const writeBtn = document.getElementById('write');
  const cardSelect = document.getElementById('card-select');
  const miniLog = document.getElementById('mini-log');
  const nfcCanvas = document.getElementById('nfc-canvas');

  const nodeMap = document.getElementById('node-map');
  const scanBtn = document.getElementById('scan');

  const term = document.getElementById('term');
  const termIn = document.getElementById('term-in');
  const termSend = document.getElementById('term-send');

  const lockBtn = document.getElementById('lock');
  const logoutBtn = document.getElementById('logout');

  // Prefs
  const pSound = document.getElementById('p-sound');
  const pNotif = document.getElementById('p-notif');
  const pCam = document.getElementById('p-cam');

  // Data
  const PASSWORD = 'Venus';
  const CARDS = {
    card1: { name:'VAULT-001', pan:'5454 3333 2222 1111' },
    card2: { name:'GHOST-ACCT', pan:'4000 1234 5678 9010' },
    card3: { name:'TAP-TEST',  pan:'6011 0009 9013 9424' }
  };

  // Utils
  const uid = () => 'S-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const now = () => new Date().toLocaleTimeString();

  function toast(msg, small=false){
    if (!pNotif || pNotif.checked) {
      const t = document.createElement('div');
      t.className = 'toast' + (small ? ' small':'');
      t.textContent = msg;
      notifications.appendChild(t);
      setTimeout(() => {
        t.style.transition = 'opacity .4s, transform .4s';
        t.style.opacity = '0';
        t.style.transform = 'translateY(-8px)';
        setTimeout(() => t.remove(), 420);
      }, 2200);
    }
    if (pSound && pSound.checked) { try{ new AudioContext().close(); }catch{} }
  }

  function logMini(line){
    const d = document.createElement('div');
    d.textContent = `[${now()}] ${line}`;
    miniLog.prepend(d);
  }

  function log(line){
    const d = document.createElement('div');
    d.textContent = `[${now()}] ${line}`;
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
  }

  // LOGIN
  function tryLogin(){
    const v = (pwd.value || '').trim();
    if (v === PASSWORD){
      sessionEl.textContent = uid();
      login.classList.add('hidden');
      main.classList.remove('hidden');
      main.setAttribute('aria-hidden','false');
      toast('Access granted', true);
      log('UI online');
      log('Session ' + sessionEl.textContent);
      document.querySelector('.thumb-btn[data-panel="dash"]').click();
    } else {
      toast('Invalid password', true);
      pwd.value = '';
      pwd.focus();
      log('Rejected credential');
    }
  }
  enter.addEventListener('click', tryLogin);
  pwd.addEventListener('keydown', e => e.key === 'Enter' && tryLogin());
  setTimeout(() => pwd.focus(), 400);

  // NAV
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.panel;
      panels.forEach(p => {
        const active = p.id === id;
        p.classList.toggle('active', active);
        p.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (id === 'atm') initNFC(); // ensure canvas sized
    });
  });

  // NFC CANVAS — Square-like: many particles + gentle gravity + damping
  let ctx, cw, ch, particles = [], raf;
  function sizeCanvas(){
    const rect = nfcCanvas.getBoundingClientRect();
    nfcCanvas.width = Math.max(1, rect.width * devicePixelRatio);
    nfcCanvas.height = Math.max(1, rect.height * devicePixelRatio);
    nfcCanvas.style.width = rect.width + 'px';
    nfcCanvas.style.height = rect.height + 'px';
    ctx = nfcCanvas.getContext('2d', { alpha:true });
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cw = rect.width; ch = rect.height;
  }

  function initNFC(){
    sizeCanvas();
    particles = [];
    const COUNT = Math.min(220, Math.floor((cw*ch)/3000)); // scale with area, cap for perf
    for (let i=0;i<COUNT;i++){
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random()*60;
      particles.push({
        x: cw/2 + Math.cos(angle)*radius,
        y: ch/2 + Math.sin(angle)*radius,
        vx: (Math.random()-0.5)*0.9,
        vy: (Math.random()-0.5)*1.0,
        r: 1.6 + Math.random()*2.6,
        life: 120 + Math.random()*140,
        alpha: 0.5 + Math.random()*0.5
      });
    }
    cancelAnimationFrame(raf);
    loop();
  }

  function loop(){
    // fade trail
    ctx.fillStyle = 'rgba(3,16,24,0.18)';
    ctx.fillRect(0,0,cw,ch);

    // faint rings
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(58,168,255,0.14)';
    ctx.arc(cw/2, ch/2, 52, 0, Math.PI*2);
    ctx.stroke();

    // center gravity settings
    const G = 0.015;   // gravity strength
    const D = 0.985;   // damping
    const CX = cw/2, CY = ch/2;

    for (let i=0;i<particles.length;i++){
      const p = particles[i];

      // gravitational acceleration toward center
      const dx = CX - p.x;
      const dy = CY - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ax = (dx / dist) * G;
      const ay = (dy / dist) * G;

      // update velocity with slight turbulence
      p.vx = (p.vx + ax + (Math.random()-0.5)*0.02) * D;
      p.vy = (p.vy + ay + (Math.random()-0.5)*0.02) * D;

      // update position
      p.x += p.vx;
      p.y += p.vy;

      // life & respawn
      if (--p.life <= 0){
        p.x = CX + (Math.random()-0.5)*20;
        p.y = CY + (Math.random()-0.5)*20;
        p.vx = (Math.random()-0.5)*1.1;
        p.vy = (Math.random()-0.5)*1.1;
        p.r = 1.6 + Math.random()*2.6;
        p.life = 120 + Math.random()*140;
        p.alpha = 0.5 + Math.random()*0.5;
      }

      // draw glow
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*6);
      grd.addColorStop(0, `rgba(58,168,255,${0.85*p.alpha})`);
      grd.addColorStop(0.6, `rgba(102,224,199,${0.45*p.alpha})`);
      grd.addColorStop(1, `rgba(58,168,255,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*2.3, 0, Math.PI*2);
      ctx.fill();
    }

    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    if (!main.classList.contains('hidden')) initNFC();
  });

  // APPLY / WRITE
  applyBtn.addEventListener('click', () => {
    const d = CARDS[cardSelect.value];
    if (!d) return;
    logMini(`Applied ${d.name} (${d.pan})`);
    log(`Track loaded: ${d.name} (${d.pan})`);
    toast('Clone ready', true);
  });

  writeBtn.addEventListener('click', () => {
    initNFC();
    toast('Preparing field', true);
    log('NFC handshake start');

    const steps = [
      ['Authenticating…', 550],
      ['Payload staging…', 880],
      ['Field negotiation…', 640],
      ['Transmitting…', 1080],
      ['Finalizing…', 700]
    ];
    steps.reduce((p,[text,time]) => p.then(()=> new Promise(res=>{
      log(text); logMini(text);
      setTimeout(res, time);
    })), Promise.resolve())
    .then(()=> {
      log('NFC write complete');
      logMini('NFC: SUCCESS');
      toast('Write complete', true);
      if (pCam && pCam.checked) cinema.classList.remove('hidden');
      flare();
    });
  });

  // pulse ring at the end of write
  function flare(){
    const steps = 16;
    let t = 0;
    const CX = cw/2, CY = ch/2;
    const id = setInterval(()=> {
      t++;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.strokeStyle = `rgba(58,168,255,${0.6 - t*0.035})`;
      ctx.lineWidth = 2;
      ctx.arc(CX, CY, 28 + t*7, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
      if (t >= steps){ clearInterval(id); }
    }, 34);
  }

  // SCAN
  function runScan(){
    nodeMap.innerHTML = '';
    log('Starting scan…');
    const n = 10;
    for (let i=0;i<n;i++){
      const d = document.createElement('div');
      d.style.width = d.style.height = (28 + Math.random()*28) + 'px';
      d.style.borderRadius = '50%';
      d.style.background = 'linear-gradient(180deg, rgba(58,168,255,0.18), rgba(255,255,255,0.03))';
      d.style.boxShadow = '0 8px 28px rgba(58,168,255,0.12)';
      d.style.opacity = '0.2';
      d.style.transform = 'scale(0.9)';
      d.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1), opacity .45s';
      nodeMap.appendChild(d);
      setTimeout(()=> {
        d.style.opacity = '1';
        d.style.transform = 'scale(1.12)';
        logMini(`Node ${i+1} online`);
        log(`Node ${i+1} — ping ok`);
        if (i === n-1) toast('Scan complete', true);
      }, 240*i);
    }
  }
  scanBtn.addEventListener('click', runScan);

  // Terminal
  termSend.addEventListener('click', () => {
    const v = termIn.value.trim();
    if (!v) return;
    log('> ' + v);
    if (/nfc|write/i.test(v)){
      document.querySelector('.thumb-btn[data-panel="atm"]').click();
      writeBtn.click();
    } else if (/scan|net/i.test(v)){
      document.querySelector('.thumb-btn[data-panel="net"]').click();
      runScan();
    } else if (/status/i.test(v)){
      log('Status: UI stable, field ready, session ' + sessionEl.textContent);
    } else {
      log('Unknown command');
    }
    termIn.value = '';
  });
  termIn.addEventListener('keydown', e => e.key === 'Enter' && termSend.click());

  // CAM overlay — floating FAB
  camBtn.addEventListener('click', () => {
    cinema.classList.toggle('hidden');
    toast(cinema.classList.contains('hidden') ? 'CAM off' : 'CAM on', true);
  });

  // Lock / Logout
  lockBtn.addEventListener('click', () => {
    main.classList.add('hidden');
    login.classList.remove('hidden');
    toast('Locked', true);
    pwd.value = '';
    setTimeout(() => pwd.focus(), 250);
  });
  logoutBtn.addEventListener('click', () => {
    main.classList.add('hidden');
    login.classList.remove('hidden');
    toast('Logged out', true);
    pwd.value = '';
    term.innerHTML = '';
    miniLog.innerHTML = '';
    sessionEl.textContent = '—';
    setTimeout(() => pwd.focus(), 250);
  });

  // Quick actions on dashboard cards
  document.querySelectorAll('.card-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const sim = btn.dataset.sim;
      if (sim === 'atm' || sim === 'nfc'){
        document.querySelector('.thumb-btn[data-panel="atm"]').click();
        if (sim === 'nfc') writeBtn.click();
      } else if (sim === 'scan'){
        document.querySelector('.thumb-btn[data-panel="net"]').click();
        runScan();
      }
    });
  });

})();