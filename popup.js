// File: popup.js
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('groupButton').addEventListener('click', groupTabs);
});

async function groupTabs() {
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

  // Create tab groups based on domain
  for (const [domain, tabObjects] of Object.entries(groups)) {
    const groupName = findCommonSubstringAmongTitles(tabObjects.map(tab => tab.title));
    if (tabObjects.length > 1) { // Only group if there's more than one tab
      const color = getColorFromString(groupName);
      const tabIds = tabObjects.map(tab => tab.id);
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, { title: groupName, color });
    }
  }
}

// Extracts the main domain from a URL
function getMainDomain(url) {
  try {
    const { hostname } = new URL(url);
    const domainParts = hostname.split('.').slice(-2);
    return domainParts.join('.');
  } catch (error) {
    console.error('Error extracting main domain:', error);
    return url; // Fallback to the full URL if domain extraction fails
  }
}

// Finds the most common substring among a list of titles
function findCommonSubstringAmongTitles(titles) {
  const commonWords = {};

  titles.forEach(title => {
    const words = title.split(' ');
    words.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        commonWords[word] = (commonWords[word] || 0) + 1;
      }
    });
  });

  const sortedWords = Object.keys(commonWords).sort((a, b) => commonWords[b] - commonWords[a]);
  return sortedWords.slice(0, 3).join(' ') || 'Untitled';
}

// Generates a consistent color for the group based on its name
function getColorFromString(str) {
  const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

