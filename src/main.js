import { Application } from '@splinetool/runtime'

// ZOOM TRANSITION
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

// BLUR OVERLAY
function showBlur() {
  document.getElementById('scene-blur-overlay').classList.add('active')
}
function hideBlur() {
  document.getElementById('scene-blur-overlay').classList.remove('active')
}

// DOM
const heroScreen = document.getElementById('hero-screen')
const mainScene = document.getElementById('main-scene')

const exploreBtn = document.getElementById('explore-btn')
const heroLoadingWrap = document.getElementById('hero-loading-wrap')
const heroLoadingBar = document.getElementById('hero-loading-bar')
const heroLoadingPercent = document.getElementById('hero-loading-percent')

const heroLoadingOverlay = document.getElementById('hero-loading-overlay')
const overlayLoadingBar = document.getElementById('overlay-loading-bar')
const overlayLoadingPercent = document.getElementById('overlay-loading-percent')

const instructionModal = document.getElementById('instruction-modal')

let hasStartedEntering = false
let mainApp = null

function showInstructionModal() {
  instructionModal.classList.add('visible')
  instructionModal.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')
}

function hideInstructionModal() {
  instructionModal.classList.remove('visible')
  instructionModal.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
}

// HERO SPLINE
const heroCanvas = document.getElementById('spline-hero')
const heroApp = new Application(heroCanvas)
const isMobile = window.innerWidth < 900

let heroProgress = 0
const heroLoadTimer = setInterval(() => {
  heroProgress = Math.min(heroProgress + Math.random() * 8, 90)
  if (overlayLoadingBar) overlayLoadingBar.style.width = heroProgress + '%'
  if (overlayLoadingPercent) overlayLoadingPercent.textContent = Math.floor(heroProgress) + '%'
}, 200)

heroApp
  .load('https://prod.spline.design/vbshuvh8WR0UjWQw/scene.splinecode')
  .then(() => {
    clearInterval(heroLoadTimer)
    if (overlayLoadingBar) overlayLoadingBar.style.width = '100%'
    if (overlayLoadingPercent) overlayLoadingPercent.textContent = '100%'

    if (isMobile) {
      try { heroApp.setVariable('isMobile', true) } catch (e) {}
      try { heroApp.setVariable('mobile', true) } catch (e) {}
      try { heroApp.emitEvent('keydown', 'Mobile') } catch (e) {}
      try {
        const cam = heroApp.findObjectByName('Mobile')
        if (cam) heroApp.setActiveCamera(cam)
      } catch (e) {}
    }

    setTimeout(() => {
      if (heroLoadingOverlay) {
        heroLoadingOverlay.style.opacity = '0'
        setTimeout(() => {
          heroLoadingOverlay.style.display = 'none'
          showInstructionModal()
        }, 900)
      }
    }, 400)
  })
  .catch((err) => {
    clearInterval(heroLoadTimer)
    console.error('Failed to load hero scene:', err)
  })

// ENTER FOREST
function enterForest() {
  if (hasStartedEntering) return
  hasStartedEntering = true

  hideInstructionModal()

  if (exploreBtn) {
    exploreBtn.disabled = true
    exploreBtn.style.display = 'none'
  }

  if (heroLoadingWrap) heroLoadingWrap.style.display = 'flex'

  let progress = 0
  const timer = setInterval(() => {
    progress = Math.min(progress + Math.random() * 8, 90)
    if (heroLoadingBar) heroLoadingBar.style.width = progress + '%'
    if (heroLoadingPercent) heroLoadingPercent.textContent = Math.floor(progress) + '%'
  }, 200)

  const mainCanvas = document.getElementById('spline-forest')
  mainApp = new Application(mainCanvas)

  mainApp
    .load('https://prod.spline.design/ECO255J46CJmatfK/scene.splinecode?v=' + Date.now())
    .then(() => {
      clearInterval(timer)
      if (heroLoadingBar) heroLoadingBar.style.width = '100%'
      if (heroLoadingPercent) heroLoadingPercent.textContent = '100%'

      mainApp.addEventListener('mouseUp', (e) => {
        const name = e?.target?.name?.toLowerCase()
        if (!name) return
        if (name.includes('about')) openPanel('about')
        else if (name.includes('contact')) openPanel('contact')
        else if (name.includes('resume')) openPanel('resume')
        else if (name.includes('portfolio')) openPanel('portfolio')
        else if (name.includes('short film') || name.includes('film')) openPanel('films')
        else if (name.includes('tools')) openPanel('tools')
      })

      setTimeout(() => {
        zoomWipeTransition(heroScreen, mainScene)
      }, 400)
    })
    .catch((err) => {
      clearInterval(timer)
      console.error('Failed to load main forest scene:', err)
      hasStartedEntering = false
      if (heroLoadingWrap) heroLoadingWrap.style.display = 'none'
      if (heroLoadingBar) heroLoadingBar.style.width = '0%'
      if (heroLoadingPercent) heroLoadingPercent.textContent = '0%'
      if (exploreBtn) {
        exploreBtn.disabled = false
        exploreBtn.style.display = ''
      }
      showInstructionModal()
    })
}

