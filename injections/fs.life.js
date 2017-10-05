XMLHttpRequest.prototype.__send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(value) {
	this.addEventListener('load', function() {

		try {
            console.log(this, '1');
			if (this.responseURL && this.responseURL.includes('/get/playvideo/')) {
                isSerials = window.location.href.includes('/serials/');
                
                
                console.log(this);
				let sourceTitle = [];
                
                if (isSerials) {
                    sourceTitle.push(document.querySelector('.b-aplayer__html5-desktop-titles-left a').innerText);
                    sourceTitle.push(document.querySelector('.b-aplayer__actions-series .b-aplayer__actions-series-season').innerText);
                    sourceTitle.push(document.querySelector('.b-aplayer__actions-series .b-aplayer__actions-series-episode').innerText);
                    sourceTitle.push(document.querySelector('.b-aplayer__actions-translation-inner .title').innerText);
                }
//                    let titles = document.querySelector('.b-aplayer__html5-desktop-titles'),
//					section = document.querySelector('.b-aplayer__html5-desktop-titles__subcat'),
//					nameAndQualityNode = titles.childNodes[1],
//					title = nameAndQualityNode.childNodes[0].innerText || '',
					let quality = (document.querySelector('.b-aplayer__html5-desktop-titles__file').innerText || '').split(' ').pop(),
//					season = document.querySelector('.b-aplayer__actions-series-season').innerText || '',
//					episode = document.querySelector('.b-aplayer__actions-series-episode').innerText || '',
//					translation = document.querySelector('.b-aplayer__actions-translation .title').innerText || '',
					poster = parent.document.querySelector('.poster-main img').getAttribute('src'),
					response = JSON.parse(this.response);
                      
				sendResponse({
					title: sourceTitle.join(' '), //season, episode,
                    sources: [
                        {
                            url: response.link,
                            type: 'video/mp4',
                            quality: parseInt(quality, 10)
                        }
                    ],
					poster: poster.includes('http') ? poster : window.location.protocol + poster
				});

			}
		} catch(e) {
			console.error('POC Extension exception: ' + e);
		}


	}, false);
	this.__send(value);
};


function sendResponse(source) {
    console.log(source);
	document.dispatchEvent(new CustomEvent('poc.injection.response', {
		detail: {
			source: source
		}
	}));
}

setTimeout(function() {


	
}, 0);

console.log('fs.life.inject');