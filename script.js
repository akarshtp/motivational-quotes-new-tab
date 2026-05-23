/* ═══════════════════════ DOM REFERENCES ═══════════════════════ */
const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('author');
const dashboardEl = document.getElementById('dashboard');
const searchSection = document.getElementById('search-section');
const bookmarksSection = document.getElementById('bookmarks-section');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const bookmarksRow1 = document.getElementById('bookmarks-row-1');
const bookmarksRow2 = document.getElementById('bookmarks-row-2');
const bookmarkModal = document.getElementById('bookmark-modal');
const bookmarkModalBackdrop = document.getElementById('bookmark-modal-backdrop');
const bookmarkModalHeading = document.getElementById('bookmark-modal-heading');
const bookmarkModalName = document.getElementById('bookmark-modal-name');
const bookmarkModalUrl = document.getElementById('bookmark-modal-url');
const bookmarkModalSave = document.getElementById('bookmark-modal-save');
const bookmarkModalCancel = document.getElementById('bookmark-modal-cancel');
const bookmarkModalDelete = document.getElementById('bookmark-modal-delete');
const bgPicker = document.getElementById('bg-picker');
const textPicker = document.getElementById('text-picker');
const editBtn = document.getElementById('edit-btn');
const settingsPanel = document.getElementById('settings-panel');
const fontSizeSelect = document.getElementById('font-size-select');
const fontFamilySelect = document.getElementById('font-family-select');
const fontItalicCheck = document.getElementById('font-italic-check');
const bgPresetGrid = document.getElementById('bg-preset-grid');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const quotePositionSelect = document.getElementById('quote-position-select');
const searchEnabledCheck = document.getElementById('search-enabled-check');
const bookmarksEnabledCheck = document.getElementById('bookmarks-enabled-check');
const dashboardOptionsEl = document.getElementById('dashboard-options');
const dashboardThemeSelect = document.getElementById('dashboard-theme-select');
const bookmarkRowsSelect = document.getElementById('bookmark-rows-select');
const searchEngineSelect = document.getElementById('search-engine-select');
const clockContainer = document.getElementById('clock-container');
const clockTimeEl = document.getElementById('clock-time');
const clockDateEl = document.getElementById('clock-date');
const greetingEl = document.getElementById('greeting');
const copyBtn = document.getElementById('copy-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const toastEl = document.getElementById('toast');
const clockEnabledCheck = document.getElementById('clock-enabled-check');
const clockFormatSelect = document.getElementById('clock-format-select');
const clockFormatRow = document.getElementById('clock-format-row');
const greetingEnabledCheck = document.getElementById('greeting-enabled-check');
const favoritesModal = document.getElementById('favorites-modal');
const favoritesModalBackdrop = document.getElementById('favorites-modal-backdrop');
const favoritesModalClose = document.getElementById('favorites-modal-close');
const favoritesModalList = document.getElementById('favorites-modal-list');
const viewFavoritesBtn = document.getElementById('view-favorites-btn');
const favoritesCountEl = document.getElementById('favorites-count');
const confirmModal = document.getElementById('confirm-modal');
const confirmModalBackdrop = document.getElementById('confirm-modal-backdrop');
const confirmModalCancel = document.getElementById('confirm-modal-cancel');
const confirmModalConfirm = document.getElementById('confirm-modal-confirm');
const bgCustomBtn = document.getElementById('bg-custom-btn');
const bgCustomRemove = document.getElementById('bg-custom-remove');
const bgCustomInput = document.getElementById('bg-custom-input');

/* ═══════════════════════ STATE ═══════════════════════ */
let editingBookmarkId = null;
let currentQuote = { q: '', a: '' };
let clockInterval = null;
let toastTimeout = null;
let settingsPanelOpen = false;
let cachedBgCustomImage = null;

/* ═══════════════════════ STORAGE ═══════════════════════ */
const storage = (typeof browser !== 'undefined') ? browser.storage.local : chrome.storage.local;

function storageGet(keys) {
    return new Promise((resolve) => storage.get(keys, resolve));
}

function storageSet(obj) {
    return new Promise((resolve) => storage.set(obj, resolve));
}

/* ═══════════════════════ CONSTANTS ═══════════════════════ */
const SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
};