exploreBtn?.addEventListener('click', enterForest)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && instructionModal.classList.contains('visible')) {
    e.preventDefault()
    enterForest()
  }
})

// RESET
function resetExploreBtn() {
  hasStartedEntering = false
  if (exploreBtn) {
    exploreBtn.disabled = false
    exploreBtn.style.display = ''
  }
  if (heroLoadingWrap) heroLoadingWrap.style.display = 'none'
  if (heroLoadingBar) heroLoadingBar.style.width = '0%'
  if (heroLoadingPercent) heroLoadingPercent.textContent = '0%'
}

// HOME
function goHome() {
  closePanel()
  hideBlur()
  resetExploreBtn()
  heroScreen.classList.remove('hidden')
  zoomWipeTransition(mainScene, heroScreen, () => {
    showInstructionModal()
  })
}

document.getElementById('nav-home-btn')?.addEventListener('click', goHome)
document.getElementById('mobile-home-btn')?.addEventListener('click', () => {
  closeMobileMenu()
  goHome()
})

// MOBILE MENU
const hamburgerBtn = document.getElementById('hamburger-btn')
const mobileDropdown = document.getElementById('mobile-dropdown')
const mobileNav = document.getElementById('mobile-nav')

hamburgerBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  if (mobileDropdown.classList.contains('open')) closeMobileMenu()
  else openMobileMenu()
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

// DATA
const projects3D = [
  {
    id: 'park',
    title: 'Stylized Park Environment',
    subtitle: '3D Environment',
    image: '/images/park-environment.png',
    description: `This stylized park environment was created as a personal project to explore environment setup and visual storytelling.

I focused on overall composition, asset placement, and scale to create a believable yet stylized park setting.

This project helped me better understand environment assembly and scene composition.`,
  },
  {
    id: 'fox',
    title: 'Fox Creature',
    subtitle: 'Stylized 3D Modeling',
    image: '/images/fox-creature.png',
    description: `This model started as a just-for-fun experiment — a fox with bat wings, demon horns, and a bit of fire.

The process was playful and intuitive, letting the design grow naturally as I modeled.

This piece reminded me how much I enjoy building characters that feel alive and full of charm.`,
  },
  {
    id: 'tree',
    title: 'Stylized Tree',
    subtitle: '3D Environment Prop',
    image: '/images/stylized-tree.png',
    description: `This stylized tree was modeled and textured as a personal study in environment prop creation.

I focused on creating a strong silhouette and simplified forms.

This project helped me better understand stylized environment modeling and organic form development.`,
  },
  {
    id: 'boot',
    title: 'Boot Study',
    subtitle: '3D Modeling — Maya',
    image: '/images/boot-study.jpg',
    description: `This boot model was created as part of an assignment, modeled entirely in Autodesk Maya.

Focusing on clean geometry helped me better understand how to build shapes efficiently.

This project reinforced my comfort with hard-surface and prop modeling in Maya.`,
  },
  {
    id: 'bench',
    title: 'Stylized Park Bench',
    subtitle: '3D Prop Study',
    image: '/images/park-bench.png',
    description: `This park bench was modeled in ZBrush and textured in Adobe Substance Painter.

The project allowed me to explore wood and metal materials and subtle texture variation.

Through this I gained a better understanding of prop modeling workflow.`,
  },
  {
    id: 'hand',
    title: 'Hand Study',
    subtitle: '3D Modeling — Maya + ZBrush',
    image: '/images/hand-study.png',
    description: `This hand model was created during my MFA in Film & Animation at RIT.

I built a base mesh in Maya then moved into ZBrush to refine the form and surface detail.

This project strengthened my understanding of human anatomy and organic 3D modeling.`,
  },
]

