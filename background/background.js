/**
 * readit — Background Service Worker (v0.4.0)
 * Extension lifecycle, tab routing, and graceful error boundary.
 */

chrome.runtime.onInstalled.addListener((details) => {
    console.log("Readit extension ready:", details.reason);
});

// Forward messages to the active tab's content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Prevent message reflection if sent from a content script
    if (sender.tab) {
        return false;
    }

    const contentScriptActionTypes = [
        "START_SELECTION",
        "GET_STATUS",
        "START_READING",
        "PAUSE_READING",
        "RESUME_READING",
        "STOP_READING",
        "SET_SPEED",
        "SET_THEME",
        "SET_AUTOSCROLL",
        "NAVIGATE_WORD"
    ];

    if (contentScriptActionTypes.includes(message.type)) {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(async (tabs) => {
                const activeTab = tabs[0];
                if (!activeTab || !activeTab.id) {
                    sendResponse({ success: false, message: "No active webpage tab found." });
                    return;
                }

                // Check for unsupported system or webstore URLs
                const url = activeTab.url || "";
                if (
                    url.startsWith("chrome://") ||
                    url.startsWith("chrome-extension://") ||
                    url.startsWith("edge://") ||
                    url.startsWith("about:") ||
                    url.includes("chromewebstore.google.com") ||
                    url.includes("chrome.google.com/webstore")
                ) {
                    sendResponse({
                        success: false,
                        isRestrictedPage: true,
                        message: "Chrome extensions cannot run on browser system pages or the Web Store."
                    });
                    return;
                }

                try {
                    const response = await chrome.tabs.sendMessage(activeTab.id, message);
                    sendResponse(response);
                } catch (error) {
                    console.warn("Readit: Failed to reach content script:", error.message);
                    sendResponse({
                        success: false,
                        needsReload: true,
                        message: "Please reload this webpage to activate Readit."
                    });
                }
            })
            .catch((err) => {
                sendResponse({ success: false, message: err.message });
            });

        return true;
    }
});
