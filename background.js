var running =
chrome.browserAction.onClicked.addListener(function(tab) {
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {args: null}, function(response) {
      // ...
    });
  }
});