const LINKS_PER_ROW = 8;
const MAX_SHORTCUTS = 16;
const MAX_FAVORITES = 50;

const QUOTE_POSITION_CLASSES = ['quote-position-center', 'quote-position-top', 'quote-position-bottom'];

const SETTINGS_KEYS = [
    'bgColor',
    'textColor',
    'bgMode',
    'bgPreset',
    'fontSize',
    'fontFamily',
    'fontItalic',
    'quotePosition',
    'searchEnabled',
    'bookmarksEnabled',
    'dashboardTheme',
    'bookmarkRows',
    'searchEngine',
    'shortcuts',
    'quoteBatch',
    'clockEnabled',
    'clockFormat',
    'greetingEnabled',
    'favorites',
];

const DEFAULTS = {
    bgColor: '#000000',
    textColor: '#ffffff',
    bgMode: 'solid',
    bgPreset: null,
    fontSize: 'medium',
    fontFamily: 'sans',
    fontItalic: true,
    quotePosition: 'center',
    searchEnabled: false,
    bookmarksEnabled: false,
    dashboardTheme: 'dark',
    bookmarkRows: 1,
    searchEngine: 'google',
    shortcuts: [],
    clockEnabled: true,
    clockFormat: '12h',
    greetingEnabled: true,
    favorites: [],
};

const BG_PRESETS = [
    { id: 'sunset', label: 'Sunset' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'forest', label: 'Forest' },
    { id: 'lavender', label: 'Lavender' },
    { id: 'rose', label: 'Rose' },
    { id: 'midnight', label: 'Midnight' },
    { id: 'aurora', label: 'Aurora' },
    { id: 'ember', label: 'Ember' },
];

const FONT_SIZE_CLASSES = ['font-size-small', 'font-size-medium', 'font-size-large'];
const FONT_FAMILY_CLASSES = ['font-family-sans', 'font-family-serif', 'font-family-mono', 'font-family-cursive', 'font-family-system'];

const FETCH_TIMEOUT_MS = 8000;
const REFILL_DEBOUNCE_MS = 350;
const LOW_BATCH_THRESHOLD = 5;

let refillPromise = null;
let refillDebounceTimer = null;

/* ═══════════════════════ QUOTE FETCHING ═══════════════════════ */
function randomBundledQuote() {
    const arr = BUNDLED_QUOTES;
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleBundledForFallback(count) {
    const copy = [...BUNDLED_QUOTES];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = copy[i];
        copy[i] = copy[j];
        copy[j] = t;
    }
    return copy.slice(0, Math.min(count, copy.length));
}

