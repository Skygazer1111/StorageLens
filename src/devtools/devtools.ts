const panelPath = 'src/devtools/panel/index.html'

chrome.devtools.panels.create('StorageLens', 'public/icons/icon16.png', panelPath)
