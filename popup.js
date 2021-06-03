// Initialize butotn with users's prefered color
let btnGetToken = document.getElementById("get-token");
let btnReloadToken = document.getElementById("reload-token");
let txtToken = document.getElementById("token");

btnReloadToken.addEventListener("click", () => {

  chrome.storage.local.set({token: randomNumber(8)});

  chrome.storage.local.get('token', function(result) {
    txtToken.innerHTML = result.token;
  });

});

btnGetToken.addEventListener("click", () => {

  chrome.storage.local.get('token', function(result) {
    txtToken.innerHTML = result.token; 
  });

});


function randomNumber(length) {
  let num = '';
  for(let i = 0; i < length; i++)
      num += (Math.floor(Math.random() * 9) + 0).toString();

  return num;
}
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

chrome.storage.local.get('token', function(result) {
  if(result.token)
    txtToken.innerHTML = result.token;
  else
    txtToken.innerHTML = '--------';

});