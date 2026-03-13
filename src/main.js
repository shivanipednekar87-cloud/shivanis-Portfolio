import { Application } from '@splinetool/runtime'

// ── ZOOM-WIPE TRANSITION ──
function zoomWipeTransition(outEl, inEl, onDone) {
  inEl.style.display = ''
  inEl.classList.remove('hidden')
  inEl.style.opacity = '1'
  inEl.style.transform = 'scale(1)'
  inEl.style.zIndex = '1'

  outEl.style.position = 'fixed'
  outEl.style.inset = '0'
  outEl.style.zIndex = '10'
  outEl.style.transformOrigin = 'center center'
  outEl.style.transition = 'transform 1.1s cubic-bezier(0.4,0,0.2,1), opacity 0.9s ease'
  outEl.style.transform = 'scale(1)'
  outEl.style.opacity = '1'

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      outEl.style.transform = 'scale(1.18)'
      outEl.style.opacity = '0'
    })
  })

  setTimeout(() => {
    outEl.style.display = 'none'
    outEl.style.transform = 'scale(1)'
    outEl.style.opacity = '1'
    outEl.style.transition = ''
    outEl.style.zIndex = ''
    inEl.style.zIndex = ''
    onDone?.()
  }, 1100)
}

// ── FIREFLIES ──
function initFireflies() {
  const fc = document.getElementById('firefly-canvas')
  if (!fc) return
  const ctx = fc.getContext('2d')
  function resize() { fc.width = window.innerWidth; fc.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)

  const COUNT = 55
  const flies = Array.from({ length: COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.85,
    r: Math.random() * 1.8 + 0.6,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.3 - 0.1,
    phase: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.025 + 0.01,
    hue: Math.random() * 30 + 80,
    sat: Math.random() * 20 + 70,
  }))

  let running = true
  function draw() {
    if (!running) return
    ctx.clearRect(0, 0, fc.width, fc.height)
    flies.forEach(f => {
      f.phase += f.pulseSpeed
      f.x += f.vx + Math.sin(f.phase * 0.7) * 0.3
      f.y += f.vy + Math.cos(f.phase * 0.5) * 0.2
      if (f.x < -10) f.x = fc.width + 10
      if (f.x > fc.width + 10) f.x = -10
      if (f.y < -10) f.y = fc.height * 0.85
      if (f.y > fc.height * 0.85) f.y = -10
      const alpha = Math.sin(f.phase) * 0.5 + 0.5
      const glow = f.r * (alpha * 8 + 4)
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glow)
      grad.addColorStop(0, `hsla(${f.hue}, ${f.sat}%, 80%, ${alpha * 0.55})`)
      grad.addColorStop(0.4, `hsla(${f.hue}, ${f.sat}%, 70%, ${alpha * 0.15})`)
      grad.addColorStop(1, `hsla(${f.hue}, ${f.sat}%, 60%, 0)`)
      ctx.beginPath(); ctx.arc(f.x, f.y, glow, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * alpha, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${f.hue}, 90%, 92%, ${alpha * 0.9})`; ctx.fill()
    })
    requestAnimationFrame(draw)
  }
  draw()
  return () => { running = false }
}

const stopFireflies = initFireflies()

// ── LOADING ──
const bar = document.getElementById('loading-bar')
const percent = document.getElementById('loading-percent')
let prog = 0
const loadTimer = setInterval(() => {
  prog = Math.min(prog + Math.random() * 12, 92)
  bar.style.width = prog + '%'
  if (percent) percent.textContent = Math.floor(prog) + '%'
}, 150)

// Safety fallback — if loading takes too long, force complete after 15s
const loadFallback = setTimeout(() => {
  clearInterval(loadTimer)
  bar.style.width = '100%'
  if (percent) percent.textContent = '100%'
  const ls = document.getElementById('loading-screen')
  const hero = document.getElementById('hero-screen')
  hero.classList.remove('hidden')
  zoomWipeTransition(ls, hero, () => { if (stopFireflies) stopFireflies() })
}, 15000)

const heroCanvas = document.getElementById('spline-hero')
const heroApp = new Application(heroCanvas)
const isMobile = window.innerWidth < 900

heroApp.load('https://prod.spline.design/vbshuvh8WR0UjWQw/scene.splinecode').then(() => {
  clearTimeout(loadFallback)

  if (isMobile) {
    // Try all known Spline camera switch approaches
    try { heroApp.setVariable('isMobile', true) } catch(e) {}
    try { heroApp.setVariable('mobile', true) } catch(e) {}
    try { heroApp.emitEvent('keydown', 'Mobile') } catch(e) {}
    try {
      const cam = heroApp.findObjectByName('Mobile')
      if (cam) {
        heroApp.setActiveCamera(cam)
        console.log('Camera switched to Mobile:', cam)
      } else {
        console.warn('Mobile camera not found — check name in Spline editor')
      }
    } catch(e) {
      console.error('Camera switch error:', e)
    }
  }
  // ... rest of your load callback
  clearInterval(loadTimer)
  bar.style.width = '100%'
  if (percent) percent.textContent = '100%'
  setTimeout(() => {
    const ls = document.getElementById('loading-screen')
    const hero = document.getElementById('hero-screen')
    hero.classList.remove('hidden')
    zoomWipeTransition(ls, hero, () => { if (stopFireflies) stopFireflies() })
  }, 600)
})

// ── ENTER FOREST ──
function enterForest() {
  const btn = document.getElementById('explore-btn')
  btn.style.display = 'none'

  const heroWrap = document.getElementById('hero-loading-wrap')
  const heroBar  = document.getElementById('hero-loading-bar')
  const heroPct  = document.getElementById('hero-loading-percent')
  heroWrap.style.display = 'flex'

  let p = 0
  const t = setInterval(() => {
    p = Math.min(p + Math.random() * 8, 90)
    heroBar.style.width = p + '%'
    heroPct.textContent = Math.floor(p) + '%'
  }, 200)

  const mainCanvas = document.getElementById('spline-forest')
  const mainApp = new Application(mainCanvas)
  mainApp.load('https://prod.spline.design/ECO255J46CJmatfK/scene.splinecode').then(() => {
    clearInterval(t)
    heroBar.style.width = '100%'
    heroPct.textContent = '100%'
    setTimeout(() => {
      zoomWipeTransition(
        document.getElementById('hero-screen'),
        document.getElementById('main-scene'),
        () => initScrollCamera(mainApp)
      )
    }, 400)
  })
}
window.enterForest = enterForest

// ── SCROLL CAMERA SYSTEM ──
const CHECKPOINTS = [
  { slide: 0.01,  section: null },
  { slide: 0.19,  section: 'about' },
  { slide: 0.25,  section: 'resume' },
  { slide: 0.38,  section: 'films' },
  { slide: 0.57,  section: 'portfolio' },
  { slide: 0.73,  section: 'tools' },
  { slide: 0.78,  section: 'contact' },
]

const PAUSE_RADIUS = 0.025
const SCROLL_SPEED = 0.0005

function initScrollCamera(app) {
  let currentSlide = 0.01
  let targetSlide  = 0.01
  let isPaused     = false
  let lastSection  = null
  let rafId        = null

  // Hide scroll hint after first scroll
  const scrollHint = document.getElementById('scroll-hint')

  function setSlide(val) {
    try { app.setVariable('offset', val) } catch(e) {}
    try { app.setVariable('Offset', val) } catch(e) {}
    try { app.setVariable('slide', val)  } catch(e) {}
    try { app.setVariable('Slide', val)  } catch(e) {}

    // Also try finding the camera and setting directly
    try {
      const cam = app.findObjectByName('Path experiment')
      if (cam) {
        if (cam.slide !== undefined) cam.slide = val
        if (cam.offset !== undefined) cam.offset = val
      }
    } catch(e) {}
  }

  function checkCheckpoint(slide) {
    for (const cp of CHECKPOINTS) {
      if (!cp.section) continue
      if (Math.abs(cp.slide - slide) < PAUSE_RADIUS && cp.section !== lastSection) {
        return cp
      }
    }
    return null
  }

  function tick() {
    if (!isPaused) {
      const diff = targetSlide - currentSlide
      if (Math.abs(diff) > 0.0002) {
        currentSlide += diff * 0.06
        const clamped = Math.max(0, Math.min(1, currentSlide))
        setSlide(clamped)

        const cp = checkCheckpoint(clamped)
        if (cp) {
          isPaused     = true
          lastSection  = cp.section
          currentSlide = cp.slide
          targetSlide  = cp.slide
          setSlide(cp.slide)
          showSectionHint(cp.section)
        }
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  // ── SCROLL ──
  let scrollLocked = false
  window.addEventListener('wheel', (e) => {
    e.preventDefault()
    if (isPaused) return
    if (scrollHint) scrollHint.style.display = 'none'
    if (scrollLocked) return
    scrollLocked = true
    setTimeout(() => scrollLocked = false, 16)
    targetSlide = Math.max(0, Math.min(1, targetSlide + e.deltaY * SCROLL_SPEED))
  }, { passive: false })

  // ── TOUCH ──
  let touchY = 0
  window.addEventListener('touchstart', (e) => {
    touchY = e.touches[0].clientY
  }, { passive: true })

  window.addEventListener('touchmove', (e) => {
    if (isPaused) return
    if (scrollHint) scrollHint.style.display = 'none'
    const dy = touchY - e.touches[0].clientY
    touchY = e.touches[0].clientY
    targetSlide = Math.max(0, Math.min(1, targetSlide + dy * SCROLL_SPEED * 3))
  }, { passive: true })

  // ── RESUME ──
  window.resumeScroll = function() {
    isPaused = false
    hideSectionHint()
    closePanel()
    // Nudge target forward slightly so it doesn't re-trigger same checkpoint
    targetSlide = Math.min(1, currentSlide + 0.04)
  }
}

// ── RESET EXPLORE BUTTON ──
function resetExploreBtn() {
  const btn = document.getElementById('explore-btn')
  btn.innerHTML = '<span>Explore the Forest</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
  btn.disabled = false
  btn.style.display = ''
  const heroWrap = document.getElementById('hero-loading-wrap')
  heroWrap.style.display = 'none'
  document.getElementById('hero-loading-bar').style.width = '0%'
  document.getElementById('hero-loading-percent').textContent = '0%'
}

// ── HOME (desktop) ──
document.getElementById('nav-home-btn').addEventListener('click', () => {
  closePanel()
  resetExploreBtn()
  zoomWipeTransition(document.getElementById('main-scene'), document.getElementById('hero-screen'))
})

// ── HOME (mobile) ──
document.getElementById('mobile-home-btn').addEventListener('click', () => {
  closeMobileMenu()
  closePanel()
  resetExploreBtn()
  zoomWipeTransition(document.getElementById('main-scene'), document.getElementById('hero-screen'))
})

// ── HAMBURGER ──
const hamburgerBtn  = document.getElementById('hamburger-btn')
const mobileDropdown = document.getElementById('mobile-dropdown')

hamburgerBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  mobileDropdown.classList.contains('open') ? closeMobileMenu() : openMobileMenu()
})

function openMobileMenu() {
  mobileDropdown.classList.add('open')
  hamburgerBtn.classList.add('open')
}
function closeMobileMenu() {
  mobileDropdown.classList.remove('open')
  hamburgerBtn.classList.remove('open')
}

// Close when tapping outside
document.addEventListener('click', (e) => {
  if (!document.getElementById('mobile-nav').contains(e.target)) closeMobileMenu()
})

// ── MOBILE NAV ITEMS ──
document.querySelectorAll('.mobile-nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-section')
    closeMobileMenu()
    setNav(key)
    openPanel(key)
  })
})

// ── DESKTOP NAV ──
document.querySelectorAll('.nav-dot[data-section]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const key = btn.getAttribute('data-section')
    setNav(key)
    openPanel(key)
  })
})

function setNav(key) {
  document.querySelectorAll('.nav-dot[data-section], .mobile-nav-item[data-section]').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-section') === key)
  )
}

// ── PANEL DATA ──
const projects3D = [
  { id:'park',  title:'Stylized Park Environment', subtitle:'3D Environment',              image:'/images/park-environment.png', description:`This stylized park environment was created as a personal project to explore environment setup and visual storytelling.\n\nI focused on overall composition, asset placement, and scale to create a believable yet stylized park setting.\n\nThis project helped me better understand environment assembly and scene composition.` },
  { id:'fox',   title:'Fox Creature',              subtitle:'Stylized 3D Modeling',        image:'/images/fox-creature.png',     description:`This model started as a just-for-fun experiment — a fox with bat wings, demon horns, and a bit of fire.\n\nThe process was playful and intuitive, letting the design grow naturally as I modeled.\n\nThis piece reminded me how much I enjoy building characters that feel alive and full of charm.` },
  { id:'tree',  title:'Stylized Tree',             subtitle:'3D Environment Prop',         image:'/images/stylized-tree.png',    description:`This stylized tree was modeled and textured as a personal study in environment prop creation.\n\nI focused on creating a strong silhouette and simplified forms.\n\nThis project helped me better understand stylized environment modeling and organic form development.` },
  { id:'boot',  title:'Boot Study',                subtitle:'3D Modeling — Maya',          image:'/images/boot-study.jpg',       description:`This boot model was created as part of an assignment, modeled entirely in Autodesk Maya.\n\nFocusing on clean geometry helped me better understand how to build shapes efficiently.\n\nThis project reinforced my comfort with hard-surface and prop modeling in Maya.` },
  { id:'bench', title:'Stylized Park Bench',       subtitle:'3D Prop Study',               image:'/images/park-bench.png',       description:`This park bench was modeled in ZBrush and textured in Adobe Substance Painter.\n\nThe project allowed me to explore wood and metal materials and subtle texture variation.\n\nThrough this I gained a better understanding of prop modeling workflow.` },
  { id:'hand',  title:'Hand Study',                subtitle:'3D Modeling — Maya + ZBrush', image:'/images/hand-study.png',       description:`This hand model was created during my MFA in Film & Animation at RIT.\n\nI built a base mesh in Maya then moved into ZBrush to refine the form and surface detail.\n\nThis project strengthened my understanding of human anatomy and organic 3D modeling.` }
]

const films = [
  { title:'Puddle Up!!',     image:'/images/puddle-up.png',      link:'https://sp9369.wixsite.com/shivanivpednekar/about' },
  { title:'Hugs in Hues',   image:'/images/hugs-in-hues.png',   link:'https://sp9369.wixsite.com/shivanivpednekar/copy-of-warli-whispers' },
  { title:'Warli Whispers', image:'/images/warli-whispers.png', link:'https://sp9369.wixsite.com/shivanivpednekar/copy-of-puddle-up' },
  { title:'ScienceLore',    image:'/images/Science lore.jpg',   link:'https://www.rit.edu/news/rit-graduate-student-launches-pilot-episode-sciencelore-educational-series' }
]

function makeCarousel(items, id) {
  return `<div class="carousel-container" id="${id}">
    <div class="carousel-track" id="track-${id}">${items.map((item, i) => `
      <div class="carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
        <img src="${item.image}" alt="${item.title}"/>
        <div class="carousel-slide-info">
          <div class="card-title">${item.title}</div>
          <div class="card-desc">${item.subtitle || 'Short film'}</div>
        </div>
      </div>`).join('')}
    </div>
    <div class="carousel-nav">
      <button class="carousel-btn" id="prev-${id}">←</button>
      <div class="carousel-dots" id="dots-${id}">${items.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>
      <button class="carousel-btn" id="next-${id}">→</button>
    </div>
  </div>`
}

function initCarousel(id, items, onClickFn) {
  let cur = 0
  const track = document.getElementById(`track-${id}`)
  const slides = track.querySelectorAll('.carousel-slide')
  const dots = document.querySelectorAll(`#dots-${id} .carousel-dot`)
  function goTo(i) {
    slides[cur].classList.remove('active'); dots[cur].classList.remove('active')
    cur = (i + items.length) % items.length
    slides[cur].classList.add('active'); dots[cur].classList.add('active')
    const sw = slides[0].offsetWidth + 20
    track.style.transform = `translateX(-${Math.max(0, cur * sw - (track.parentElement.offsetWidth / 2) + (sw / 2))}px)`
  }
  document.getElementById(`prev-${id}`).addEventListener('click', () => goTo(cur - 1))
  document.getElementById(`next-${id}`).addEventListener('click', () => goTo(cur + 1))
  slides.forEach((s, i) => s.addEventListener('click', () => { if (i === cur) onClickFn(i); else goTo(i) }))
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)))
}

