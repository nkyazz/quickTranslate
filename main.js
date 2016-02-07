$(document).ready(function() {
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
    var selection = getSelection();
    $translationDiv.css({
        'top': selection.top,
        'left': selection.right,
        'visibility': 'visible'
    });
    $spellingDiv.css({
        'top': selection.top,
        'left': selection.left - $spellingDiv.outerWidth(),
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
    var imgUrl = chrome.extension.getURL("play.jpeg");
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

function getSelection() {
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

function selectText(element) {
    var doc = document;
    var text = doc.getElementById(element);

    var range = doc.body.createTextRange;
    if (range) { // ms
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) { // moz, opera, webkit
        var selection = window.getSelection();
        range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function getSelectionCoords(win) {
    win = win || window;
    var doc = win.document;
    var sel = doc.selection, range, rects, rect;
    var x = 0, y = 0;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.collapse(true);
            x = range.boundingLeft;
            y = range.boundingTop;
        }
    } else if (win.getSelection) {
        sel = win.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getClientRects) {
                rects = range.getClientRects();
                if (rects.length > 0) {
                    rect = rects[0];
                }
                x = rect.right;
                y = rect.top - document.body.getBoundingClientRect().top;
            }
            // Fall back to inserting a temporary element
            if (x == 0 && y == 0) {
                var span = doc.createElement("span");
                if (span.getClientRects) {
                    // Ensure span has dimensions and position by
                    // adding a zero-width space character
                    span.appendChild( doc.createTextNode("\u200b") );
                    range.insertNode(span);
                    rect = span.getClientRects()[0];
                    x = rect.right;
                    y = rect.top;
                    var spanParent = span.parentNode;
                    spanParent.removeChild(span);

                    // Glue any broken text nodes back together
                    spanParent.normalize();
                }
            }
        }
    }
    return { right: x, top: y };
}