async function fetchRemoteQuotes() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch('https://zenquotes.io/api/quotes/', {
            signal: controller.signal,
            cache: 'default',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty payload');
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function mergeQuotesIntoStorage(newQuotes, displayImmediately) {
    const data = await storageGet(['quoteBatch']);
    const existing = data.quoteBatch || [];
    const combined = [...existing, ...newQuotes];
    await storageSet({ quoteBatch: combined });

    if (displayImmediately && newQuotes.length > 0) {
        displayQuote(newQuotes[0].q, newQuotes[0].a);
    }
}

async function refillBatch(displayImmediately = false) {
    if (refillPromise) return refillPromise;

    refillPromise = (async () => {
        try {
            const newQuotes = await fetchRemoteQuotes();
            await storageSet({
                lastRemoteQuotes: newQuotes,
                lastRemoteQuotesAt: Date.now(),
            });
            await mergeQuotesIntoStorage(newQuotes, displayImmediately);
        } catch (_err) {
            const data = await storageGet(['quoteBatch', 'lastRemoteQuotes']);
            const existing = data.quoteBatch || [];
            let inject = Array.isArray(data.lastRemoteQuotes) ? data.lastRemoteQuotes : [];
            if (inject.length === 0) inject = shuffleBundledForFallback(15);
            const combined = [...existing, ...inject];
            await storageSet({ quoteBatch: combined });

            if (displayImmediately && inject.length > 0) {
                displayQuote(inject[0].q, inject[0].a);
            } else if (displayImmediately) {
                const b = randomBundledQuote();
                displayQuote(b.q, b.a);
            }
        } finally {
            refillPromise = null;
        }
    })();

    return refillPromise;
}

function scheduleRefill() {
    if (refillDebounceTimer) clearTimeout(refillDebounceTimer);
    refillDebounceTimer = setTimeout(() => {
        refillDebounceTimer = null;
        refillBatch(false);
    }, REFILL_DEBOUNCE_MS);
}

/* ═══════════════════════ DISPLAY QUOTE ═══════════════════════ */
function displayQuote(text, author) {
    currentQuote = { q: text, a: author };
    quoteEl.textContent = `\u201C${text}\u201D`;
    authorEl.textContent = `\u2014 ${author}`;
    updateFavButton();
}

/* ═══════════════════════ CLOCK ═══════════════════════ */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function updateClock(format) {
    const now = new Date();
    const fmt = format || '12h';

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let timeStr;

    if (fmt === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        timeStr = `${hours}:${minutes} ${ampm}`;
    } else {
        timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    clockTimeEl.textContent = timeStr;
    clockDateEl.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;

    /* Keep greeting in sync if visible */
    if (!greetingEl.classList.contains('hidden')) {
        const fresh = getGreeting();
        if (greetingEl.textContent !== fresh) greetingEl.textContent = fresh;
    }
}

function startClock(format) {
    if (clockInterval) clearInterval(clockInterval);
    updateClock(format);
    clockInterval = setInterval(() => updateClock(format), 1000);
}

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

/* ═══════════════════════ GREETING ═══════════════════════ */
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function updateGreeting() {
    greetingEl.textContent = getGreeting();
}

/* ═══════════════════════ TOAST ═══════════════════════ */
function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
        toastTimeout = null;
    }, 2000);
}

/* ═══════════════════════ COPY QUOTE ═══════════════════════ */
function copyQuote() {
    const text = `\u201C${currentQuote.q}\u201D \u2014 ${currentQuote.a}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Quote copied!');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

/* ═══════════════════════ FAVORITES ═══════════════════════ */
async function toggleFavorite() {
    const data = await storageGet(['favorites']);
    const favs = data.favorites || [];

    const idx = favs.findIndex((f) => f.q === currentQuote.q && f.a === currentQuote.a);
    if (idx >= 0) {
        favs.splice(idx, 1);
        showToast('Removed from favorites');
    } else {
        if (favs.length >= MAX_FAVORITES) {
            showToast('Favorites list is full (max 50)');
            return;
        }
        favs.push({ q: currentQuote.q, a: currentQuote.a });
        showToast('Added to favorites!');
    }

    await storageSet({ favorites: favs });
    updateFavButton();
    updateFavoritesCount(favs);
}

function updateFavButton() {
    storageGet(['favorites']).then((data) => {
        const favs = data.favorites || [];
        const isFav = favs.some((f) => f.q === currentQuote.q && f.a === currentQuote.a);
        favBtn.classList.toggle('active', isFav);
        favIcon.setAttribute('fill', isFav ? 'currentColor' : 'none');
    });
}

function updateFavoritesCount(favs) {
    const count = (favs && favs.length) || 0;
    favoritesCountEl.textContent = count > 0 ? `(${count})` : '';
}

function openFavoritesModal() {
    storageGet(['favorites']).then((data) => {
        renderFavoritesModal(data.favorites || []);
        favoritesModal.classList.remove('hidden');
    });
}

function closeFavoritesModal() {
    favoritesModal.classList.add('hidden');
}

function renderFavoritesModal(favs) {
    if (!favs || favs.length === 0) {
        favoritesModalList.innerHTML = '<p class="favorites-empty">No favorites yet \u2014 tap \u2665 on a quote to save it here.</p>';
        return;
    }
    favoritesModalList.innerHTML = '';
    favs.forEach((fav, i) => {
        const item = document.createElement('div');
        item.className = 'favorite-item';

        const content = document.createElement('div');
        content.className = 'favorite-content';

        const text = document.createElement('span');
        text.className = 'favorite-text';
        text.textContent = `\u201C${fav.q}\u201D`;

        const author = document.createElement('span');
        author.className = 'favorite-author';
        author.textContent = `\u2014 ${fav.a}`;

        content.appendChild(text);
        content.appendChild(author);

        const actions = document.createElement('div');
        actions.className = 'favorite-actions';

        const copyFavBtn = document.createElement('button');
        copyFavBtn.type = 'button';
        copyFavBtn.className = 'favorite-copy';
        copyFavBtn.title = 'Copy quote';
        copyFavBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyFavBtn.addEventListener('click', () => {
            const text = `\u201C${fav.q}\u201D \u2014 ${fav.a}`;
            navigator.clipboard.writeText(text).then(() => showToast('Quote copied!'));
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'favorite-remove';
        removeBtn.title = 'Remove from favorites';
        removeBtn.textContent = '\u00D7';
        removeBtn.addEventListener('click', () => removeFavorite(i));

        actions.appendChild(copyFavBtn);
        actions.appendChild(removeBtn);

        item.appendChild(content);
        item.appendChild(actions);
        favoritesModalList.appendChild(item);
    });
}

async function removeFavorite(index) {
    const data = await storageGet(['favorites']);
    const favs = data.favorites || [];
    favs.splice(index, 1);
    await storageSet({ favorites: favs });
    updateFavButton();
    updateFavoritesCount(favs);
    renderFavoritesModal(favs);
    showToast('Removed from favorites');
}

/* ═══════════════════════ HELPERS ═══════════════════════ */
function presetImageUrl(presetId) {
    return `backgrounds/${presetId}.webp`;
}

function normalizeUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function shortcutInitial(title, url) {
    const t = (title || '').trim();
    if (t) return t.charAt(0).toUpperCase();
    try {
        return new URL(normalizeUrl(url)).hostname.charAt(0).toUpperCase();
    } catch {
        return '?';
    }
}

function newShortcutId() {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 40%)`;
}