const sections = {
  about: { title:'About Me', content:`
    <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:40px;align-items:start;" class="about-grid">
      <img src="/images/Shivani.JPG" style="width:100%;border-radius:12px;object-fit:cover;"/>
      <div>
        <p style="font-size:11px;letter-spacing:0.25em;color:rgba(168,240,192,0.5);margin-bottom:16px;">A BIT ABOUT ME</p>
        <p style="margin-bottom:16px;line-height:1.9;">Hi! I'm Shivani, a 3D animator and filmmaker with an MFA in Film & Animation from RIT.</p>
        <p style="margin-bottom:16px;line-height:1.9;">I work across the 3D pipeline — modeling, rigging, animation, and environments.</p>
        <p style="line-height:1.9;">I've collaborated on projects like ScienceLore and created personal films end to end.</p>
      </div>
    </div>` },
  tools:     { title:'Tools & Skills', content:`<div style="text-align:center;"><img src="/images/tools.png" style="width:100%;border-radius:12px;"/></div>` },
  portfolio: { title:'Portfolio',      content: makeCarousel(projects3D, 'carousel-3d') },
  films:     { title:'Short Films',    content: makeCarousel(films, 'carousel-films') },
  resume:    { title:'Resume',         content:`<p>Want to see my full experience?</p><br/><a class="card" href="https://sp9369.wixsite.com/shivanivpednekar/work-experiance" target="_blank"><div class="card-title">View My Resume</div><div class="card-desc">Education & experience</div></a>` },
  contact:   { title:'Contact',        content:`
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.8;margin-bottom:36px;">I'm seeking opportunities in animation, film, and creative production.</p>
    <div style="display:flex;flex-direction:column;gap:24px;margin-bottom:40px;">
      <input type="text" id="contact-name" placeholder="Your Name" style="background:transparent;border:none;border-bottom:1px solid rgba(168,240,192,0.3);padding:12px 0;color:white;font-family:'Cormorant Garamond',serif;font-size:16px;outline:none;width:100%;"/>
      <input type="email" id="contact-email" placeholder="Your Email" style="background:transparent;border:none;border-bottom:1px solid rgba(168,240,192,0.3);padding:12px 0;color:white;font-family:'Cormorant Garamond',serif;font-size:16px;outline:none;width:100%;"/>
      <textarea id="contact-message" placeholder="Your Message" rows="4" style="background:transparent;border:none;border-bottom:1px solid rgba(168,240,192,0.3);padding:12px 0;color:white;font-family:'Cormorant Garamond',serif;font-size:16px;outline:none;width:100%;resize:none;"></textarea>
      <button onclick="sendContact()" style="background:transparent;border:1px solid rgba(168,240,192,0.4);color:white;padding:14px 40px;border-radius:30px;font-family:'Cormorant Garamond',serif;font-size:14px;letter-spacing:0.2em;cursor:pointer;">SEND MESSAGE</button>
    </div>
    <div style="border-top:1px solid rgba(168,240,192,0.1);padding-top:28px;">
      <p style="font-size:10px;letter-spacing:0.25em;color:rgba(168,240,192,0.4);margin-bottom:20px;">FIND ME ON</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <a href="mailto:shivanipednekar87@gmail.com" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(168,240,192,0.05);border:1px solid rgba(168,240,192,0.15);border-radius:30px;padding:10px 20px;text-decoration:none;color:white;font-size:13px;">Email</a>
        <a href="https://www.linkedin.com/in/shivani-vinayak-pednekar/" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(168,240,192,0.05);border:1px solid rgba(168,240,192,0.15);border-radius:30px;padding:10px 20px;text-decoration:none;color:white;font-size:13px;">LinkedIn</a>
        <a href="https://youtu.be/UZv9RJm6PGs" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(168,240,192,0.05);border:1px solid rgba(168,240,192,0.15);border-radius:30px;padding:10px 20px;text-decoration:none;color:white;font-size:13px;">Animation Reel</a>
        <a href="https://youtu.be/UdS8FCdfNa0" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(168,240,192,0.05);border:1px solid rgba(168,240,192,0.15);border-radius:30px;padding:10px 20px;text-decoration:none;color:white;font-size:13px;">Demo Reel</a>
        <a href="tel:5852903187" style="display:flex;align-items:center;gap:10px;background:rgba(168,240,192,0.05);border:1px solid rgba(168,240,192,0.15);border-radius:30px;padding:10px 20px;text-decoration:none;color:white;font-size:13px;">(585) 290-3187</a>
      </div>
    </div>` }
}

