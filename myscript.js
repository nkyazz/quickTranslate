context = new AudioContext(); // Create and Initialize the Audio Context

$(document).ready(function() {
  $(document).keypress(function () {
    if( event.which === 116 ) {
       reset();
       var selectedText = getSelectedText();
       console.log(selectedText);
       var selectionCoordinates = getSelectionCoords2();
       console.log(selectionCoordinates.right, selectionCoordinates.top);
       $.ajax({
         type: "GET",
         url: "https://dict.leo.org/dictQuery/m-vocab/ende/query.xml?tolerMode=nof&lp=ende&lang=en&rmWords=off&rmSearch=on&search=" + selectedText + "&searchLoc=0&resultOrder=basic&multiwordShowSingle=on&sectLenMax=16&n=2&t=2015-09-03T20:32:32.875Z",
         success: function (response) {
           var translatedAsHtml = $(response).find('side:eq(1) > repr').html();
           console.log(translatedAsHtml);           
           var $translationDiv = $('<div id="translation" />').css({
                                           'top': selectionCoordinates.top,
                                           'left': selectionCoordinates.right,
           });
           var imgUrl = chrome.extension.getURL("play.jpeg");
           //var $spellingDiv = $('<button type="button" id="spelling" ><img src="'+ imgUrl +'"></button>');
           var $spellingDiv = $('<div id="spelling"><img src="' + imgUrl + '" /></div>');
           $('body').append($spellingDiv);
           var url = $(response).find('entry:first > side:first > ibox > pron').attr('url');
           $(document).on('click', '#spelling', function(event) {
             requestAndPlay("https://dict.leo.org/media/audio/" + url + ".mp3");
             event.stopPropagation();
           });   
           $spellingDiv.css({'top': selectionCoordinates.top,
                             'left': selectionCoordinates.left - $spellingDiv.outerWidth(),
                             'visibility': 'visible',
           });
           
           $.each($(response).find('side:lt(6)').filter(':odd'), function(index, value) {
           	var translatedText = $(this).find('word').text();
           	var translationSpan = $('<span class="tt" />').html(translatedText);
           	$($translationDiv).append(translationSpan);
           });
	   $('body').append($translationDiv);
         },
         error: function (xhr, ajaxOptions, thrownError) {
           alert(xhr.status);
           alert(thrownError);
         }
      });
    }
  });
  $(document).click(function() {
    reset();
  })
});

function getSelectedText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function getSelectionCoords2(win) {
    win = win || window;
    var doc = win.document;
    var sel = doc.selection, range, rects, rect;
    var top = 0, left = 0, right = 0;
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

function selectText(element) {
    var doc = document;
    var text = doc.getElementById(element);    

    if (doc.body.createTextRange) { // ms
        var range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) { // moz, opera, webkit
        var selection = window.getSelection();            
        var range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function reset() {
   $('#translation').remove();
   $('#spelling').remove();
    var $wrapper = $('.tr');
    if ($wrapper.length > 0){
        var parent = $wrapper.parent().get(0);
        $wrapper.contents().unwrap();
        parent.normalize(); 
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

// Load the Sound with XMLHttpRequest
function requestAndPlay(url) {
    // Note: this will load asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer"; // Read as binary data
    // Asynchronous callback
    request.onload = function() {
        var data = request.response;
        audioRouting(data);
    };
    request.send();
}

// Create Buffered Sound Source
function audioRouting(data) {
    source = context.createBufferSource(); // Create sound source
    context.decodeAudioData(data, function(buffer){ // Create source buffer from raw binary
    source.buffer = buffer; // Add buffered data to object
    source.connect(context.destination); // Connect sound source to output
    source.start(context.currentTime); // play the source immediately
    //playSound(source); // Pass the object to the play function
    });
}

//function playSound() {
  //  source.start(context.currentTime); // play the source immediately
//}

// --------------


// Create Annonomuos Self Executing Function
//(function(){
	
	//var context = new AudioContext(); // Create and Initialize the Audio Context
	//var electro; // Create the Sound 
	//var getSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	//getSound.open("GET", "sounds/electro2.wav", true); // Path to Audio File
	//getSound.responseType = "arraybuffer"; // Read as Binary Data
	//getSound.onload = function() {
	//	context.decodeAudioData(getSound.response, function(buffer){
	//		electro = buffer; // Decode the Audio Data and Store it in a Variable
	//	});
	//}
	//getSound.send(); // Send the Request and Load the File
	
	//window.addEventListener("keydown",onKeyDown); // Create Event Listener for KeyDown
	
	//function onKeyDown(e){
	//	switch (e.keyCode) {
			// X
	//		case 88:
	//			var playSound = context.createBufferSource(); // Declare a New Sound
	//			playSound.buffer = electro; // Attatch our Audio Data as it's Buffer
	//			playSound.connect(context.destination);  // Link the Sound to the Output
	//			playSound.start(0); // Play the Sound Immediately
	//		break;
	//	}
 	//}
//}());