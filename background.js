// Background service worker for message passing and extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log("Indeed & LinkedIn AI Helper background worker installed.");
});