const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('author');
const bgPicker = document.getElementById('bg-picker');
const textPicker = document.getElementById('text-picker');
const editBtn = document.getElementById('edit-btn');
const settingsPanel = document.getElementById('settings-panel');
const fontSizeSelect = document.getElementById('font-size-select');
const fontFamilySelect = document.getElementById('font-family-select');
const fontItalicCheck = document.getElementById('font-italic-check');
const bgPresetGrid = document.getElementById('bg-preset-grid');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

const storage = (typeof browser !== 'undefined') ? browser.storage.local : chrome.storage.local;

const SETTINGS_KEYS = [
    'bgColor',
    'textColor',
    'bgMode',
    'bgPreset',
    'fontSize',
    'fontFamily',
    'fontItalic',
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

function updatePresetButtonsActive(activeId) {
    bgPresetGrid.querySelectorAll('.bg-preset-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.preset === activeId);
    });
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

async function loadAndApplySettings() {
    const data = await storageGet(SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'));
    applyAppearance(data);
    return data;
}

async function saveAppearance(partial) {
    await storageSet(partial);
    const data = await storageGet(SETTINGS_KEYS.filter((k) => k !== 'quoteBatch'));
    applyAppearance(data);
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
            saveAppearance({ bgMode: 'preset', bgPreset: id });
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

editBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));

bgPicker.addEventListener('input', (e) => {
    saveAppearance({
        bgMode: 'solid',
        bgPreset: null,
        bgColor: e.target.value,
    });
});

textPicker.addEventListener('input', (e) => {
    saveAppearance({ textColor: e.target.value });
});

fontSizeSelect.addEventListener('change', (e) => {
    saveAppearance({ fontSize: e.target.value });
});

fontFamilySelect.addEventListener('change', (e) => {
    saveAppearance({ fontFamily: e.target.value });
});

fontItalicCheck.addEventListener('change', (e) => {
    saveAppearance({ fontItalic: e.target.checked });
});

resetSettingsBtn.addEventListener('click', async () => {
    const data = await storageGet(['quoteBatch', 'lastRemoteQuotes', 'lastRemoteQuotesAt']);
    await storageSet({
        bgColor: DEFAULTS.bgColor,
        textColor: DEFAULTS.textColor,
        bgMode: DEFAULTS.bgMode,
        bgPreset: DEFAULTS.bgPreset,
        fontSize: DEFAULTS.fontSize,
        fontFamily: DEFAULTS.fontFamily,
        fontItalic: DEFAULTS.fontItalic,
        quoteBatch: data.quoteBatch,
        lastRemoteQuotes: data.lastRemoteQuotes,
        lastRemoteQuotesAt: data.lastRemoteQuotesAt,
    });
    applyAppearance(DEFAULTS);
});

buildPresetGrid();
loadAndApplySettings().then(() => getNextQuote());
