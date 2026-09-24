// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links li a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }
});

// Highlight active section on scroll removed as we are using separate pages now

// Homepage modals
function setupModal(triggerId, modalId, closeSelector) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);

    if (!trigger || !modal) {
        return;
    }

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    };

    trigger.addEventListener('click', () => {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const panel = modal.querySelector('.quick-pubs-panel');
        if (panel) {
            panel.scrollTop = 0;
        }
    });

    modal.querySelectorAll(closeSelector).forEach(el => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

setupModal('open-quick-pubs', 'quick-pubs-modal', '[data-close-modal]');
setupModal('open-news-modal', 'news-modal', '[data-close-news]');
setupModal('open-highlights-modal', 'highlights-modal', '[data-close-highlights]');

const longBioToggle = document.getElementById('long-bio-toggle');
const longBioContent = document.getElementById('long-bio-content');
const aboutGrid = document.getElementById('about-grid');
const aboutText = document.getElementById('about-text');
const dependSysCard = document.getElementById('dependsys-card');

if (longBioToggle && longBioContent) {
    const longBioAnimMs = 560;

    longBioToggle.addEventListener('click', () => {
        const isHidden = longBioToggle.getAttribute('aria-expanded') !== 'true';

        if (isHidden) {
            if (aboutGrid) {
                aboutGrid.classList.add('long-bio-expanded');
            }
            if (aboutText) {
                aboutText.classList.add('long-bio-animated');
            }
            if (dependSysCard) {
                dependSysCard.setAttribute('aria-hidden', 'true');
            }
            longBioContent.removeAttribute('hidden');
            requestAnimationFrame(() => {
                if (longBioToggle.getAttribute('aria-expanded') === 'true') {
                    longBioContent.classList.add('is-open');
                }
            });
            longBioToggle.setAttribute('aria-expanded', 'true');
            longBioToggle.textContent = 'Hide Long Bio';
        } else {
            longBioContent.classList.remove('is-open');
            setTimeout(() => {
                if (!longBioContent.classList.contains('is-open')) {
                    longBioContent.setAttribute('hidden', '');
                    if (aboutGrid) {
                        aboutGrid.classList.remove('long-bio-expanded');
                    }
                    if (aboutText) {
                        aboutText.classList.remove('long-bio-animated');
                    }
                    if (dependSysCard) {
                        dependSysCard.removeAttribute('aria-hidden');
                    }
                }
            }, longBioAnimMs);
            longBioToggle.setAttribute('aria-expanded', 'false');
            longBioToggle.textContent = 'View Long Bio ';
        }
    });
}

function initShared3DBackground() {
    if (document.querySelector('.bg-3d-scene')) {
        return;
    }

    const scene = document.createElement('div');
    scene.className = 'bg-3d-scene';
    scene.innerHTML = `
        <span class="bg-orb orb-a"></span>
        <span class="bg-orb orb-b"></span>
        <span class="bg-orb orb-c"></span>
    `;
    document.body.prepend(scene);
}

// Research Page Button Switcher
const researchTabBtns = document.querySelectorAll('.research-tab-btn');
const researchPanels = document.querySelectorAll('.research-filter-item');

researchTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        researchTabBtns.forEach(tab => tab.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.getAttribute('data-target');

        researchPanels.forEach(panel => {
            const isMatch = target === 'all' || panel.getAttribute('data-section') === target;
            panel.classList.toggle('is-visible-panel', isMatch);
            if (isMatch) {
                panel.classList.add('is-visible');
            }
        });
    });
});

// Student Sub-Tabs Switcher (PhD / MS-UG / Alumni)
const subTabBtns = document.querySelectorAll('.sub-tab-btn');
const subPanels = document.querySelectorAll('.student-sub-panel');

subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        subTabBtns.forEach(tab => tab.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.getAttribute('data-sub-target');

        subPanels.forEach(panel => {
            const isMatch = panel.id === target;
            panel.classList.toggle('is-visible-subpanel', isMatch);
        });
    });
});

// Alumni Live Search Engine
const alumniSearch = document.getElementById('alumni-search');
const alumniCards = document.querySelectorAll('.alumni-card');
const alumniCountText = document.getElementById('alumni-count');

if (alumniSearch) {
    alumniSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        let visibleCount = 0;

        alumniCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const thesis = card.getAttribute('data-thesis').toLowerCase();
            const years = card.getAttribute('data-years').toLowerCase();
            const matches = name.includes(query) || thesis.includes(query) || years.includes(query);

            if (matches) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (query === '') {
            alumniCountText.textContent = `Showing all ${alumniCards.length} alumni`;
        } else {
            alumniCountText.textContent = `Showing ${visibleCount} of ${alumniCards.length} alumni`;
        }
    });
}

// Interactive Neural/Wireless Network Canvas Animation
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particlesArray;

