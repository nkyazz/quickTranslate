audioContext = new AudioContext(); // Create and Initialize the Audio Context

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
    source = audioContext.createBufferSource(); // Create sound source
    audioContext.decodeAudioData(data, function(buffer){ // Create source buffer from raw binary
        source.buffer = buffer; // Add buffered data to object
        source.connect(audioContext.destination); // Connect sound source to output
        source.start(audioContext.currentTime); // play the source immediately
        //playSound(source); // Pass the object to the play function
    });
}