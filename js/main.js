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

  var successTitle = 'Success';
  var successMessage = 'Your display URL is: ';

  var failureTitle = 'Error';
  var failureMessage = 'Unable to get YouTube video from URL: ';

  parseUrlForYouTubeVideo(inputUrl, function successHandler(displayUrl) {
    $alert.removeClass('alert-danger');
    $alert.addClass('alert-success');

    $alertTitle.text(successTitle);
    $alertMessage.text(successMessage);

    $alertUrl.text(displayUrl);
    $alertUrl.attr('href', displayUrl);

    $alertError.text('');

    $alert.fadeIn();
  }, function errorHandler(errorMessage) {
    $alert.removeClass('alert-success');
    $alert.addClass('alert-danger');

    $alertTitle.text(failureTitle);
    $alertMessage.text(failureMessage);

    $alertUrl.text('');
    $alertUrl.attr('href', '#');

    $alertError.text(errorMessage);

    $alert.fadeIn();
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
                        'the video or pressing <F11>.';

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

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate luma, which is a perception-based coefficient based on apparent
 * 'lightness' or luminescence of colour.
 * See https://stackoverflow.com/a/12043228
 */
function calculateLuma(hexColour) {
  var hex = hexColour.substring(1); // Remove leading '#'.
  var rgb = parseInt(hex, 16); // Convert hex value to decimal.

  var redValue = (rgb >> 16) & 0xff; // Extract RR from RRGGBB.
  var greenValue = (rgb >> 8) & 0xff; // Extract GG from RRGGBB.
  var blueValue = rgb && 0xff; // Extract BB from RRGGBB.

  // Defined by ITU-R BT.709.
  var luma = 0.2126 * redValue +
             0.7152 * greenValue +
             0.0722 * blueValue;

  return luma;
}

/**
 * Check whether the perception-based luma coefficient is more than an
 * arbitrary measure of its value.
 */
function isColourBright(hexColour) {
  var luma = calculateLuma(hexColour);

  return luma > 80;
}

function generateTitleGradient() {
  // Values via uigradients.com
  var gradientsList = [
    ["#DE6262", "#FFB88C"],
    ["#ff4b1f", "#1fddff"],
    ["#f7ff00", "#db36a4"],
    ["#ddd6f3", "#faaca8"],
    ["#9D50BB", "#6E48AA"],
    ["#1A2980", "#26D0CE"],
    ["#50C9C3", "#96DEDA"],
    ["#414d0b", "#727a17"],
    ["#606c88", "#3f4c6b"],
    ["#AA076B", "#61045F"],
    ["#DAD299", "#B0DAB9"],
    ["#ef32d9", "#89fffd"],
    ["#00C9FF", "#92FE9D"],
    ["#C02425", "#F0CB35"],
    ["#52c234", "#061700"],
    ["#2c3e50", "#3498db"],
    ["#73C8A9", "#373B44"],
    ["#f4c4f3", "#fc67fa"],
    ["#f85032", "#e73827"],
    ["#FF512F", "#DD2476"],
    ["#d53369", "#cbad6d"],
    ["#B24592", "#F15F79"],
    ["#2BC0E4", "#EAECC6"],
    ["#EC6F66", "#F3A183"],
    ["#00c3ff", "#ffff1c"],
    ["#00d2ff", "#928DAB"],
    ["#5f2c82", "#49a09d"],
    ["#D3959B", "#BFE6BA"],
    ["#556270", "#FF6B6B"],
    ["#EB3349", "#F45C43"],
    ["#FBD3E9", "#BB377D"],
    ["#2F7336", "#AA3A38"],
    ["#005C97", "#363795"],
    ["#ECE9E6", "#FFFFFF"],
    ["#E0EAFC", "#CFDEF3"],
    ["#603813", "#b29f94"],
    ["#ff00cc", "#333399"],
    ["#D38312", "#A83279"],
    ["#525252", "#3d72b4"],
    ["#FF4E50", "#F9D423"],
    ["#BE93C5", "#7BC6CC"],
    ["#BA8B02", "#181818"],
    ["#4B79A1", "#283E51"],
    ["#F3904F", "#3B4371"],
    ["#f857a6", "#ff5858"],
    ["#4CA1AF", "#C4E0E5"],
    ["#673AB7", "#512DA8"],
    ["#2C3E50", "#4CA1AF"],
    ["#000000", "#434343"],
    ["#B993D6", "#8CA6DB"],
    ["#4ECDC4", "#556270"],
    ["#DC2424", "#4A569D"],
    ["#ffd89b", "#19547b"],
    ["#2C3E50", "#FD746C"],
    ["#649173", "#DBD5A4"],
    ["#ff7e5f", "#feb47b"],
    ["#41295a", "#2F0743"],
    ["#4776E6", "#8E54E9"],
    ["#348F50", "#56B4D3"],
    ["#43cea2", "#185a9d"],
    ["#00c6ff", "#0072ff"],
    ["#bdc3c7", "#2c3e50"],
    ["#cb2d3e", "#ef473a"],
    ["#ff0084", "#33001b"],
    ["#5A3F37", "#2C7744"],
    ["#5D4157", "#A8CABA"],
    ["#F1F2B5", "#135058"],
    ["#83a4d4", "#b6fbff"],
    ["#000428", "#004e92"],
    ["#403B4A", "#E7E9BB"],
    ["#e96443", "#904e95"],
    ["#c2e59c", "#64b3f4"],
    ["#02AAB0", "#00CDAC"],
    ["#6A9113", "#141517"],
    ["#fd746c", "#ff9068"],
    ["#16A085", "#F4D03F"],
    ["#1e130c", "#9a8478"],
    ["#003973", "#E5E5BE"],
    ["#ee0979", "#ff6a00"],
    ["#808080", "#3fada8"],
    ["#457fca", "#5691c8"],
    ["#C04848", "#480048"],
    ["#517fa4", "#243949"],
    ["#DA22FF", "#9733EE"],
    ["#FFEEEE", "#DDEFBB"],
    ["#1e3c72", "#2a5298"],
    ["#FF8008", "#FFC837"],
    ["#614385", "#516395"],
    ["#D1913C", "#FFD194"],
    ["#c21500", "#ffc500"],
    ["#3CA55C", "#B5AC49"],
    ["#FFB75E", "#ED8F03"],
    ["#A1FFCE", "#FAFFD1"],
    ["#76b852", "#8DC26F"],
    ["#304352", "#d7d2cc"],
    ["#3a6186", "#89253e"],
    ["#56ab2f", "#a8e063"],
    ["#780206", "#061161"],
    ["#F09819", "#EDDE5D"],
    ["#24C6DC", "#514A9D"],
    ["#FDFC47", "#24FE41"],
    ["#f46b45", "#eea849"],
    ["#42275a", "#734b6d"],
    ["#abbaab", "#ffffff"],
    ["#FC354C", "#0ABFBC"],
    ["#4DA0B0", "#D39D38"],
    ["#232526", "#414345"],
    ["#67B26F", "#4ca2cd"],
    ["#F00000", "#DC281E"],
    ["#5614B0", "#DBD65C"],
    ["#16222A", "#3A6073"],
    ["#215f00", "#e4e4d9"],
    ["#1D976C", "#93F9B9"],
    ["#DAE2F8", "#D6A4A4"],
    ["#616161", "#9bc5c3"],
    ["#134E5E", "#71B280"],
    ["#757F9A", "#D7DDE8"],
    ["#a73737", "#7a2828"],
    ["#B3FFAB", "#12FFF7"],
    ["#de6161", "#2657eb"],
    ["#8E0E00", "#1F1C18"],
    ["#2980b9", "#2c3e50"],
    ["#ff6e7f", "#bfe9ff"],
    ["#3D7EAA", "#FFE47A"],
    ["#eacda3", "#d6ae7b"],
    ["#ADD100", "#7B920A"],
    ["#e53935", "#e35d5b"],
    ["#ffb347", "#ffcc33"],
    ["#ED4264", "#FFEDBC"],
    ["#666600", "#999966"],
    ["#ee9ca7", "#ffdde1"],
    ["#DD5E89", "#F7BB97"],
    ["#4b6cb7", "#182848"],
    ["#114357", "#F29492"],
    ["#D31027", "#EA384D"],
    ["#2196f3", "#f44336"],
    ["#403A3E", "#BE5869"],
    ["#8e9eab", "#eef2f3"],
    ["#FFA17F", "#00223E"],
    ["#360033", "#0b8793"],
    ["#1D2B64", "#F8CDDA"],
    ["#BA5370", "#F4E2D8"],
    ["#6a3093", "#a044ff"],
    ["#000000", "#e74c3c"],
    ["#1D4350", "#A43931"],
    ["#00d2ff", "#3a7bd5"],
    ["#E55D87", "#5FC3E4"],
    ["#141E30", "#243B55"],
    ["#CCCCB2", "#757519"],
    ["#1CD8D2", "#93EDC7"],
    ["#4CB8C4", "#3CD3AD"],
    ["#485563", "#29323c"],
    ["#000000", "#53346D"],
    ["#a80077", "#66ff00"],
    ["#f79d00", "#64f38c"],
    ["#70e1f5", "#ffd194"],
    ["#e43a15", "#e65245"],
    ["#5C258D", "#4389A2"],
    ["#EFEFBB", "#D4D3DD"],
    ["#fffc00", "#ffffff"],
    ["#3a7bd5", "#3a6073"],
    ["#fe8c00", "#f83600"],
    ["#F0C27B", "#4B1248"],
    ["#1F1C2C", "#928DAB"],
    ["#7474BF", "#348AC7"],
    ["#fceabb", "#f8b500"],
    ["#EDE574", "#E1F5C4"],
    ["#FF512F", "#F09819"],
    ["#0B486B", "#F56217"],
    ["#0099F7", "#F11712"],
    ["#834d9b", "#d04ed6"],
    ["#FF5F6D", "#FFC371"],
    ["#ff4b1f", "#ff9068"],
    ["#948E99", "#2E1437"],
    ["#AAFFA9", "#11FFBD"],
    ["#870000", "#190A05"],
    ["#fc00ff", "#00dbde"],
    ["#283048", "#859398"],
    ["#EECDA3", "#EF629F"],
    ["#16BFFD", "#CB3066"],
    ["#136a8a", "#267871"],
    ["#6441A5", "#2a0845"],
    ["#004FF9", "#FFF94C"],
    ["#e9d362", "#333333"],
    ["#085078", "#85D8CE"],
    ["#00bf8f", "#001510"],
    ["#C9FFBF", "#FFAFBD"],
    ["#7b4397", "#dc2430"],
    ["#E6DADA", "#274046"],
    ["#e52d27", "#b31217"],
  ];

  var randomIndex = getRandomInt(0, gradientsList.length - 1);
  var randomGradient = gradientsList[randomIndex];

  var $mainTitle = $('#yd-js-title');
  var linearGradient = '45deg, ' + randomGradient[0] + ', ' + randomGradient[1];
  $mainTitle.css('color', randomGradient[0]); // Fallback
  $mainTitle.css('background-image',
                 '-webkit-linear-gradient(' + linearGradient + ')');
  $mainTitle.css('background-image',
                 'linear-gradient(' + linearGradient + ')');

  var leftBrightness = calculateLuma(randomGradient[0]);
  if (isColourBright(randomGradient[0])) {
    $mainTitle.removeClass('yd-shadow__light');
    $mainTitle.addClass('yd-shadow__dark');
    console.log('Gradient start colour has luma of ' + leftBrightness + '; using dark shadow.');
  } else {
    $mainTitle.removeClass('yd-shadow__dark');
    $mainTitle.addClass('yd-shadow__light');
    console.log('Gradient start colour has luma of ' + leftBrightness + '; using light shadow.');
  }
}

(function() {
  generateTitleGradient();
  loadBackgroundImage();
})();

$(function() {
  initialiseEventHandlers();
  enableBootstrapTooltips();
});
