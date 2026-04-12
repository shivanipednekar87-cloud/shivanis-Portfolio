import { Application } from '@splinetool/runtime'

// ── SERVICE WORKER ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW failed', err))
  })
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
const loadingBar     = document.getElementById('loading-bar')
const loadingPercent = document.getElementById('loading-percent')
let   displayPct     = 0
let   tickInterval   = null

function setProgress(pct) {
  displayPct = Math.min(Math.round(pct), 99)
  if (loadingBar)     loadingBar.style.width     = displayPct + '%'
  if (loadingPercent) loadingPercent.textContent = displayPct + '%'
}

function tickToward(target) {
  clearInterval(tickInterval)
  tickInterval = setInterval(() => {
    if (displayPct >= target) { clearInterval(tickInterval); return }
    setProgress(displayPct + Math.random() * 3 + 0.5)
  }, 150)
}

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const heroScreen       = document.getElementById('hero-screen')
const mainScene        = document.getElementById('main-scene')
const instructionModal = document.getElementById('instruction-modal')
const finalOverlay     = document.getElementById('final-load-overlay')
const finalBar         = document.getElementById('final-load-bar')
const finalPercent     = document.getElementById('final-load-percent')
const isMobile         = window.innerWidth < 900

let mainApp = null
let isMuted = false

// ── LOAD HOUSE SCENE ──────────────────────────────────────────────────────────
setProgress(0)
tickToward(70)

const mainCanvas = document.getElementById('spline-forest')
mainApp = new Application(mainCanvas)

mainApp
  .load('https://prod.spline.design/XlNosqdwcDooZwGr/scene.splinecode')
  .then(() => {
    clearInterval(tickInterval)
    setProgress(70)
    attachMainEvents()
    setTimeout(() => dismissLoadingScreen(), 200)
  })
  .catch(() => {
    clearInterval(tickInterval)
    setProgress(70)
    setTimeout(() => dismissLoadingScreen(), 200)
  })

// ── MUTE BUTTON ───────────────────────────────────────────────────────────────
function initMuteButton() {
  const btn = document.getElementById('mute-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    isMuted = !isMuted
    // Mute all audio elements inside the Spline canvas
    const audioEls = document.querySelectorAll('audio, video')
    audioEls.forEach(el => { el.muted = isMuted })
    // Also try via Spline app if API supports it
    if (mainApp && mainApp.setVariable) {
      try { mainApp.setVariable('muted', isMuted) } catch(e) {}
    }
    btn.innerHTML = isMuted
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
    btn.title = isMuted ? 'Unmute' : 'Mute'
  })
}

// ── DISMISS LOADING SCREEN ────────────────────────────────────────────────────
function dismissLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  loadingScreen.style.transition = 'opacity 0.8s ease'
  loadingScreen.style.opacity    = '0'
  setTimeout(() => {
    loadingScreen.style.display = 'none'
    heroScreen.classList.remove('hidden')
    heroScreen.style.opacity    = '0'
    heroScreen.style.transition = 'opacity 0.6s ease'
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroScreen.style.opacity = '1'
    }))
    initPaintReveal()
    setTimeout(() => preloadPanelImages(), 500)
  }, 800)
}

