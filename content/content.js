
console.log("Readit: Content script initialized!");

// Listen for messages from the background service worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    console.log("Readit received message:", message);

    // Handle selection mode activation.
    if (message.type === "START_SELECTION") {

        console.log("Readit: Selection mode requested!");

        sendResponse({
            success: true,
            message: "Content script received the selection command."
        });

    }

});
