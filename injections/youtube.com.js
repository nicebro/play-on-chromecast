XMLHttpRequest.prototype.__send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(value) {
	this.addEventListener('load', function() {
		try {
			if (this.responseType !== 'document' && this.responseURL.includes('//www.youtube.com/watch?')) {
				var videoData = JSON.parse(this.responseText);
                console.log(videoData);
				sendResponse(parseArgs(videoData[2].player.args));
			}
		} catch(e) {
			console.warn('POC Extension exception: ' + e);
		}

	}, false);
	this.__send(value);
};


function ajax(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

function parseArgs(args) {
    
	let streamMap = args.url_encoded_fmt_stream_map;
    
    if (!streamMap) {
		return false;
	}
        
    let video = {
        title: args.title,
        poster: args.thumbnail_url.replace('default', 'hqdefault'),
        sources: []
    };

	streamMap.split(',').forEach(function(item) {
		let source = {},
			properties = item.split('&');

		properties.forEach(function(property) {
			property = property.split('=');
			source[property[0]] = decodeURIComponent(property[1]);
		});

		if (source.type.includes('video/mp4')) {
			if (!source.url.includes('signature=')) {
                console.log('no signature');
                source.url += '&signature=' + decodeSignature(source.s);
			} else {
                 console.log('has signature');
            }
            
			video.sources.push({
				url: source.url,
                type: 'video/mp4',
                quality: source.quality === 'medium' ? 360 : 720
			});
		}
	});

	return video;
}



function sendResponse(source) {
    let videoNode = document.querySelector('video'),
        videoContainer = document.querySelector('#player-container');
    
    if (videoNode) {
        videoNode.classList.add('poc-video-element');
    }
    
    if (videoContainer) {
        videoContainer.classList.add('poc-video-container');
    }
    
	document.dispatchEvent(new CustomEvent('poc.injection.response', {
		detail: {
			source: source
		}
	}));
}

let decodeSignature = null;

setTimeout(function() {
    

    try {
        ajax(window.location.origin + ytplayer.config.assets.js, function(response) {

            let signatureDecodeFunction = response.responseText.match(/((.+)=function\(.{1}\){.=.\.split\(""\).*?};)/);
                helpersFunctionName = signatureDecodeFunction[1].match(/split\(""\);(.*?)\..*?;/);
            
                let helpersFunctionRegExp = new RegExp('var ' + helpersFunctionName[1] + '(?:.|\n)*?};');
                helpersFunction = response.responseText.match(helpersFunctionRegExp);
            
           decodeSignature = new Function('s', `
                ${helpersFunction[0]}
                var ${signatureDecodeFunction[1]}
                return ${signatureDecodeFunction[2]}(s);
            `);
            
            sendResponse(parseArgs(ytplayer.config.args));    
//            return;
//                responseData = response.responseText
//                .replace(
//                    signatureDecodeFunctionName + '=function(',
//                    'window._yt_player.' + signatureDecodeFunctionName + '=function('
//                )
//                .replace('var _yt_player={};', 'window._yt_player = {};var _yt_player={};')
////                .replace('(_yt_player);', '(_yt_player);window._yt_player = _yt_player;');
////                return;
////            eval(responseData);
//            decodeSignature = _yt_player[signatureDecodeFunctionName];
//                
//                return;
//            sendResponse(parseArgs(ytplayer.config.args));    

        });
    
    } catch (e) {
        console.warn('POC Extension exception: ' + e);
    }   
	
}, 0);