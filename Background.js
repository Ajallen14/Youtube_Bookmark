chrome.tabs.onUpdate.addListener((tabId, tab) =>{
    if(tab.url && tab.url.include("youtube.com/watch")) {
        const queryParameters = tabs.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);       
    
        chrome.tabs.sendMessage(tabId, {
            type : "New",
            videoId : urlParameters.get("v")
        });
    }
});