// ── PAINT REVEAL HERO ─────────────────────────────────────────────────────────
function initPaintReveal() {
  const scratch    = document.getElementById('hero-scratch')
  const ctx        = scratch.getContext('2d')
  const hint       = document.getElementById('hero-hint')
  const enterBtn   = document.getElementById('enter-forest-btn')

  let hasStarted = false
  let prevX      = null
  let prevY      = null
  let checkTimer = 0
  const BRUSH    = isMobile ? 130 : 180

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    scratch.width  = w
    scratch.height = h
    const bwSrc = isMobile ? '/images/hero-bw-mobile.png' : '/images/hero-bw.png'
    const img = new Image()
    img.src = bwSrc
    img.onload = () => ctx.drawImage(img, 0, 0, w, h)
  }
  resize()
  window.addEventListener('resize', resize)

  function paintBlob(x, y, size) {
    ctx.globalCompositeOperation = 'destination-out'
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2)
    grad.addColorStop(0,    'rgba(0,0,0,1)')
    grad.addColorStop(0.45, 'rgba(0,0,0,1)')
    grad.addColorStop(0.72, 'rgba(0,0,0,0.7)')
    grad.addColorStop(0.88, 'rgba(0,0,0,0.3)')
    grad.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist  = size * 0.3 + Math.random() * size * 0.4
      const fx    = x + Math.cos(angle) * dist
      const fy    = y + Math.sin(angle) * dist
      const fr    = size * (0.06 + Math.random() * 0.12)
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr)
      fg.addColorStop(0, 'rgba(0,0,0,0.8)')
      fg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.arc(fx, fy, fr, 0, Math.PI * 2)
      ctx.fill()
    }
    const streakLen = size * (0.7 + Math.random() * 0.6)
    const streakDir = Math.random() > 0.5 ? 1 : -1
    ctx.beginPath()
    ctx.lineWidth   = size * 0.6
    ctx.lineCap     = 'round'
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'
    ctx.moveTo(x - streakLen * 0.5 * streakDir, y + (Math.random() - 0.5) * 14)
    ctx.lineTo(x + streakLen * 0.5 * streakDir, y + (Math.random() - 0.5) * 14)
    ctx.stroke()
  }

  function paintStroke(x, y) {
    if (!hasStarted) {
      hasStarted = true
      hint.style.opacity = '0'
    }
    if (prevX !== null) {
      const dist  = Math.hypot(x - prevX, y - prevY)
      const steps = Math.ceil(dist / 6)
      for (let i = 0; i <= steps; i++) {
        const t  = i / steps
        paintBlob(prevX + (x - prevX) * t, prevY + (y - prevY) * t, BRUSH)
      }
    } else {
      paintBlob(x, y, BRUSH)
    }
    prevX = x
    prevY = y
    checkTimer++
    if (checkTimer % 30 === 0) checkReveal()
  }

  function checkReveal() {
    const data = ctx.getImageData(0, 0, scratch.width, scratch.height).data
    let transparent = 0
    const step = 4 * 40
    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 100) transparent++
    }
    const pct = (transparent / (data.length / (4 * 40))) * 100
    if (pct > 10 && !enterBtn.classList.contains('visible')) {
      enterBtn.classList.add('visible')
    }
  }

  scratch.addEventListener('mousemove', e => {
    const r = scratch.getBoundingClientRect()
    paintStroke(e.clientX - r.left, e.clientY - r.top)
  })
  scratch.addEventListener('mouseleave', () => { prevX = null; prevY = null })
  scratch.addEventListener('touchmove', e => {
    e.preventDefault()
    const r = scratch.getBoundingClientRect()
    const t = e.touches[0]
    paintStroke(t.clientX - r.left, t.clientY - r.top)
  }, { passive: false })
  scratch.addEventListener('touchend', () => { prevX = null; prevY = null })
}

// ── FINAL LOAD OVERLAY ────────────────────────────────────────────────────────
function runFinalLoad(onComplete) {
  if (finalOverlay) {
    finalOverlay.style.display    = 'flex'
    finalOverlay.style.opacity    = '0'
    finalOverlay.style.transition = 'opacity 0.3s ease'
    requestAnimationFrame(() => requestAnimationFrame(() => {
      finalOverlay.style.opacity = '1'
    }))
  }
  if (finalBar)     finalBar.style.width     = '70%'
  if (finalPercent) finalPercent.textContent = '70%'
  let pct = 70
  const iv = setInterval(() => {
    pct = Math.min(pct + Math.random() * 6 + 3, 100)
    if (finalBar)     finalBar.style.width     = pct + '%'
    if (finalPercent) finalPercent.textContent = Math.floor(pct) + '%'
    if (pct >= 100) {
      clearInterval(iv)
      if (finalBar)     finalBar.style.width     = '100%'
      if (finalPercent) finalPercent.textContent = '100%'
      setTimeout(() => {
        if (finalOverlay) finalOverlay.style.opacity = '0'
        setTimeout(() => {
          if (finalOverlay) finalOverlay.style.display = 'none'
          onComplete()
        }, 400)
      }, 300)
    }
  }, 60)
}

// ── ZOOM TRANSITION ───────────────────────────────────────────────────────────
function zoomWipeTransition(outEl, inEl) {
  inEl.classList.remove('hidden')
  inEl.style.opacity   = '1'
  inEl.style.transform = 'scale(1)'
  inEl.style.zIndex    = '1'
  outEl.style.position        = 'fixed'
  outEl.style.inset           = '0'
  outEl.style.zIndex          = '10'
  outEl.style.transformOrigin = 'center center'
  outEl.style.transition      = 'transform 1.1s cubic-bezier(0.4,0,0.2,1), opacity 0.9s ease'
  requestAnimationFrame(() => requestAnimationFrame(() => {
    outEl.style.transform = 'scale(1.18)'
    outEl.style.opacity   = '0'
  }))
  setTimeout(() => {
    outEl.style.display    = 'none'
    outEl.style.transform  = ''
    outEl.style.opacity    = ''
    outEl.style.transition = ''
    outEl.style.zIndex     = ''
    inEl.style.zIndex      = ''
    initMuteButton()
    initProximityBubble()
  }, 1100)
}

// ── BLUR ──────────────────────────────────────────────────────────────────────
function showBlur() {
  document.getElementById('scene-blur-overlay')?.classList.add('active')
  hideSpeechBubble()
}
function hideBlur() {
  document.getElementById('scene-blur-overlay')?.classList.remove('active')
}

// ── INSTRUCTION MODAL ─────────────────────────────────────────────────────────
function showInstructionModal() {
  instructionModal.classList.add('visible')
  instructionModal.setAttribute('aria-hidden', 'false')
  const bar = document.getElementById('instruction-countdown-bar')
  if (bar) {
    bar.style.transition = 'none'
    bar.style.width      = '100%'
    bar.getBoundingClientRect()
    bar.style.transition = 'width 6s linear'
    bar.style.width      = '0%'
  }
}
function hideInstructionModal() {
  instructionModal.classList.remove('visible')
  instructionModal.setAttribute('aria-hidden', 'true')
}