/* ═══════════════════════ UI HELPERS ═══════════════════════ */
function updatePresetButtonsActive(activeId) {
    bgPresetGrid.querySelectorAll('.bg-preset-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.preset === activeId);
    });
}

function applyQuotePosition(position) {
    QUOTE_POSITION_CLASSES.forEach((c) => document.body.classList.remove(c));
    const valid = ['center', 'top', 'bottom'];
    const pos = valid.includes(position) ? position : DEFAULTS.quotePosition;
    document.body.classList.add(`quote-position-${pos}`);
    quotePositionSelect.value = pos;
}

/* ═══════════════════════ BOOKMARKS ═══════════════════════ */
function createBookmarkTile(item) {
    const tile = document.createElement('div');
    tile.className = 'bookmark-tile';

    const editBtnEl = document.createElement('button');
    editBtnEl.type = 'button';
    editBtnEl.className = 'bookmark-edit-btn';
    editBtnEl.title = 'Edit bookmark';
    editBtnEl.setAttribute('aria-label', `Edit ${item.title}`);
    editBtnEl.textContent = '\u270E';
    editBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openBookmarkModal(item.id);
    });

    const link = document.createElement('a');
    link.className = 'bookmark-link';
    link.href = item.url;
    link.title = item.title;

    const icon = document.createElement('span');
    icon.className = 'bookmark-icon';
    icon.textContent = shortcutInitial(item.title, item.url);
    icon.style.backgroundColor = stringToColor(item.title || item.url);

    const label = document.createElement('span');
    label.textContent = item.title;

    link.appendChild(icon);
    link.appendChild(label);
    tile.appendChild(editBtnEl);
    tile.appendChild(link);
    return tile;
}

function createAddBookmarkTile() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bookmark-add-tile';
    btn.title = 'Add bookmark';
    btn.setAttribute('aria-label', 'Add bookmark');
    btn.innerHTML = '<span class="bookmark-add-icon">+</span><span>Add</span>';
    btn.addEventListener('click', () => openBookmarkModal(null));
    return btn;
}

function renderBookmarkRow(container, items, includeAddButton) {
    container.innerHTML = '';
    items.forEach((item) => container.appendChild(createBookmarkTile(item)));
    if (includeAddButton) container.appendChild(createAddBookmarkTile());
}

