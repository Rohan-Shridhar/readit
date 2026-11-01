/**
 * readit — Popup Controller (v1.0.0 Stable)
 * Manages user interactions, reading controls, speed, theme customization,
 * auto-scroll preferences, selection clearance, and graceful error handling.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const statusBadge = document.getElementById("statusBadge");
    const errorAlert = document.getElementById("errorAlert");
    const errorMessage = document.getElementById("errorMessage");

    const selectionInfo = document.getElementById("selectionInfo");
    const progressStatusLabel = document.getElementById("progressStatusLabel");
    const wordProgressLabel = document.getElementById("wordProgressLabel");
    const progressBar = document.getElementById("progressBar");
    const previewSnippet = document.getElementById("previewSnippet");

    const initialActions = document.getElementById("initialActions");
    const mainActionBtn = document.getElementById("mainActionBtn");
    const mainActionText = document.getElementById("mainActionText");
    const mainActionIcon = document.getElementById("mainActionIcon");
    const clearSelectionBtn = document.getElementById("clearSelectionBtn");

    const readingControls = document.getElementById("readingControls");
    const prevBtn = document.getElementById("prevBtn");
    const pauseResumeBtn = document.getElementById("pauseResumeBtn");
    const pauseResumeText = document.getElementById("pauseResumeText");
    const pauseResumeIcon = document.getElementById("pauseResumeIcon");
    const nextBtn = document.getElementById("nextBtn");
    const stopBtn = document.getElementById("stopBtn");

    const speedRange = document.getElementById("speedRange");
    const speedDisplay = document.getElementById("speedDisplay");
    const presetPills = document.querySelectorAll(".preset-pill");

    const themeSwatches = document.querySelectorAll(".theme-swatch");
    const autoScrollToggle = document.getElementById("autoScrollToggle");

    let currentState = "idle";
    let currentWordCount = 0;

    // Show error or warning message
    function showError(msg) {
        if (!msg) {
            errorAlert.classList.add("hidden");
            return;
        }
        errorMessage.textContent = msg;
        errorAlert.classList.remove("hidden");
    }

    // Load saved settings from chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['readit_speed', 'readit_theme', 'readit_autoscroll'], (result) => {
            if (result.readit_speed) {
                setSpeedValue(result.readit_speed, false);
            }
            if (result.readit_theme) {
                setThemeValue(result.readit_theme, false);
            }
            if (typeof result.readit_autoscroll === 'boolean') {
                autoScrollToggle.checked = result.readit_autoscroll;
                chrome.runtime.sendMessage({ type: "SET_AUTOSCROLL", autoScroll: result.readit_autoscroll }).catch(() => {});
            }
        });
    }

    // Speed handler
    function setSpeedValue(speed, notifyContent = true) {
        const val = parseInt(speed, 10);
        if (isNaN(val)) return;

        speedRange.value = val;
        speedDisplay.textContent = `${val} WPM`;

        presetPills.forEach(pill => {
            if (parseInt(pill.dataset.speed, 10) === val) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ readit_speed: val });
        }

        if (notifyContent) {
            chrome.runtime.sendMessage({ type: "SET_SPEED", speed: val }).catch(() => {});
        }
    }

    // Theme handler
    function setThemeValue(theme, notifyContent = true) {
        themeSwatches.forEach(swatch => {
            if (swatch.dataset.theme === theme) {
                swatch.classList.add("active");
            } else {
                swatch.classList.remove("active");
            }
        });

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ readit_theme: theme });
        }

        if (notifyContent) {
            chrome.runtime.sendMessage({ type: "SET_THEME", theme }).catch(() => {});
        }
    }

    // Update UI based on extension reading state
    function updateStateUI(state, data = {}) {
        currentState = state;

        if (state === "reading") {
            statusBadge.textContent = "Reading";
            statusBadge.className = "badge badge-reading";
            progressStatusLabel.textContent = "Reading";

            initialActions.classList.add("hidden");
            clearSelectionBtn.classList.add("hidden");
            readingControls.classList.remove("hidden");
            selectionInfo.classList.remove("hidden");

            pauseResumeBtn.className = "control-btn primary-control-btn";
            pauseResumeText.textContent = "Pause";
            pauseResumeIcon.innerHTML = `
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            `;

            if (data.totalWords) {
                updateProgress(data.currentIndex || 0, data.totalWords);
            }
        } else if (state === "paused") {
            statusBadge.textContent = "Paused";
            statusBadge.className = "badge badge-paused";
            progressStatusLabel.textContent = "Paused";

            initialActions.classList.add("hidden");
            clearSelectionBtn.classList.add("hidden");
            readingControls.classList.remove("hidden");
            selectionInfo.classList.remove("hidden");

            pauseResumeBtn.className = "control-btn primary-control-btn is-paused";
            pauseResumeText.textContent = "Resume";
            pauseResumeIcon.innerHTML = `
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
            `;

            if (data.totalWords) {
                updateProgress(data.currentIndex || 0, data.totalWords);
            }
        } else if (state === "selected") {
            statusBadge.textContent = "Selected";
            statusBadge.className = "badge badge-active";
            progressStatusLabel.textContent = "Ready";

            initialActions.classList.remove("hidden");
            clearSelectionBtn.classList.remove("hidden");
            readingControls.classList.add("hidden");
            selectionInfo.classList.remove("hidden");

            mainActionText.textContent = "Start Reading";
            mainActionBtn.className = "primary-button btn-read";
            mainActionIcon.innerHTML = `
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
            `;

            currentWordCount = data.wordCount || 0;
            wordProgressLabel.textContent = `${currentWordCount} words`;
            progressBar.style.width = "0%";
            previewSnippet.textContent = data.textPreview ? `"${data.textPreview}"` : "";
        } else {
            currentState = "idle";
            statusBadge.textContent = "Ready";
            statusBadge.className = "badge";

            initialActions.classList.remove("hidden");
            clearSelectionBtn.classList.add("hidden");
            readingControls.classList.add("hidden");
            selectionInfo.classList.add("hidden");

            mainActionText.textContent = "Select Text";
            mainActionBtn.className = "primary-button";
            mainActionIcon.innerHTML = `
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            `;
            progressBar.style.width = "0%";
        }
    }

    // Update Progress Indicator
    function updateProgress(currentIndex, totalWords) {
        if (!totalWords || totalWords === 0) return;
        const current = Math.min(currentIndex + 1, totalWords);
        const percent = Math.round((current / totalWords) * 100);

        wordProgressLabel.textContent = `${current} / ${totalWords} (${percent}%)`;
        progressBar.style.width = `${percent}%`;
    }

    // Query status on popup open
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
            if (response && response.message) {
                showError(response.message);
            }
            updateStateUI("idle");
            return;
        }

        showError(null);

        if (response.speedWpm) {
            setSpeedValue(response.speedWpm, false);
        }
        if (response.colorTheme) {
            setThemeValue(response.colorTheme, false);
        }
        if (typeof response.autoScroll === 'boolean') {
            autoScrollToggle.checked = response.autoScroll;
        }

        updateStateUI(response.state || "idle", {
            wordCount: response.wordCount,
            totalWords: response.wordCount,
            currentIndex: response.currentIndex,
            textPreview: response.textPreview
        });
    });

    // Main action button click (Select Text or Start Reading)
    mainActionBtn.addEventListener("click", () => {
        if (currentState === "idle") {
            chrome.runtime.sendMessage({ type: "START_SELECTION" }, (res) => {
                if (res && res.success) {
                    window.close();
                } else if (res && res.message) {
                    showError(res.message);
                }
            });
        } else if (currentState === "selected") {
            chrome.runtime.sendMessage({ type: "START_READING" }, (response) => {
                if (response && response.success) {
                    updateStateUI("reading", { totalWords: currentWordCount, currentIndex: 0 });
                } else if (response && response.message) {
                    showError(response.message);
                }
            });
        }
    });

    // Clear selection
    clearSelectionBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "STOP_READING" }, () => {
            updateStateUI("idle");
        });
    });

    // Reading playback controls
    pauseResumeBtn.addEventListener("click", () => {
        if (currentState === "reading") {
            chrome.runtime.sendMessage({ type: "PAUSE_READING" }, (res) => {
                if (res && res.success) updateStateUI("paused");
            });
        } else if (currentState === "paused") {
            chrome.runtime.sendMessage({ type: "RESUME_READING" }, (res) => {
                if (res && res.success) updateStateUI("reading");
            });
        }
    });

    stopBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "STOP_READING" }, () => {
            updateStateUI("idle");
        });
    });

    prevBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "NAVIGATE_WORD", direction: "prev" });
    });

    nextBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "NAVIGATE_WORD", direction: "next" });
    });

    // Speed input listeners
    speedRange.addEventListener("input", (e) => {
        setSpeedValue(e.target.value, true);
    });

    presetPills.forEach(pill => {
        pill.addEventListener("click", () => {
            setSpeedValue(pill.dataset.speed, true);
        });
    });

    // Theme selector listeners
    themeSwatches.forEach(swatch => {
        swatch.addEventListener("click", () => {
            setThemeValue(swatch.dataset.theme, true);
        });
    });

    // Auto-scroll toggle listener
    autoScrollToggle.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ readit_autoscroll: enabled });
        }
        chrome.runtime.sendMessage({ type: "SET_AUTOSCROLL", autoScroll: enabled }).catch(() => {});
    });

    // Listen for live messages from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "READING_PROGRESS") {
            updateProgress(message.currentIndex, message.totalWords);
        } else if (message.type === "READING_COMPLETED" || message.type === "READING_STOPPED") {
            updateStateUI("idle");
        } else if (message.type === "SELECTION_UPDATED") {
            updateStateUI("selected", {
                wordCount: message.wordCount,
                textPreview: message.textPreview
            });
        }
    });
});
