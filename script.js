const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('author');
const bgPicker = document.getElementById('bg-picker');
const textPicker = document.getElementById('text-picker');
const editBtn = document.getElementById('edit-btn');
const settingsPanel = document.getElementById('settings-panel');

const storage = (typeof browser !== 'undefined') ? browser.storage.local : chrome.storage.local;

// --- 1. CORE LOGIC: THE SMART BATCHER ---

async function getNextQuote() {
    storage.get(['quoteBatch', 'bgColor', 'textColor'], async (data) => {
        // Apply colors immediately
        if (data.bgColor) document.body.style.backgroundColor = data.bgColor;
        if (data.textColor) document.body.style.color = data.textColor;

        let batch = data.quoteBatch || [];

        // If we have quotes in stock, show one and remove it from the list
        if (batch.length > 0) {
            const current = batch.shift();
            displayQuote(current.q, current.a);
            storage.set({ quoteBatch: batch });

            // If we're running low (less than 5 left), refill the tank in the background
            if (batch.length < 5) refillBatch();
        } else {
            // Emergency fetch if the batch is totally empty
            await refillBatch(true); 
        }
    });
}

async function refillBatch(displayImmediately = false) {
    try {
        // Fetch 50 random quotes at once
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://zenquotes.io/api/quotes'));
        const json = await response.json();
        const newQuotes = JSON.parse(json.contents);

        storage.get(['quoteBatch'], (data) => {
            const existing = data.quoteBatch || [];
            const combined = [...existing, ...newQuotes];
            storage.set({ quoteBatch: combined });
            
            if (displayImmediately && newQuotes.length > 0) {
                displayQuote(newQuotes[0].q, newQuotes[0].a);
            }
        });
    } catch (err) {
        displayQuote("Small steps lead to big destinations.", "Internal Drive");
    }
}

function displayQuote(text, author) {
    quoteEl.textContent = `"${text}"`;
    authorEl.textContent = `- ${author}`;
}

// --- 2. SETTINGS & COLORS ---

editBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));

bgPicker.addEventListener('input', (e) => {
    document.body.style.backgroundColor = e.target.value;
    storage.set({ bgColor: e.target.value });
});

textPicker.addEventListener('input', (e) => {
    document.body.style.color = e.target.value;
    storage.set({ textColor: e.target.value });
});

// Start!
getNextQuote();