function renderBookmarks(shortcuts, rows) {
    const list = shortcuts || [];
    const row1Items = list.slice(0, LINKS_PER_ROW);
    const row2Items = rows === 2 ? list.slice(LINKS_PER_ROW, LINKS_PER_ROW * 2) : [];
    const canAddMore = list.length < MAX_SHORTCUTS;

    renderBookmarkRow(
        bookmarksRow1,
        row1Items,
        canAddMore && (rows === 1 || row1Items.length < LINKS_PER_ROW),
    );
    renderBookmarkRow(
        bookmarksRow2,
        row2Items,
        canAddMore && rows === 2 && row1Items.length >= LINKS_PER_ROW,
    );
}

/* ═══════════════════════ BOOKMARK MODAL ═══════════════════════ */
function openBookmarkModal(bookmarkId) {
    editingBookmarkId = bookmarkId;
    bookmarkModalDelete.classList.toggle('hidden', !bookmarkId);
    bookmarkModalHeading.textContent = bookmarkId ? 'Edit bookmark' : 'Add bookmark';

    /* Clear validation errors */
    bookmarkModalName.classList.remove('input-error');
    bookmarkModalUrl.classList.remove('input-error');

    if (bookmarkId) {
        storageGet(['shortcuts']).then((data) => {
            const item = (data.shortcuts || []).find((s) => s.id === bookmarkId);
            bookmarkModalName.value = item ? item.title : '';
            bookmarkModalUrl.value = item ? item.url : '';
        });
    } else {
        bookmarkModalName.value = '';
        bookmarkModalUrl.value = '';
    }

    bookmarkModal.classList.remove('hidden');
    bookmarkModalName.focus();
}

function closeBookmarkModal() {
    editingBookmarkId = null;
    bookmarkModal.classList.add('hidden');
}

async function saveBookmarkFromModal() {
    const title = bookmarkModalName.value.trim();
    const url = normalizeUrl(bookmarkModalUrl.value);

    /* Clear previous errors and force reflow so animation can replay */
    bookmarkModalName.classList.remove('input-error');
    bookmarkModalUrl.classList.remove('input-error');
    void bookmarkModalName.offsetHeight;

    let hasError = false;
    if (!title) {
        bookmarkModalName.classList.add('input-error');
        hasError = true;
    }
    if (!url) {
        bookmarkModalUrl.classList.add('input-error');
        hasError = true;
    } else {
        try {
            new URL(url);
        } catch {
            bookmarkModalUrl.classList.add('input-error');
            hasError = true;
        }
    }
    if (hasError) return;

    const data = await storageGet(['shortcuts']);
    const list = data.shortcuts || [];

    if (editingBookmarkId) {
        const idx = list.findIndex((s) => s.id === editingBookmarkId);
        if (idx >= 0) {
            list[idx].title = title;
            list[idx].url = url;
        }
    } else {
        if (list.length >= MAX_SHORTCUTS) return;
        list.push({ id: newShortcutId(), title, url });
    }

    await saveSettings({ shortcuts: list });
    closeBookmarkModal();
}

async function deleteBookmarkFromModal() {
    if (!editingBookmarkId) return;
    const data = await storageGet(['shortcuts']);
    const list = (data.shortcuts || []).filter((s) => s.id !== editingBookmarkId);
    await saveSettings({ shortcuts: list });
    closeBookmarkModal();
}

/* ═══════════════════════ MIGRATION ═══════════════════════ */
async function migrateLegacyDashboardFlags(data) {
    if (data.dashboardEnabled && data.searchEnabled === undefined) {
        const patch = { searchEnabled: true, bookmarksEnabled: true };
        await storageSet(patch);
        return { ...data, ...patch };
    }
    return data;
}

