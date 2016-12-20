// See https://stackoverflow.com/a/901144
function getQueryParameterByName(parameterName, url) {
  if (!url) {
    url = window.location.href;
  }

  var encodedName = parameterName.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + encodedName + "(=([^&#]*)|&|#|$)");
  var results = regex.exec(url);

  if (!results) {
    // Key not found.
    return null;
  }

  if (!results[2]) {
    // Key found, but value empty.
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function makeGetRequest(url, success, error) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      success(data);
    } else {
      error();
    }
  };

  request.onerror = function () {
    error();
  };

  request.send();
}

// This is being run async anyway, so let's just do it here.

var videoId = getQueryParameterByName('v');

var iframeId = 'DisplayVideo';
var googleApiKey = 'AIzaSyBxG_Tf2uvKip5sJLaFUPEjwAx5nd-iJ88'; // Restricted to this domain.
var videoApiUrl = 'https://www.googleapis.com/youtube/v3/videos?part=id' +
                  '&id=' + videoId +
                  '&key=' + googleApiKey;

if (!videoId) {
  console.error("Video ID not found in URL.");
}

makeGetRequest(videoApiUrl, function successHandler(data) {
  if (data.items.length === 0) {
    console.error("Video ID not valid.");
  }

  console.log("Video ID is valid.");
}, function errorHandler() {
  console.error("Video ID not valid.");
});

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player(iframeId, {
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
        evt.target.mute();
      },
    },
  });
}

window.onresize = function (evt) {
  if (player) {
    player.setSize(window.innerWidth, window.innerHeight);
  }
};
