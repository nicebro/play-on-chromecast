XMLHttpRequest.prototype.__send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(value) {
	this.addEventListener('load', function() {
		try {
			if (this.responseURL.includes('//player.vimeo.com/video')) {
				var clipData = JSON.parse(this.responseText);
				if (clipData.request) {
					sendResponse(parseVimeoClipObject(clipData));
				}
			}
		} catch(e) {
			console.warn('POC Extension exception: ' + e);
		}

	}, false);
	this.__send(value);
};

function parseVimeoClipObject(clip) {

	var videos = clip.request.files.progressive,
        video = {
            title: clip.video.title,
            poster: clip.video.thumbs.base,
            sources: []
        };

	for (var i = 0; i < videos.length; i++) {
		video.sources.push({
			url: videos[i].url,
            quality: parseInt(videos[i].quality),
            type: videos[i].mime
		});
	}

	return video;
}

function sendResponse(source) {
    
    let videoNode = document.querySelector('.player video');
    
    if (videoNode) {
        videoNode.classList.add('poc-video-element');
    }
    
	document.dispatchEvent(new CustomEvent('poc.injection.response', {
		detail: {
			source: source
		}
	}));
}

setTimeout(function() {

	if (vimeo && vimeo.clips) {
		try {
			for (var id in vimeo.clips) {
				sendResponse(parseVimeoClipObject(vimeo.clips[id]));
			}
		} catch(e) {
			console.warn('POC Extension exception: ' + e);
		}

	}

}, 0);