/* =========================================================
   Intro (Splash) + Reveal on Scroll (robusto)
========================================================= */
(() => {
    // --- Módulo Reveal (reusable)
    const Reveal = (() => {
        const SELECTOR = '.reveal';
        let io = null;

        function revealNow(el) {
            const delay = Number(el.getAttribute('data-delay') || 0);
            if (delay > 0) {
                setTimeout(() => el.classList.add('revealed'), delay);
            } else {
                el.classList.add('revealed');
            }
        }

        function ensureIO() {
            if (!('IntersectionObserver' in window)) return null;
            if (!io) {
                io = new IntersectionObserver(
                    entries => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const el = entry.target;
                                revealNow(el);
                                io.unobserve(el);
                            }
                        });
                    },
                    { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
                );
            }
            return io;
        }

        function observe(root = document) {
            const items = Array.from(root.querySelectorAll(SELECTOR))
                .filter(el => !el.dataset.revealReady);

            if (!items.length) return;

            // Sin IO → revelar directo
            if (!('IntersectionObserver' in window)) {
                items.forEach(el => {
                    el.classList.add('revealed');
                    el.dataset.revealReady = '1';
                });
                return;
            }

            const obs = ensureIO();
            items.forEach(el => {
                el.dataset.revealReady = '1';
                obs.observe(el);
            });
        }

        // Observa nuevos nodos añadidos dinámicamente (por si hay HTML inyectado fuera de catálogo)
        const mo = new MutationObserver(() => observe());
        mo.observe(document.documentElement, { childList: true, subtree: true });

        return { observe };
    })();

    // --- Intro + Boot
    const intro = document.getElementById('intro');
    let hidden = false;

    function initRevealOnPage() {
        // Activa reveal para todo lo que tenga .reveal
        Reveal.observe(document);
    }

    if (!intro) {
        initRevealOnPage();
        return;
    }

    document.body.classList.add('lock-scroll');

    function hideIntro() {
        if (hidden) return;
        hidden = true;
        intro.classList.add('intro--hide');
        document.body.classList.remove('lock-scroll');
        setTimeout(() => intro.remove(), 700);
    }

    function onReady() {
        setTimeout(hideIntro, 1500);
        initRevealOnPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
        onReady();
    }

    // Permitir saltar con interacción
    window.addEventListener('click', hideIntro, { once: true });
    window.addEventListener('keydown', hideIntro, { once: true });
    window.addEventListener('wheel', hideIntro, { once: true, passive: true });
    window.addEventListener('touchstart', hideIntro, { once: true, passive: true });

    // Fallback duro
    setTimeout(hideIntro, 4000);

    // Exponer para otros IIFEs de este archivo
    window.__Reveal = Reveal;
})();

