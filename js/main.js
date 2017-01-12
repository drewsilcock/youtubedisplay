// jQuery AJAX version of YouTube video ID validator.
function validateVideoId(videoId, onSuccess, onError) {
  var googleApiKey = 'AIzaSyBxG_Tf2uvKip5sJLaFUPEjwAx5nd-iJ88'; // Restricted to this domain.
  var videoApiUrl = 'https://www.googleapis.com/youtube/v3/videos?part=id' +
                    '&id=' + videoId +
                    '&key=' + googleApiKey;

  $.ajax(videoApiUrl)
    .done(function successHandler(data) {
      if (data.items.length === 0) {
        onError && onError('The video ID doesn\'t point to a valid video.');
      } else {
        onSuccess && onSuccess();
      }
    }).fail(function errorHandler() {
      onError && onError('Unable to connect to Google YouTube API.');
    });
}

// http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
function parseUrl(url) {
  if (url.split('://').length === 1) {
    url = 'http://' + url;
  }

  var a = document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':', ''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (function () {
      var ret = {},
        seg = a.search.replace(/^\?/, '').split('&'),
        len = seg.length,
        i = 0,
        s;
      for (; i < len; i++) {
        if (!seg[i]) {
            continue;
        }
        s = seg[i].split('=');
        ret[s[0]] = s[1];
      }
      return ret;
    })(),
    file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
    hash: a.hash.replace('#', ''),
    path: a.pathname.replace(/^([^\/])/, '/$1'),
    relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
    segments: a.pathname.replace(/^\//, '').split('/')
  };
}

function getDisplayUrlFromVideoId(videoId, shouldFullscreen, shouldMute) {
  var displayUrl = window.location.origin + '/display/?v=' + videoId;

  // Default is not automatic fullscreen.
  if (shouldFullscreen === true) {
    displayUrl += '&fullscreen=1';
  }

  // Default is automatic mute.
  if (shouldMute === false) {
    displayUrl += '&mute=0';
  }

  return displayUrl;
}

// Parameter `url` is object from `parseUrl`, not a string.
function getVideoIdFromYouTubeUrl(url) {
  var videoId = url.params['v'];

  if (videoId !== undefined) {
    return videoId;
  }

  // Handle shortened domain, which is 'youtu.be/{VIDEO_ID}', without query parameter; OR
  // Handle youtube embed URL, which is 'www.youtube.com/embed/{VIDEO_ID}' (www is optional).
  if ((url.host === 'youtu.be' && url.segments.length === 1) ||
      ((url.host === 'youtube.com' || url.host === 'www.youtube.com') && url.segments.length === 2)) {
    return url.file;
  }

  return null;
}

function parseUrlForYouTubeVideo(inputUrl, onSuccess, onError) {
  if (!inputUrl) {
    onError('Please enter a URL.');
    return;
  }

  var url = parseUrl(inputUrl);

  var hostnameIsValid = url.host === 'www.youtube.com' ||
                        url.host === 'youtube.com' ||
                        url.host === 'youtu.be';
  if (!hostnameIsValid) {
    onError && onError('Input URL is not from YouTube.');
    return;
  }

  var videoId = getVideoIdFromYouTubeUrl(url);
  if (videoId === null || videoId === undefined) {
    onError && onError('Unable to find video ID from URL.');
    return;
  }

  var $fullscreenButton = $('#yd-js-fullscreen');
  var shouldFullscreen = $fullscreenButton.data('enabled');

  var $muteButton = $('#yd-js-mute');
  var shouldMute = $muteButton.data('muted');

  validateVideoId(videoId, function successHandler() {
    var displayUrl = getDisplayUrlFromVideoId(videoId, shouldFullscreen, shouldMute);
    onSuccess && onSuccess(displayUrl);
  }, function errorHandler(errorMessage) {
    onError && onError(errorMessage);
  });
}

function onSubmitClick() {
  var $urlInput = $('#yd-js-input');
  var inputUrl = $urlInput.val();

  var $alert = $('#yd-js-alert');
  var $alertTitle = $('#yd-js-alert__title');
  var $alertMessage = $('#yd-js-alert__message');
  var $alertUrl = $('#yd-js-alert__url');
  var $alertError = $('#yd-js-alert__error');

  var $info = $('#yd-js-info');

  var successTitle = 'Success';
  var successMessage = 'Your display URL is: ';

  var failureTitle = 'Error';
  var failureMessage = 'Unable to get YouTube video from URL: ';

  parseUrlForYouTubeVideo(inputUrl, function successHandler(displayUrl) {
    $alert.addClass('yd-fade-in');

    $alert.removeClass('alert-danger');
    $alert.addClass('alert-success');

    $alertTitle.text(successTitle);
    $alertMessage.text(successMessage);

    $alertUrl.text(displayUrl);
    $alertUrl.attr('href', displayUrl);

    $alertError.text('');

    $info.addClass('yd-fade-in');
  }, function errorHandler(errorMessage) {
    $alert.addClass('yd-fade-in');

    $alert.removeClass('alert-success');
    $alert.addClass('alert-danger');

    $alertTitle.text(failureTitle);
    $alertMessage.text(failureMessage);

    $alertUrl.text('');
    $alertUrl.attr('href', '#');

    $alertError.text(errorMessage);

    $info.removeClass('yd-fade-in');
  });
}

