/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
var controlPanel, camera = null;
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('html/control.html', {
    frame : "none",
    id : "control",
    resizable : false,
    minHeight: 200,
    maxHeight: 200,
    type : 'panel'
  },
  function(w) {
    controlPanel = w;
  });
});