const films = [
  {
    title: 'Puddle Up!!',
    image: '/images/puddle-up.png',
    link: 'https://sp9369.wixsite.com/shivanivpednekar/about',
  },
  {
    title: 'Hugs in Hues',
    image: '/images/hugs-in-hues.png',
    link: 'https://sp9369.wixsite.com/shivanivpednekar/copy-of-warli-whispers',
  },
  {
    title: 'Warli Whispers',
    image: '/images/warli-whispers.png',
    link: 'https://sp9369.wixsite.com/shivanivpednekar/copy-of-puddle-up',
  },
  {
    title: 'ScienceLore',
    image: '/images/Science lore.jpg',
    link: 'https://www.rit.edu/news/rit-graduate-student-launches-pilot-episode-sciencelore-educational-series',
  },
]

function makeCarousel(items, id) {
  return `
    <div class="carousel-container" id="${id}">
      <div class="carousel-track" id="track-${id}">
        ${items.map((item, i) => `
          <div class="carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${item.image}" alt="${item.title}" />
            <div class="carousel-slide-info">
              <div class="card-title">${item.title}</div>
              <div class="card-desc">${item.subtitle || 'Short film'}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="carousel-nav">
        <button class="carousel-btn" id="prev-${id}" type="button">←</button>
        <div class="carousel-dots" id="dots-${id}">
          ${items.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
        </div>
        <button class="carousel-btn" id="next-${id}" type="button">→</button>
      </div>
    </div>
  `
}

function initCarousel(id, items, onClickFn) {
  let cur = 0
  const track = document.getElementById(`track-${id}`)
  if (!track) return

  const slides = track.querySelectorAll('.carousel-slide')
  const dots = document.querySelectorAll(`#dots-${id} .carousel-dot`)

  function goTo(i) {
    slides[cur].classList.remove('active')
    dots[cur].classList.remove('active')
    cur = (i + items.length) % items.length
    slides[cur].classList.add('active')
    dots[cur].classList.add('active')
    const sw = slides[0].offsetWidth + 20
    track.style.transform = `translateX(-${Math.max(0, cur * sw - track.parentElement.offsetWidth / 2 + sw / 2)}px)`
  }

  document.getElementById(`prev-${id}`)?.addEventListener('click', () => goTo(cur - 1))
  document.getElementById(`next-${id}`)?.addEventListener('click', () => goTo(cur + 1))

  slides.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (i === cur) onClickFn(i)
      else goTo(i)
    })
  })

  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)))
}

