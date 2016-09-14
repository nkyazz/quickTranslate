$(document).ready(function() {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var source;

    // Load the Sound with XMLHttpRequest
    function requestAndPlay(url) {
        source = audioContext.createBufferSource();
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer"; // Read as binary data
        // Asynchronous callback
        request.onload = function() {
            var audioData = request.response;
            audioContext.decodeAudioData(audioData, function(buffer) {
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                },

                function(e){"Error with decoding audio data" + e.err});

        };
        request.send();
    }

    function playAudio(buffer) {
        source = audioContext.createBufferSource(); // Create sound source
        source.buffer = buffer; // Add buffered data to object
        source.connect(audioContext.destination); // Connect sound source to output
        source.start(0); // play the source immediately
    }

    function requestTranslationFor(text, callback) {
        $.ajax({
            type: "GET",
            url: "https://dict.leo.org/dictQuery/m-vocab/ende/query.xml?tolerMode=nof&lp=ende&lang=en&rmWords=off&rmSearch=on&search=" + text + "&searchLoc=0&resultOrder=basic&multiwordShowSingle=on&sectLenMax=16&n=2&t=2015-09-03T20:32:32.875Z",
            success: function (response) {
                callback(response)

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        });
    }

    function displayTranslation(translation) {
        var $translationDiv = createTranslationDiv(translation);
        var $spellingDiv = createSpellingDiv(translation);
        var $body = $('body');
        $body.append($translationDiv);
        $body.append($spellingDiv);
        var selection = getSelectionBoundries();
        $translationDiv.css({
            'top': selection.top,
            'left': selection.right,
            'visibility': 'visible'
        });
        $spellingDiv.css({
            'top': selection.top,
            'left': selection.left - $spellingDiv.outerWidth() -1,
            'visibility': 'visible'
        });
    }

    function createTranslationDiv(response) {
        var $translationDiv = $('<div id="translation" />');
        $.each($(response).find('side:lt(6)').filter(':odd'), function() {
            var translatedText = $(this).find('word').text();
            var translationSpan = $('<span class="tt" />').html(translatedText);
            $($translationDiv).append(translationSpan);
        });
        return $translationDiv;
    }

    function createSpellingDiv(response) {
        var imgUrl = chrome.extension.getURL("resources/images/play.jpeg");
        var url = $(response).find('entry:first > side:first > ibox > pron').attr('url');
        var $spellingDiv = $('<div id="spelling"><img src="' + imgUrl + '" /></div>');
        $spellingDiv.click(function (event) {
            requestAndPlay("https://dict.leo.org/media/audio/" + url + ".mp3");
            event.stopPropagation();
        });
        return $spellingDiv;
    }

    function getSelectedText() {
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    }

    function getSelectionBoundries() {
        var doc = window.document;
        var sel = doc.selection, range;
        var top = 0, left = 0, right = 0;
        if (sel) {
            if (sel.type != "Control") {
                range = sel.createRange();
                range.collapse(true);
                x = range.boundingLeft;
                y = range.boundingTop;
            }
        } else if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0).cloneRange();
                if (range.getClientRects) {
                    var newNode = document.createElement("span");
                    newNode.setAttribute('class', 'tr');
                    range.surroundContents(newNode);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    var $offset = $(newNode).offset();
                    top = $offset.top;
                    left = $offset.left;
                    right = $offset.left + $(newNode).width();

                }
            }
        }
        return { top: top, left: left, right: right };
    }

    function removeDisplayedTranslation() {
        $('#translation').remove();
        $('#spelling').remove();
        var $wrapper = $('.tr');
        if ($wrapper.length > 0){
            var parent = $wrapper.parent().get(0);
            $wrapper.contents().unwrap();
            parent.normalize();
        }
    }

    $(document).keypress(function () {
        if (event.altKey && event.which === 8224) {
            removeDisplayedTranslation();
            var selectedText = getSelectedText();
            requestTranslationFor(selectedText, function (translation) {
                displayTranslation(translation);
            });
        }
    });
    $(document).click(function() {
        removeDisplayedTranslation();
    });
});