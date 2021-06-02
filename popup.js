// Initialize butotn with users's prefered color
let GenBtn = document.getElementById("genbtn");
let Token = document.getElementById("token");

GenBtn.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYT = tab.url.indexOf('www.youtube.com') >= 0;

  document.querySelector('.content.onyt').style.display = isYT ? 'block': 'none';
  document.querySelector('.content.other').style.display = !isYT ? 'block': 'none';

  if(isYT) {

    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      function: reloadToken
    }, function(res) {

      chrome.tabs.sendMessage(tab.id, {"message": "giveMeYourToken"}, (res) => {
        GenBtn.innerHTML = res;
      });

    });
  }

});
function load() {

  let [tab] = chrome.tabs.query({ active: true, currentWindow: true });
  const isYT = tab.url.indexOf('www.youtube.com') >= 0;

  document.querySelector('.content.onyt').style.display = isYT ? 'block': 'none';
  document.querySelector('.content.other').style.display = !isYT ? 'block': 'none';

  if(isYT) {
    chrome.tabs.sendMessage(tab.id, {"message": "giveMeYourToken"}, (res) => {
      GenBtn.innerHTML = res;
    });
  }

};

// The body of this function will be execuetd as a content script inside the
// current page
function reloadToken() {
  const token = randomNumber(8);
  localStorage.setItem('YTCtrl.Token', token);
}

function setToken() {
  YTCTRL_TOKEN = localStorage.getItem('YTCtrl.Token');

  if(YTCTRL_TOKEN == null || YTCTRL_TOKEN == '' || force === true) {
      YTCTRL_TOKEN = randomNumber(8);
      localStorage.setItem('YTCtrl.Token', YTCTRL_TOKEN);
  }

}
setTimeout(() => {
  load()
}, 500);