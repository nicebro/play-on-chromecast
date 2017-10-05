console.log('main.js injected');

function sendMessage(message, callback) {
    chrome.runtime.sendMessage(message, callback);
}

function log(message) {
    sendMessage({
        from: 'main.js',
        action: 'log',
        message: message
    });
}

log('main.js injected');

function getState(callback) {
    sendMessage({
        from: 'main.js',
        action: 'getState'
    }, callback); 
}
    
var sources = {},
    isEnabled = true,
    supportedFormats = ['mp4', 'webm'];

function getFileNameFromUrl(url) {
	return url.split('/').pop();
}

function addNewSource(url, title, poster) {
	
    console.log(addNewSource);
	if (!poster) {
		var element = document.querySelector('meta[property="og:image"]') ||
			parent.document.querySelector('meta[property="og:image"]');

		poster = element && element.getAttribute("content");
	}

	let source = {
		title: (title || document.title || parent.document.title) + new Date().getTime(),
		sources: [{
            url: url,
            type: 'video/mp4',
            quality: 'unknown'
        }],
		poster: poster
	};

	sendMessage({
		from: 'main.js',
		action: 'add.source',
		message: {
			source: source
		}
	});
}

let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            console.log('mutatiion', mutation, this);
            debugger;
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                console.log(source);
    //			var source = mutation.target.getAttribute('src');
    //			if (source.length) {
    //				addNewSource(source, null, mutation.target.getAttribute('poster'));
    //			}
            }
        });
    }),
    observerConfig = {
        attributes: true, childList: true
    };



function nodeOffsetCalc(el) {
  
    let rect = el.getBoundingClientRect(),
            
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height
    };
}

function onResize(videoNode, pocContainer) {
    let nodeOffset = nodeOffsetCalc(videoNode);
    console.log(nodeOffset);
    pocContainer.style.width = nodeOffset.width + 'px';
    pocContainer.style.height = nodeOffset.height + 'px';
    pocContainer.style.left = nodeOffset.left + 'px';
    pocContainer.style.top = nodeOffset.top + 'px';
}

function stopVideo(e) {
	this.pause();
	e.target.removeEventListener(e.type, arguments.callee);
}

function createOverlay(source) {
    
    console.log(source);
    if (!source) {
        return;
    }
    
    let videoNode = document.querySelector('.poc-video-element'), 
        videoContainer = document.querySelector('.poc-video-container'),
        pocContainer = document.querySelector('.poc-container');
    
    pocContainer && pocContainer.remove();
     
    videoNode.addEventListener('play', stopVideo);
    videoNode.pause();
    
    setTimeout(function() {
        
        if (videoNode) {

            source.location = window.location.href;

            let el = document.createElement('div');

            el.innerHTML = `
                <div class="poc-container">
                    <div class="poc-background-image">
                        <img src="${source.poster}" alt="" />
                    </div>
                    <div class="poc-inner-container">
                        <div class="poc-title">${source.title}</div>
                        <div class="poc-poster-container">
                            <img src="${source.poster}" alt="" />
                        </div>
                        <div class="poc-action-buttons">
                            <button class="poc-action-play-now">Play now</button>
                            <button class="poc-action-add-to-queue">Add to queue</button>
                        </div>
                    </div>
                </div>
            `;

            let pocContainer = el.firstElementChild;

            document.body.appendChild(pocContainer);
            document.body.classList.add('poc-init');

            pocContainer.querySelector('.poc-action-play-now').addEventListener('click', function(event) {
                setTimeout(function() {
                    event.target.blur();
                }, 1000);
                sendMessage({
                    from: 'main.js',
                    action: 'playSource',
                    message: {
                        source: source
                    }
                });
            });

            pocContainer.querySelector('.poc-action-add-to-queue').addEventListener('click', function(event) {
                setTimeout(function() {
                    event.target.blur();
                }, 1000);
                sendMessage({
                    from: 'main.js',
                    action: 'addSourceToQueue',
                    message: {
                        source: source
                    }
                });
            });

            window.addEventListener('resize', function() {
                onResize(videoContainer || videoNode, pocContainer);
            });
            
            onResize(videoContainer || videoNode, pocContainer);

        }
    }, 500);

}