// ── ENTER HOUSE ───────────────────────────────────────────────────────────────
let hasStartedEntering = false

function enterHouse() {
  if (hasStartedEntering) return
  hasStartedEntering = true
  showInstructionModal()
  setTimeout(() => {
    hideInstructionModal()
    runFinalLoad(() => zoomWipeTransition(heroScreen, mainScene))
  }, 6000)
}

document.getElementById('enter-forest-btn')?.addEventListener('click',       () => enterHouse())
document.getElementById('enter-forest-btn-modal')?.addEventListener('click', () => enterHouse())

// ── PRELOAD IMAGES ────────────────────────────────────────────────────────────
function preloadPanelImages() {
  const urls = [
    ...projects3D.map(p => p.image),
    ...films.map(f => f.thumbnail),
    ...films.flatMap(f => f.screenshots || []),
    '/images/Portfolio BG.png',
    '/images/Hugs and hues BG.png',
    '/images/puddle up BG.png',
    '/images/wharli whishper BG.png',
    '/images/Science lore BG.jpg',
  ]
  urls.forEach(src => { const img = new Image(); img.src = src })
}

// ── MOBILE MENU ───────────────────────────────────────────────────────────────
const hamburgerBtn   = document.getElementById('hamburger-btn')
const mobileDropdown = document.getElementById('mobile-dropdown')
const mobileNav      = document.getElementById('mobile-nav')

hamburgerBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  mobileDropdown.classList.contains('open') ? closeMobileMenu() : openMobileMenu()
})
function openMobileMenu() {
  mobileDropdown.classList.add('open')
  hamburgerBtn.classList.add('open')
  hamburgerBtn.setAttribute('aria-expanded', 'true')
}
function closeMobileMenu() {
  mobileDropdown.classList.remove('open')
  hamburgerBtn.classList.remove('open')
  hamburgerBtn.setAttribute('aria-expanded', 'false')
}
document.addEventListener('click', (e) => {
  if (mobileNav && !mobileNav.contains(e.target)) closeMobileMenu()
})

// ── DATA ──────────────────────────────────────────────────────────────────────
const projects3D = [
  {
    id: 'park', title: 'Stylized Park Environment', subtitle: '3D Environment',
    image: '/images/park-environment.png',
    description: `This stylized park environment was created as a personal project to explore environment setup and visual storytelling.\n\nI focused on overall composition, asset placement, and scale to create a believable yet stylized park setting.\n\nThis project helped me better understand environment assembly and scene composition.`,
  },
  {
    id: 'fox', title: 'Fox Creature', subtitle: 'Stylized 3D Modeling',
    image: '/images/fox-creature.png',
    description: `This model started as a just-for-fun experiment - a fox with bat wings, demon horns, and a bit of fire.\n\nThe process was playful and intuitive, letting the design grow naturally as I modeled.\n\nThis piece reminded me how much I enjoy building characters that feel alive and full of charm.`,
  },
  {
    id: 'tree', title: 'Stylized Tree', subtitle: '3D Environment Prop',
    image: '/images/stylized-tree.png',
    description: `This stylized tree was modeled and textured as a personal study in environment prop creation.\n\nI focused on creating a strong silhouette and simplified forms.\n\nThis project helped me better understand stylized environment modeling and organic form development.`,
  },
  {
    id: 'boot', title: 'Boot Study', subtitle: '3D Modeling - Maya',
    image: '/images/boot-study.jpg',
    description: `This boot model was created as part of an assignment, modeled entirely in Autodesk Maya.\n\nFocusing on clean geometry helped me better understand how to build shapes efficiently.\n\nThis project reinforced my comfort with hard-surface and prop modeling in Maya.`,
  },
  {
    id: 'bench', title: 'Stylized Park Bench', subtitle: '3D Prop Study',
    image: '/images/park-bench.png',
    description: `This park bench was modeled in ZBrush and textured in Adobe Substance Painter.\n\nThe project allowed me to explore wood and metal materials and subtle texture variation.\n\nThrough this I gained a better understanding of prop modeling workflow.`,
  },
  {
    id: 'hand', title: 'Hand Study', subtitle: '3D Modeling - Maya + ZBrush',
    image: '/images/hand-study.png',
    description: `This hand model was created during my MFA in Film & Animation at RIT.\n\nI built a base mesh in Maya then moved into ZBrush to refine the form and surface detail.\n\nThis project strengthened my understanding of human anatomy and organic 3D modeling.`,
  },
]

