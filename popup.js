document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('groupButton').addEventListener('click', groupTabs);
});

async function groupTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  for (const tab of tabs) {
    await chrome.runtime.sendMessage({ type: 'handleNewTab', tab });
  }
}