/**
 * On injection response add video overlay.
 * @returns {undefined}
 */
function addListeners() {
    document.addEventListener('poc.injection.response', function(e) {
        if (!e.detail || !e.detail.source) {
            return;
        }
        
        getState(function(state) {
            log(['inject.response', state, e.detail.source]);
            if (state.enabled) {
                createOverlay(e.detail.source);
            }
        });
    });
}

function injectScript(name) {
	var script = document.createElement('script');
	script.src = 'chrome-extension://' + chrome.runtime.id + '/injections/' + name + '.js';
	document.body.appendChild(script);
    log(['injected', name]);
	script.onload = function() {
		script.remove();
	};
}

function checkVideoElement(video) {
    
    let url = video.getAttribute('src'),
        poster = video.getAttribute('poster'),
        title = document.title,
        sources = video.getElementsByTagName('source'),
        type;

    if (!url) {
        if (sources) {
            [].forEach.call(sources, function(source) {
                let sourceType = source.getAttribute('type');
                 
                if (['video/mp4', 'video/webm'].indexOf(sourceType) !== -1 && !url) {
                    url = source.getAttribute('src');
                    type = sourceType;
                }
            });
        }
    }

    if (url) {
 
        
        if (url.includes('blob:')) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function (e) {
                if (this.status === 200) {
                    var myBlob = this.response;
                    console.log(myBlolb);
                }
            };
            xhr.send();
        }
        
        video.classList.add('poc-video-element');
        createOverlay({
            title: title,
            poster: poster,
            sources: [{
                url: url,
                type: type,
                quality: null
            }]
        });
    }
}

function init() {
    
    console.log('init');
    
    addListeners();
    
    switch(window.location.host) {
        case 'www.youtube.com':
            injectScript('youtube.com');
            return;
        case 'vimeo.com':
            injectScript('vimeo.com');
            return;
        case 'fs.life':
            injectScript('fs.life');
            return;
    }



       
    let videos = document.getElementsByTagName("video");

	[].forEach.call(videos, function(video) {
        console.log(video);
        video.addEventListener('loadedmetadata', function(event, data) {
            console.log(event, data);
            checkVideoElement(event.target);
        });
	});
    
    
	document.addEventListener("DOMNodeInserted", function(event) {
        return;
		if (event.target.nodeName === 'SOURCE') {
			var url = event.target.getAttribute('src');
			if (url) {
				addNewSource(url);
			}
			observer.observe(event.target, observerConfig);
		}
        
		if (event.target.nodeName === 'IFRAME') {
            
			var url = event.target.getAttribute('src');
			console.log('url', url);
		}

		if (event.target.nodeName === 'VIDEO') {
            console.log('video node inserted');
			var url = event.target.getAttribute('src'),
			poster = event.target.getAttribute('poster');

			if (url) {
				addNewSource(url, null, poster);
			}
            
            event.target.addEventListener('loadedmetadata', function(data, data2) {
                console.log('meta load', data, data2);
            });

			observer.observe(event.target, observerConfig);
		}
	});
    
    return;



   
	var regExp = RegExp("(http(s)?)?[A-Za-z0-9%?=&:\/._-]*[.](mp4|mkv|webm)[A-Za-z0-9;%?=&:\/._-]*", "ig");



	function findVideoSources(html) {

		var urls = [];

		if (!html) {
			html = document.documentElement.innerHTML;
		}

		var matches = html.match(regExp);
		return matches;
	}
}

if (document.readyState === "complete" 
     || document.readyState === "loaded" 
     || document.readyState === "interactive") {
     init();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        init();
    }, false);
}