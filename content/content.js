/**
 * readit — Content Script (v0.4.0)
 * Selection detection, keyboard navigation, state coordination, and runtime error handling.
 */

(function () {
    'use strict';

    const engine = new (window.ReaditReadingEngine || Object)();
    let isSelectionMode = false;
    let savedRange = null;
    let toastTimeout = null;

    // Toast Notification UI
    function showToast(title, subtitle = '', badge = '') {
        if (!document.body) return;

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
            if (toast) toast.classList.remove('readit-toast-visible');
        }, 3200);
    }

    // Helper to send messages safely without throwing unhandled exceptions
    function notifyPopup(message) {
        try {
            chrome.runtime.sendMessage(message).catch(() => {});
        } catch (e) {}
    }

    // Enter Selection Mode
    function enableSelectionMode() {
        isSelectionMode = true;
        document.body.classList.add('readit-selection-mode');
        showToast("Selection Mode Active", "Select any text passage on this page to begin.", "Active");

        const onMouseUp = () => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
                try {
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
                                "Open popup or press Space to begin reading.",
                                `${words.length} words`
                            );

                            notifyPopup({
                                type: "SELECTION_UPDATED",
                                wordCount: words.length,
                                textPreview: selectedText.substring(0, 100)
                            });
                        }
                    }
                } catch (err) {
                    console.warn("Readit: Error capturing selection", err);
                }
            }
        };

        document.addEventListener('mouseup', onMouseUp);
    }

    // Engine Callbacks
    engine.onProgress = (progress) => {
        notifyPopup({
            type: "READING_PROGRESS",
            ...progress
        });
    };

    engine.onComplete = () => {
        showToast("Reading Complete", "Finished reading the selected passage.", "Done");
        notifyPopup({ type: "READING_COMPLETED" });
    };

    engine.onError = (msg) => {
        showToast("Notice", msg, "Alert");
    };

    // Keyboard Shortcuts (Space, ESC, Left/Right Arrows)
    window.addEventListener('keydown', (e) => {
        // Skip hotkeys if user is editing in an input, textarea, or contentEditable element
        const target = e.target;
        if (target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable
        )) {
            return;
        }

        // ESC: Stop reading or cancel selection mode
        if (e.key === 'Escape') {
            if (engine.isPlaying || engine.isPaused) {
                engine.stop();
                showToast("Reading Stopped", "Webpage restored.");
                notifyPopup({ type: "READING_STOPPED" });
                e.preventDefault();
            } else if (isSelectionMode) {
                isSelectionMode = false;
                document.body.classList.remove('readit-selection-mode');
                showToast("Selection Cancelled");
                e.preventDefault();
            }
        }

        // Spacebar: Toggle Pause/Resume or Start Reading
        if (e.code === 'Space') {
            if (engine.isPlaying) {
                engine.togglePause();
                showToast(engine.isPaused ? "Reading Paused" : "Reading Resumed");
                notifyPopup({ type: engine.isPaused ? "READING_PAUSED" : "READING_RESUMED" });
                e.preventDefault();
            } else if (engine.words.length > 0 && !isSelectionMode) {
                engine.start();
                showToast("Reading Started", `${engine.words.length} words`, "Live");
                notifyPopup({ type: "READING_STARTED" });
                e.preventDefault();
            }
        }

        // Arrow Keys: Step through words
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

    // Cleanup before page navigation or reload
    window.addEventListener('beforeunload', () => {
        if (engine.isPlaying || engine.isPaused) {
            engine.stop();
        }
    });

    // Message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case "START_SELECTION":
                enableSelectionMode();
                sendResponse({ success: true, message: "Selection mode active" });
                break;

            case "GET_STATUS": {
                if (!savedRange || engine.words.length === 0) {
                    try {
                        const sel = window.getSelection();
                        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                            savedRange = sel.getRangeAt(0).cloneRange();
                            engine.processRange(savedRange);
                        }
                    } catch (e) {}
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
                    autoScroll: engine.autoScroll,
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

            case "SET_AUTOSCROLL":
                engine.setAutoScroll(message.autoScroll);
                sendResponse({ success: true, autoScroll: engine.autoScroll });
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
                sendResponse({ success: false, message: "Unrecognized command" });
        }
        return true;
    });

})();