const films = [
  {
    id: 'hugs', title: 'Hugs in Hues', label: 'Short Film',
    bgImage: '/images/Hugs and hues BG.png', thumbnail: '/images/hugs-in-hues.png',
    screenshots: ['/images/hugs-1.png','/images/hugs-2.png','/images/hugs-3.png','/images/hugs-4.png'],
    detailTitle: 'Behind the Hues',
    description: [
      `Hugs and Hues is a short animated film that grew from my relationship with emotions and how I naturally express them. I've always found it easier to process feelings through images, colors, light, and movement rather than words. Animation became the language that felt most honest to me.`,
      `The film follows a young artist who retreats into her drawings, slipping into a painted world where emotions take shape visually. Through this journey, she learns to face her fears, express herself, and reconnect with the people around her. The story is quiet and gentle, focusing on small moments rather than big dialogue.`,
      `Visually, I explored painterly textures, color, and lighting to communicate emotion. I wanted the world to feel soft, expressive, and slightly imperfect - like a painting that breathes. Much of the process involved experimenting with mood and color to let the visuals carry the emotional weight of the story.`,
      `Hugs and Hues is deeply personal to me. It reflects how I understand connection, vulnerability, and care, and how art can become a bridge when words feel difficult.`,
    ],
  },
  {
    id: 'puddle', title: 'Puddle Up!!', label: 'Short Film',
    bgImage: '/images/puddle up BG.png', thumbnail: '/images/puddle-up.png',
    leftVideo: '/images/puddle-1.mp4', leftImage: '/images/puddle-2.png',
    screenshots: ['/images/puddle-2.png','/images/puddle-3.png','/images/puddle-4.png'],
    detailTitle: 'Behind the Splash',
    description: [
      `This 30-second short was created during my master's program and was my very first finished film. I started with a character rig from Animation Methods and a few environment assets from TurboSquid, and jumped straight into animating in Maya.`,
      `Midway through the project, I realized there were things I wanted to explore in Unreal Engine, especially lighting and mood. That meant figuring out how to properly bring a Maya rig into Unreal, which took a lot more time than I expected but taught me a lot about pipelines and problem-solving.`,
      `One of the biggest challenges was texturing and lighting the environment in grayscale. I didn't want to simply desaturate the final render in post - I wanted to actually understand how values, contrast, and lighting work without relying on color. It was difficult, but it pushed me to think more intentionally about mood and composition.`,
      `Looking back, there are definitely things I would approach differently now, but this project was an important learning experience and a meaningful first step in my journey as an animator.`,
    ],
  },
  {
    id: 'warli', title: 'Warli Whispers', label: 'Short Film',
    bgImage: '/images/wharli whishper BG.png', thumbnail: '/images/warli-whispers.png',
    screenshots: ['/images/warli-1.png','/images/warli-2.png','/images/warli-3.png','/images/warli-4.png'],
    detailTitle: 'Behind the Whispers',
    description: [
      `Warli Whispers is a short animated film inspired by Warli art, a traditional Indian folk art form that has always been close to my heart. My mother has always loved Warli paintings, and growing up, I painted a Warli mural on the wall of my parents' bedroom. That wall became something I lived with every day.`,
      `As a child, I often imagined the painted figures coming to life at night - the stick figures moving, talking, dancing, and carrying out their everyday chores once no one was watching. That childhood imagination stayed with me, and this film grew directly from that feeling.`,
      `In Warli Whispers, I wanted to bring that wall to life through animation, letting the drawings move gently and tell quiet stories. The goal wasn't dramatic motion, but subtle, rhythmic movement that feels natural and respectful to the simplicity of Warli art.`,
      `The entire film was created in After Effects, where I focused on animating the hand-painted forms while preserving their texture and handmade quality. This project is deeply personal, connecting my cultural roots, family memories, and my early fascination with the idea that drawings could move.`,
    ],
  },
  {
    id: 'sciencelore', title: 'ScienceLore', label: 'Short Film',
    bgImage: '/images/Science lore BG.jpg', thumbnail: '/images/Science lore.jpg',
    leftYoutube: 'https://www.youtube.com/embed/PBs7AcSVsSM?autoplay=1&mute=1&loop=1&playlist=PBs7AcSVsSM',
    screenshots: ['/images/sciencelore-1.jpg','/images/sciencelore-2.jpg','/images/sciencelore-3.jpg','/images/sciencelore-4.jpg'],
    detailTitle: 'ScienceLore',
    description: [
      `ScienceLore is an educational animated series that blends storytelling with science concepts for younger audiences.`,
      `This project involved collaborative production work at RIT, bringing together animation, writing, and educational design.`,
    ],
  },
]

// ── RANDOM ROTATING TIPS ─────────────────────────────────────────────────────
const tips = [
  { msg: "Hey! Wanna know about me? Find this little guy in the backyard!", emoji: '🐕', section: 'about' },
  { msg: "Curious about my skills? Look for this in the office!", emoji: '🖥️', section: 'skills' },
  { msg: "Wanna see my 3D work? Find this easel in the pink room!", emoji: '🎨', section: 'portfolio' },
  { msg: "My short films are hiding near this camera — go find it!", emoji: '🎬', section: 'films' },
  { msg: "Need my resume? Find the work experience board in the kitchen!", emoji: '📋', section: 'resume' },
  { msg: "Want to reach out? The telephone in the living room is waiting!", emoji: '☎️', section: 'contact' },
]