/* =========================================================
   Catalog: Load JSON + Filters + Cards + Detail
   (dos estados en .results: lista vs detalle)
========================================================= */
(() => {
    // ---- DOM refs
    const grid = document.getElementById('cardsGrid');
    const detail = document.getElementById('detailView');
    const stateLoading = document.querySelector('.results__state--loading');
    const stateEmpty = document.querySelector('.results__state--empty');
    const stateError = document.querySelector('.results__state--error');
    const resetBtn = document.getElementById('filtersReset');
    const resultsPanel = document.querySelector('.results');
    const resultsHeader = document.querySelector('.results__header');

    if (!grid || !detail || !resultsPanel) return; // si no existe la sección catálogo

    // Accesores para título/subtítulo (porque el header cambia en detalle)
    const getResultsTitle = () => document.querySelector('.results__title');
    const getResultsSubtitle = () => document.querySelector('.results__subtitle');

    // ---- Helpers de estado del panel derecho
    function setResultsState(mode /* 'list' | 'detail' */) {
        resultsPanel.classList.toggle('is-list', mode === 'list');
        resultsPanel.classList.toggle('is-detail', mode === 'detail');
    }
    function setBusy(isBusy) {
        resultsPanel.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    }

    // ---- Header: modos
    const originalHeaderHTML = resultsHeader ? resultsHeader.innerHTML : '';
    function setHeaderToList() {
        if (!resultsHeader) return;
        // Si el header no tiene los elementos de lista, restáuralos
        if (!getResultsTitle() || !getResultsSubtitle()) {
            resultsHeader.innerHTML = originalHeaderHTML || `
        <h2 class="results__title">All Destinations</h2>
        <p class="results__subtitle">Showing all destinations available</p>
      `;
        }
    }
    function setHeaderToDetail(onBack) {
        if (!resultsHeader) return;
        resultsHeader.innerHTML = `
      <button class="detail__back" type="button" id="detailBackTop">← Back to results</button>
    `;
        const backTop = document.getElementById('detailBackTop');
        if (backTop) backTop.addEventListener('click', onBack, { once: true });
    }

    // ---- Data
    let destinations = [];

    // ---- Filtro activo
    const active = { cat: 'all', subcat: null };

    // ---- Labels para títulos dinámicos
    const labels = {
        all: { name: 'All Destinations', desc: 'Showing all destinations available' },
        nature: { name: 'Natural Spaces', desc: 'Explore mountains, lagoons, beaches and more' },
        heritage: { name: 'Heritage', desc: 'Discover historic buildings and squares' },
        culture: { name: 'Culture', desc: 'Museums, markets and cultural life' },
        gastronomy: { name: 'Gastronomy', desc: 'Enjoy cafés, restaurants and bars' },
        urban: { name: 'Urban', desc: 'Squares, shopping and modern spaces' }
    };

    // ⚠️ Importante: usar las keys reales del JSON
    const subLabels = {
        parks: 'Parks',
        mountains: 'Mountains',
        lagoons: 'Lagoons',
        'beaches-coast': 'Beaches & Coast',
        viewpoints: 'Viewpoints',
        buildings: 'Buildings',
        squares: 'Squares',
        museums: 'Museums',
        market: 'Market',
        cafes: 'Cafés',
        restaurants: 'Restaurants',
        bars: 'Bars',
        spaces: 'Spaces',
        shopping: 'Shopping'
    };

    // ---- Helpers de filtrado
    const byFilter = item => {
        if (active.cat === 'all') return true;
        if (item.cat !== active.cat) return false;
        if (active.subcat) return item.subcat === active.subcat;
        return true;
    };

    function showState({ loading = false, empty = false, error = false }) {
        if (stateLoading) stateLoading.hidden = !loading;
        if (stateEmpty) stateEmpty.hidden = !empty;
        if (stateError) stateError.hidden = !error;
    }

    function renderCounts(data) {
        const totals = { all: data.length };
        data.forEach(d => {
            totals[d.cat] = (totals[d.cat] || 0) + 1;
            const key = `${d.cat}:${d.subcat}`;
            totals[key] = (totals[key] || 0) + 1;
        });

        // Contadores de categorías (si se usan)
        document.querySelectorAll('[data-count-cat]').forEach(el => {
            const k = el.getAttribute('data-count-cat');
            el.textContent = `(${totals[k] || 0})`;
        });
        // Contadores de subcategorías
        document.querySelectorAll('[data-count]').forEach(el => {
            const k = el.getAttribute('data-count');
            el.textContent = totals[k] != null ? totals[k] : 0;
        });
    }

    function updateResultsHeaderForList() {
        const resultsTitle = getResultsTitle();
        const resultsSubtitle = getResultsSubtitle();
        if (!resultsTitle || !resultsSubtitle) return;
        if (active.cat === 'all') {
            resultsTitle.textContent = labels.all.name;
            resultsSubtitle.textContent = labels.all.desc;
        } else {
            resultsTitle.textContent = labels[active.cat]?.name || 'Destinations';
            if (active.subcat) {
                const sub = subLabels[active.subcat] || active.subcat;
                resultsSubtitle.textContent = `Showing ${sub} in ${labels[active.cat]?.name || active.cat}`;
            } else {
                resultsSubtitle.textContent = labels[active.cat]?.desc || 'Filtered results';
            }
        }
    }

    function highlightActiveGroup() {
        document.querySelectorAll('.filters__group').forEach(g => g.classList.remove('active'));
        const catToMark = active.cat || 'all';
        document.querySelector(`.filters__group[data-cat="${catToMark}"]`)?.classList.add('active');
    }

    // ---- Render listado (estado LISTA)
    function renderCards(data) {
        setBusy(true);

        // Header en modo lista (título + subtítulo)
        setHeaderToList();

        detail.hidden = true;
        detail.innerHTML = '';
        grid.hidden = false;

        const list = data.filter(byFilter);
        showState({ loading: false, empty: list.length === 0, error: false });

        updateResultsHeaderForList();
        highlightActiveGroup();

        // CHANGED: se elimina la clase "reveal" y los data-delay en las cards
        grid.innerHTML = list
            .map((d) => {
                return `
          <article class="card" role="listitem" data-id="${d.id}">
            <div class="card__media">
              <img src="${d.img}" alt="${d.name}">
            </div>
            <div class="card__body">
              <h3 class="card__title">${d.name}</h3>
              <p class="card__text">${d.description}</p>
              <div class="card__actions">
                <a href="#dest/${d.id}" class="btn btn--secondary card__more" data-id="${d.id}">View details</a>
              </div>
            </div>
          </article>
        `;
            })
            .join('');

        setResultsState('list');
        setBusy(false);

        // REMOVED: no activar reveal sobre las nuevas cards del catálogo
        // window.__Reveal?.observe(grid);
    }

    // ---- Render detalle (estado DETALLE)
    function renderDetail(item) {
        if (!item) return;
        setBusy(true);

        // Header en modo detalle (solo botón Back arriba)
        setHeaderToDetail(() => {
            renderCards(destinations);
            if (location.hash.startsWith('#dest/')) history.replaceState(null, '', ' ');
        });

        grid.hidden = true;
        detail.hidden = false;

        highlightActiveGroup();

        // Construir link a Google Maps
        let mapsHref = '';
        if (item.coords && Array.isArray(item.coords) && item.coords.length === 2) {
            const [lat, lng] = item.coords;
            mapsHref = `https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}`;
        } else if (item.address) {
            mapsHref = `https://www.google.com/maps?q=${encodeURIComponent(item.address)}`;
        }

        // Lámina informativa (PDF o imagen)
        let sheetHTML = '';
        if (item.infoSheet) {
            const isPDF = /\.pdf(\?|#|$)/i.test(item.infoSheet);
            // CHANGED: sin clase "reveal" ni data-delay; visible solo cuando se pulse el botón
            sheetHTML = `
    <div class="detail__sheet" id="infoSheetBlock" hidden>
      ${isPDF
                    ? `
          <iframe class="pdf-frame" src="${item.infoSheet}" title="Information sheet"></iframe>
          <p class="pdf-fallback">
            <a href="${item.infoSheet}" target="_blank" rel="noopener">Abrir PDF en otra pestaña</a>
          </p>
        `
                    : `<img src="${item.infoSheet}" alt="Information sheet">`
                }
    </div>`;
        }

        // Badges HTML
        const badgesHTML =
            Array.isArray(item.badges) && item.badges.length
                ? `<div class="badges">
             ${item.badges.map(b => `<span class="badge">${b}</span>`).join('')}
           </div>`
                : '';

        // CHANGED: se eliminan todas las clases "reveal" del detalle
        detail.innerHTML = `
      <!-- Banner -->
      <div class="detail__hero" style="background-image:url('${item.img}')">
        <div class="detail__hero-content">
          <h3 class="detail__title" id="detailTitle" tabindex="-1">${item.name}</h3>
          <div class="detail__meta">
            <span>${labels[item.cat]?.name || item.cat}</span>
            ${item.subcat ? `<span>• ${subLabels[item.subcat] || item.subcat}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="detail__body" role="region" aria-labelledby="detailTitle">
        <div class="detail__main">
          <p class="detail__desc">${item.long || item.description || ''}</p>
          ${sheetHTML}
        </div>

        <aside class="detail__aside">
          ${badgesHTML}
          ${item.address || mapsHref
                ? `
            <div class="detail__address">
              <h4>Address</h4>
              ${item.address ? `<p>${item.address}</p>` : ''}
              ${mapsHref
                    ? `<a class="btn--map" href="${mapsHref}" target="_blank" rel="noopener">Open in Google Maps</a>`
                    : ''
                }
            </div>`
                : ''
            }

          <div class="detail__actions">
            ${item.infoSheet
                ? `<button class="btn" type="button" id="toggleSheetBtn">View information sheet</button>`
                : ''
            }
          </div>
        </aside>
      </div>
    `;

        // Enfocar el título para lector de pantalla / teclado
        const title = document.getElementById('detailTitle');
        if (title) title.focus?.();

        // Toggle del PDF/imagen
        const toggleBtn = document.getElementById('toggleSheetBtn');
        const sheetBlock = document.getElementById('infoSheetBlock');
        if (toggleBtn && sheetBlock) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = sheetBlock.hasAttribute('hidden');
                if (isHidden) {
                    sheetBlock.removeAttribute('hidden');
                    toggleBtn.textContent = 'Hide information sheet';
                    sheetBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // REMOVED: no se añade "reveal" ni se observa
                    // sheetBlock.classList.add('reveal');
                    // window.__Reveal?.observe(sheetBlock);
                } else {
                    sheetBlock.setAttribute('hidden', '');
                    toggleBtn.textContent = 'View information sheet';
                }
            });
        }

        setResultsState('detail');
        setBusy(false);

        // REMOVED: no activar reveal sobre el detalle
        // window.__Reveal?.observe(detail);
    }

    // -----------------------------------------------
    // INTERACCIÓN DEL SIDEBAR (categoría / expandir)
    // -----------------------------------------------
    // 1) Click en header de categoría: distinguir entre "catbtn" y "expand"
    document.querySelectorAll('.filters__group-summary').forEach(sum => {
        sum.addEventListener('click', e => {
            // Bloquear el toggle nativo de <summary>
            e.preventDefault();
            e.stopPropagation();

            const details = sum.parentElement;
            const expandBtn = e.target.closest('.filters__expand');
            const catBtn = e.target.closest('.filters__catbtn');

            if (expandBtn) {
                // Toggle manual del <details>
                details.open = !details.open;
                expandBtn.setAttribute('aria-expanded', details.open ? 'true' : 'false');
                return;
            }

            if (catBtn) {
                // Filtrar por categoría principal (sin subcategoría)
                const cat = details.getAttribute('data-cat') || 'all';
                active.cat = cat;
                active.subcat = null;

                // Reset visual de chips
                document
                    .querySelectorAll('.filters__chip')
                    .forEach(c => c.setAttribute('aria-pressed', 'false'));
                if (cat === 'all') {
                    document
                        .querySelector('.filters__chip[data-cat="all"]')
                        ?.setAttribute('aria-pressed', 'true');
                }

                renderCards(destinations);
                return;
            }
        });
    });

    // 2) Chips de subcategoría
    document.querySelectorAll('.filters__chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cat = chip.getAttribute('data-cat');
            const sub = chip.getAttribute('data-subcat') || null;

            // Al seleccionar subcategoría, abrir su grupo por si estuviera cerrado
            const group = document.querySelector(`.filters__group[data-cat="${cat}"]`);
            if (group && !group.open) {
                group.open = true;
                group.querySelector('.filters__expand')?.setAttribute('aria-expanded', 'true');
            }

            // Reset chips
            document.querySelectorAll('.filters__chip').forEach(c => c.setAttribute('aria-pressed', 'false'));

            if (cat === 'all') {
                active.cat = 'all';
                active.subcat = null;
                chip.setAttribute('aria-pressed', 'true');
            } else {
                chip.setAttribute('aria-pressed', 'true');
                active.cat = cat;
                active.subcat = sub;
            }
            renderCards(destinations);
        });
    });

    // Reset global
    resetBtn?.addEventListener('click', () => {
        active.cat = 'all';
        active.subcat = null;
        document.querySelectorAll('.filters__chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
        document.querySelector('.filters__chip[data-cat="all"]')?.setAttribute('aria-pressed', 'true');
        renderCards(destinations);
    });

    // Delegación para "View details"
    document.addEventListener('click', e => {
        const a = e.target.closest('.card__more');
        if (!a) return;
        e.preventDefault();
        const id = a.getAttribute('data-id');
        const item = destinations.find(x => x.id === id);
        if (item) {
            renderDetail(item);
            // set hash para deep-link
            location.hash = `#dest/${id}`;
        }
    });

    // Router por hash (abrir detalle si URL ya viene con #dest/ID)
    function tryOpenFromHash() {
        if (!location.hash.startsWith('#dest/')) return false;
        const id = location.hash.split('/')[1];
        const item = destinations.find(x => x.id === id);
        if (item) {
            renderDetail(item);
            return true;
        }
        return false;
    }

    // ---- Load JSON
    async function loadData() {
        try {
            showState({ loading: true, empty: false, error: false });
            setBusy(true);
            const res = await fetch('assets/data/destinations.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(`Failed to load JSON (${res.status})`);
            destinations = await res.json();

            // CHANGED: expone datos para el buscador del header
            window.DESTINATIONS = destinations;

            renderCounts(destinations);
            renderCards(destinations);

            // Sincronizar aria-expanded de flechas con <details open>
            document.querySelectorAll('.filters__group').forEach(g => {
                g.querySelector('.filters__expand')?.setAttribute('aria-expanded', g.open ? 'true' : 'false');
            });

            tryOpenFromHash();
            showState({ loading: false, empty: false, error: false });
            setBusy(false);

            // Notificar a otros módulos que los datos están disponibles
            window.dispatchEvent(new CustomEvent('data:loaded', { detail: destinations }));
        } catch (err) {
            console.error(err);
            showState({ loading: false, empty: false, error: true });
            setBusy(false);
        }
    }

    // ---- Init
    loadData();
})();

