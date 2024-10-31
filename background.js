let isAutoGroupingEnabled = false;

// Load initial state
chrome.storage.local.get(['autoGrouping'], function(result) {
  isAutoGroupingEnabled = result.autoGrouping ?? false;
});

async function handleNewTab(tab) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = {};

  // Group tabs by main domain URL
  tabs.forEach(tab => {
    const domain = getMainDomain(tab.url);
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(tab);
  });

  // Create tab groups based on the updated naming strategy
  for (const [domain, tabObjects] of Object.entries(groups)) {
    const groupName = generateUniqueGroupName(domain, tabObjects.map(tab => tab.title));
    if (tabObjects.length > 1) { // Only group if there's more than one tab
      const color = getColorFromString(groupName);
      const tabIds = tabObjects.map(tab => tab.id);
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, { title: groupName, color });
    }
  }
}

// Move all utility functions from popup.js to background.js
function getMainDomain(url) {
  try {
    const { hostname } = new URL(url);
    const domainParts = hostname.split('.').slice(-2);
    return domainParts.join('.');
  } catch (error) {
    console.error('Error extracting main domain:', error);
    return url;
  }
}

function generateUniqueGroupName(domain, titles) {
  const largestWord = findLargestWord(domain);
  const commonWords = findCommonWordsInAllTitles(titles);
  const uniqueNameParts = removeDuplicateStrings([largestWord, ...commonWords]);
  return uniqueNameParts.join(' ').trim();
}

function findLargestWord(domain) {
  const words = domain.split(/[\W_]+/);
  return words.reduce((largest, word) => (word.length > largest.length ? word : largest), '');
}

function findCommonWordsInAllTitles(titles) {
  if (titles.length === 0) return [];

  const wordSets = titles.map(title => new Set(title.toLowerCase().split(' ')));
  const commonWords = [...wordSets[0]].filter(word =>
    wordSets.every(set => set.has(word) && word.length > 2)
  );

  return commonWords.slice(0, 3);
}

function removeDuplicateStrings(words) {
  const seen = new Set();
  return words.filter(word => {
    const lowercaseWord = word.toLowerCase();
    if (seen.has(lowercaseWord)) {
      return false;
    }
    seen.add(lowercaseWord);
    return true;
  });
}

function getColorFromString(str) {
  const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Update event listeners to respect auto-grouping setting
chrome.tabs.onCreated.addListener((tab) => {
  if (isAutoGroupingEnabled && tab.url) handleNewTab(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isAutoGroupingEnabled && changeInfo.url) handleNewTab(tab);
});

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'handleNewTab':
      handleNewTab(message.tab);
      break;
    case 'setAutoGrouping':
      isAutoGroupingEnabled = message.enabled;
      break;
  }
});
