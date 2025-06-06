(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];
  let bookmarkBtn = null;

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        if (chrome.runtime.lastError) {
          console.error("Storage access error:", chrome.runtime.lastError);
          resolve([]);
        } else {
          resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        }
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    try {
      const currentTime = youtubePlayer.currentTime;
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
      };

      currentVideoBookmarks = await fetchBookmarks();

      await chrome.storage.sync.set({
        [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
      });
    } catch (error) {
      console.error("Error adding bookmark:", error);
    }
  };

  const newVideoLoaded = async () => {
    try {
      const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
      currentVideoBookmarks = await fetchBookmarks();

      if (!bookmarkBtnExists && youtubeLeftControls) {
        bookmarkBtn = document.createElement("img");

        bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
        bookmarkBtn.className = "ytp-button bookmark-btn";
        bookmarkBtn.title = "Click to bookmark current timestamp";

        youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
        youtubePlayer = document.getElementsByClassName('video-stream')[0];

        youtubeLeftControls.appendChild(bookmarkBtn);
        bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
      }
    } catch (error) {
      console.error("Error in newVideoLoaded:", error);
    }
  };

  const handleMessage = async (obj, sender, response) => {
    try {
      const { type, value, videoId } = obj;

      if (type === "NEW") {
        currentVideo = videoId;
        await newVideoLoaded();
      } else if (type === "PLAY") {
        youtubePlayer.currentTime = value;
      } else if (type === "DELETE") {
        currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
        await chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
        response(currentVideoBookmarks);
      }
    } catch (error) {
      console.error("Error in message handler:", error);
    }
  };

  const init = async () => {
    try {
      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];
      chrome.runtime.onMessage.addListener(handleMessage);
      await newVideoLoaded();
    } catch (error) {
      console.error("Initialization error:", error);
    }
  };

  const cleanup = () => {
    if (bookmarkBtn) {
      bookmarkBtn.removeEventListener("click", addNewBookmarkEventHandler);
    }
    chrome.runtime.onMessage.removeListener(handleMessage);
  };

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg === 'EXTENSION_CONTEXT_INVALIDATED') {
      cleanup();
      init();
    }
  });

  init();

  window.addEventListener('beforeunload', cleanup);
})();

const getTime = t => {
  const date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().substr(11, 8);
};