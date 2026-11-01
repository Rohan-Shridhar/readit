/**
 * readit — Popup Controller
 * Manages user interactions in the extension popup and synchronizes state with the content script.
 */

document.addEventListener("DOMContentLoaded", () => {
    const selectBtn = document.getElementById("selectBtn");
    const buttonText = document.getElementById("buttonText");
    const statusBadge = document.getElementById("statusBadge");
    const selectionInfo = document.getElementById("selectionInfo");
    const wordCountLabel = document.getElementById("wordCountLabel");
    const previewSnippet = document.getElementById("previewSnippet");

    let currentState = "idle";

    function updateUI(state, data = {}) {
        currentState = state;

        if (state === "selected") {
            buttonText.textContent = "Start Reading";
            selectBtn.className = "primary-button btn-read";
            statusBadge.textContent = "Selected";
            statusBadge.className = "badge badge-active";

            selectionInfo.classList.remove("hidden");
            wordCountLabel.textContent = `${data.wordCount || 0} words`;
            previewSnippet.textContent = data.textPreview ? `"${data.textPreview}"` : "";
        } else if (state === "reading") {
            buttonText.textContent = "Reading...";
            selectBtn.className = "primary-button btn-reading";
            statusBadge.textContent = "Reading";
            statusBadge.className = "badge badge-reading";

            selectionInfo.classList.remove("hidden");
            wordCountLabel.textContent = `${data.wordCount || 0} words`;
            previewSnippet.textContent = data.textPreview ? `"${data.textPreview}"` : "";
        } else {
            currentState = "idle";
            buttonText.textContent = "Select Text";
            selectBtn.className = "primary-button";
            statusBadge.textContent = "Ready";
            statusBadge.className = "badge";
            selectionInfo.classList.add("hidden");
        }
    }

    // Fetch initial status from the active tab
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
            updateUI("idle");
            return;
        }

        updateUI(response.state || "idle", response);
    });

    // Handle primary action button click
    selectBtn.addEventListener("click", () => {
        if (currentState === "idle") {
            // Activate selection mode on webpage and close popup
            chrome.runtime.sendMessage({ type: "START_SELECTION" }, () => {
                window.close();
            });
        } else if (currentState === "selected") {
            // Trigger reading on webpage
            chrome.runtime.sendMessage({ type: "START_READING" }, (response) => {
                if (response && response.success) {
                    updateUI("reading");
                    setTimeout(() => window.close(), 250);
                }
            });
        }
    });
});
