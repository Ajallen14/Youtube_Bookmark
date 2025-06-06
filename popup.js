import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    currentBookmarks.forEach(bookmark => {
      addNewBookmark(bookmarksElement, bookmark);
    });
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
};

const onPlay = async e => {
  try {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const activeTab = await getActiveTabURL();

    await chrome.tabs.sendMessage(activeTab.id, {
      type: "PLAY",
      value: bookmarkTime,
    });
  } catch (error) {
    console.error("Error playing bookmark:", error);
  }
};

const onDelete = async e => {
  try {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById(
      "bookmark-" + bookmarkTime
    );

    if (bookmarkElementToDelete) {
      bookmarkElementToDelete.remove();
    }

    await chrome.tabs.sendMessage(activeTab.id, {
      type: "DELETE",
      value: bookmarkTime,
    }, viewBookmarks);
  } catch (error) {
    console.error("Error deleting bookmark:", error);
  }
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    const currentVideo = urlParameters.get("v");

    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
      chrome.storage.sync.get([currentVideo], (data) => {
        if (chrome.runtime.lastError) {
          console.error("Storage access error:", chrome.runtime.lastError);
          return;
        }
        const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
        viewBookmarks(currentVideoBookmarks);
      });
    } else {
      const container = document.getElementsByClassName("container")[0];
      container.innerHTML = '<div class="title">This is not a YouTube video page.</div>';
    }
  } catch (error) {
    console.error("Popup initialization error:", error);
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML = '<div class="title">Error loading bookmarks. Please refresh.</div>';
  }
});