/* ═══════════════════════ APPLY SETTINGS ═══════════════════════ */
function applyDashboard(settings) {
    const searchOn = !!(settings.searchEnabled ?? DEFAULTS.searchEnabled);
    const bookmarksOn = !!(settings.bookmarksEnabled ?? DEFAULTS.bookmarksEnabled);
    const anyDashboard = searchOn || bookmarksOn;
    const theme = settings.dashboardTheme ?? DEFAULTS.dashboardTheme;
    const rows = Number(settings.bookmarkRows ?? DEFAULTS.bookmarkRows);
    const engine = settings.searchEngine ?? DEFAULTS.searchEngine;
    const shortcuts = Array.isArray(settings.shortcuts) ? settings.shortcuts : [];

    document.body.classList.toggle('dashboard-active', anyDashboard);
    dashboardEl.classList.toggle('hidden', !anyDashboard);
    searchSection.classList.toggle('hidden', !searchOn);
    bookmarksSection.classList.toggle('hidden', !bookmarksOn);
    dashboardOptionsEl.classList.toggle('disabled', !anyDashboard);

    searchEnabledCheck.checked = searchOn;
    bookmarksEnabledCheck.checked = bookmarksOn;
    dashboardThemeSelect.value = theme;
    bookmarkRowsSelect.value = String(rows === 2 ? 2 : 1);
    searchEngineSelect.value = SEARCH_ENGINES[engine] ? engine : 'google';

    dashboardEl.classList.remove('theme-dark', 'theme-light');
    dashboardEl.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');

    bookmarksRow2.classList.toggle('hidden', !bookmarksOn || rows !== 2);

    if (bookmarksOn) {
        renderBookmarks(shortcuts, rows);
    }
}

function applyAppearance(settings) {
    const bgColor = settings.bgColor ?? DEFAULTS.bgColor;
    const textColor = settings.textColor ?? DEFAULTS.textColor;
    const bgMode = settings.bgMode ?? DEFAULTS.bgMode;
    const bgPreset = settings.bgPreset ?? DEFAULTS.bgPreset;
    const fontSize = settings.fontSize ?? DEFAULTS.fontSize;
    const fontFamily = settings.fontFamily ?? DEFAULTS.fontFamily;
    const fontItalic = settings.fontItalic ?? DEFAULTS.fontItalic;

    document.body.style.color = textColor;
    textPicker.value = textColor;

    FONT_SIZE_CLASSES.forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(`font-size-${fontSize}`);
    fontSizeSelect.value = fontSize;

    FONT_FAMILY_CLASSES.forEach((c) => document.body.classList.remove(c));
    if (fontFamily === 'sans') {
        document.body.style.fontFamily = '';
    } else {
        document.body.classList.add(`font-family-${fontFamily}`);
    }
    fontFamilySelect.value = fontFamily;

    document.body.classList.toggle('font-not-italic', !fontItalic);
    fontItalicCheck.checked = fontItalic;

    bgCustomRemove.classList.toggle('hidden', !cachedBgCustomImage);

    if (bgMode === 'custom' && cachedBgCustomImage) {
        document.body.classList.add('has-bg-preset');
        document.body.style.backgroundImage = `url("${cachedBgCustomImage}")`;
        document.body.style.backgroundColor = '';
        bgPicker.value = bgColor;
        updatePresetButtonsActive(null);
    } else if (bgMode === 'preset' && bgPreset) {
        document.body.classList.add('has-bg-preset');
        document.body.style.backgroundImage = `url("${presetImageUrl(bgPreset)}")`;
        document.body.style.backgroundColor = '';
        bgPicker.value = bgColor;
        updatePresetButtonsActive(bgPreset);
    } else {
        document.body.classList.remove('has-bg-preset');
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = bgColor;
        bgPicker.value = bgColor;
        updatePresetButtonsActive(null);
    }
}

function applyClock(settings) {
    const clockOn = !!(settings.clockEnabled ?? DEFAULTS.clockEnabled);
    const format = settings.clockFormat ?? DEFAULTS.clockFormat;

    clockContainer.classList.toggle('hidden', !clockOn);
    clockEnabledCheck.checked = clockOn;
    clockFormatSelect.value = format;
    clockFormatRow.classList.toggle('disabled', !clockOn);

    if (clockOn) {
        startClock(format);
    } else {
        stopClock();
    }
}

function applyGreeting(settings) {
    const greetingOn = !!(settings.greetingEnabled ?? DEFAULTS.greetingEnabled);
    greetingEl.classList.toggle('hidden', !greetingOn);
    greetingEnabledCheck.checked = greetingOn;

    if (greetingOn) {
        updateGreeting();
    }
}

function applyAllSettings(settings) {
    applyAppearance(settings);
    applyQuotePosition(settings.quotePosition ?? DEFAULTS.quotePosition);
    applyDashboard(settings);
    applyClock(settings);
    applyGreeting(settings);
    updateFavoritesCount(settings.favorites || []);
}