// Set canvas sizing
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = {
    x: null,
    y: null,
    radius: (canvas.height / 80) * (canvas.width / 80)
}

window.addEventListener('mousemove',
    function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    }
);

window.addEventListener('mouseout',
    function() {
        mouse.x = undefined;
        mouse.y = undefined;
    }
);

// Create Particle
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }
    // Method to draw individual particle
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    // Check particle position, check mouse position, move the particle, draw the particle
    update() {
        // check if particle is still within canvas
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // check collision detection - mouse position / particle position
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.size){
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                this.x += 10;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 10;
            }
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                this.y += 10;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 10;
            }
        }
        // move particle
        this.x += this.directionX;
        this.y += this.directionY;
        // draw particle
        this.draw();
    }
}

// create particle array
function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 12000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 1) - 0.5;
        let directionY = (Math.random() * 1) - 0.5;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        let color = isLight ? '#0ea5e9' : '#38bdf8';

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

// check if particles are close enough to draw line between them
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                const rgb = isLight ? '14, 165, 233' : '56, 189, 248';
                ctx.strokeStyle = `rgba(${rgb},${opacityValue})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Keep the ambient background still when reduced motion is requested.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let backgroundFrame;
function animate() {
    backgroundFrame = motionPreference.matches ? null : requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

motionPreference.addEventListener('change', () => {
    cancelAnimationFrame(backgroundFrame);
    animate();
});

// resize event
window.addEventListener('resize',
    function() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        mouse.radius = ((innerHeight / 80) * (innerWidth / 80));
        init();
        if (motionPreference.matches) animate();
    }
);

// Store contact submissions; never report success until the server confirms it.
const form = document.querySelector('.contact-form');
if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('[type="submit"]');
        const status = document.getElementById('contact-status');
        button.disabled = true;
        status.classList.remove('error');
        status.textContent = 'Submitting your message…';
        try {
            const response = await fetch('/api/contact', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to submit your message.');
            status.textContent = 'Your message has been received. Thank you for getting in touch.';
            form.reset();
        } catch (error) {
            status.classList.add('error');
            status.textContent = 'Your message could not be submitted. Please email md@fordham.edu directly. Your draft is still here.';
        } finally { button.disabled = false; }
    });
}

init();
animate();


// Theme Toggle Logic
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
}

const themeToggleBtns = document.querySelectorAll('.theme-toggle');
themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        let theme = 'dark';
        if (document.documentElement.getAttribute('data-theme') === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            theme = 'light';
        }
        
        // Restart particle canvas to update colors based on the theme
        if (typeof init === 'function') {
            init();
            if (motionPreference.matches) animate();
        }
    });
});

initShared3DBackground();

// =======================================================
// --- SCROLL PROGRESS AND BACK-TO-TOP ---
// =======================================================
(function enhancements() {
    // Scroll progress bar
    const progress = document.createElement('div');
    progress.id = 'enh-progress';
    document.body.appendChild(progress);

    // Back-to-top button
    const topBtn = document.createElement('button');
    topBtn.id = 'enh-top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(topBtn);

    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    });

    const onScroll = () => {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const height = doc.scrollHeight - doc.clientHeight;
        const pct = height > 0 ? (scrollTop / height) * 100 : 0;
        progress.style.width = pct + '%';
        topBtn.classList.toggle('show', scrollTop > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();


})();

// =======================================================
// --- INTERACTIVE COURSE CATALOG SEARCH AND FILTERING ---
// =======================================================
const courseSearch = document.getElementById('course-search');
const courseCards = document.querySelectorAll('.course-card');
const courseTabBtns = document.querySelectorAll('.course-tab-btn');
const courseCountText = document.getElementById('course-count');

if (courseCards.length > 0 && courseCountText) {
    let currentFilter = 'all';
    let currentSearchQuery = '';

    const filterCourses = () => {
        let visibleCount = 0;

        courseCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const code = card.getAttribute('data-code').toLowerCase();
            const title = card.getAttribute('data-title').toLowerCase();
            const textContent = card.innerText.toLowerCase();
            
            const matchesCategory = (currentFilter === 'all' || category === currentFilter);
            const matchesSearch = (code.includes(currentSearchQuery) || 
                                   title.includes(currentSearchQuery) || 
                                   textContent.includes(currentSearchQuery));

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update counts
        if (currentSearchQuery === '' && currentFilter === 'all') {
            courseCountText.textContent = `Showing all ${courseCards.length} courses`;
        } else {
            courseCountText.textContent = `Showing ${visibleCount} of ${courseCards.length} courses`;
        }
    };

    // Tab buttons event listener
    courseTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            courseTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            filterCourses();
        });
    });

    // Search input event listener
    if (courseSearch) {
        courseSearch.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            filterCourses();
        });
    }
}

// Identify the current page consistently, including direct links and legacy lab anchors.
if (location.pathname.endsWith('/services.html') && location.hash === '#join-lab') {
    location.replace('join-lab.html');
}
document.querySelectorAll('.nav-links a').forEach(link => {
    const current = new URL(link.href).pathname.split('/').pop() === (location.pathname.split('/').pop() || 'index.html');
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
});
if (mobileBtn && navLinks) {
    navLinks.id = 'primary-navigation';
    mobileBtn.setAttribute('aria-controls', navLinks.id);
    mobileBtn.setAttribute('aria-expanded', 'false');
    const syncMenu = () => mobileBtn.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
    mobileBtn.addEventListener('click', syncMenu);
    navLinks.addEventListener('click', syncMenu);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { navLinks.classList.remove('active'); syncMenu(); }
    });
}
// Smaller previews retain access to the full-resolution project artwork.
document.querySelectorAll('.project-shot').forEach(figure => {
    const link = document.createElement('a');
    link.className = 'project-image-link';
    link.target = '_blank'; link.rel = 'noopener';
    const update = () => {
        const img = [...figure.querySelectorAll('img')].find(image => getComputedStyle(image).display !== 'none');
        if (img) { link.href = img.src; link.setAttribute('aria-label', 'Open full-size image: ' + img.alt); }
    };
    [...figure.querySelectorAll('img')].forEach(img => link.appendChild(img));
    figure.appendChild(link);
    const caption = document.createElement('figcaption');
    caption.textContent = 'Open image to view full size'; figure.appendChild(caption);
    update(); new MutationObserver(update).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
});

// Shared card interactions and short, one-time scroll entrances on every page.
(function siteMotion() {
    const cardSelector = [
        '.card', '.img-wrapper', '.about-text', '.lab-highlight', '.hero-glass',
        '.research-filter-item', '.research-areas-text', '.research-areas-image-box',
        '.overview-pillar-card', '.overview-impact-card', '.impact-items > div',
        '.impact-metrics > div', '.vision-main', '.vision-mini', '.position-card',
        '.vseries-card', '.preview-fbox', '.preview-trust-showcase', '.project-card',
        '.student-card', '.alumni-card', '.award-badge-card', '.prof-chip',
        '.node-content', '.philosophy-container', '.philosophy-card',
        '.course-card', '.design-card', '.curriculum-card', '.teaching-item',
        '.publication-impact-panel', '.impact-card', '.pub-item', '.project-shot',
        '.service-block', '.service-mini-card', '.service-timeline-list > li',
        '.service-record-grid > div', '.talk-list > li', '.editorial-list > div',
        '.proceedings-list > article', '.conference-grid > div', '.conference-role-group',
        '.opening', '.contact-form', '.bio-node', '.editor-record'
    ].join(',');
    const headingSelector = [
        '.hero-text', '.hero-image', '.services-hero', '.teaching-hero',
        '.section-header-block', '.opportunities-header-container',
        '.section-title', '.section-subtitle', '.project-panel > h3',
        '.project-panel-note', '.impact-card-head', '.overview-pillars-title'
    ].join(',');
    const activeAnimations = new Set();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            observer.unobserve(element);
            if (reduceMotion.matches || element.contains(document.activeElement) || !element.animate) return;
            const animation = element.animate([
                { opacity: 0, translate: '0 12px' },
                { opacity: 1, translate: '0 0' }
            ], {
                duration: 460,
                delay: Math.min(stagger++ * 35, 105),
                easing: 'cubic-bezier(.2,.7,.2,1)',
                fill: 'backwards'
            });
            activeAnimations.add(animation);
            animation.onfinish = animation.oncancel = () => activeAnimations.delete(animation);
        });
    }, { threshold: 0, rootMargin: '0px 0px 32px 0px' }) : null;

    function matching(root, selector) {
        const elements = [...root.querySelectorAll(selector)];
        if (root instanceof Element && root.matches(selector)) elements.unshift(root);
        return elements;
    }
    function register(root) {
        matching(root, cardSelector).forEach(element => element.classList.add('motion-card'));
        matching(root, `.motion-card,${headingSelector}`).forEach(element => {
            if (element.classList.contains('motion-reveal')) return;
            // Animate leaf cards, not both a large panel and every card inside it.
            if (element.querySelector('.motion-card') || element.parentElement?.closest('.motion-reveal')) return;
            if (element.closest('[role="dialog"]')) return;
            element.classList.add('motion-reveal');
            if (observer && !reduceMotion.matches) observer.observe(element);
        });
    }
    register(document);
    // Publication search and the editor insert cards after the initial page load.
    new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof Element) register(node);
            }
        }
    }).observe(document.body, { childList: true, subtree: true });
    reduceMotion.addEventListener('change', () => {
        if (!reduceMotion.matches) return;
        observer?.disconnect();
        activeAnimations.forEach(animation => animation.cancel());
        activeAnimations.clear();
    });
})();
