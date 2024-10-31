document.addEventListener('DOMContentLoaded', function() {
  const groupButton = document.getElementById('groupButton');
  const ungroupButton = document.getElementById('ungroupButton');
  const autoGroupingCheckbox = document.getElementById('autoGrouping');

  // Load saved state
  chrome.storage.local.get(['autoGrouping'], function(result) {
    autoGroupingCheckbox.checked = result.autoGrouping ?? false;
  });

  // Event listeners
  groupButton.addEventListener('click', groupTabs);
  ungroupButton.addEventListener('click', ungroupAllTabs);
  autoGroupingCheckbox.addEventListener('change', function(e) {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ autoGrouping: isEnabled });
    chrome.runtime.sendMessage({ 
      type: 'setAutoGrouping', 
      enabled: isEnabled 
    });
  });
});

async function groupTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  for (const tab of tabs) {
    await chrome.runtime.sendMessage({ type: 'handleNewTab', tab });
  }
}

async function ungroupAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  for (const tab of tabs) {
    if (tab.groupId !== chrome.tabs.TAB_ID_NONE) {
      await chrome.tabs.ungroup(tab.id);
    }
  }
}