let activeBubbleSection = null
let bubbleTimeout       = null
let tipInterval         = null
let lastTipIndex        = -1

function getRandomTip() {
  let idx
  do { idx = Math.floor(Math.random() * tips.length) } while (idx === lastTipIndex)
  lastTipIndex = idx
  return tips[idx]
}

function showTip(tip) {
  activeBubbleSection = tip.section
  const bubble  = document.getElementById('speech-bubble')
  const msg     = document.getElementById('speech-bubble-msg')
  const objEl   = document.getElementById('speech-bubble-obj')
  if (!bubble || !msg) return
  msg.textContent = tip.msg
  if (objEl) objEl.textContent = tip.emoji
  bubble.classList.add('visible')
}

function hideSpeechBubble() {
  activeBubbleSection = null
  const bubble = document.getElementById('speech-bubble')
  if (bubble) bubble.classList.remove('visible')
}

function startTipCycle() {
  // Show first tip after 3 seconds
  bubbleTimeout = setTimeout(() => {
    showTip(getRandomTip())
    // Show for 10s, hide for 4s, repeat
    tipInterval = setInterval(() => {
      hideSpeechBubble()
      setTimeout(() => {
        if (document.getElementById('panel')?.classList.contains('hidden')) {
          showTip(getRandomTip())
        }
      }, 4000)
    }, 14000) // 10s visible + 4s hidden = 14s cycle
  }, 3000)
}

function initProximityBubble() {
  // Enter key opens active section
  window.addEventListener('keyup', (e) => {
    if ((e.key === 'Enter' || e.code === 'Enter') && activeBubbleSection) {
      e.preventDefault()
      openPanel(activeBubbleSection)
      setNav(activeBubbleSection)
    }
  }, true)

  // Click on bubble box opens section
  document.getElementById('speech-bubble-box')?.addEventListener('click', () => {
    if (activeBubbleSection) {
      openPanel(activeBubbleSection)
      setNav(activeBubbleSection)
    }
  })

  startTipCycle()
}

function showSpeechBubble(message, section) {
  activeBubbleSection = section
  const bubble = document.getElementById('speech-bubble')
  const msg    = document.getElementById('speech-bubble-msg')
  if (!bubble || !msg) return
  msg.textContent = message
  bubble.classList.add('visible')
}

// ── FILM DETAIL ───────────────────────────────────────────────────────────────
let curFilmDetail = 0

function openFilmDetail(i) {
  curFilmDetail = i
  const panel   = document.getElementById('panel')
  const overlay = document.getElementById('film-detail-overlay')
  if (!overlay) return
  if (panel) { panel.classList.add('hidden'); panel.style.display = 'none' }
  renderFilmDetail()
  overlay.classList.remove('hidden')
  overlay.style.display = 'flex'
  hideBlur()
}