// ============================
// Buscador del header (sin cambiar tu HTML)
// ============================
(() => {
    const $form = document.querySelector('.header__search');
    const $input = document.getElementById('search');

    if (!$form || !$input) return;

    // 1) Fuente de datos (ajusta si usas otro nombre global)
    let DATA = window.DESTINATIONS || window.destinations || [];

    // Si tu JSON se carga asincrónicamente en otro módulo, emite este evento:
    // window.dispatchEvent(new CustomEvent('data:loaded', { detail: arrayDeDestinos }));
    window.addEventListener('data:loaded', (e) => {
        if (Array.isArray(e.detail)) DATA = e.detail;
    });

    // 2) Normalizador (minúsculas + sin tildes)
    const norm = (s) =>
        (s || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    // 3) Lógica de búsqueda sobre varios campos
    function searchData(query, data) {
        const q = norm(query);
        if (!q) return data;

        return data.filter((d) => {
            const title = norm(d.title || d.nombre || d.name);
            const desc = norm(d.description || d.descripcion || d.summary || d.long || '');
            const cat = norm(d.category || d.categoria || d.cat || '');
            const subcats = norm(d.subcat || '');
            const tags = Array.isArray(d.tags) ? d.tags.map(norm).join(' ') : '';
            const city = norm(d.location?.city || d.ubicacion?.ciudad || '');
            const region = norm(d.location?.region || d.ubicacion?.region || '');

            const haystack = [title, desc, cat, subcats, tags, city, region].join(' ');
            return haystack.includes(q);
        });
    }

    // 4) Render (usa el tuyo si existe)
    function minimalRender(list) {
        const grid = document.getElementById('cardsGrid'); // FIX: mismo ID que tu HTML
        if (!grid) return;
        grid.innerHTML = list
            .map((d) => {
                const title = d.title || d.nombre || d.name || 'Untitled';
                const img = (d.images && d.images[0]) || d.image || d.img || 'assets/img/placeholder.jpg';
                const cat = d.category || d.categoria || d.cat || '';
                const city = d.location?.city || d.ubicacion?.ciudad || '';
                const region = d.location?.region || d.ubicacion?.region || '';
                const subtitle = [cat, city || region].filter(Boolean).join(' • ');
                return `
          <article class="card">
            <div class="card__thumb">
              <img src="${img}" alt="${title}" loading="lazy" decoding="async">
            </div>
            <div class="card__body">
              <h3 class="card__title">${title}</h3>
              <p class="card__meta">${subtitle}</p>
            </div>
          </article>
        `;
            })
            .join('');
    }

    const render = (list) => {
        if (typeof window.renderDestinations === 'function') {
            window.renderDestinations(list);
        } else {
            minimalRender(list);
        }
    };

    // 5) Debounce
    const debounce = (fn, ms = 200) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    };

    // 6) Handler principal
    function handleQuery(q) {
        const base = Array.isArray(DATA) ? DATA : [];
        const results = searchData(q, base);

        // Aviso opcional a otras partes de la app
        window.dispatchEvent(new CustomEvent('search:results', { detail: { query: q, results } }));

        render(results);
    }

    // 7) Eventos (submit + input con debounce)
    $form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleQuery($input.value);
    });

    $input.addEventListener(
        'input',
        debounce(() => {
            handleQuery($input.value);
        }, 200)
    );

    // 8) Calidad de vida: ESC limpia y muestra todo
    $input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $input.value = '';
            handleQuery('');
            $input.blur();
        }
    });

    // 9) Estado inicial (opcional)
    // if (Array.isArray(DATA) && DATA.length) render(DATA);
})();

