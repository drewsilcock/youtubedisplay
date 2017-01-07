// See https://stackoverflow.com/a/901144
function getQueryParameterByName(parameterName, url) {
  if (!url) {
    url = window.location.href;
  }

  var encodedName = parameterName.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + encodedName + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);

  if (!results) {
    // Key not found.
    return null;
  }

  if (!results[2]) {
    // Key found, but value empty.
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Don't have jQuery AJAX here for efficiency; create our own AJAX GET.
function makeGetRequest(url, onSuccess, onError) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      onSuccess && onSuccess(data);
    } else {
      onError && onError('Server returned status code ' + request.status + '.');
    }
  };

  request.onerror = function () {
    onError && onError('Unable to connect to URL ' + url + '.');
  };

  request.send();
}


// Custom-AJAX version of YouTube video ID validator.
function validateVideoId(videoId, onSuccess, onError) {
  var googleApiKey = 'AIzaSyBxG_Tf2uvKip5sJLaFUPEjwAx5nd-iJ88'; // Restricted to this domain.
  var videoApiUrl = 'https://www.googleapis.com/youtube/v3/videos?part=id' +
                    '&id=' + videoId +
                    '&key=' + googleApiKey;

  makeGetRequest(videoApiUrl, function successHandler(data) {
    if (data.items.length === 0) {
      onError && onError('The video ID doesn\'t point to a valid video.');
    } else {
      onSuccess && onSuccess();
    }
  }, function errorHandler() {
    onError && onError('Unable to connect to Google YouTube API.');
  });
}

function activateFullscreen(evt) {
  console.log('Activating fullscreen...');

  var elem = document.documentElement;

  if (!document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }
}

function initialiseFullscreenButton() {
  var fullscreenQueryParameter = getQueryParameterByName('fullscreen');
  var disableFullscreen = fullscreenQueryParameter === '0';

  var fullscreenButton = document.getElementById('yd-js-fullscreen');

  if (disableFullscreen) {
    fullscreenButton.remove();
  } else {
    fullscreenButton.addEventListener('click', activateFullscreen);
  }
}

function initialiseVideoDisplay() {
  var videoId = getQueryParameterByName('v');

  if (!videoId) {
    return;
  }

  var muteQueryParameter = getQueryParameterByName('mute');
  var shouldMute = muteQueryParameter === null ||
                   muteQueryParameter === undefined ||
                   muteQueryParameter !== '0';

  var iframeElementId = 'yd-js-display-video';
  var iframeElement = document.getElementById(iframeElementId);

  validateVideoId(videoId, function successHandler() {
    console.log('Video ID is valid.');
  }, function errorHandler(errorMessage) {
    throw new Error(errorMessage);
  });

  var player;
  onYouTubeIframeAPIReady = function() {
    player = new YT.Player(iframeElementId, {
      videoId: videoId,
      width: window.innerWidth,
      height: window.innerHeight,
      playerVars: {
        autoplay: 1,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        playlist: videoId,
        loop: 1,
        fs: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 0,
      },
      events: {
        onReady: function(evt) {
          if (shouldMute) {
            console.log('Muting video...');
            evt.target.mute();
          } else {
            console.log('No-mute set in query parameter; not muting...');
          }
        },
      },
    });
  }

  window.onresize = function (evt) {
    player && player.setSize(window.innerWidth, window.innerHeight);
  };
}

var onYouTubeIframeAPIReady;
initialiseVideoDisplay();
initialiseFullscreenButton();
