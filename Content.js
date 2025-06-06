(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];
    let bookmarkBtn = null; 


    const removeExistingButton = () => {
        const existingBtn = document.querySelector('.bookmark-btn');
        if (existingBtn) {
            existingBtn.removeEventListener('click', addNewBookmarkEventHandler);
            existingBtn.remove();
        }
    };

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
        removeExistingButton();  // Clean up any existing button first
        
        currentVideoBookmarks = await fetchBookmarks();
        
        // Create new button
        bookmarkBtn = document.createElement('img');
        bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.png');
        bookmarkBtn.className = 'ytp-button bookmark-btn';
        bookmarkBtn.title = 'Click to bookmark current timestamp';

        // Wait for YouTube player to be ready
        const waitForPlayer = setInterval(() => {
            youtubeLeftControls = document.querySelector('.ytp-left-controls');
            youtubePlayer = document.querySelector('.video-stream');
            
            if (youtubeLeftControls && youtubePlayer) {
                clearInterval(waitForPlayer);
                youtubeLeftControls.prepend(bookmarkBtn);  // Use prepend to place it first
                bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
            }
        }, 100);
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

    // Initialize for first load
    if (window.location.href.includes('youtube.com/watch')) {
        const queryParameters = window.location.search.split('?')[1];
        const urlParameters = new URLSearchParams(queryParameters);
        currentVideo = urlParameters.get('v');
        newVideoLoaded();
    }

    const observer = new MutationObserver(() => {
        if (window.location.href.includes('youtube.com/watch')) {
            const queryParameters = window.location.search.split('?')[1];
            const urlParameters = new URLSearchParams(queryParameters);
            const newVideoId = urlParameters.get('v');
            
            if (newVideoId !== currentVideo) {
                currentVideo = newVideoId;
                newVideoLoaded();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();

const getTime = t => {
    const date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().substr(11, 8);
};