// ===== Parallax Rally Biobío (3 capas) =====
(() => {
    const root = document.querySelector('[data-parallax]');
    if (!root) return;

    const layers = Array.from(root.querySelectorAll('.parallax-banner__layer'));
    if (!layers.length) return;

    // Configura fuerzas sutiles (puedes ajustar con data-speed en HTML)
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    let ticking = false;
    let inView = false;
    let lastY = window.scrollY;

    // Calcula progreso del banner en viewport (0 cuando empieza a entrar, 1 cuando sale)
    function getProgress() {
        const rect = root.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        // Rango donde animamos: desde que entra hasta que sale completamente
        const start = vh;           // justo antes de entrar por abajo
        const end = -rect.height;   // cuando ya salió por arriba
        const p = (rect.top - end) / (start - end);
        return clamp(1 - p, 0, 1);  // 0..1
    }

    function update() {
        ticking = false;
        if (!inView) return;

        const progress = getProgress(); // 0..1
        // Traducimos levemente en Y cada capa usando su speed (en %) del alto
        layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed || '0.1'); // 0.05 - 0.25 recomendado
            const translate = ((progress - 0.5) * 2) * (speed * 10); // -speed..+speed en %
            layer.style.transform = `translateY(${translate}%)`;
        });
    }

    function requestTick() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }

    // Scroll/resize listeners
    function onScroll() {
        const y = window.scrollY;
        if (y === lastY) return;
        lastY = y;
        requestTick();
    }
    function onResize() { requestTick(); }

    // Solo animar cuando el banner esté en viewport
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            inView = entry.isIntersecting;
            if (inView) requestTick();
        });
    }, { root: null, threshold: [0, 0.01, 0.5, 0.99, 1] });

    io.observe(root);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Fallback si usuario prefiere menos movimiento
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
        layers.forEach(l => l.style.transform = 'none');
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        io.disconnect();
    }
})();