function renderFilmDetail() {
  const f       = films[curFilmDetail]
  const overlay = document.getElementById('film-detail-overlay')
  if (!overlay) return
  overlay.style.backgroundImage = `url('${encodeURI(f.bgImage)}')`

  const leftSlot = document.getElementById('film-detail-left-slot')
  if (leftSlot) {
    if (f.leftYoutube) {
      leftSlot.innerHTML = `<iframe src="${f.leftYoutube}" style="width:100%;max-width:560px;aspect-ratio:16/9;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,0.6);display:block;border:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
    } else if (f.leftVideo) {
      leftSlot.innerHTML = `<video src="${f.leftVideo}" autoplay loop muted playsinline style="width:100%;max-width:560px;max-height:62vh;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,0.6);display:block;object-fit:cover;"></video>`
    } else {
      const imgSrc = f.leftImage || (f.screenshots && f.screenshots[0]) || ''
      leftSlot.innerHTML = `<img id="film-detail-img" src="${imgSrc}" alt="${f.title}" style="width:100%;max-width:560px;max-height:62vh;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,0.6);display:block;object-fit:cover;cursor:pointer;"/>`
      const imgEl = leftSlot.querySelector('#film-detail-img')
      if (imgEl && f.screenshots?.length) imgEl.addEventListener('click', () => openLightbox(f.screenshots, 0))
    }
  }

  const gridLeft = document.getElementById('film-detail-grid-left')
  if (gridLeft) {
    gridLeft.innerHTML = (f.screenshots || []).map((src, i) => `
      <div class="film-screenshot" data-index="${i}">
        <img src="${src}" alt="Screenshot ${i+1}" loading="lazy"
             onerror="this.closest('.film-screenshot').style.display='none'" />
      </div>`).join('')
    gridLeft.querySelectorAll('.film-screenshot').forEach(el => {
      el.addEventListener('click', () => openLightbox(f.screenshots, parseInt(el.dataset.index)))
    })
  }

  const labelEl = document.getElementById('film-detail-label');   if (labelEl) labelEl.textContent = f.label
  const titleEl = document.getElementById('film-detail-title');   if (titleEl) titleEl.textContent = f.detailTitle
  const bodyEl  = document.getElementById('film-detail-body');    if (bodyEl)  bodyEl.innerHTML    = f.description.map(p => `<p>${p}</p>`).join('')
  const ctrEl   = document.getElementById('film-detail-counter'); if (ctrEl)   ctrEl.textContent   = `${curFilmDetail + 1} / ${films.length}`
}

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
let lightboxImages = [], lightboxCur = 0

function openLightbox(images, startIdx) {
  lightboxImages = images
  lightboxCur    = startIdx
  renderLightbox()
  const lb = document.getElementById('film-lightbox')
  lb.classList.remove('hidden')
  lb.style.display = 'flex'
}
function closeLightbox() {
  const lb = document.getElementById('film-lightbox')
  lb.classList.add('hidden')
  lb.style.display = 'none'
}
function renderLightbox() {
  document.getElementById('lightbox-img').src             = lightboxImages[lightboxCur]
  document.getElementById('lightbox-counter').textContent = `${lightboxCur + 1} / ${lightboxImages.length}`
}
document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox)
document.getElementById('lightbox-prev')?.addEventListener('click', () => {
  lightboxCur = (lightboxCur - 1 + lightboxImages.length) % lightboxImages.length
  renderLightbox()
})
document.getElementById('lightbox-next')?.addEventListener('click', () => {
  lightboxCur = (lightboxCur + 1) % lightboxImages.length
  renderLightbox()
})
document.getElementById('film-lightbox')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('film-lightbox')) closeLightbox()
})

document.getElementById('film-detail-close')?.addEventListener('click', () => {
  const o = document.getElementById('film-detail-overlay')
  o.classList.add('hidden')
  o.style.display = 'none'
  openPanel('films')
})
document.getElementById('film-detail-prev')?.addEventListener('click', () => {
  curFilmDetail = (curFilmDetail - 1 + films.length) % films.length
  renderFilmDetail()
})
document.getElementById('film-detail-next')?.addEventListener('click', () => {
  curFilmDetail = (curFilmDetail + 1) % films.length
  renderFilmDetail()
})

// ── CAROUSEL ──────────────────────────────────────────────────────────────────
function makeCarousel(items, id) {
  return `
    <div class="carousel-container" id="${id}">
      <div class="carousel-track" id="track-${id}">
        ${items.map((item, i) => `
          <div class="carousel-slide ${i===0?'active':''}" data-index="${i}">
            <img src="${item.thumbnail||item.image}" alt="${item.title}" />
            <div class="carousel-slide-info">
              <div class="card-title">${item.title}</div>
              <div class="card-desc">${item.label||item.subtitle||'Short film'}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="carousel-nav">
        <button class="carousel-btn" id="prev-${id}" type="button">←</button>
        <div class="carousel-dots" id="dots-${id}">
          ${items.map((_,i) => `<div class="carousel-dot ${i===0?'active':''}"></div>`).join('')}
        </div>
        <button class="carousel-btn" id="next-${id}" type="button">→</button>
      </div>
    </div>`
}

function initCarousel(id, items, onClickFn) {
  let cur = 0
  const track = document.getElementById(`track-${id}`)
  if (!track) return
  const slides = track.querySelectorAll('.carousel-slide')
  const dots   = document.querySelectorAll(`#dots-${id} .carousel-dot`)

  function goTo(i, openItem = false) {
    slides[cur].classList.remove('active')
    dots[cur].classList.remove('active')
    cur = (i + items.length) % items.length
    slides[cur].classList.add('active')
    dots[cur].classList.add('active')
    // Scroll the active slide into view smoothly
    slides[cur].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    if (openItem) onClickFn(cur)
  }

  document.getElementById(`prev-${id}`)?.addEventListener('click', (e) => {
    e.stopPropagation()
    goTo(cur - 1)
  })
  document.getElementById(`next-${id}`)?.addEventListener('click', (e) => {
    e.stopPropagation()
    goTo(cur + 1)
  })

  // Single click = go to that slide; double click = open
  slides.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (i === cur) {
        onClickFn(i)
      } else {
        goTo(i)
      }
    })
  })

  dots.forEach((d, i) => d.addEventListener('click', (e) => {
    e.stopPropagation()
    goTo(i)
  }))

  // Touch/swipe support
  let touchStartX = 0
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) goTo(diff > 0 ? cur + 1 : cur - 1)
  })
}

// ── SECTION BACKGROUNDS ───────────────────────────────────────────────────────
function getSectionBg(section) {
  const mobile = {
    about:     '/images/About-mobile.png',
    skills:    '/images/Tools-mobile.png',
    resume:    '/images/Resume-mobile.png',
    portfolio: '/images/Portfolio-mobile.png',
    films:     '/images/Short-Films-mobile.png',
    contact:   '/images/Contact-mobile.png',
  }
  const desktop = {
    about:     '/images/About.png',
    skills:    '/images/Tools.png',
    resume:    '/images/Resume.png',
    portfolio: '/images/Portfolio.png',
    films:     '/images/Short Films.png',
    contact:   '/images/Contact.png',
  }
  return isMobile ? (mobile[section] || desktop[section]) : desktop[section]
}

