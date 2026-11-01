<div align="center">

<img src="icons/icon128.png" alt="readit logo" width="96" height="96" />

# readit

**Word-by-word reading assistant Chrome extension designed for enhanced focus, comprehension, and accessibility.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Rohan-Shridhar/readit/releases/tag/v1.0.0)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)]()

</div>

---

## Overview

**readit** is a lightweight, privacy-focused browser extension that transforms any webpage text into an engaging, sequential reading experience. By highlighting words one at a time with cadence-aware pauses and smooth visual transitions, **readit** helps readers maintain laser focus, overcome reading fatigue, and read comfortably at their own pace.

Unlike bulky reader-mode extensions that strip away website styling or redirect you to alternate reader interfaces, **readit** operates directly on top of the native webpage without altering its DOM structure, typography, or layout.

---

## Key Features

- **Sequential Word-by-Word Highlighting:** Visually guides your eyes through selected text one word at a time using modern **CSS Custom Highlight API** and hardware-accelerated animations.
- **Natural Cadence Engine:** Automatically adjusts transition timings for punctuation marks (commas, semicolons, sentence endings) and longer words, creating an organic reading rhythm.
- **Full Playback Controls:** Start, pause, resume, step forward, step backward, or stop at any moment without losing your position.
- **Dynamic Speed Configuration:** Adjust reading pace from **100 to 700 WPM (Words Per Minute)** in real-time using an intuitive slider or quick-select presets.
- **5 High-Contrast Color Themes:** Curated palettes (Sun Yellow, Emerald Green, Electric Cyan, Sunset Coral, and Lavender Calm) with contrast-aware foreground styling for optimal legibility on both dark and light websites.
- **Smooth Auto-Scroll:** Intelligent viewport tracking keeps the active reading word centered in view as you read through lengthy articles.
- **Instant Keyboard Shortcuts:** Control playback completely hands-free using `Space`, `Esc`, `←`, and `→`.
- **Zero DOM Disruption:** Pure non-destructive DOM Range mapping ensures original webpage layout and formatting remain 100% intact.
- **100% Offline & Private:** No tracking, no external servers, no subscriptions, and zero external network calls.

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Space</kbd> | **Pause / Resume** | Toggles playback. Starts reading if text is already selected. |
| <kbd>Esc</kbd> | **Stop Reading** | Immediately halts reading, clears all highlights, and restores page. |
| <kbd>→</kbd> | **Next Word** | Steps forward by one word while reading or paused. |
| <kbd>←</kbd> | **Previous Word** | Steps backward by one word while reading or paused. |

> *Note:* Keyboard shortcuts automatically yield focus when you are typing inside input fields, textareas, or content-editable elements.

---

## Installation Guide

### Manual / Developer Mode Installation

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/Rohan-Shridhar/readit.git
   ```
2. Open Google Chrome (or any Chromium browser such as Edge, Brave, or Opera).
3. Navigate to `chrome://extensions/` in your address bar.
4. Enable **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select the `readit` folder that contains `manifest.json`.
7. The **readit** icon will now appear in your browser toolbar! Pin it for quick access.

---

## How to Use

1. **Select Text:**
   - Click the **readit** extension icon in your browser toolbar.
   - Click **Select Text** (the popup will close and activate selection mode).
   - Click and drag across any text passage, article, or paragraph on the page.
   - A floating toast confirms the number of captured words.
2. **Start Reading:**
   - Reopen the popup and click **Start Reading** (or simply press <kbd>Space</kbd> on the page).
   - The extension will sequentially highlight each word.
3. **Customize Your Experience:**
   - Use the slider or quick presets to set your preferred Words Per Minute (WPM).
   - Click any of the color swatches in the popup to change the highlight theme.
   - Toggle **Auto-scroll page** to keep active content centered automatically.
4. **Finish or Cancel:**
   - When reading concludes, the page is automatically restored.
   - Press <kbd>Esc</kbd> at any time to cancel reading immediately.

---

## Tech Stack & Architecture

| Component | Implementation |
|---|---|
| **Platform** | Chrome Extension Manifest V3 |
| **Highlighter** | CSS Custom Highlight API (`::highlight()`) + Animated Smooth Overlay |
| **Text Processing** | DOM Range API & `TreeWalker` non-destructive text extraction |
| **Messaging** | Asynchronous Chrome Runtime Messaging (`chrome.tabs.sendMessage`) |
| **Storage** | Chrome Storage API (`chrome.storage.local`) |
| **Testing** | Node.js automated functional test suite |

---

## Supported Environments & Limitations

- **Supported Browsers:** Google Chrome (v105+), Microsoft Edge, Brave, Chromium-based browsers supporting Manifest V3 and CSS Custom Highlight API.
- **Page Limitations:** By design and browser security policy, extensions cannot execute content scripts on internal browser URLs (`chrome://`, `chrome-extension://`, `edge://`) or the Chrome Web Store. **readit** provides automatic safety notifications when opened on such pages.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