// ===== Parallax Rally Biobío (más notorio + mouse en desktop) =====
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('banner-rally');
    if (!section) return;

    const root = section.querySelector('.parallax-banner');
    const bg = section.querySelector('.layer--bg');
    const mid = section.querySelector('.layer--mid');
    const fg = section.querySelector('.layer--fg');
    if (!root || !bg || !mid || !fg) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    let mouseY = 0;  // -1..1 relativo al centro del banner (desktop)

    function getRanges() {
        const h = root.getBoundingClientRect().height || 476; // fallback
        // Rango base en px según alto del banner (más alto => más movimiento)
        // móvil (<=768px): rangos moderados, desktop: más notorios
        const isDesktop = window.matchMedia('(min-width: 769px)').matches;
        const scale = isDesktop ? 0.10 : 0.06; // 10% vs 6% del alto total repartido entre capas

        // Distribución por capa (auto > fondo > contenido)
        const R_MID = Math.min(64, h * scale);        // auto
        const R_BG = Math.min(36, h * (scale * 0.55)); // fondo
        const R_FG = Math.min(28, h * (scale * 0.45)); // texto/logo

        return { R_BG, R_MID, R_FG, isDesktop };
    }

    function applyParallax() {
        ticking = false;

        const rect = root.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;

        // Distancia entre centros (scroll)
        const centerEl = rect.top + rect.height / 2;
        const centerVp = vh / 2;
        const delta = centerVp - centerEl;

        // Normaliza scroll a -1..1
        const tScroll = Math.max(-1, Math.min(1, delta / (vh / 2)));

        // Rango dinámico
        const { R_BG, R_MID, R_FG, isDesktop } = getRanges();

        // Mezcla scroll + mouse (mouseY ya es -1..1)
        // Peso del mouse solo en desktop para no molestar en móvil
        const mouseWeight = isDesktop ? 0.35 : 0.0;

        const tBG = tScroll * 1.0 + mouseY * mouseWeight * 0.4;
        const tMID = tScroll * 1.2 + mouseY * mouseWeight * 1.0; // el auto reacciona más
        const tFG = tScroll * 0.8 + mouseY * mouseWeight * 0.25;

        bg.style.transform = `translate3d(0, ${tBG * R_BG}px, 0)`;
        mid.style.transform = `translate3d(0, ${tMID * R_MID}px, 0)`;
        fg.style.transform = `translate3d(0, ${tFG * R_FG}px, 0)`;
    }

    function onScrollResize() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(applyParallax);
        }
    }

    // Parallax por mouse (solo desktop)
    function onMouseMove(e) {
        const r = root.getBoundingClientRect();
        const y = e.clientY - (r.top + r.height / 2);
        // Normaliza a -1..1 (suave)
        mouseY = Math.max(-1, Math.min(1, y / (r.height / 2)));
        onScrollResize();
    }

    window.addEventListener('scroll', onScrollResize, { passive: true });
    window.addEventListener('resize', onScrollResize);

    // Activar mouse en desktop
    const mqDesktop = window.matchMedia('(min-width: 769px)');
    function toggleMouseListener(e) {
        if (e.matches) {
            root.addEventListener('mousemove', onMouseMove);
        } else {
            root.removeEventListener('mousemove', onMouseMove);
            mouseY = 0;
        }
        onScrollResize();
    }
    mqDesktop.addEventListener('change', toggleMouseListener);
    toggleMouseListener(mqDesktop); // set inicial

    // Primera ejecución
    applyParallax();
});