const sections = {
  about:    { content: `` },
  skills:   { content: `` },
  portfolio: {
    content: `<div style="width:100%;display:flex;flex-direction:column;align-items:center;padding-top:10px;">${makeCarousel(projects3D, 'carousel-3d')}</div>`
  },
  films: {
    content: `<div style="width:100%;display:flex;flex-direction:column;align-items:center;padding-top:10px;">${makeCarousel(films, 'carousel-films')}</div>`
  },
  resume: {
    content: `<div style="width:100%;display:flex;align-items:center;justify-content:center;padding-top:${window.innerWidth < 900 ? '20px' : '30%'};">
      <a href="/images/Shivani Vinayak Pednekar_2026.pdf" target="_blank" rel="noopener noreferrer" class="resume-download-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        View Resume
      </a>
    </div>`
  },
  contact: {
    content: `<div style="padding:${window.innerWidth < 900 ? '0 10px' : '0 10px'}; margin-top:${window.innerWidth < 900 ? '0px' : '0px'}">
      <p style="color:#111;font-size:12px;line-height:1.5;margin-bottom:8px;font-family:'Cinzel',serif;font-weight:600;">I'm seeking opportunities in animation, film, and creative production.</p>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
        <input type="text" id="contact-name" placeholder="Your Name" style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.25);padding:5px 0;color:#111;font-family:'Cinzel',serif;font-size:12px;font-weight:600;outline:none;width:100%;"/>
        <input type="email" id="contact-email" placeholder="Your Email" style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.25);padding:5px 0;color:#111;font-family:'Cinzel',serif;font-size:12px;font-weight:600;outline:none;width:100%;"/>
        <textarea id="contact-message" placeholder="Your Message" rows="2" style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.25);padding:5px 0;color:#111;font-family:'Cinzel',serif;font-size:12px;font-weight:600;outline:none;width:100%;resize:none;"></textarea>
        <button onclick="sendContact()" style="background:transparent;border:1px solid rgba(0,0,0,0.35);color:#111;padding:6px 22px;border-radius:30px;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:0.12em;cursor:pointer;align-self:center;margin-top:4px;">SEND MESSAGE</button>
      </div>
      <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:8px;">
        <p style="font-size:10px;letter-spacing:0.2em;color:#111;font-weight:700;margin-bottom:6px;font-family:'Cinzel',serif;">FIND ME ON</p>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <a href="mailto:shivanipednekar87@gmail.com" target="_blank" style="background:rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.2);border-radius:30px;padding:4px 10px;text-decoration:none;color:#111;font-size:11px;font-family:'Cinzel',serif;font-weight:600;">Email</a>
          <a href="https://www.linkedin.com/in/shivani-vinayak-pednekar/" target="_blank" style="background:rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.2);border-radius:30px;padding:4px 10px;text-decoration:none;color:#111;font-size:11px;font-family:'Cinzel',serif;font-weight:600;">LinkedIn</a>
          <a href="https://youtu.be/UZv9RJm6PGs" target="_blank" style="background:rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.2);border-radius:30px;padding:4px 10px;text-decoration:none;color:#111;font-size:11px;font-family:'Cinzel',serif;font-weight:600;">Animation Reel</a>
          <a href="https://youtu.be/UdS8FCdfNa0" target="_blank" style="background:rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.2);border-radius:30px;padding:4px 10px;text-decoration:none;color:#111;font-size:11px;font-family:'Cinzel',serif;font-weight:600;">Demo Reel</a>
          <a href="tel:5852903187" style="background:rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.2);border-radius:30px;padding:4px 10px;text-decoration:none;color:#111;font-size:11px;font-family:'Cinzel',serif;font-weight:600;">(585) 290-3187</a>
        </div>
      </div>
    </div>`
  },
}

// ── PANEL ─────────────────────────────────────────────────────────────────────
function openPanel(section) {
  if (!sections[section]) return
  hideSpeechBubble()
  const panel = document.getElementById('panel')
  panel.style.backgroundImage = `url('${encodeURI(getSectionBg(section))}')`
  document.getElementById('panel-content').innerHTML =
    `<div class="panel-body panel-body--no-title">${sections[section].content}</div>`
  panel.classList.remove('hidden')
  panel.style.display = 'block'
  showBlur()
  if (section === 'portfolio') initCarousel('carousel-3d',    projects3D, (i) => open3DProject(projects3D[i].id))
  if (section === 'films')     initCarousel('carousel-films', films,      (i) => openFilmDetail(i))
}

function closePanel() {
  const panel = document.getElementById('panel')
  panel.classList.add('hidden')
  panel.style.display = 'none'
  hideBlur()
  document.querySelectorAll('.nav-dot[data-section],.mobile-nav-item[data-section]').forEach(b => b.classList.remove('active'))
}

document.getElementById('panel-close')?.addEventListener('click', closePanel)

