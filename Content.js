(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];

    chrome.runtime.onMessage.addListener((obj, sender, response) =>{
        const {tpe, valu, videoId} = obj;

        if( type === "New"){
            currentVideo = videoId;
            newVideoLoaded();
        }
    });

    const newVideoLoaded = () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0]

        if(!bookmarkBtnExists){
            const bookmarkBtn = document.createElement("img");
            
            bookmarkBtn.src = chrome.runtime.getUrl(assests/bookmark.png);
            bookmarkBtn.classNAme = "ytp-button" + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current Timestamp";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];
            
            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    }

    newVideoLoaded();

    const addNewBookmarkEventHandler = () => {
        const currentTime =  youtubePlayer.currentTime;
        const newBookmark = {
            time : currentTime,
            desc : "Bookmark at "+ getTime(currentTime)
            
        };

        chrome.storage.sync.set({
            [currentVideo] : JSON.stringify([...currentVideoBookmarks, newBookmark]. sort((a, b) => a.time -b))
        });
    }
})();

const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);

    return date.toISOString(). substr(11, 8);
};