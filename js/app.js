/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

/**
 * Grabs the camera feed from the browser, requesting
 * both video and audio. Requires the permissions
 * for audio and video to be set in the manifest.
 *
 * @see http://developer.chrome.com/trunk/apps/manifest.html#permissions
 */
var hasCStream, hasVStream = false;
var cStream, vStream = null;
var recordRTC = null;
var recordedVideo = null;
var recordedVideoURL = null;
var fileEntry = null;
var cameraView = null;
var options = {
   type: 'video'
};
  var btnRecord = document.getElementById('record');
  var btnPause = document.getElementById('pause');
  var btnStop = document.getElementById('stop');
  var btnWatch = document.getElementById('watch');
  var btnSave = document.getElementById('save');
  var btnDelete = document.getElementById('delete');
  var chkCamera = document.getElementById('camera');
  var chkAudio = document.getElementById('audio');
  
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  window.requestFileSystem(window.PERSISTANT, 1024 * 1024 * 1024, function(){console.log("File storage granted")}, function(e){console.log("Error "+e)});
  
  /**
   * Click handler to init the camera grab
   */
  btnRecord.addEventListener('click', record);
  btnStop.addEventListener('click', stop);
  btnWatch.addEventListener('click', watch);
  btnSave.addEventListener('click', save);
  btnDelete.addEventListener('click', deleteVideo);
  chkCamera.addEventListener('change', toggleCamera);
  chkAudio.addEventListener('change', toggleAudio);

function record() {
    navigator.webkitGetUserMedia(
      {video: {mandatory: {chromeMediaSource: 'screen'}}},
      function(s) {
        chrome.app.window.current().minimize();
        vStream = s;
        if(chkCamera.checked) {
          toggleCamera();
          //document.getElementById("cam").src = webkitURL.createObjectURL(cStream);
        }
        recordRTC = RecordRTC(vStream, options);
        recordRTC.startRecording();
        $('#stop').button('reset');
        if(!recordedVideo) {
          $('#watch').button('loading');
        }
        $('#save').button('loading');
        $('#delete').button('loading');
        $('#record').button('loading');
        chkCamera.disabled = true;
        console.log("Video recording started");
        $('#alert').alert();
      },
      function(e) {
        if (e.code == e.PERMISSION_DENIED) {
          showErrorMsg('PERMISSION_DENIED. Are you no SSL?');
        }
      }
    );
}

function save() {
  if(recordedVideo) {
    chrome.fileSystem.chooseEntry({ type: 'saveFile', suggestedName: 'recordr.webm' },
      function(theFileEntry) {
        thefileEntry.createWriter(
          function(fileWriter) {
            fileWriter.onerror = function(e) {
              console.log("Write failed: " + e.toString());
            };
            fileWriter.truncate(recordedVideo.size);
            fileWriter.onwriteend = function() {
              console.log("Video saved");
            };
            fileWriter.write(recordedVideo);
          },
          function(e) {
            console.log(e);
          });
      });
  }
}

function stop() {
    recordRTC.stopRecording(function(videoURL) {
        recordedVideo = recordRTC.getBlob();
        console.log("Video blob: "+recordedVideo);
        recordedVideoURL = videoURL;
    });
    if(cStream) {cStream.stop();}
    if(vStream) {vStream.stop();}
    $('#stop').button('loading');
    $('#watch').button('reset');
    $('#save').button('reset');
    $('#delete').button('reset');
    $('#record').button('reset');
    chkCamera.disabled = false;
  console.log("Recording stopped");
}

function watch() {
  window.open(recordedVideoURL);
  console.log("Recorded video launched");
}

function deleteVideo() {
  recordedVideo = null;
  $('#watch').button('loading');
  $('#save').button('loading');
  $('#delete').button('loading');
  $('#record').button('reset');
  console.log("Video deleted");
}

function toggleCamera() {
  if(chkCamera.checked) {
    createCamera();
    navigator.webkitGetUserMedia(
      {audio: true, video: true}, 
      function(s) {
        cStream = s;
      }
    );
    //TODO Activate new window
    console.log("Camera feed launched");
  } else {
    destroyCamera();
    //TODO Destroy new window
    console.log("Camera feed closed");
  }
}

function toggleAudio() {
  if(chkAudio.checked) {
    //TODO Change attributes
    console.log("Audio feed activated");
  } else {
    //TODO Change attributes
    console.log("Audio feed stopped");
  }
}

function createCamera() {
  chrome.app.window.create('../html/camera.html', {
    frame : "none",
    id : "camera",
    transparentBackground: true,
    singleton : true,
    minWidth: 200,
    maxWidth: 200,
    maxHeight: 150,
    type: 'panel'
  },
  function(w) {
    cameraView = w;
    var endStream = function() {
      chkCamera.checked = false;
      cStream.stop();
      cameraView.close();
    };
    chrome.app.window.current().onClosed.addListener(endStream);
    cameraView.onClosed.addListener(endStream);
  });
}

function destroyCamera() {
  chkCamera.checked = false;
  cStream.stop();
  cameraView.close();
  cameraView = null;
}