// ===== Parallax + Blur/Fade para HERO =====
// ADDED: efecto parallax + blur + fade al hacer scroll (reversible)
(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Respeta prefers-reduced-motion
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let ticking = false;

    const update = () => {
        const y = window.scrollY || document.documentElement.scrollTop;

        // Configuración de intensidad (ajusta a gusto)
        const maxRange = 400;                 // ADDED: rango (px) sobre el que se aplica el efecto
        const t = Math.min(1, Math.max(0, y / maxRange)); // progreso 0→1 según scroll
        const parallax = y * -0.30;           // ADDED: mueve el fondo más lento hacia arriba
        const blur = 8 * t;                   // ADDED: hasta 8px de blur
        const opacity = 1 - (0.6 * t);        // ADDED: reduce opacidad hasta 40%
        const scale = 1 + (0.06 * t);         // ADDED: leve zoom para profundidad

        hero.style.setProperty('--hero-parallax', parallax.toFixed(2) + 'px');
        hero.style.setProperty('--hero-blur', blur.toFixed(2) + 'px');
        hero.style.setProperty('--hero-opacity', opacity.toFixed(3));
        hero.style.setProperty('--hero-scale', scale.toFixed(3));

        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };

    // Inicializa en carga y en scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', update);
})();

async function loadData() {
    try {
        showState({ loading: true, empty: false, error: false });
        setBusy(true);

        const res = await fetch('assets/data/destinations.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to load JSON (${res.status})`);

        const text = await res.text();
        try {
            destinations = JSON.parse(text);
        } catch (e) {
            console.error('JSON inválido:', e);
            // Muestra un extracto alrededor del punto del error si existe e.position
            const pos = e.position ?? (e.message.match(/position (\d+)/)?.[1] | 0);
            console.error('Cerca de:', text.slice(Math.max(0, pos - 80), pos + 80));
            throw e;
        }

        renderCounts(destinations);
        renderCards(destinations);

        document.querySelectorAll('.filters__group').forEach(g => {
            g.querySelector('.filters__expand')?.setAttribute('aria-expanded', g.open ? 'true' : 'false');
        });

        tryOpenFromHash();
        showState({ loading: false, empty: false, error: false });
    } catch (err) {
        console.error(err);
        showState({ loading: false, empty: false, error: true });
    } finally {
        setBusy(false);
    }
}
