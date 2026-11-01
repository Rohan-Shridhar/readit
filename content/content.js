/**
 * readit — Content Script
 * Handles selection detection, UI feedback, and communicates with the popup/engine.
 */

(function () {
    'use strict';

    console.log("Readit: Content script loaded.");

    const engine = new (window.ReaditReadingEngine || Object)();
    let isSelectionMode = false;
    let savedRange = null;
    let toastTimeout = null;

    // Toast UI
    function showToast(title, subtitle = '', badge = '') {
        let toast = document.getElementById('readit-toast-element');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'readit-toast-element';
            toast.className = 'readit-feedback-toast';
            toast.innerHTML = `
                <div class="readit-toast-icon">R</div>
                <div class="readit-toast-content">
                    <div class="readit-toast-title"></div>
                    <div class="readit-toast-subtitle"></div>
                </div>
            `;
            document.body.appendChild(toast);
        }

        const titleEl = toast.querySelector('.readit-toast-title');
        const subEl = toast.querySelector('.readit-toast-subtitle');

        titleEl.innerHTML = badge ? `${title} <span class="readit-toast-badge">${badge}</span>` : title;
        subEl.textContent = subtitle;

        toast.classList.add('readit-toast-visible');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('readit-toast-visible');
        }, 3500);
    }

    // Enter Selection Mode
    function enableSelectionMode() {
        isSelectionMode = true;
        document.body.classList.add('readit-selection-mode');
        showToast("Selection Mode Active", "Highlight any text on this page to read.", "Active");

        const onMouseUp = () => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString().trim();

                if (selectedText.length > 0) {
                    savedRange = range.cloneRange();
                    const words = engine.processRange(savedRange);

                    if (words.length > 0) {
                        isSelectionMode = false;
                        document.body.classList.remove('readit-selection-mode');
                        document.removeEventListener('mouseup', onMouseUp);

                        showToast(
                            "Text Selected",
                            "Open readit popup or press Space to start reading.",
                            `${words.length} words`
                        );

                        // Broadcast selection update
                        try {
                            chrome.runtime.sendMessage({
                                type: "SELECTION_UPDATED",
                                wordCount: words.length,
                                textPreview: selectedText.substring(0, 100)
                            }).catch(() => {});
                        } catch (e) {}
                    }
                }
            }
        };

        // Listen for mouseup once user selects text
        document.addEventListener('mouseup', onMouseUp);
    }

    // Engine callbacks
    engine.onProgress = (progress) => {
        try {
            chrome.runtime.sendMessage({
                type: "READING_PROGRESS",
                ...progress
            }).catch(() => {});
        } catch (e) {}
    };

    engine.onComplete = () => {
        showToast("Reading Complete", "Finished reading the selected text.", "Done");
        try {
            chrome.runtime.sendMessage({ type: "READING_COMPLETED" }).catch(() => {});
        } catch (e) {}
    };

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // ESC cancels reading or selection mode
        if (e.key === 'Escape') {
            if (engine.isPlaying || engine.isPaused) {
                engine.stop();
                showToast("Reading Stopped", "Webpage restored to original appearance.");
                try {
                    chrome.runtime.sendMessage({ type: "READING_STOPPED" }).catch(() => {});
                } catch (err) {}
                e.preventDefault();
            } else if (isSelectionMode) {
                isSelectionMode = false;
                document.body.classList.remove('readit-selection-mode');
                showToast("Selection Cancelled");
                e.preventDefault();
            }
        }

        // Spacebar to toggle pause/resume or start reading if text is selected
        if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            if (engine.isPlaying) {
                engine.togglePause();
                showToast(engine.isPaused ? "Reading Paused" : "Reading Resumed");
                e.preventDefault();
            } else if (engine.words.length > 0 && !isSelectionMode) {
                engine.start();
                showToast("Reading Started", `${engine.words.length} words`, "Live");
                e.preventDefault();
            }
        }

        // Arrow navigation when reading or paused
        if (engine.isPlaying || engine.isPaused) {
            if (e.key === 'ArrowRight') {
                engine.nextWord();
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                engine.prevWord();
                e.preventDefault();
            }
        }
    });

    // Message listener for popup & background requests
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case "START_SELECTION":
                enableSelectionMode();
                sendResponse({ success: true, message: "Selection mode activated" });
                break;

            case "GET_STATUS": {
                // If user selected text directly with mouse without clicking Select Text first
                if (!savedRange || engine.words.length === 0) {
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        savedRange = sel.getRangeAt(0).cloneRange();
                        engine.processRange(savedRange);
                    }
                }

                let state = "idle";
                if (engine.isPlaying && !engine.isPaused) {
                    state = "reading";
                } else if (engine.isPaused) {
                    state = "paused";
                } else if (engine.words.length > 0) {
                    state = "selected";
                }

                sendResponse({
                    success: true,
                    state: state,
                    wordCount: engine.words.length,
                    currentIndex: engine.currentIndex,
                    speedWpm: engine.speedWpm,
                    colorTheme: engine.colorTheme,
                    textPreview: engine.words.length > 0
                        ? engine.words.slice(0, 15).map(w => w.word).join(' ') + (engine.words.length > 15 ? '...' : '')
                        : ''
                });
                break;
            }

            case "START_READING":
                if (engine.words.length === 0 && savedRange) {
                    engine.processRange(savedRange);
                }
                if (engine.words.length > 0) {
                    engine.start();
                    sendResponse({ success: true, state: "reading" });
                } else {
                    sendResponse({ success: false, message: "No text selected" });
                }
                break;

            case "PAUSE_READING":
                engine.pause();
                sendResponse({ success: true, state: "paused" });
                break;

            case "RESUME_READING":
                engine.resume();
                sendResponse({ success: true, state: "reading" });
                break;

            case "STOP_READING":
                engine.stop();
                sendResponse({ success: true, state: "idle" });
                break;

            case "SET_SPEED":
                if (message.speed) {
                    engine.setSpeed(message.speed);
                    sendResponse({ success: true, speed: engine.speedWpm });
                }
                break;

            case "SET_THEME":
                if (message.theme) {
                    engine.setTheme(message.theme);
                    sendResponse({ success: true, theme: engine.colorTheme });
                }
                break;

            case "NAVIGATE_WORD":
                if (message.direction === 'next') {
                    engine.nextWord();
                } else if (message.direction === 'prev') {
                    engine.prevWord();
                }
                sendResponse({ success: true, currentIndex: engine.currentIndex });
                break;

            default:
                sendResponse({ success: false, message: "Unknown message type" });
        }
        return true;
    });

})();