function onFullscreenClick() {
  var $fullscreenButton = $('#yd-js-fullscreen');
  var $fullscreenIcon = $fullscreenButton.find('.fa');
  var $fullscreenInfo = $('#yd-js-info').find('.yd-alert__message');

  var enabledTooltip = 'Easy fullscreen will be enabled.';
  var disabledTooltip = 'Easy fullscreen will be disabled.';

  var enabledInfo = 'Security restrictions prevent a page going fullscreen ' +
                       'without user interaction. To go fullscreen, click ' +
                       'anywhere on the page. To exit fullscreen, press the Escape key.';
  var disabledInfo = 'You can still go fullscreen by double-clicking on ' +
                        'the video or pressing \'F\'.';

  var $alertUrl = $('#yd-js-alert__url');
  var alertUrlExists = $alertUrl.text() !== '';

  if ($fullscreenButton.data('enabled')) {
    $fullscreenButton.data('enabled', false);
    $fullscreenButton.attr('title', disabledTooltip).tooltip('fixTitle').tooltip('show');

    $fullscreenIcon.removeClass('fa-arrows-alt');
    $fullscreenIcon.addClass('fa-window-restore');

    $fullscreenInfo.text(disabledInfo);

    if (alertUrlExists) {
      var newUrl = $alertUrl.text().replace('&fullscreen=1', '');
      $alertUrl.text(newUrl);
      $alertUrl.attr('href', newUrl);
    }
  } else {
    $fullscreenButton.data('enabled', true);
    $fullscreenButton.attr('title', enabledTooltip).tooltip('fixTitle').tooltip('show');

    $fullscreenIcon.removeClass('fa-window-restore');
    $fullscreenIcon.addClass('fa-arrows-alt');

    $fullscreenInfo.text(enabledInfo);

    if (alertUrlExists) {
      var newUrl = $alertUrl.text() + '&fullscreen=1';
      $alertUrl.text(newUrl);
      $alertUrl.attr('href', newUrl);
    }
  }
}

// When the mute button is clicked.
function onMuteClick() {
  var $muteButton = $('#yd-js-mute');
  var $muteIcon = $muteButton.find('.fa');

  var mutedTooltip = 'Sound will be disabled.';
  var unmutedTooltip = 'Sound will be enabled.';

  var $alertUrl = $('#yd-js-alert__url');
  var alertUrlExists = $alertUrl.text() !== '';

  if ($muteButton.data('muted')) {
    $muteButton.data('muted', false);
    $muteButton.attr('title', unmutedTooltip).tooltip('fixTitle').tooltip('show');

    $muteIcon.removeClass('fa-volume-off');
    $muteIcon.addClass('fa-volume-up');

    if (alertUrlExists) {
      var newUrl = $alertUrl.text() + '&mute=0';
      $alertUrl.text(newUrl);
      $alertUrl.attr('href', newUrl);
    }
  } else {
    $muteButton.data('muted', true);
    $muteButton.attr('title', mutedTooltip).tooltip('fixTitle').tooltip('show');

    $muteIcon.removeClass('fa-volume-up');
    $muteIcon.addClass('fa-volume-off');

    if (alertUrlExists) {
      var newUrl = $alertUrl.text().replace('&mute=0', '');
      $alertUrl.text(newUrl);
      $alertUrl.attr('href', newUrl);
    }
  }
}

function initialiseEventHandlers() {
  var $fullscreenButton = $('#yd-js-fullscreen');
  $fullscreenButton.on('click', onFullscreenClick);

  var $muteButton = $('#yd-js-mute');
  $muteButton.on('click', onMuteClick);

  var $submitButton = $('#yd-js-submit');
  $submitButton.on('click', onSubmitClick);

  var $urlInput = $('#yd-js-input');
  $urlInput.on('keypress', {}, function handleKeyPress(evt) {
    var keyCode = evt.keyCode ? evt.keyCode : evt.which;

    var enterKeyCode = 13;
    if (keyCode === enterKeyCode) {
      evt.preventDefault();
      onSubmitClick();
    }
  });
}

function loadBackgroundImage() {
  var $main = $('#yd-js-main');

  var backgroundImage = 'https://source.unsplash.com/category/nature';
  $('<img>').attr('src', backgroundImage).on('load', function() {
    $(this).remove();
    $main.css('background-image', 'url(' + backgroundImage + ')');
    $main.addClass('yd-fade-in');
  });
}

function enableBootstrapTooltips() {
  $('.yd-js-tooltip').tooltip();
}

(function() {
  loadBackgroundImage();
})();

$(function() {
  initialiseEventHandlers();
  enableBootstrapTooltips();
});
