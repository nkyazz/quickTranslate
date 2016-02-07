audioContext = new AudioContext(); // Create and Initialize the Audio Context

// Load the Sound with XMLHttpRequest
function requestAndPlay(url) {
    // Note: this will load asynchronously
    var soundBuffer = null;
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer"; // Read as binary data
    // Asynchronous callback
    request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer){
            soundBuffer = buffer;
        }, onError);
        var data = request.response;
        playAudio(data);
    };
    request.send();
}

// Create Buffered Sound Source
function playAudio(buffer) {
    source = audioContext.createBufferSource(); // Create sound source
    source.buffer = buffer; // Add buffered data to object
    source.connect(audioContext.destination); // Connect sound source to output
    source.start(0); // play the source immediately
}