const YTCTRL_VER = '1.0';
var YTCTRL_TOKEN = localStorage.getItem('YTCtrl.Token');

var YTCTRL_MAX_ERROR_COUNT = 10;
var YTCTRL_ERROR_REG_INFO_COUNT = 0;
var YTCTRL_ERROR_GET_ACTIONS_COUNT = 0;

var YTCTRL_LAST_ACTION_CREATION_TIME = 0;

var YTCTRL_TIME_BETWEEN_SCAN_INFO = 1000;
var YTCTRL_TIME_BETWEEN_ACTIONS = 3000;


/**
 * Executes an action on server side
 * @param {string} action Action to execute (update, create, remove, get, get-all, etc)
 * @param {Object} data Data to send
 * @param {function} callback Callback function to improve with response
 */
function post(action, data, callback) {

    const formData = new FormData();
    formData.append('json_content', JSON.stringify(data));



    const xhttp = new XMLHttpRequest();
    const api_url = 'https://apis.protoxos.com/ytctrl/v1.0/';
    
    xhttp.open('POST', api_url + '?action=' + action, true);
    xhttp.onreadystatechange = function() {
    
        if(typeof(callback) == 'function') {

            if (this.readyState == 4 && this.status == 200)
                callback(JSON.parse(this.responseText));
        }
    };
    
    xhttp.send(formData);
}

function randomNumber(length) {
    let num = '';
    for(let i = 0; i < length; i++)
        num += (Math.floor(Math.random() * 9) + 0).toString();

    return num;
}

function register_info() {
    console.log('register_info', Date.now());
    const urlParams = new URLSearchParams(window.location.search);

    const Id = urlParams.get('v');
    const lastId = localStorage.getItem('YTCtrl.Id');    
    let related = localStorage.getItem('YTCtrl.RelatedListCount');

    const YTCtrl = {
        Id,
        Name: document.querySelector('#columns #primary #info h1')?.innerText,
        RelatedList: []
    }

    if(Id != lastId || !(related >= 1)) {
        // Get related videos
        document.querySelectorAll('ytd-item-section-renderer ytd-compact-video-renderer').forEach(n => {
            const vId = n.querySelector('ytd-thumbnail #thumbnail').getAttribute('href');

            if(vId) {
                const id = vId.split('v=')[1];
                YTCtrl.RelatedList.push({
                    id,
                    title: n.querySelector('#video-title').innerText,
                    duration: n.querySelector('ytd-thumbnail ytd-thumbnail-overlay-time-status-renderer span').innerText,
                });
            }
        });

        related = YTCtrl.RelatedList.length;        
        
        post(
            'register_info', 
            {
                token: YTCTRL_TOKEN,
                object_data: JSON.stringify(YTCtrl)
            },
            (res) => {

                if (res.status == 1) { // success
                    YTCTRL_ERROR_REG_INFO_COUNT = 0;
                }
                else {
                    YTCTRL_ERROR_REG_INFO_COUNT++;
                    console.log(res.data);
                }

                if (YTCTRL_ERROR_REG_INFO_COUNT < 10)
                    setTimeout(() => register_info(), YTCTRL_TIME_BETWEEN_SCAN_INFO);
                else
                    console.error('YTCtrl is bugged... reload Youtube tabs please');

            }
        );
    }

    else
        setTimeout(() => register_info(), YTCTRL_TIME_BETWEEN_SCAN_INFO);

    localStorage.setItem('YTCtrl.Id', YTCtrl.Id);
    localStorage.setItem('YTCtrl.RelatedListCount', related);

    
}
function get_actions() {
    console.log('get_actions', Date.now());
    post(
        'get_actions', 
        {
            token: YTCTRL_TOKEN,
            created_time: YTCTRL_LAST_ACTION_CREATION_TIME
        },
        (res) => {

            if (res.status == 1) { // success
                YTCTRL_ERROR_GET_ACTIONS_COUNT = 0;
                res.data.forEach(action => {
                    do_action(action);
                });
            }
            else {
                YTCTRL_ERROR_GET_ACTIONS_COUNT++;
                console.log(res.data);
            }
            return;

            if (YTCTRL_ERROR_GET_ACTIONS_COUNT < 10)
                setTimeout(() => get_actions(), YTCTRL_TIME_BETWEEN_ACTIONS);
            else
                console.error('YTCtrl is bugged... reload Youtube tabs please');

        }
    );
}
function do_action(action) {
    //token	action_id	action_data	created_time

    //  Asignamos el tiempo mas reciente
    if (action.created_time > YTCTRL_LAST_ACTION_CREATION_TIME)
        YTCTRL_LAST_ACTION_CREATION_TIME = action.created_time;

    if(action.action_id != 0) {

        const data = JSON.parse(action.action_data);
        const videoTag = document.querySelector('.video-stream');
    
        if(action.action_id == 1) { // PlayVideo

            if (data.video_id)
                location.href = 'https://www.youtube.com/watch?v=' + data.video_id;
                
        }

        else if(action.action_id == 2) { // SetVolume
            if (data.level)
                videoTag.volume = data.level;
        }

        else if(action.action_id == 3) { // ToogleFullscreen
            if(videoTag.webkitDisplayingFullscreen)
                videoTag.webkitExitFullscreen();

            else
                videoTag.webkitRequestFullScreen();
        }
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "giveMeYourToken" )
            sendResponse(YTCTRL_TOKEN);

    }
);

// register_info();
get_actions();