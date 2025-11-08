/* NUMEN — refined build
   - Password: Venus
   - No pre-login dots; tight spacing; better animations
   - Polished NFC particles; camera overlay; aligned thumb-nav
*/
(() => {
  // ELs
  const login = document.getElementById('login');
  const main = document.getElementById('main');
  const pwd = document.getElementById('pwd');
  const enter = document.getElementById('enter');
  const notifications = document.getElementById('notifications');

  const sessionEl = document.getElementById('session-id');
  const camBtn = document.getElementById('cam');
  const cinema = document.getElementById('cinema');

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
    if (!pNotif.checked) return;
    const t = document.createElement('div');
    t.className = 'toast' + (small ? ' small':'');
    t.textContent = msg;
    notifications.appendChild(t);
    // auto-remove
    setTimeout(() => {
      t.style.transition = 'opacity .4s, transform .4s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px)';
      setTimeout(() => t.remove(), 420);
    }, 2200);
    if (pSound.checked) try{ new AudioContext().close(); }catch{}
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
      // focus nav state
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

  // NFC CANVAS
  let ctx, cw, ch, particles = [], raf;
  function sizeCanvas(){
    const rect = nfcCanvas.getBoundingClientRect();
    nfcCanvas.width = Math.max(1, rect.width * devicePixelRatio);
    nfcCanvas.height = Math.max(1, rect.height * devicePixelRatio);
    nfcCanvas.style.width = rect.width + 'px';
    nfcCanvas.style.height = rect.height + 'px';
    ctx = nfcCanvas.getContext('2d');
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cw = rect.width; ch = rect.height;
  }

  function initNFC(){
    sizeCanvas();
    particles = [];
    const count = 22;
    for (let i=0;i<count;i++){
      particles.push({
        x: cw/2 + (Math.random()-0.5)*90,
        y: ch/2 + (Math.random()-0.5)*50,
        vx: (Math.random()-0.5)*0.7,
        vy: (Math.random()-0.5)*0.9,
        r: 2 + Math.random()*3.5,
        life: 60 + Math.random()*70
      });
    }
    cancelAnimationFrame(raf);
    loop();
  }

  function loop(){
    ctx.clearRect(0,0,cw,ch);

    // faint ring
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(58,168,255,0.14)';
    ctx.arc(cw/2, ch/2, 50, 0, Math.PI*2);
    ctx.stroke();

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*5);
      grd.addColorStop(0, 'rgba(58,168,255,0.85)');
      grd.addColorStop(0.6, 'rgba(102,224,199,0.45)');
      grd.addColorStop(1, 'rgba(58,168,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*2, 0, Math.PI*2);
      ctx.fill();
      if (p.life <= 0){
        p.x = cw/2 + (Math.random()-0.5)*90;
        p.y = ch/2 + (Math.random()-0.5)*50;
        p.vx = (Math.random()-0.5)*0.7;
        p.vy = (Math.random()-0.5)*0.9;
        p.r = 2 + Math.random()*3.5;
        p.life = 60 + Math.random()*70;
      }
    });

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
      ['Authenticating…', 600],
      ['Payload staging…', 900],
      ['Field negotiation…', 650],
      ['Transmitting…', 1100],
      ['Finalizing…', 700]
    ];
    steps.reduce((p,[text,time],i,arr) => p.then(()=> new Promise(res=>{
      log(text); logMini(text);
      setTimeout(res, time);
    })), Promise.resolve())
    .then(()=> {
      log('NFC write complete');
      logMini('NFC: SUCCESS');
      toast('Write complete', true);
      if (pCam.checked) cinema.classList.remove('hidden');
      flare();
    });
  });

  function flare(){
    // radial pulse
    const steps = 14;
    let t = 0;
    const id = setInterval(()=> {
      t++;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.fillStyle = `rgba(58,168,255,${0.6 - t*0.04})`;
      ctx.arc(cw/2, ch/2, 28 + t*6, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      if (t >= steps){ clearInterval(id); }
    }, 38);
  }

  // SCAN
  function runScan(){
    nodeMap.innerHTML = '';
    log('Starting scan…');
    const n = 9;
    for (let i=0;i<n;i++){
      const d = document.createElement('div');
      d.style.width = d.style.height = (30 + Math.random()*26) + 'px';
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

  // CAM overlay
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