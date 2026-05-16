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

let editingBookmarkId = null;

const storage = (typeof browser !== 'undefined') ? browser.storage.local : chrome.storage.local;

const SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
};

const LINKS_PER_ROW = 8;
const MAX_SHORTCUTS = 16;

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
const FONT_FAMILY_CLASSES = ['font-family-sans', 'font-family-serif', 'font-family-system'];

function storageGet(keys) {
    return new Promise((resolve) => storage.get(keys, resolve));
}

function storageSet(obj) {
    return new Promise((resolve) => storage.set(obj, resolve));
}

const FETCH_TIMEOUT_MS = 8000;
const REFILL_DEBOUNCE_MS = 350;
const LOW_BATCH_THRESHOLD = 5;

let refillPromise = null;
let refillDebounceTimer = null;

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

function displayQuote(text, author) {
    quoteEl.textContent = `"${text}"`;
    authorEl.textContent = `- ${author}`;
}

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

function createBookmarkTile(item) {
    const tile = document.createElement('div');
    tile.className = 'bookmark-tile';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'bookmark-edit-btn';
    editBtn.title = 'Edit bookmark';
    editBtn.setAttribute('aria-label', `Edit ${item.title}`);
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', (e) => {
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

    const label = document.createElement('span');
    label.textContent = item.title;

    link.appendChild(icon);
    link.appendChild(label);
    tile.appendChild(editBtn);
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

function openBookmarkModal(bookmarkId) {
    editingBookmarkId = bookmarkId;
    bookmarkModalDelete.classList.toggle('hidden', !bookmarkId);
    bookmarkModalHeading.textContent = bookmarkId ? 'Edit bookmark' : 'Add bookmark';

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
    if (!title || !url) return;

    try {
        new URL(url);
    } catch {
        return;
    }

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

async function migrateLegacyDashboardFlags(data) {
    if (data.dashboardEnabled && data.searchEnabled === undefined) {
        const patch = { searchEnabled: true, bookmarksEnabled: true };
        await storageSet(patch);
        return { ...data, ...patch };
    }
    return data;
}

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

    if (bgMode === 'preset' && bgPreset) {
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

function applyAllSettings(settings) {
    applyAppearance(settings);
    applyQuotePosition(settings.quotePosition ?? DEFAULTS.quotePosition);
    applyDashboard(settings);
}

async function loadAndApplySettings() {
    let data = await storageGet([...SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'), 'dashboardEnabled']);
    data = await migrateLegacyDashboardFlags(data);
    applyAllSettings(data);
    return data;
}

async function saveSettings(partial) {
    await storageSet(partial);
    const data = await storageGet(SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'));
    applyAllSettings(data);
}

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

editBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));

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

fontSizeSelect.addEventListener('change', (e) => {
    saveSettings({ fontSize: e.target.value });
});

fontFamilySelect.addEventListener('change', (e) => {
    saveSettings({ fontFamily: e.target.value });
});

fontItalicCheck.addEventListener('change', (e) => {
    saveSettings({ fontItalic: e.target.checked });
});

quotePositionSelect.addEventListener('change', (e) => {
    saveSettings({ quotePosition: e.target.value });
});

searchEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ searchEnabled: e.target.checked });
});

bookmarksEnabledCheck.addEventListener('change', (e) => {
    saveSettings({ bookmarksEnabled: e.target.checked });
});

bookmarkModalSave.addEventListener('click', () => saveBookmarkFromModal());
bookmarkModalCancel.addEventListener('click', () => closeBookmarkModal());
bookmarkModalDelete.addEventListener('click', () => deleteBookmarkFromModal());
bookmarkModalBackdrop.addEventListener('click', () => closeBookmarkModal());

bookmarkModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBookmarkModal();
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

resetSettingsBtn.addEventListener('click', async () => {
    const data = await storageGet(['quoteBatch', 'lastRemoteQuotes', 'lastRemoteQuotesAt']);
    await storageSet({
        ...DEFAULTS,
        quoteBatch: data.quoteBatch,
        lastRemoteQuotes: data.lastRemoteQuotes,
        lastRemoteQuotesAt: data.lastRemoteQuotesAt,
    });
    closeBookmarkModal();
    applyAllSettings(DEFAULTS);
});

buildPresetGrid();
loadAndApplySettings().then(() => getNextQuote());
