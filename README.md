# Motivational Quotes for New Tab

Replace your default new tab with a clean, distraction-free motivational quote. Built as a lightweight, privacy-focused extension focused on speed and simple customization.

## Why this project?

A personal hobby project: fast to open, pleasant to read, and easy to make your own.

## Features

* **Daily inspiration**: A new motivational quote every time you open a tab.
* **Minimalist design**: The quote stays front and center.
* **Custom appearance** (edit button, bottom right):
  * **Text**: size (small / medium / large), sans / serif / system fonts, italic on/off, text color.
  * **Background**: solid color or one of eight bundled gradient presets with a readability overlay and text shadow.
  * **Reset**: restore default look in one click.
* **Lightning fast**: Local presets and bundled quotes keep new tabs snappy; remote quotes load in the background when online.

## Privacy and Safety

Your privacy is a priority. This extension is built as a low-data project:

* **External data**: Fresh quotes may be fetched from the [ZenQuotes](https://zenquotes.io/) API. No personal data or identifiers are sent with those requests.
* **Local customization**: Colors, font choices, and background preset selections are stored only in your browser (`storage.local`). Nothing is uploaded.
* **No tracking**: No browsing history or usage analytics.
* **No data collection**: No personal information is collected, stored on a server, or sold.
* **Minimal permissions**: `storage` for quotes and settings; network access only for the quote API host declared in the manifest.
* **Open source**: Transparent code, no ads or hidden scripts.

## Develop

Bundled background images are generated once with:

```bash
python -m pip install pillow
python scripts/gen_backgrounds.py
```

## License

MIT License — free to explore, fork, or learn from.

---
Developed with ❤️ by Akarsh T P
