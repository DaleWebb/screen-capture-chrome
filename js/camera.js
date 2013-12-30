 navigator.webkitGetUserMedia(
      {audio: true, video: true}, 
      function(s) {
        document.getElementById("cam").src = webkitURL.createObjectURL(s);
      }
    );