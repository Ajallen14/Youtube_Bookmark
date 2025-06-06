(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, value, videoId} = obj;

        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = Number(value);
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({
                [currentVideo]: JSON.stringify(currentVideoBookmarks)
            });
        }
    });

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            });
        });
    };

    const newVideoLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        currentVideoBookmarks = await fetchBookmarks();

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");
            
            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            // Wait for YouTube controls to be available
            const waitForPlayer = setInterval(() => {
                youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
                youtubePlayer = document.getElementsByClassName("video-stream")[0];
                
                if (youtubeLeftControls && youtubePlayer) {
                    clearInterval(waitForPlayer);
                    youtubeLeftControls.appendChild(bookmarkBtn);
                    bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
                }
            }, 500);
        }
    };

    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime)
        };

        currentVideoBookmarks = await fetchBookmarks();

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        });
    };

    if (window.location.href.includes("youtube.com/watch")) {
        const queryParameters = window.location.search.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);
        currentVideo = urlParameters.get("v");
        newVideoLoaded();
    }
})();

const getTime = t => {
    const date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().substr(11, 8);
};