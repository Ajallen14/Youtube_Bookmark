chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    
    if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com/watch")) {
        try {
            const queryParameters = tab.url.split("?")[1];
            const urlParameters = new URLSearchParams(queryParameters);
            const videoId = urlParameters.get("v");

            chrome.tabs.sendMessage(tabId, {
                type: "NEW",
                videoId: videoId
            }).catch((err) => {
                console.warn("Content script not ready yet:", err);
            });
        } catch (error) {
            console.error("Failed to send message to content script:", error);
        }
    }
});
