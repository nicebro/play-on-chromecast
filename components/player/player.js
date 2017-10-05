/* global chrome */

let player = videojs('video', {
	controls: true,
	plugins: {
		chromecast: {},
		playlist: {},
        videoJsResolutionSwitcher: {
          default: 'high',
          dynamicLabel: true
        }
	}
}),
playListNode = document.querySelector('.playlist'),
playlist = [],
state = {},
documentTitle = document.title;

function updateState(state) {
    chrome.runtime.sendMessage({
        from: 'player.js',
        action: 'setState',
        message: {
            state: state
        }
    });
}

function createPlaylistNode(item, index, isActive) {
	let playlistItem = document.createElement('div'),
        playlistItemTemplate = `
            <div class="remove-item" title="Remove">&times;</div>
            <div class="poster">
                <img src="/assets/poster-placeholder.jpg">
            </div>
            <div class="title">${item.title || "Untitled"}</div>
            <div class="description"></div>
            <div class="link">${item.location || ''}</div>
        `,
        posterSource = item.poster;


	playlistItem.innerHTML = playlistItemTemplate;
	playlistItem.setAttribute('class', 'playlist-item');

	if (isActive) {
		playlistItem.classList.add('active');
		playlistItem.setAttribute('data-active', 'Now play');
	}

	if (posterSource) {
		let poster = new Image();
		poster.onload = function() {
			playlistItem.getElementsByTagName('img')[0].src = posterSource;
		};

		poster.src = posterSource;
	}

	playlistItem.addEventListener('click', function() {
		player.playlist.currentItem(index);
	});
    
    
    playlistItem.querySelector('.remove-item').addEventListener('click', function(event) {
        event.stopPropagation();
        let index = getElementIndex(this.closest('.playlist-item'));
        state.playlist.splice(index, 1);
        updatePlaylist(state.playlist, false);
        updateState(state);
    });

	return playlistItem;
}

player.on('playlistchange', function() {
	playListNode.innerHTML = "";
	let currentItem = player.playlist.currentItem();
    console.log('playlistchange', currentItem);
  	player.playlist().forEach(function(el, i) {
  		playListNode.appendChild(createPlaylistNode(el, i, currentItem === i));
  	});
});

player.on('playlistitem', function(event, item) {
    
    console.log('playlist item', item);
    
    document.title = item.title || documentTitle;
	document.querySelector('.video-title').innerHTML = (item.title || "");
	document.querySelector('.video-description').innerHTML = (item.description || "");

	document.querySelectorAll('.playlist-item.active').forEach(function(el) {
		el.classList.remove('active');
	});

	let playlistItems = document.querySelectorAll('.playlist-item');
    
	if (playlistItems.length) {
		playlistItems[item.index].classList.add('active');
	}
    
    let sources = item.sources.map(function(source, i) {
        return {
            index: source.index,
            src: source.url,
            url: source.url,
            location: source.location,
            type: source.type,
            label: source.quality + 'p',
            res: source.quality
        };
    });
        
    if (sources.length > 1) {
        player.updateSrc(sources); 
    } else {
        player.updateSrc(sources.pop()); 
    }
    
    chrome.runtime.sendMessage({
        from: 'player.js',
        action: 'play.now',
        message: {
            source: item
        }
    });
});

player.playlist.autoadvance(0);

function updatePlaylist(sources, startFirstItem) {
	let adaptedSources = [];
    
    if (typeof startFirstItem === 'undefined') {
        startFirstItem = -1;
    }

	sources.forEach(function(source, i) {
		adaptedSources.push({
            index: i,
			title: source.title,
			description: source.description,
			poster: source.poster,
            location: source.location,
			sources: source.sources.map(function(resolution) {
                resolution.src = resolution.url;
                if (!resolution.src.includes('http')) {
                    resolution.src = 'http:' + resolution.src;
                }
                return resolution;
            })
		});
	});
    
	player.playlist(adaptedSources, startFirstItem);
}

chrome.runtime.onMessage.addListener(function(request, sender, response) {

	if (request.from === 'background.js' && request.action === 'play.source') {
        player.pause();
		updatePlaylist([request.message.source], 0);
        player.playlist.currentItem(0);
        player.play();
	}

	if (request.from === 'background.js' && request.action === 'queue.source') {
        let playList = player.playlist();
        playList.push(request.message.source);
        updatePlaylist(playList);
	}
});

chrome.runtime.sendMessage({
    from: 'player.js',
    action: 'getState'
}, function(_state) {
    state = _state;
    updatePlaylist(_state.playlist, 0);
});


//let storedPlayList = localStorage.getItem('poc.playList');

//if (storedPlayList) {
//    player.playlist(JSON.parse(storedPlayList));
//    setTimeout(function() {
//        player.playlist([].concat(JSON.parse(storedPlayList), JSON.parse(storedPlayList)));
//    }, 5000);
//   setTimeout(function() {
//        player.playlist(JSON.parse(storedPlayList));
//    }, 10000);
//}


var drake = dragula([playListNode], {
    isContainer: function (el) {
        return  el.classList.contains('playlist'); // only elements in drake.containers will be taken into account
    },
    accepts: function (el, target, source, sibling) {
        return el.classList.contains('playlist-item') && target.classList.contains('playlist');
    },
    mirrorContainer: playListNode,
    direction: 'vertical' // Y axis is considered when determining where an element would be dropped
});

drake.on('dragend', function() {
    let order = [],
        playList = state.playlist;
        
    document.querySelectorAll('.playlist-item .title').forEach(function(el) {
		order.push(el.innerText);
	});
    
    playList.sort(function(a, b) {
        if (order.indexOf(a.title) > order.indexOf(b.title)) {
            return 1;
        } else if (order.indexOf(a.title) < order.indexOf(b.title)) {
            return -1;
        } else {
            return 0;
        }
    });
    
    updatePlaylist(playList);  
    updateState(state);
});

function getElementIndex(node) {
    var index = 0;
    while ((node = node.previousElementSibling)) {
        index++;
    }
    return index;
}