function openPanel(section) {
  if (!sections[section]) return
  document.getElementById('panel-content').innerHTML = `
    <h2>${sections[section].title}</h2>
    <div class="panel-divider"></div>
    <div class="panel-body">${sections[section].content}</div>`
  document.getElementById('panel').classList.remove('hidden')
  if (section === 'portfolio') initCarousel('carousel-3d', projects3D, i => open3DProject(projects3D[i].id))
  if (section === 'films')     initCarousel('carousel-films', films, i => openFilmstrip(i))
}

function closePanel() {
  document.getElementById('panel').classList.add('hidden')
  document.querySelectorAll('.nav-dot[data-section], .mobile-nav-item[data-section]').forEach(b => b.classList.remove('active'))
}

document.getElementById('panel-close').addEventListener('click', closePanel)

// ── 3D PROJECT OVERLAY ──
let curProj = 0
function open3DProject(id) {
  curProj = projects3D.findIndex(p => p.id === id)
  renderProj()
  document.getElementById('project-overlay').classList.remove('hidden')
  document.getElementById('panel').classList.add('hidden')
}
function renderProj() {
  const p = projects3D[curProj]
  document.getElementById('project-img').src = p.image
  document.getElementById('project-title').textContent = p.title
  document.getElementById('project-subtitle').textContent = p.subtitle
  document.getElementById('project-desc').innerHTML = p.description.split('\n\n').map(t => `<p>${t}</p>`).join('')
}
document.getElementById('project-close').addEventListener('click', () => document.getElementById('project-overlay').classList.add('hidden'))
document.getElementById('project-prev').addEventListener('click', () => { curProj = (curProj - 1 + projects3D.length) % projects3D.length; renderProj() })
document.getElementById('project-next').addEventListener('click', () => { curProj = (curProj + 1) % projects3D.length; renderProj() })

