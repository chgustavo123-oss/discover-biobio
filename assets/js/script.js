/*
 * script.js for Discover Bio Bío
 * Handles data fetching, rendering, filtering, search, modal, and animations.
 */

(function () {
    "use strict";

    // --- STATE MANAGEMENT ---
    const state = {
        destinations: [],
        filteredDestinations: [],
        map: null,
        markerLayer: null,
        currentCategory: 'all',
        currentSubcategory: 'all',
        currentLanguage: 'en',
        i18n: {},
    };

    // --- DOM ELEMENT SELECTORS ---
    const DOMElements = {
        siteHeader: document.querySelector('.site-header'),
        splashScreen: document.getElementById('splash-screen'),
        grid: document.getElementById('destinations-grid'),
        destinationsList: document.getElementById('destinations-list'),
        destinationsSection: document.getElementById('destinations'),
        scrollToTopBtn: document.getElementById('scroll-to-top-btn'),
        searchBar: document.getElementById('search-bar'),
        filters: document.getElementById('filters'),
        headerControls: document.querySelector('.header-controls'),
        mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
        headerDropdownMenu: document.getElementById('header-dropdown-menu'),
        subFilters: document.getElementById('sub-filters'),
        languageSwitcher: document.querySelector('.language-switcher'),
        viewSwitcher: document.getElementById('view-switcher'),
        mapContainer: document.getElementById('map-container'),
        modal: document.getElementById('detail-modal'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
        modalBanner: document.getElementById('modal-banner'),
        modalTitle: document.getElementById('modal-title'),
        modalDescription: document.getElementById('modal-description'),
        modalBadges: document.getElementById('modal-badges'),
        modalAddress: document.getElementById('modal-address'),
        modalMapLink: document.getElementById('modal-map-link'),
        modalSheetLink: document.getElementById('modal-sheet-link'),
        // Game Elements
        gameGrid: document.getElementById('game-grid'),
        shuffleBtn: document.getElementById('shuffle-btn'),
        winMessage: document.getElementById('game-win-message'),
        communityProjectGame: document.querySelector('.community-project-game'),
        themeSwitcher: document.querySelector('.theme-switcher'),
    };

    // --- LEAFLET CUSTOM ICONS ---
    const categoryColors = {
        nature: '#4CAF50',
        heritage: '#795548',
        culture: '#673AB7',
        gastronomy: '#FF9800',
        urban: '#607D8B',
        default: '#009A96' // Primary color as fallback
    };

    // Function to create a custom SVG marker icon
    const createMarkerIcon = (color) => {
        return L.divIcon({
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>`,
            className: 'svg-marker-icon', // A class to remove default divIcon styles
            iconSize: [32, 32],
            iconAnchor: [16, 32], // Point of the icon
            popupAnchor: [0, -32]
        });
    };

    const categoryIcons = {
        nature: createMarkerIcon(categoryColors.nature),
        heritage: createMarkerIcon(categoryColors.heritage),
        culture: createMarkerIcon(categoryColors.culture),
        gastronomy: createMarkerIcon(categoryColors.gastronomy),
        urban: createMarkerIcon(categoryColors.urban),
        default: createMarkerIcon(categoryColors.default)
    };

    // --- HELPERS ---
    // --- API & DATA FETCHING ---
    async function fetchI18n() {
        try {
            const response = await fetch('assets/data/i18n.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            state.i18n = await response.json();
        } catch (error) {
            console.error("Could not fetch i18n strings:", error);
        }
    }
    async function fetchDestinations() {
        try {
            const response = await fetch('assets/data/destinations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            state.destinations = await response.json();
        } catch (error) {
            console.error("Could not fetch destinations:", error);
            const lang = state.currentLanguage;
            const errorMsg = state.i18n[lang]?.error_loading_destinations || 'Error loading destinations. Please try again later.';
            DOMElements.grid.innerHTML = `<p>${errorMsg}</p>`;
        }
    }

    // --- RENDER FUNCTIONS ---
    function createDestinationCard(destination) {
        const lang = state.currentLanguage;
        const card = document.createElement('article');
        card.className = 'destination-card reveal';
        card.dataset.id = destination.id;

        const name = (destination.name && destination.name[lang]) || (destination.name && destination.name.en) || destination.id;
        const description = (destination.description && destination.description[lang]) || (destination.description && destination.description.en) || '';
        const categoryName = state.i18n[lang]?.[`filter_${destination.cat}`] || destination.cat.charAt(0).toUpperCase() + destination.cat.slice(1);

        card.innerHTML = `
       <img src="${destination.img}" alt="${name}" class="card-image">
       <div class="card-content">
         <h3>${name}</h3>
         <p>${description}</p>
         <span class="card-category" data-category="${destination.cat}">${categoryName}</span>
       </div>
     `;
        return card;
    }

    function createDestinationListItem(destination) {
        const item = document.createElement('article');
        const lang = state.currentLanguage;
        item.className = 'destination-list-item reveal';
        item.dataset.id = destination.id;

        const name = (destination.name && destination.name[lang]) || (destination.name && destination.name.en) || destination.id;
        const description = (destination.description && destination.description[lang]) || (destination.description && destination.description.en) || '';
        const categoryName = state.i18n[lang]?.[`filter_${destination.cat}`] || destination.cat.charAt(0).toUpperCase() + destination.cat.slice(1);

        item.innerHTML = `
      <img src="${destination.img}" alt="${name}" class="list-item-image">
      <div class="list-item-content">
          <div class="list-item-header">
              <h3>${name}</h3>
              <span class="card-category" data-category="${destination.cat}">${categoryName}</span>
          </div>
          <p>${description}</p>
      </div>
    `;
        return item;
    }

    function renderDestinations(destinations) {
        DOMElements.grid.innerHTML = '';
        DOMElements.destinationsList.innerHTML = '';
        if (!destinations) return;

        const activeView = DOMElements.viewSwitcher.querySelector('.active').dataset.view;
        if (activeView === 'map') return; // Don't render cards if map is active

        const container = activeView === 'grid' ? DOMElements.grid : DOMElements.destinationsList;
        const createItem = activeView === 'grid' ? createDestinationCard : createDestinationListItem;

        if (destinations.length === 0) {
            const lang = state.currentLanguage;
            const noResultsMsg = state.i18n[lang]?.no_destinations_found || 'No destinations found matching your search.';
            container.innerHTML = `<p>${noResultsMsg}</p>`;
            return;
        }
        destinations.forEach(destination => {
            const item = createItem(destination);
            container.appendChild(item);
        });
        setupIntersectionObserver(); // Re-observe new cards
    }

    function renderSubFilters(category) {
        const lang = state.currentLanguage;
        DOMElements.subFilters.innerHTML = '';

        if (category === 'all') {
            DOMElements.subFilters.style.display = 'none';
            return;
        }

        // Find unique subcategories for the selected main category
        const subcategories = [...new Set(
            state.destinations
                .filter(dest => dest.cat === category && dest.subcat)
                .map(dest => dest.subcat)
        )];

        // If there are no subcategories or only one, don't show the filter bar
        if (subcategories.length <= 1) {
            DOMElements.subFilters.style.display = 'none';
            return;
        }

        // Create "All" button for the sub-category
        const allBtn = document.createElement('button');
        allBtn.className = `sub-filter-btn ${category} active`;
        allBtn.dataset.filter = 'all';
        allBtn.textContent = state.i18n[lang]?.subfilter_all || 'All';
        DOMElements.subFilters.appendChild(allBtn);

        // Create buttons for each subcategory
        subcategories.forEach(subcat => {
            const btn = document.createElement('button');
            btn.className = `sub-filter-btn ${category}`;
            btn.dataset.filter = subcat;
            btn.textContent = state.i18n[lang]?.[`subcat_${subcat}`] || subcat.charAt(0).toUpperCase() + subcat.slice(1);
            DOMElements.subFilters.appendChild(btn);
        });

        DOMElements.subFilters.style.display = 'flex';
    }

    function initMap() {
        if (typeof L === 'undefined') {
            console.error("Leaflet library not loaded.");
            DOMElements.mapContainer.innerHTML = `<p>Error loading the map.</p>`;
            return;
        }

        state.map = L.map(DOMElements.mapContainer).setView([-37.0, -72.5], 8); // Centered on Biobío Region

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(state.map);

        state.markerLayer = L.layerGroup().addTo(state.map);
    }

    function updateMapMarkers(destinations) {
        if (!state.map || !state.markerLayer) return;

        state.markerLayer.clearLayers();

        const lang = state.currentLanguage;

        destinations.forEach(destination => {
            if (destination.coords && destination.coords.length === 2) {
                const icon = categoryIcons[destination.cat] || categoryIcons.default;
                const marker = L.marker(destination.coords, { icon: icon });
                const name = (destination.name && destination.name[lang]) || (destination.name && destination.name.en) || destination.id;
                const popupContent = `
           <strong>${name}</strong><br>
           <a href="#" class="map-popup-link" data-id="${destination.id}" data-category="${destination.cat}">${state.i18n[lang]?.map_popup_details || 'View details'}</a>
         `;
                marker.bindPopup(popupContent);

                // Open popup on hover
                marker.on('mouseover', function () {
                    this.openPopup();
                });

                marker.addTo(state.markerLayer);
            }
        });
    }

    function handleViewSwitch(e) {
        const target = e.target.closest('.view-btn');
        if (!target) return;

        const currentView = target.dataset.view;

        // Update active button
        DOMElements.viewSwitcher.querySelector('.active').classList.remove('active');
        target.classList.add('active');

        // Toggle visibility
        const isGridView = currentView === 'grid';
        const isListView = currentView === 'list';
        const isMapView = currentView === 'map';

        DOMElements.grid.style.display = isGridView ? 'grid' : 'none';
        DOMElements.destinationsList.style.display = isListView ? 'block' : 'none';
        DOMElements.mapContainer.style.display = isMapView ? 'block' : 'none';

        // If map is now visible, tell Leaflet to update its size
        if (isMapView) {
            if (state.map) setTimeout(() => state.map.invalidateSize(), 10);
        } else {
            renderDestinations(state.filteredDestinations);
        }
    }

    // --- EVENT HANDLERS ---
    function handleFilter(e) {
        const target = e.target;
        if (target.tagName !== 'BUTTON') return;

        // Update active button style
        document.querySelector('.filter-btn.active').classList.remove('active');
        target.classList.add('active');

        const filter = target.dataset.filter;
        state.currentCategory = filter;
        state.currentSubcategory = 'all'; // Reset subcategory when main category changes

        renderSubFilters(filter); // Render sub-filters for the new category

        const searchTerm = DOMElements.searchBar.value.toLowerCase();

        applyFilters(filter, 'all', searchTerm);
    }

    function handleSubFilter(e) {
        const target = e.target;
        if (target.tagName !== 'BUTTON') return;

        // Update active button style
        if (DOMElements.subFilters.querySelector('.active')) {
            DOMElements.subFilters.querySelector('.active').classList.remove('active');
        }
        target.classList.add('active');

        const subFilter = target.dataset.filter;
        state.currentSubcategory = subFilter;

        const searchTerm = DOMElements.searchBar.value.toLowerCase();
        applyFilters(state.currentCategory, subFilter, searchTerm);
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        applyFilters(state.currentCategory, state.currentSubcategory, searchTerm);
    }

    function applyFilters(category, subcategory, searchTerm) {
        const lang = state.currentLanguage;
        let results = state.destinations;

        // Filter by category
        if (category !== 'all') {
            results = results.filter(dest => dest.cat === category);
        }

        // Filter by subcategory
        if (subcategory !== 'all') {
            results = results.filter(dest => dest.subcat === subcategory);
        }

        // Filter by search term
        if (searchTerm) {
            results = results.filter(dest =>
                ((dest.name && dest.name[lang]) || (dest.name && dest.name.en) || '').toLowerCase().includes(searchTerm) ||
                ((dest.description && dest.description[lang]) || (dest.description && dest.description.en) || '').toLowerCase().includes(searchTerm) ||
                (Array.isArray(dest.badges?.[lang]) && dest.badges[lang].some(badge => badge.toLowerCase().includes(searchTerm)))
            );
        }

        state.filteredDestinations = results;
        renderDestinations(state.filteredDestinations);
        updateMapMarkers(state.filteredDestinations);
    }

    function openDetailModal(destination) {
        const lang = state.currentLanguage;

        const name = (destination.name && destination.name[lang]) || (destination.name && destination.name.en) || destination.id;
        const longDescription = (destination.long && destination.long[lang]) || (destination.long && destination.long.en) || '';
        const badges = (destination.badges && destination.badges[lang]) || (destination.badges && destination.badges.en) || [];

        DOMElements.modalBanner.style.backgroundImage = `url(${destination.img})`;
        DOMElements.modalTitle.textContent = name;
        DOMElements.modalDescription.textContent = longDescription;

        // Populate badges
        DOMElements.modalBadges.innerHTML = ''; // Clear previous badges
        if (Array.isArray(badges) && badges.length > 0) {
            const badgesTitle = document.createElement('p');
            const featuresText = state.i18n[lang]?.modal_activities_features || 'Activities & Features:';
            badgesTitle.innerHTML = `<strong>${featuresText}</strong>`;
            DOMElements.modalBadges.appendChild(badgesTitle);

            const badgesList = document.createElement('div');
            badgesList.className = 'badges-list';
            badges.forEach(badgeText => {
                const badge = document.createElement('span');
                badge.className = 'modal-badge';
                badge.textContent = badgeText;
                badgesList.appendChild(badge);
            });
            DOMElements.modalBadges.appendChild(badgesList);
        }

        DOMElements.modalAddress.textContent = destination.address;

        // Build Google Maps URL from coordinates
        if (destination.coords && destination.coords.length === 2) {
            const [lat, lng] = destination.coords;
            DOMElements.modalMapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
            DOMElements.modalMapLink.style.display = 'inline-block';
        } else {
            DOMElements.modalMapLink.style.display = 'none';
        }

        // Handle info sheet link
        if (destination.infoSheet) {
            DOMElements.modalSheetLink.href = destination.infoSheet;
            DOMElements.modalSheetLink.style.display = 'inline-block';
        } else {
            DOMElements.modalSheetLink.style.display = 'none';
        }

        DOMElements.modal.showModal();
    }

    function handleCardClick(e) {
        const card = e.target.closest('.destination-card, .destination-list-item');
        if (!card) return;

        const destinationId = card.dataset.id;
        const destination = state.destinations.find(d => d.id === destinationId);
        if (destination) {
            openDetailModal(destination);
        }
    }

    function handleMapPopupClick(e) {
        if (e.target.classList.contains('map-popup-link')) {
            e.preventDefault();
            const destinationId = e.target.dataset.id;
            const destination = state.destinations.find(d => d.id === destinationId);
            if (destination) {
                openDetailModal(destination);
                if (state.map) state.map.closePopup();
            }
        }
    }

    function setLanguage(lang) {
        if (!state.i18n[lang]) return;

        state.currentLanguage = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('preferredLanguage', lang);

        // Update static UI text from data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (state.i18n[lang][key]) {
                el.innerHTML = state.i18n[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (state.i18n[lang][key]) {
                el.placeholder = state.i18n[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.dataset.i18nAriaLabel;
            if (state.i18n[lang][key]) {
                el.setAttribute('aria-label', state.i18n[lang][key]);
            }
        });

        // Re-render dynamic content
        applyFilters(state.currentCategory, state.currentSubcategory, DOMElements.searchBar.value.toLowerCase());
        renderSubFilters(state.currentCategory);
    }


    // --- ANIMATIONS ---
    function setupIntersectionObserver() {
        const revealElements = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => observer.observe(el));
    }

    function handleLanguageSwitch(e) {
        const target = e.target.closest('input[name="lang"]');
        if (!target) return;
        setLanguage(target.value);
    }

    function handleMobileMenuToggle(e) {
        e.stopPropagation(); // Prevent the document click listener from firing immediately
        const isOpen = DOMElements.headerDropdownMenu.classList.toggle('is-open');
        DOMElements.mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));

        // Move the controls to the dropdown menu when it's open, and back when it's closed.
        // This avoids cloning and issues with event listeners or duplicate IDs.
        if (isOpen) {
            DOMElements.headerDropdownMenu.appendChild(DOMElements.headerControls);
        } else {
            // When closing, move controls back to their original place in the header for desktop view.
            DOMElements.mobileMenuToggle.insertAdjacentElement('beforebegin', DOMElements.headerControls);
        }
    }

    // --- GAME LOGIC ---
    const gameState = {
        rows: 3,
        cols: 3,
        isSolved: false,
        rotations: []
    };

    function createGameGrid() {
        if (!DOMElements.gameGrid) return;

        DOMElements.gameGrid.innerHTML = '';
        DOMElements.gameGrid.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
        DOMElements.gameGrid.style.gridTemplateRows = `repeat(${gameState.rows}, 1fr)`;
        gameState.rotations = [];

        const totalCells = gameState.rows * gameState.cols;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.dataset.index = i;
            cell.tabIndex = 0; // For keyboard accessibility

            const row = Math.floor(i / gameState.cols);
            const col = i % gameState.cols;

            // Adjust background position and size to show a slice of the logo
            const bgPosX = (gameState.cols > 1) ? (col * 100) / (gameState.cols - 1) : 0;
            const bgPosY = (gameState.rows > 1) ? (row * 100) / (gameState.rows - 1) : 0;
            cell.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
            cell.style.backgroundSize = `${gameState.cols * 100}% ${gameState.rows * 100}%`;

            DOMElements.gameGrid.appendChild(cell);
            gameState.rotations.push(0);
        }
    }

    function shuffleGameGrid() {
        if (!DOMElements.gameGrid) return;

        gameState.isSolved = false;
        DOMElements.communityProjectGame.classList.remove('game-solved-state', 'game-message-hidden');
        const cells = DOMElements.gameGrid.children;
        let isStillSolved = true;

        for (let i = 0; i < cells.length; i++) {
            const randomRotation = Math.floor(Math.random() * 4) * 90;
            cells[i].style.transform = `rotate(${randomRotation}deg)`;
            gameState.rotations[i] = randomRotation;
            if (randomRotation !== 0) {
                isStillSolved = false;
            }
        }

        // Ensure it's not solved from the start
        if (isStillSolved && cells.length > 0) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            const randomRotation = (Math.floor(Math.random() * 3) + 1) * 90; // 90, 180, or 270
            cells[randomIndex].style.transform = `rotate(${randomRotation}deg)`;
            gameState.rotations[randomIndex] = randomRotation;
        }
    }

    function checkWinCondition() {
        if (gameState.isSolved) return; // Don't re-check if already solved
        const isWon = gameState.rotations.every(rot => rot % 360 === 0);
        if (isWon) {
            gameState.isSolved = true;
            DOMElements.communityProjectGame.classList.add('game-solved-state');
            // Hide message after a delay, but keep the glow effect
            setTimeout(() => {
                DOMElements.communityProjectGame.classList.add('game-message-hidden');
            }, 2500);
        }
    }

    function handleCellInteraction(cell) {
        if (gameState.isSolved || !cell) return;

        const index = parseInt(cell.dataset.index, 10);
        const newRotation = (gameState.rotations[index] + 90);

        gameState.rotations[index] = newRotation;
        cell.style.transform = `rotate(${newRotation}deg)`;

        checkWinCondition();
    }

    function initGame() {
        if (!DOMElements.gameGrid) return;
        createGameGrid();
        shuffleGameGrid();
    }

    // --- INITIALIZATION ---
    function setupEventListeners() {
        DOMElements.filters.addEventListener('click', handleFilter);
        DOMElements.subFilters.addEventListener('click', handleSubFilter);
        DOMElements.viewSwitcher.addEventListener('click', handleViewSwitch);
        DOMElements.searchBar.addEventListener('input', handleSearch);
        DOMElements.languageSwitcher.addEventListener('change', handleLanguageSwitch);
        DOMElements.grid.addEventListener('click', handleCardClick);
        DOMElements.destinationsList.addEventListener('click', handleCardClick);
        DOMElements.modalCloseBtn.addEventListener('click', () => DOMElements.modal.close());
        DOMElements.mobileMenuToggle.addEventListener('click', handleMobileMenuToggle);

        // Game Event Listeners
        if (DOMElements.gameGrid) {
            DOMElements.shuffleBtn.addEventListener('click', shuffleGameGrid);
            DOMElements.gameGrid.addEventListener('click', (e) => handleCellInteraction(e.target.closest('.game-cell')));
            DOMElements.gameGrid.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const cell = e.target.closest('.game-cell');
                    if (cell) {
                        e.preventDefault(); // Prevent page scroll on space
                        handleCellInteraction(cell);
                    }
                }
            });
        }
        DOMElements.scrollToTopBtn.addEventListener('click', () => {
            DOMElements.destinationsSection.scrollIntoView({ behavior: 'smooth' });
        });
        document.addEventListener('click', handleMapPopupClick); // Listen on document for popups

        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (DOMElements.headerDropdownMenu.classList.contains('is-open') && !DOMElements.mobileMenuToggle.contains(e.target) && !DOMElements.headerDropdownMenu.contains(e.target) && !DOMElements.headerControls.contains(e.target)) {
                DOMElements.headerDropdownMenu.classList.remove('is-open');
                DOMElements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
                // Also move controls back
                DOMElements.mobileMenuToggle.insertAdjacentElement('beforebegin', DOMElements.headerControls);
            }
        });

        // Handle window resize to ensure controls are in the correct place
        const mediaQuery = window.matchMedia('(min-width: 769px)');
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) { // If we are on desktop view
                // Ensure controls are in the main header, not the dropdown
                DOMElements.mobileMenuToggle.insertAdjacentElement('beforebegin', DOMElements.headerControls);
                // And close the mobile menu if it was open
                if (DOMElements.headerDropdownMenu.classList.contains('is-open')) {
                    DOMElements.headerDropdownMenu.classList.remove('is-open');
                    DOMElements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Handle hiding header on scroll
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const headerHeight = DOMElements.siteHeader.offsetHeight;
            const currentScrollY = window.scrollY;

            // Do not hide header if mobile menu is open
            if (DOMElements.headerDropdownMenu.classList.contains('is-open')) {
                return;
            }

            if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
                // Scrolling down
                DOMElements.siteHeader.classList.add('site-header--hidden');
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up
                DOMElements.siteHeader.classList.remove('site-header--hidden');
            }

            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;

            // Handle scroll-to-top button visibility
            const scrollThreshold = DOMElements.destinationsSection.offsetTop + 200; // Show after scrolling 200px into the section
            if (window.scrollY > scrollThreshold) {
                DOMElements.scrollToTopBtn.classList.add('visible');
            } else {
                DOMElements.scrollToTopBtn.classList.remove('visible');
            }
        });
    }


    async function init() {
        // 1. Determine initial language and fetch translations
        const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
        await fetchI18n();

        // 2. Update splash screen text early
        DOMElements.splashScreen.querySelector('h1').textContent = state.i18n[preferredLanguage]?.splash_title || 'Discover Bio Bío';

        // 3. Fetch main data
        await fetchDestinations();

        // 4. Set up language switcher state
        const langRadio = document.getElementById(`lang-${preferredLanguage}`);
        if (langRadio) langRadio.checked = true;

        // 5. Initialize map
        initMap();

        // 6. Set language and perform initial render of all content
        setLanguage(preferredLanguage);

        // 7. Setup listeners and animations
        setupEventListeners();
        setupIntersectionObserver();
        // 8. Initialize the game
        initGame();

        // 8. Hide splash screen
        setTimeout(() => {
            DOMElements.splashScreen.classList.add('hidden');
        }, 500);
    }

    // --- RUN ---
    init(); // The script is deferred, so the DOM is ready when this runs.

})();