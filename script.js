/* script.js — Numen Prop ATM Simulator
   - Password: Venus (case-sensitive)
   - Fake NFC particle effect when "Write NFC" is clicked
   - Animated notifications, terminal logs, progress flows
*/

(() => {
  // DOM
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  const enterBtn = document.getElementById('enter-btn');
  const pwdInput = document.getElementById('pwd');
  const notifications = document.getElementById('notifications');
  const sessionIdEl = document.getElementById('session-id');
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.panel');
  const cardActions = document.querySelectorAll('.card-action');
  const applyBtn = document.getElementById('apply-btn');
  const writeBtn = document.getElementById('write-btn');
  const nfcStage = document.getElementById('nfc-stage');
  const miniTerm = document.getElementById('mini-terminal');
  const terminal = document.getElementById('terminal');
  const termIn = document.getElementById('term-in');
  const termSend = document.getElementById('term-send');
  const nfcCanvas = document.getElementById('nfc-canvas');
  const camToggle = document.getElementById('cam-toggle');
  const cinema = document.getElementById('cinema');
  const logoutBtn = document.getElementById('logout-btn');

  // Config / fake data
  const PASSWORD = 'Venus';
  const fakeCards = {
    card1: {name:'VAULT-001', pan:'5454 3333 2222 1111'},
    card2: {name:'GHOST-ACCT', pan:'4000 1234 5678 9010'},
    card3: {name:'TAP-TEST', pan:'6011 0009 9013 9424'}
  };

  // Helpers
  function uuid() {
    return 'GHOST-' + Math.random().toString(36).slice(2,9).toUpperCase();
  }

  function notify(txt, small=false) {
    // create animated notification
    const n = document.createElement('div');
    n.className = 'notify' + (small ? ' small' : '');
    n.textContent = txt;
    notifications.appendChild(n);
    setTimeout(()=> n.style.opacity = '1', 10);
    // auto remove
    setTimeout(()=> {
      n.style.transition = 'opacity .5s, transform .4s';
      n.style.opacity = '0';
      n.style.transform = 'translateY(-10px)';
      setTimeout(()=> n.remove(), 600);
    }, 2400);
  }

  function appendMiniLog(txt) {
    const line = document.createElement('div');
    line.textContent = `[${(new Date()).toLocaleTimeString()}] ${txt}`;
    miniTerm.prepend(line);
  }

  function appendTerminal(txt) {
    const line = document.createElement('div');
    line.textContent = `[${(new Date()).toLocaleTimeString()}] ${txt}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // LOGIN
  function loginAttempt() {
    const val = pwdInput.value.trim();
    if (val === PASSWORD) {
      // success
      sessionIdEl.textContent = uuid();
      notify('Access Granted — Session created', true);
      loginScreen.classList.add('hidden');
      appScreen.classList.remove('hidden');
      appScreen.setAttribute('aria-hidden','false');
      // small start logs
      appendTerminal('>> Bootstrapping NUMEN UI...');
      appendTerminal('>> Loading camera-ready shaders...');
      appendTerminal('>> Session: ' + sessionIdEl.textContent);
      setTimeout(()=> notify('NUMEN ready — camera mode looks clean'), 800);
    } else {
      notify('Invalid password', true);
      pwdInput.value = '';
      pwdInput.focus();
      appendTerminal('>> Failed login attempt');
    }
  }
  enterBtn.addEventListener('click', loginAttempt);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginAttempt(); });

  // Simple nav
  navBtns.forEach(b => {
    b.addEventListener('click', () => {
      navBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const panel = b.dataset.panel;
      panels.forEach(p => {
        if (p.id === panel) {
          p.classList.add('active');
          p.setAttribute('aria-hidden','false');
        } else {
          p.classList.remove('active');
          p.setAttribute('aria-hidden','true');
        }
      });
    });
  });

  // Quick card actions
  cardActions.forEach(btn => {
    btn.addEventListener('click', () => {
      const sim = btn.dataset.sim;
      if (sim === 'atm' || sim === 'nfc') {
        // switch to ATM panel
        document.querySelector('.nav-btn[data-panel="atm"]').click();
        notify('ATM panel opened', true);
      } else if (sim === 'scan') {
        document.querySelector('.nav-btn[data-panel="network"]').click();
        notify('Node scan ready', true);
      }
    });
  });

  // Apply (clone) => fake loading and terminal update
  applyBtn.addEventListener('click', () => {
    const sel = document.getElementById('card-select').value;
    const data = fakeCards[sel];
    if (!data) return;
    appendMiniLog(`Applied pattern ${data.name} (${data.pan})`);
    appendTerminal(`>> Applied stored track: ${data.name} (${data.pan})`);
    notify('Clone applied to buffer', true);
  });

  // NFC canvas particle system
  function makeCanvasFull(c) {
    const rect = c.getBoundingClientRect();
    c.width = rect.width * devicePixelRatio;
    c.height = rect.height * devicePixelRatio;
    c.style.width = rect.width + 'px';
    c.style.height = rect.height + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    return ctx;
  }

  let particles = [];
  function initCanvas() {
    if (!nfcCanvas) return;
    const ctx = makeCanvasFull(nfcCanvas);
    const w = nfcCanvas.clientWidth;
    const h = nfcCanvas.clientHeight;
    particles = [];
    for (let i=0;i<20;i++) {
      particles.push({
        x: w/2 + (Math.random()-0.5)*80,
        y: h/2 + (Math.random()-0.5)*40,
        vx: (Math.random()-0.5)*0.6,
        vy: (Math.random()-0.5)*0.8,
        size: 2 + Math.random()*4,
        life: 40 + Math.random()*60,
        alpha: 0
      });
    }
    function frame(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.min(1, (60 - p.life) / 60);
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*4);
        grd.addColorStop(0, `rgba(58,168,255,${0.9*p.alpha})`);
        grd.addColorStop(0.6, `rgba(102,224,199,${0.5*p.alpha})`);
        grd.addColorStop(1, `rgba(58,168,255,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*1.8, 0, Math.PI*2);
        ctx.fill();
        // respawn
        if (p.life <= 0) {
          p.x = w/2 + (Math.random()-0.5)*80;
          p.y = h/2 + (Math.random()-0.5)*40;
          p.vx = (Math.random()-0.5)*0.8;
          p.vy = (Math.random()-0.5)*0.9;
          p.size = 2 + Math.random()*4;
          p.life = 40 + Math.random()*60;
        }
      });
      // ring
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(58,168,255,0.12)';
      ctx.arc(w/2, h/2, 46, 0, Math.PI*2);
      ctx.stroke();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // "Write NFC" simulation: show particles, progress, terminal logs
  writeBtn.addEventListener('click', () => {
    // show stage
    nfcStage.setAttribute('aria-hidden','false');
    nfcStage.style.opacity = '1';
    initCanvas();
    appendMiniLog('Starting NFC write sequence');
    appendTerminal('>> Initiating NFC handshake...');
    notify('Preparing NFC field', true);

    // animated progress simulation
    const progressSteps = [
      {text:'Authenticating...', time:800},
      {text:'Pushing emulation payload...', time:1200},
      {text:'Negotiating field...', time:700},
      {text:'Transmitting...', time:1400},
      {text:'Finalizing...', time:900},
    ];

    let sum = 0;
    progressSteps.reduce((p,step, idx) => {
      return p.then(()=> new Promise(res=>{
        appendTerminal(`>> ${step.text}`);
        appendMiniLog(step.text);
        // optional camera overlay toggle if set
        setTimeout(()=> {
          res();
          if (idx === progressSteps.length -1) {
            appendTerminal('>> NFC write complete — simulated success');
            appendMiniLog('NFC: SUCCESS');
            notify('Write complete', true);
            // tiny flourish: particle flare
            flashParticles();
            // hide stage after short delay
            setTimeout(()=> {
              nfcStage.setAttribute('aria-hidden','true');
              nfcStage.style.opacity = '0';
            }, 900);
          }
        }, step.time);
      }));
    }, Promise.resolve());
  });

  // small particle flare function to simulate final handshake
  function flashParticles(){
    if (!nfcCanvas) return;
    const ctx = nfcCanvas.getContext('2d');
    const w = nfcCanvas.width / devicePixelRatio;
    const h = nfcCanvas.height / devicePixelRatio;
    let t = 0;
    const raf = setInterval(()=>{
      t++;
      ctx.clearRect(0,0,w,h);
      ctx.beginPath();
      ctx.fillStyle = `rgba(58,168,255,${0.6 - t*0.02})`;
      ctx.arc(w/2, h/2, 30 + t*6, 0, Math.PI*2);
      ctx.fill();
      if (t>12) {
        clearInterval(raf);
        // restore initCanvas particles
        initCanvas();
      }
    },40);
  }

  // Terminal panel send
  termSend.addEventListener('click', () => {
    const v = termIn.value.trim();
    if (!v) return;
    appendTerminal('> ' + v);
    // fake responses
    if (/nfc/i.test(v)) {
      appendTerminal('>> Simulating NFC write (type: quick)');
      document.querySelector('.nav-btn[data-panel="atm"]').click();
      writeBtn.click();
    } else if (/scan/i.test(v)) {
      document.querySelector('.nav-btn[data-panel="network"]').click();
      startScan();
    } else {
      appendTerminal('>> Unknown command — simulated only.');
    }
    termIn.value = '';
  });
  termIn.addEventListener('keydown', e => { if (e.key === 'Enter') termSend.click(); });

  // Node scan
  function startScan(){
    appendTerminal('>> Starting node scan...');
    const nodeMap = document.getElementById('node-map');
    nodeMap.innerHTML = '';
    const nodes = 7;
    for (let i=0;i<nodes;i++){
      const n = document.createElement('div');
      n.className = 'node';
      n.style.width = (34 + Math.random()*20) + 'px';
      n.style.height = n.style.width;
      n.style.borderRadius = '50%';
      n.style.background = 'linear-gradient(180deg, rgba(58,168,255,0.14), rgba(255,255,255,0.02))';
      n.style.margin = '6px';
      n.style.opacity = '0.15';
      n.style.transition = 'transform .5s, opacity .6s, box-shadow .6s';
      nodeMap.appendChild(n);
    }
    // animate nodes lighting up
    const kids = Array.from(nodeMap.children);
    kids.forEach((n, idx) => {
      setTimeout(()=>{
        n.style.transform = 'scale(1.12)';
        n.style.opacity = '1';
        n.style.boxShadow = '0 8px 30px rgba(58,168,255,0.12)';
        appendTerminal(`>> Node ${idx+1} — ping ok`);
        appendMiniLog(`Node ${idx+1} discovered`);
        if (idx === kids.length -1) notify('Scan complete', true);
      }, 280 * idx);
    });
  }
  document.getElementById('scan-btn')?.addEventListener('click', startScan);

  // camera overlay toggle
  camToggle.addEventListener('click', () => {
    cinema.classList.toggle('hidden');
    if (!cinema.classList.contains('hidden')) {
      notify('Camera overlay on', true);
    } else {
      notify('Camera overlay off', true);
    }
  });

  // logout
  logoutBtn.addEventListener('click', () => {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    appScreen.setAttribute('aria-hidden','true');
    pwdInput.value = '';
    notify('Logged out', true);
    appendTerminal('>> Session terminated');
  });

  // small niceties
  function initMini() {
    // prefill mini terminal
    appendMiniLog('NUMEN UI ready');
    appendMiniLog('Tap Write NFC to run a demo');
    // init canvas when ATM panel visible
    setTimeout(()=> {
      if (nfcCanvas) initCanvas();
    }, 500);
  }

  initMini();

  // accessibility: focus password on load
  setTimeout(()=> pwdInput.focus(), 400);

})();