// ── FILMSTRIP OVERLAY ──
let curFilm = 0
function openFilmstrip(i = 0) {
  curFilm = i; updateFilm()
  document.getElementById('filmstrip-overlay').classList.remove('hidden')
  document.getElementById('panel').classList.add('hidden')
}
function updateFilm() {
  const f = films[curFilm]
  document.getElementById('film-img').src = f.image
  document.getElementById('film-title').textContent = f.title
  document.getElementById('film-counter').textContent = `${curFilm + 1} / ${films.length}`
}
document.getElementById('film-prev').addEventListener('click', () => { curFilm = (curFilm - 1 + films.length) % films.length; updateFilm() })
document.getElementById('film-next').addEventListener('click', () => { curFilm = (curFilm + 1) % films.length; updateFilm() })
document.getElementById('filmstrip-close').addEventListener('click', () => document.getElementById('filmstrip-overlay').classList.add('hidden'))
document.getElementById('film-visit').addEventListener('click', () => window.open(films[curFilm].link, '_blank'))

// ── CONTACT ──
function sendContact() {
  const n = document.getElementById('contact-name').value
  const e = document.getElementById('contact-email').value
  const m = document.getElementById('contact-message').value
  if (!n || !e || !m) { alert('Please fill in all fields!'); return }
  window.open(`mailto:shivanipednekar87@gmail.com?subject=Portfolio Contact from ${n}&body=${m}%0D%0A%0D%0AFrom: ${e}`)
}

window.open3DProject = open3DProject
window.openFilmstrip = openFilmstrip
window.sendContact = sendContact