/* ═══════════════════════ LOAD / SAVE ═══════════════════════ */
async function loadAndApplySettings() {
    let data = await storageGet([...SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'), 'dashboardEnabled', 'bgCustomImage']);
    data = await migrateLegacyDashboardFlags(data);
    cachedBgCustomImage = data.bgCustomImage || null;
    applyAllSettings(data);
    return data;
}

async function saveSettings(partial) {
    if (partial.bgCustomImage !== undefined) {
        cachedBgCustomImage = partial.bgCustomImage;
    }
    await storageSet(partial);
    const data = await storageGet(SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'));
    data.bgCustomImage = cachedBgCustomImage;
    applyAllSettings(data);
}

/* ═══════════════════════ IMAGE PROCESSING ═══════════════════════ */
function processImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_W = 1920;
                const MAX_H = 1080;
                let w = img.width;
                let h = img.height;

                if (w > MAX_W || h > MAX_H) {
                    const ratio = Math.min(MAX_W / w, MAX_H / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/* ═══════════════════════ PRESET GRID ═══════════════════════ */
function buildPresetGrid() {
    bgPresetGrid.innerHTML = '';
    BG_PRESETS.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-preset-btn';
        btn.dataset.preset = id;
        btn.title = label;
        btn.style.backgroundImage = `url("${presetImageUrl(id)}")`;
        btn.addEventListener('click', () => {
            saveSettings({ bgMode: 'preset', bgPreset: id });
        });
        bgPresetGrid.appendChild(btn);
    });
}

/* ═══════════════════════ NEXT QUOTE ═══════════════════════ */
async function getNextQuote() {
    const data = await storageGet(['quoteBatch']);
    const batch = data.quoteBatch || [];

    if (batch.length > 0) {
        const current = batch.shift();
        displayQuote(current.q, current.a);
        await storageSet({ quoteBatch: batch });

        if (batch.length < LOW_BATCH_THRESHOLD) scheduleRefill();
    } else {
        const b = randomBundledQuote();
        displayQuote(b.q, b.a);
        scheduleRefill();
    }
}

/* ═══════════════════════ SETTINGS PANEL ═══════════════════════ */
function openSettings() {
    settingsPanelOpen = true;
    settingsPanel.classList.add('open');
}

function closeSettings() {
    settingsPanelOpen = false;
    settingsPanel.classList.remove('open');
}

function toggleSettings() {
    if (settingsPanelOpen) closeSettings();
    else openSettings();
}

/* ═══════════════════════ ENTRY ANIMATION ═══════════════════════ */
function playEntryAnimation() {
    const targets = [
        document.querySelector('#clock-container:not(.hidden)'),
        document.querySelector('#greeting:not(.hidden)'),
        quoteEl,
        authorEl,
        document.getElementById('quote-actions'),
    ].filter(Boolean);

    let delay = 0;
    targets.forEach((el) => {
        el.style.animationDelay = `${delay}ms`;
        el.classList.add('anim-enter');
        el.addEventListener('animationend', () => {
            el.classList.remove('anim-enter');
            el.style.animationDelay = '';
        }, { once: true });
        delay += 100;
    });
}

/* ═══════════════════════ EVENT LISTENERS ═══════════════════════ */

/* Search */
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    storageGet(['searchEngine']).then((data) => {
        const key = SEARCH_ENGINES[data.searchEngine] ? data.searchEngine : 'google';
        const base = SEARCH_ENGINES[key];
        window.location.href = base + encodeURIComponent(query);
    });
});

/* Settings panel toggle */
editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSettings();
});

settingsPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

/* Close settings on outside click */
document.addEventListener('click', (e) => {
    if (settingsPanelOpen &&
        !settingsPanel.contains(e.target) &&
        e.target !== editBtn &&
        !bookmarkModal.contains(e.target) &&
        !favoritesModal.contains(e.target) &&
        !confirmModal.contains(e.target)) {
        closeSettings();
    }
});

/* Color pickers */
bgPicker.addEventListener('input', (e) => {
    saveSettings({
        bgMode: 'solid',
        bgPreset: null,
        bgColor: e.target.value,
    });
});