// SECTIONS
const sections = {
  about: {
    title: 'About Me',
    content: `
      <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:40px;align-items:start;" class="about-grid">
        <img src="/images/Shivani.JPG" style="width:100%;border-radius:12px;object-fit:cover;" />
        <div>
          <p style="font-size:11px;letter-spacing:0.3em;color:rgba(0,0,0,0.4);margin-bottom:20px;font-family:'Cinzel',serif;">A BIT ABOUT ME</p>
          <p style="margin-bottom:18px;line-height:2;color:#111;font-size:16px;font-family:'Cinzel',serif;">Hi! I'm Shivani, a 3D animator and filmmaker with an MFA in Film & Animation from RIT.</p>
          <p style="margin-bottom:18px;line-height:2;color:#111;font-size:16px;font-family:'Cinzel',serif;">I work across the 3D pipeline — modeling, rigging, animation, and environments.</p>
          <p style="line-height:2;color:#111;font-size:16px;font-family:'Cinzel',serif;">I've collaborated on projects like ScienceLore and created personal films end to end.</p>
        </div>
      </div>
    `,
  },
  tools: {
    title: 'Tools & Skills',
    content: `
      <div style="display:flex;align-items:center;justify-content:center;padding-top:40px;min-height:400px;">
        <img src="/images/tools.png" style="max-width:90%;max-height:50vh;object-fit:contain;border-radius:12px;" />
      </div>
    `,
  },
  portfolio: {
    title: 'Portfolio',
    content: `<div style="padding-top:30px;">${makeCarousel(projects3D, 'carousel-3d')}</div>`,
  },
  films: {
    title: 'Short Films',
    content: `<div style="padding-top:30px;">${makeCarousel(films, 'carousel-films')}</div>`,
  },
  resume: {
    title: 'Resume',
    content: `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:24px;padding:20px;">
        <p style="color:#111;font-size:16px;font-family:'Cinzel',serif;text-align:center;">Want to see my full experience?</p>
        <a class="card" href="https://sp9369.wixsite.com/shivanivpednekar/work-experiance" target="_blank" style="text-align:center;min-width:260px;">
          <div class="card-title" style="color:#111;font-size:15px;font-family:'Cinzel',serif;">View My Resume</div>
          <div class="card-desc" style="font-family:'Cinzel',serif;">Education &amp; experience</div>
        </a>
      </div>
    `,
  },
  contact: {
    title: 'Contact',
    content: `
      <div style="padding:0 60px 0 80px;">
        <p style="color:#111;font-size:14px;line-height:1.9;margin-bottom:24px;font-family:'Cinzel',serif;">
          I'm seeking opportunities in animation, film, and creative production.
        </p>
        <div style="display:flex;flex-direction:column;gap:18px;margin-bottom:28px;">
          <input
            type="text"
            id="contact-name"
            placeholder="Your Name"
            style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.3);padding:10px 0;color:#111;font-family:'Cinzel',serif;font-size:20px;outline:none;width:100%;"
          />
          <input
            type="email"
            id="contact-email"
            placeholder="Your Email"
            style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.3);padding:10px 0;color:#111;font-family:'Cinzel',serif;font-size:20px;outline:none;width:100%;"
          />
          <textarea
            id="contact-message"
            placeholder="Your Message"
            rows="3"
            style="background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,0.3);padding:10px 0;color:#111;font-family:'Cinzel',serif;font-size:20px;outline:none;width:100%;resize:none;"
          ></textarea>
          <button
            onclick="sendContact()"
            style="background:transparent;border:1px solid rgba(0, 0, 0, 0.57);color:#111;padding:12px 36px;border-radius:30px;font-family:'Cinzel',serif;font-size:15px;letter-spacing:0.2em;cursor:pointer;align-self:center;"
          >
            SEND MESSAGE
          </button>
        </div>
        <div style="border-top:1px solid rgba(0,0,0,0.12);padding-top:20px;">
          <p style="font-size:10px;letter-spacing:0.3em;color:rgba(0,0,0,0.4);margin-bottom:14px;font-family:'Cinzel',serif;">FIND ME ON</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="mailto:shivanipednekar87@gmail.com" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.18);border-radius:30px;padding:8px 16px;text-decoration:none;color:#111;font-size:12px;font-family:'Cinzel',serif;">Email</a>
            <a href="https://www.linkedin.com/in/shivani-vinayak-pednekar/" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.18);border-radius:30px;padding:8px 16px;text-decoration:none;color:#111;font-size:12px;font-family:'Cinzel',serif;">LinkedIn</a>
            <a href="https://youtu.be/UZv9RJm6PGs" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.18);border-radius:30px;padding:8px 16px;text-decoration:none;color:#111;font-size:12px;font-family:'Cinzel',serif;">Animation Reel</a>
            <a href="https://youtu.be/UdS8FCdfNa0" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.18);border-radius:30px;padding:8px 16px;text-decoration:none;color:#111;font-size:12px;font-family:'Cinzel',serif;">Demo Reel</a>
            <a href="tel:5852903187" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.18);border-radius:30px;padding:8px 16px;text-decoration:none;color:#111;font-size:12px;font-family:'Cinzel',serif;">(585) 290-3187</a>
          </div>
        </div>
      </div>
    `,
  },
}

