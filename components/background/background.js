/* global chrome */

let sources = {},
	$activeTab,
	playerTab,
    played = {},
	tabs = {},
    
    _playlist = [],
    _enabled = true,
    state = {
        get enabled() {
            return _enabled;
        },
        set enabled(value) {
            if (value) {
                chrome.browserAction.setIcon({path: '/enabled.png'});
            } else {
                chrome.browserAction.setIcon({path: '/disabled.png'});
            }
            _enabled = value;
        },
        get playlist() {
            return _playlist;
        },
        set playlist(value) {
            _playlist = value;
        }
    };

function setState(newState) {
    Object.assign(state, newState);
    chrome.storage.sync.set({'poc.state': state}, function() {
        chrome.runtime.sendMessage({
            from: 'background.js',
            action: 'stateUpdate',
            message: {
                state: state
            }
        });
    });
}

chrome.storage.sync.get('poc.state', function (storage) {
    if (typeof storage['poc.state'] !== 'undefined') {
        Object.assign(state, storage['poc.state']);
    }
    
    console.log(state);

    init();
});

function init() {
    tabLoadListener();
}





















//document.addEventListener('DOMContentLoaded', function() {
//	chrome.browserAction.setBadgeBackgroundColor({color:[190, 10, 10, 230]});
//});
//
//function getActiveTab(callback) {
//	return chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//		let activeTab = tabs[0].id;
//		callback(activeTab);
//	});
//}

//function getTabState(activeTab) {
//
//	let tab = getTab(activeTab)
//	sources = tab.sources || [];
//	chrome.browserAction.setBadgeText({text: ""});
//
//	if (sources.length > 0) {
//		chrome.browserAction.setBadgeText({text: String(sources.length)});
//	}
//
//	tab.sources = sources;
//	$activeTab = activeTab;
//}

/**
 * Calls when tabs becomes active selected
 */
//chrome.tabs.onActivated.addListener(function(activeInfo) {
//	if (getTab(activeInfo.tabId).mainScriptIsExecuted) {
//		chrome.tabs.executeScript(activeInfo.tabId, {
//            file:'./main.js',
//            allFrames:true
//        });
//	}
//
//	getTabState(activeInfo.tabId);
//});



chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//    console.log(tabId, changeInfo);
//    if (changeInfo.status === 'complete') {
//        console.log('execute main.js');
//
//	}
//    
//	if (changeInfo.status === 'complete') {
//		getTab(tabId).status = 'complete';
//		getTabState(tabId);
//	}
});

chrome.tabs.onRemoved.addListener(function(tabId) {
    console.log(tabId, playerTab.id);
	if (tabId === playerTab.id) {
		playerTab = null;
	}
});

function openPlayerTab(callback, active = false) {
    console.log('open player tab');
    chrome.tabs.query({url: 'chrome-extension://' + chrome.runtime.id + '/components/player/player.html'}, function(tabs) {
        if (tabs.length > 0) {
             callback(tabs[0]);
        } else {
            chrome.tabs.create({
                url: './components/player/player.html',
                active: active
            }, function (tab) {
                callback(tab);
            });  
        }
    });

}

function playSourceMessage(source) {
    chrome.runtime.sendMessage({
        from: 'background.js',
        action: 'play.source',
        message: {
            source: source
        }
    });
}

function queueSourceMessage(source) {
    chrome.runtime.sendMessage({
        from: 'background.js',
        action: 'queue.source',
        message: {
            source: source
        }
    });
}

function getTab(tabId) {

	if (!tabId) {
		throw new Error('Tab id is not provided.');
	}

	if (!tabs[tabId]) {
		tabs[tabId] = {};
	}

	return tabs[tabId];
}


chrome.runtime.onMessage.addListener(function(request, sender, response) {

	if (request.from === 'main.js' && request.action === 'add.source') {
//		let activeTab = sender.tab.id,
//			tab = getTab(activeTab),
//			activeTabSources = tab.sources || [],
//			source = request.message.source,
//			sourceExists = activeTabSources.filter(function(item) {
//				return item.title === source.title;
//			});
//
//		if (!sourceExists.length) {
//			activeTabSources.unshift(request.message.source);
//			
//		} else {
//            let sourceQualities = [],
//                newSources = [].concat(sourceExists[0].sources, source.sources);
//        
//            newSources = newSources.filter(function(item) {
//                if (sourceQualities.indexOf(item.quality) === -1) {
//                    sourceQualities.push(item.quality);
//                    return true;
//                }
//                return false;
//            });
//            
//            sourceExists[0].sources = newSources;
//        }
//        
//        tab.sources = activeTabSources;
//        
//		chrome.browserAction.setBadgeText({text: String(activeTabSources.length)});
	}

	if (request.from === 'popup.js' && request.action === 'get.sources') {
		response({
            played: played,
            sources: getTab($activeTab).sources
        });
	}
    
    
	if (request.from === 'main.js' && request.action === 'playSource') {

        let source = request.message.source;
        
        setState({
            playlist: [source]
        });
        
        if (!playerTab) {
            openPlayerTab(function(tab) {
                console.log('open tab');
                playerTab = tab;
                playSourceMessage(source);
                chrome.tabs.highlight({ tabs: tab.index});
            }, true);
        } else {
            playSourceMessage(source);
            chrome.tabs.highlight({ tabs: playerTab.index});
        }
	}
    
	if (request.from === 'main.js' && request.action === 'addSourceToQueue') {
        
        let source = request.message.source,
            currentPlaylist = state.playlist,
            newPlaylist = [];
        
        newPlaylist = newPlaylist.concat(currentPlaylist, [source]);
        
        setState({
            playlist: newPlaylist
        });
    
        if (!playerTab) {
            openPlayerTab(function(tab) {
                playerTab = tab.id;
                queueSourceMessage(source);
            }, true);
        } else {
            queueSourceMessage(source);
        }
	}
    
	if (request.from === 'player.js' && request.action === 'play.now') {
        played = request.message.source;
	}

	if (request.action === 'log') {
		console.warn('Log message from: ' + request.from);
		console.log(request.message);
		console.warn('End of log message.');
	}


	if (request.action === 'getState') {
        response(state);
	}

	if (request.action === 'setState') {
        response(setState(request.message.state));
	}

});

//chrome.contextMenus.removeAll();
//
//chrome.contextMenus.create({
//      title: "Open player",
//      contexts: ["browser_action"],
//      onclick: function() {
//        openPlayerTab(function(tab) {
//            playerTab = tab;
//            chrome.tabs.highlight({ tabs: tab.index});
//        }, true);
//      }
//});
//
//chrome.contextMenus.create({
//    title: "Reload extension",
//    contexts: ["browser_action"],
//    onclick: function() {
//      chrome.runtime.reload();
//    }
//});

chrome.runtime.onSuspend.addListener(function(event) {
    console.log('suspend', event, this);
});

function tabLoadListener() {
    chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
        console.log('on domloaded', details.tabId, details, state);
        if (details.frameId === 0 && state.enabled) {
            
            console.log('execute scripts');
            chrome.tabs.executeScript(details.tabId, {
                file: './main.js',
                allFrames: true,
                runAt: 'document_start'
            });

            chrome.tabs.insertCSS(details.tabId, {
                file: './main.css',
                allFrames: true,
                runAt: 'document_start'
            });
        }
    }, {
        url: [{
            schemes: ['http', 'https']
        }]
    });
}

