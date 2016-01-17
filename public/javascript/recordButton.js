var audio_context;
var recorder;

function startUserMedia(stream) {
  var input = audio_context.createMediaStreamSource(stream);
  
  recorder = new Recorder(input);
}

function startRecording(button, initAnswer) {
  recorder && recorder.record();
  initAnswer()
  $(button).text("Stop");
}

function stopRecording(button, uploadAudio) {
  recorder && recorder.stop();
  $(button).text("Record");
  
  // create WAV download link using audio data blob
  createDownloadLink(uploadAudio);
  
  recorder.clear();
}

function ToggleRecording(button) {
  if ($(button).hasClass("recording")) {
    stopRecording(button)
    $(button).removeClass("recording");
  }
  else {
    startRecording(button)
    $(button).addClass("recording");
  }
}


function createDownloadLink(uploadAudio) {
  recorder && recorder.exportWAV(function(blob) {
    var fd = new FormData();
    fd.append("audioFile", blob, "answer.wav");
    var xhr=new XMLHttpRequest();
    xhr.onload=function(e) {
      if(this.readyState === 4) {
          var resp = JSON.parse(e.target.response)
          uploadAudio(resp.Mp3Url);
      }
    };

    xhr.open("POST","https://upload.clyp.it/upload",true);
    xhr.send(fd);
  });
}

window.onload = function init() {
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    
    audio_context = new AudioContext;
  } catch (e) {
    alert('No web audio support in this browser!');
  }
  
  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
  });
};