textPicker.addEventListener('input', (e) => {
    saveSettings({ textColor: e.target.value });
});

/* Font controls */
fontSizeSelect.addEventListener('change', (e) => {
    saveSettings({ fontSize: e.target.value });
});

fontFamilySelect.addEventListener('change', (e) => {
    saveSettings({ fontFamily: e.target.value });
});

fontItalicCheck.addEventListener('change', (e) => {
    saveSettings({ fontItalic: e.target.checked });
});

/* Position */
quotePositionSelect.addEventListener('change', (e) => {
    saveSettings({ quotePosition: e.target.value });
});

/* Dashboard */
searchEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ searchEnabled: e.target.checked });
});

bookmarksEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ bookmarksEnabled: e.target.checked });
});

dashboardThemeSelect.addEventListener('change', (e) => {
    saveSettings({ dashboardTheme: e.target.value });
});

bookmarkRowsSelect.addEventListener('change', (e) => {
    saveSettings({ bookmarkRows: Number(e.target.value) });
});

searchEngineSelect.addEventListener('change', (e) => {
    saveSettings({ searchEngine: e.target.value });
});

/* Clock & Greeting */
clockEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ clockEnabled: e.target.checked });
});

clockFormatSelect.addEventListener('change', (e) => {
    saveSettings({ clockFormat: e.target.value });
});

greetingEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ greetingEnabled: e.target.checked });
});

/* Copy & Favorite */
copyBtn.addEventListener('click', copyQuote);
favBtn.addEventListener('click', toggleFavorite);

/* Bookmark modal */
bookmarkModalSave.addEventListener('click', () => saveBookmarkFromModal());
bookmarkModalCancel.addEventListener('click', () => closeBookmarkModal());
bookmarkModalDelete.addEventListener('click', () => deleteBookmarkFromModal());
bookmarkModalBackdrop.addEventListener('click', () => closeBookmarkModal());

bookmarkModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBookmarkModal();
});

/* Favorites modal */
viewFavoritesBtn.addEventListener('click', openFavoritesModal);
favoritesModalClose.addEventListener('click', closeFavoritesModal);
favoritesModalBackdrop.addEventListener('click', closeFavoritesModal);
favoritesModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFavoritesModal();
});

/* Reset — with confirmation */
function openConfirmModal() {
    confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
    confirmModal.classList.add('hidden');
}

resetSettingsBtn.addEventListener('click', openConfirmModal);
confirmModalCancel.addEventListener('click', closeConfirmModal);
confirmModalBackdrop.addEventListener('click', closeConfirmModal);
confirmModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeConfirmModal();
});

confirmModalConfirm.addEventListener('click', async () => {
    const data = await storageGet(['quoteBatch', 'lastRemoteQuotes', 'lastRemoteQuotesAt', 'favorites']);
    cachedBgCustomImage = null;
    await storageSet({
        ...DEFAULTS,
        bgCustomImage: null,
        quoteBatch: data.quoteBatch,
        lastRemoteQuotes: data.lastRemoteQuotes,
        lastRemoteQuotesAt: data.lastRemoteQuotesAt,
        favorites: data.favorites || [],
    });
    closeConfirmModal();
    closeBookmarkModal();
    closeSettings();
    applyAllSettings({ ...DEFAULTS, favorites: data.favorites || [] });
    showToast('Settings reset to defaults');
});

/* Custom background upload */
bgCustomBtn.addEventListener('click', () => bgCustomInput.click());

bgCustomInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    bgCustomInput.value = '';
    try {
        const dataUrl = await processImage(file);
        await saveSettings({ bgMode: 'custom', bgCustomImage: dataUrl });
        showToast('Background updated!');
    } catch {
        showToast('Failed to process image');
    }
});

bgCustomRemove.addEventListener('click', async () => {
    cachedBgCustomImage = null;
    await storageSet({ bgCustomImage: null });
    await saveSettings({ bgMode: 'solid', bgPreset: null });
    showToast('Custom image removed');
});

/* ═══════════════════════ INIT ═══════════════════════ */
buildPresetGrid();
loadAndApplySettings().then(() => {
    getNextQuote().then(() => playEntryAnimation());
});
