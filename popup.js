document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('groupButton').addEventListener('click', groupTabs);
});

async function groupTabs() {
  const tabs = await chrome.tabs.query({currentWindow: true});
  const groups = {};

  // Group tabs by common substrings
  tabs.forEach(tab => {
    const groupName = findCommonSubstring(tab.title, Object.keys(groups));
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(tab.id);
  });

  // Create tab groups
  for (const [groupName, tabIds] of Object.entries(groups)) {
    if (tabIds.length > 1) {  // Only group if there's more than one tab
      const color = getColorFromString(groupName);
      const group = await chrome.tabs.group({tabIds});
      await chrome.tabGroups.update(group, {title: groupName, color});
    }
  }
}

function findCommonSubstring(title, existingGroups) {
  // Check if the title matches any existing group
  for (const group of existingGroups) {
    if (title.includes(group)) {
      return group;
    }
  }

  // If no match, create a new group name from the first few words
  const words = title.split(' ');
  return words.slice(0, Math.min(3, words.length)).join(' ');
}

function getColorFromString(str) {
  const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