// PANEL
function openPanel(section) {
  if (!sections[section]) return

  document.getElementById('panel-content').innerHTML = `
    <h2>${sections[section].title}</h2>
    <div class="panel-divider"></div>
    <div class="panel-body">${sections[section].content}</div>
  `

  const panel = document.getElementById('panel')
  panel.scrollTop = 0
  panel.classList.remove('hidden')
  showBlur()

  if (section === 'portfolio') {
    initCarousel('carousel-3d', projects3D, (i) => open3DProject(projects3D[i].id))
  }
  if (section === 'films') {
    initCarousel('carousel-films', films, (i) => openFilmstrip(i))
  }
}

function closePanel() {
  document.getElementById('panel').classList.add('hidden')
  hideBlur()
  document.querySelectorAll('.nav-dot[data-section], .mobile-nav-item[data-section]').forEach((b) => {
    b.classList.remove('active')
  })
}

document.getElementById('panel-close')?.addEventListener('click', closePanel)

// NAV
function setNav(key) {
  document
    .querySelectorAll('.nav-dot[data-section], .mobile-nav-item[data-section]')
    .forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-section') === key)
    })
}

document.querySelectorAll('.nav-dot[data-section]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const key = btn.getAttribute('data-section')
    setNav(key)
    openPanel(key)
  })
})

document.querySelectorAll('.mobile-nav-item[data-section]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-section')
    closeMobileMenu()
    setNav(key)
    openPanel(key)
  })
})

// 3D PROJECT OVERLAY
let curProj = 0

function open3DProject(id) {
  curProj = projects3D.findIndex((p) => p.id === id)
  renderProj()
  document.getElementById('project-overlay').classList.remove('hidden')
  document.getElementById('panel').classList.add('hidden')
}

function renderProj() {
  const p = projects3D[curProj]
  document.getElementById('project-img').src = p.image
  document.getElementById('project-img').alt = p.title
  document.getElementById('project-title').textContent = p.title
  document.getElementById('project-subtitle').textContent = p.subtitle
  document.getElementById('project-desc').innerHTML = p.description
    .split('\n\n')
    .map((t) => `<p>${t}</p>`)
    .join('')
}

document.getElementById('project-close')?.addEventListener('click', () => {
  document.getElementById('project-overlay').classList.add('hidden')
  hideBlur()
})

document.getElementById('project-prev')?.addEventListener('click', () => {
  curProj = (curProj - 1 + projects3D.length) % projects3D.length
  renderProj()
})

document.getElementById('project-next')?.addEventListener('click', () => {
  curProj = (curProj + 1) % projects3D.length
  renderProj()
})

// FILMSTRIP OVERLAY
let curFilm = 0

function openFilmstrip(i = 0) {
  curFilm = i
  updateFilm()
  document.getElementById('filmstrip-overlay').classList.remove('hidden')
  document.getElementById('panel').classList.add('hidden')
}

function updateFilm() {
  const f = films[curFilm]
  document.getElementById('film-img').src = f.image
  document.getElementById('film-img').alt = f.title
  document.getElementById('film-title').textContent = f.title
  document.getElementById('film-counter').textContent = `${curFilm + 1} / ${films.length}`
}

document.getElementById('film-prev')?.addEventListener('click', () => {
  curFilm = (curFilm - 1 + films.length) % films.length
  updateFilm()
})

document.getElementById('film-next')?.addEventListener('click', () => {
  curFilm = (curFilm + 1) % films.length
  updateFilm()
})

document.getElementById('filmstrip-close')?.addEventListener('click', () => {
  document.getElementById('filmstrip-overlay').classList.add('hidden')
  hideBlur()
})

document.getElementById('film-visit')?.addEventListener('click', () => {
  window.open(films[curFilm].link, '_blank')
})

// CONTACT
function sendContact() {
  const n = document.getElementById('contact-name').value.trim()
  const e = document.getElementById('contact-email').value.trim()
  const m = document.getElementById('contact-message').value.trim()

  if (!n || !e || !m) {
    alert('Please fill in all fields!')
    return
  }

  const subject = encodeURIComponent(`Portfolio Contact from ${n}`)
  const body = encodeURIComponent(`${m}\n\nFrom: ${e}`)
  window.location.href = `mailto:shivanipednekar87@gmail.com?subject=${subject}&body=${body}`
}

window.open3DProject = open3DProject
window.openFilmstrip = openFilmstrip
window.sendContact = sendContact