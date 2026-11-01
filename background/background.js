/**
 * readit — Background Service Worker
 * Manages extension lifecycle, tab messaging, and state coordination.
 */

chrome.runtime.onInstalled.addListener((details) => {
    console.log("Readit extension installed/updated:", details.reason);
});

// Forward messages to the active tab's content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // If the message is already from a content script (sender has tab), don't loop it back
    if (sender.tab) {
        return false;
    }

    // Messages destined for the active tab content script
    const contentScriptActionTypes = [
        "START_SELECTION",
        "GET_STATUS",
        "START_READING",
        "PAUSE_READING",
        "RESUME_READING",
        "STOP_READING",
        "SET_SPEED",
        "SET_THEME",
        "NAVIGATE_WORD"
    ];

    if (contentScriptActionTypes.includes(message.type)) {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(async (tabs) => {
                const activeTab = tabs[0];
                if (!activeTab || !activeTab.id) {
                    sendResponse({ success: false, message: "No active tab found" });
                    return;
                }

                // Check for unsupported system URLs
                if (!activeTab.url || activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("chrome-extension://") || activeTab.url.startsWith("edge://") || activeTab.url.startsWith("about:")) {
                    sendResponse({
                        success: false,
                        message: "Readit is not supported on browser system pages."
                    });
                    return;
                }

                try {
                    const response = await chrome.tabs.sendMessage(activeTab.id, message);
                    sendResponse(response);
                } catch (error) {
                    console.warn("Readit: Failed to communicate with content script:", error.message);
                    sendResponse({
                        success: false,
                        message: "Please refresh the page to use Readit on this tab."
                    });
                }
            })
            .catch((err) => {
                sendResponse({ success: false, message: err.message });
            });

        return true; // Keep message channel open for async response
    }
});
