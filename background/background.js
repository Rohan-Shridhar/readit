
chrome.runtime.onInstalled.addListener(() => {
    console.log("Readit installed successfully!");
});


// Receive messages from the popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "START_SELECTION") {

        // Find the currently active tab.
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }).then(async (tabs) => {

            const activeTab = tabs[0];

            if (!activeTab || !activeTab.id) {
                throw new Error("No active tab found.");
            }

            // Forward the message to the content script.
            const response = await chrome.tabs.sendMessage(
                activeTab.id,
                {
                    type: "START_SELECTION"
                }
            );

            sendResponse(response);

        }).catch((error) => {

            console.error("Readit messaging error:", error);

            sendResponse({
                success: false,
                message: error.message
            });

        });

        // Keep the message channel open for async response.
        return true;
    }

});
