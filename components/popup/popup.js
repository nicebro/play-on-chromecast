(function() {

    let state,
        enableBtn = document.querySelector('.enable-extension-btn'),
        disableBtn = document.querySelector('.disable-extension-btn'),
        openPlayerBtn = document.querySelector('.disable-extension-btn');
        
    enableBtn.addEventListener('click', function() {
        state.enabled = true;
        changeButtonState();
        
        chrome.runtime.sendMessage({
            from: 'popup.js',
            action: 'setState',
            message: {
                state: state
            }
        });
    });
    
    disableBtn.addEventListener('click', function() {
        state.enabled = false;
        changeButtonState();
        
        chrome.runtime.sendMessage({
            from: 'popup.js',
            action: 'setState',
            message: {
                state: state
            }
        });
        
    });
    
    function changeButtonState() {
        if (state.enabled) {
            enableBtn.style.display = 'none';
            disableBtn.style.display = '';
        } else {
            enableBtn.style.display = '';
            disableBtn.style.display = 'none';
        }
    }
    
	function log(message) {
		chrome.runtime.sendMessage({
			from: 'popup.js',
			action: 'log',
			message: message
		});
	}
    
    chrome.runtime.getBackgroundPage(function () {
        chrome.runtime.sendMessage({
            from: 'popup.js',
            action: 'getState'
        }, function(_state) {
            console.log(_state);
            state = _state;
            changeButtonState();
        });
    });
    
    
    return;
    
    
    
    
    
    chrome.runtime.reload();
	function log(message) {
		chrome.runtime.sendMessage({
			from: 'popup.js',
			action: 'log',
			message: message
		});
	}

	function getSources() {
		chrome.runtime.sendMessage({
			from: 'popup.js',
			action: 'get.sources'
		}, function(data) {
			
			if (!data || !data.sources || !data.sources.length) {
				log(['popup.js no sources', data]);
				window.close();
			}
			
			let sources = data.sources,
                playList = document.querySelector('.playlist');
                

			playList.innerHTML = "";

			sources.forEach(function(source) {

				let playlistItem = document.createElement('div'),
                    resolutions = source.sources.map(function(resolution) {
                        return resolution.quality + 'p';
                    }).join(' ');
					playlistItemTemplate = `
						<div class="poster"><img src="/assets/poster-placeholder.jpg"></div>
						<div class="title">${source.title}</div>
						<div class="description"></div>
						<div class="resolutions">${resolutions}</div>
                        <div class="played-now-label">Played now</div>
						<div class="actions">
							<button>Play on Chromecast</button>
							<button>Add to queue</button>
						</div>
					`;

				playlistItem.innerHTML = playlistItemTemplate;
				playlistItem.setAttribute('class', 'playlist-item');
				playList.appendChild(playlistItem);

				let poster = new Image();

				poster.onload = function() {
					playlistItem.getElementsByTagName('img')[0].src = source.poster;
				};

				let actionButtons = playlistItem.getElementsByTagName('button');

				actionButtons[0].addEventListener('click', function() {
					chrome.runtime.sendMessage({
						from: 'popup.js',
						action: 'play.source',
						message: {
							source: source
						}
					});
				});

				actionButtons[1].addEventListener('click', function() {
					chrome.runtime.sendMessage({
						from: 'popup.js',
						action: 'queue.source',
						message: {
							source: source
						}
					});
				})

				poster.src = source.poster;

			});
            
            setPlayedNow(data.played);
		});
	}
    
    function setPlayedNow(item) {
        console.log('setPlayed', item);
        [].forEach.call(document.querySelectorAll('.playlist-item'), function(itemNode) {
            itemNode.classList.remove('played-now');
            if (itemNode.querySelector('.title').innerText === item.title) {
                itemNode.classList.add('played-now');
            }
        })
    }


	/**
	 * Update
	*/
	chrome.runtime.onMessage.addListener(function(request, sender, response) {
        
		if (request.from === 'main.js' && request.action === 'add.source') {
			getSources();
		}
        
        if (request.from === 'player.js' && request.action === 'play.now') {
			setPlayedNow(request.message.source);
		}
        
        log(['get request popupjs', request])
	});

	getSources();

})();

console.log('popup');