function setNav(key) {
  document.querySelectorAll('.nav-dot[data-section],.mobile-nav-item[data-section]').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-section') === key)
  )
}
document.querySelectorAll('.nav-dot[data-section]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const k = btn.getAttribute('data-section')
    setNav(k)
    openPanel(k)
  })
})
document.querySelectorAll('.mobile-nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.getAttribute('data-section')
    closeMobileMenu()
    setNav(k)
    openPanel(k)
  })
})

// ── 3D PROJECT OVERLAY ────────────────────────────────────────────────────────
let curProj = 0

function open3DProject(id) {
  curProj = projects3D.findIndex(p => p.id === id)
  renderProj()
  const overlay = document.getElementById('project-overlay')
  overlay.style.backgroundImage = "url('/images/Portfolio BG.png')"
  overlay.classList.remove('hidden')
  overlay.style.display = 'flex'
  const panel = document.getElementById('panel')
  panel.classList.add('hidden')
  panel.style.display = 'none'
  showBlur()
}

function renderProj() {
  const p = projects3D[curProj]
  document.getElementById('project-img').src              = p.image
  document.getElementById('project-img').alt              = p.title
  document.getElementById('project-title').textContent    = p.title
  document.getElementById('project-subtitle').textContent = p.subtitle
  document.getElementById('project-desc').innerHTML =
    p.description.split('\n\n').map(t => `<p>${t}</p>`).join('')
}

document.getElementById('project-close')?.addEventListener('click', () => {
  const overlay = document.getElementById('project-overlay')
  overlay.classList.add('hidden')
  overlay.style.display = 'none'
  openPanel('portfolio')
})
document.getElementById('project-prev')?.addEventListener('click', () => {
  curProj = (curProj - 1 + projects3D.length) % projects3D.length
  renderProj()
})
document.getElementById('project-next')?.addEventListener('click', () => {
  curProj = (curProj + 1) % projects3D.length
  renderProj()
})

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
function sendContact() {
  const n = document.getElementById('contact-name').value.trim()
  const e = document.getElementById('contact-email').value.trim()
  const m = document.getElementById('contact-message').value.trim()
  if (!n || !e || !m) { alert('Please fill in all fields!'); return }
  window.location.href = `mailto:shivanipednekar87@gmail.com?subject=${encodeURIComponent(`Portfolio Contact from ${n}`)}&body=${encodeURIComponent(`${m}\n\nFrom: ${e}`)}`
}

// ── SPLINE CLICK + PROXIMITY EVENTS ──────────────────────────────────────────
// Exact Spline object names from the scene
const SPLINE_OBJECTS = [
  { name: 'Shortfilm',  section: 'films'     },
  { name: 'About Me',   section: 'about'     },
  { name: 'Skills',     section: 'skills'    },
  { name: 'Contact',    section: 'contact'   },
  { name: 'Portfolio',  section: 'portfolio' },
  { name: 'Resume',     section: 'resume'    },
]
const PROXIMITY_THRESHOLD = 350 // units — adjust if needed
let   proximityLoop        = null
let   lastNearSection      = null

function attachMainEvents() {
  // ── Click to open panel ────────────────────────────────────────────────────
  mainApp.addEventListener('mouseDown', (e) => {
    const name = e?.target?.name?.toLowerCase() || ''
    console.log('[Spline click]', name)
    if (name.includes('about'))                              openPanel('about')
    else if (name.includes('skill'))                         openPanel('skills')
    else if (name.includes('short') || name.includes('film')) openPanel('films')
    else if (name.includes('contact'))                       openPanel('contact')
    else if (name.includes('portfolio'))                     openPanel('portfolio')
    else if (name.includes('resume'))                        openPanel('resume')
  })

  // ── Position polling — check pig vs each section object every 200ms ────────
  function checkProximity() {
    try {
      const pig = mainApp.findObjectByName('pig')
      if (!pig) return

      const px = pig.position.x
      const py = pig.position.y
      const pz = pig.position.z

      let nearest     = null
      let nearestDist = Infinity

      for (const obj of SPLINE_OBJECTS) {
        const target = mainApp.findObjectByName(obj.name)
        if (!target) continue
        const dx   = px - target.position.x
        const dy   = py - target.position.y
        const dz   = pz - target.position.z
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < PROXIMITY_THRESHOLD && dist < nearestDist) {
          nearestDist = dist
          nearest     = obj
        }
      }

      if (nearest && nearest.section !== lastNearSection) {
        lastNearSection = nearest.section
        const entry = proximityMap[nearest.section]
        const msg   = entry ? entry.message : ''
        showSpeechBubble(msg, nearest.section)
      } else if (!nearest && lastNearSection) {
        lastNearSection = null
        hideSpeechBubble()
      }
    } catch(err) {
      // silently ignore if objects not found yet
    }
  }

  proximityLoop = setInterval(checkProximity, 200)
}

// ── GLOBAL EXPORTS ────────────────────────────────────────────────────────────
window.open3DProject  = open3DProject
window.openFilmDetail = openFilmDetail
window.sendContact    = sendContact