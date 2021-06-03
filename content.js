const YTCTRL_VER = '1.0';
var YTCTRL_TOKEN = '';

var YTCTRL_MAX_ERROR_COUNT = 10;
var YTCTRL_ERROR_REG_INFO_COUNT = 0;
var YTCTRL_ERROR_GET_ACTIONS_COUNT = 0;

var YTCTRL_LAST_ACTION_CREATION_TIME = 0;

var YTCTRL_TIME_BETWEEN_SCAN_INFO = 1000;
var YTCTRL_TIME_BETWEEN_ACTIONS = 5000;

var YTCTRL_CURRENT_TITLE = '';


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

function waitForChange() {

    //  Revisamos el titulo...
    const title = document.title;

    //  Si es diferente al titulo anterior
    if(title != YTCTRL_CURRENT_TITLE) {
        YTCTRL_CURRENT_TITLE = title;

        register_info((success) => {

            //  Si pudimos guardar, reportamos que el ultimo video es el actual y quitamos los errores
            if (success){
                YTCTRL_ERROR_REG_INFO_COUNT = 0;
                YTCTRL_CURRENT_TITLE = title;
            }

            //  Si no, agregamos un error
            else YTCTRL_ERROR_REG_INFO_COUNT++;
            

            //  Si aun no alcanzamos el limite de intentos erroneos, volvemos a esperar...
            if (YTCTRL_ERROR_REG_INFO_COUNT < YTCTRL_MAX_ERROR_COUNT)
                setTimeout(() => waitForChange(), YTCTRL_TIME_BETWEEN_SCAN_INFO);


            //  Pero si ya quemamos el ultimo cuete, solo decimos el se buggeo
            else
                console.error('YTCtrl is bugged... reload Youtube tabs please');
        });

    }

    //  Si el titulo es el mismo, seguimos esperando
    else
        setTimeout( () => waitForChange(), YTCTRL_TIME_BETWEEN_SCAN_INFO);

}
function register_info( onFinish ) {
    
    //  Primero sacamos la url actual...
    const urlParams = new URLSearchParams(window.location.search);

    //  Sacamos el Id del video que se esta reproduciendo
    const Id = urlParams.get('v');

    //  Preparamos lo que enviaremos
    const YTCtrl = {
        Id,
        Name: YTCTRL_CURRENT_TITLE,
        RelatedList: []
    }

    // Preparamos el selector (cuando tenemos el param ?v=VIDEO_ID)
    const vidSelector = Id != null 
        ? 'ytd-item-section-renderer ytd-compact-video-renderer' // cuando estamos en un video
        : 'ytd-rich-item-renderer'; // Cuando estamos en youtube
    
    // Buscamos los videos relacionados
    document.querySelectorAll(vidSelector).forEach(n => {

        const vId = n.querySelector('ytd-thumbnail #thumbnail').getAttribute('href');

        if(vId) {
            const id = vId.split('v=')[1];
            
            //  Obtenemos la duración, si es que esta se encuentra en el nodo
            let dur = n.querySelector('ytd-thumbnail ytd-thumbnail-overlay-time-status-renderer span');
            if(!dur) dur = '--:--';
            else dur = dur.innerHTML;

            YTCtrl.RelatedList.push({
                id,
                title: n.querySelector('#video-title').innerText,
                duration: dur,
            });
        }
    });
        
    //  Lo subimos...
    post(
        'register_info', 
        
        {
            token: YTCTRL_TOKEN,
            object_data: JSON.stringify(YTCtrl)
        },
        
        (res) => onFinish(res.status == 1)
    );    
}


function get_actions() {

    //  Pedimos las acciones
    post(
        'get_actions', 
        {
            token: YTCTRL_TOKEN,
            created_time: YTCTRL_LAST_ACTION_CREATION_TIME
        },
        (res) => {

            //  Si todo sale bien...
            if (res.status == 1) { // success
                YTCTRL_ERROR_GET_ACTIONS_COUNT = 0;

                //  por cada accion, ejecutamos
                res.data.forEach(action => {
                    do_action(action);
                });

                //  Guardamos el ultimo tiempo de ejecución
                chrome.storage.local.set({last_action_time: YTCTRL_LAST_ACTION_CREATION_TIME});
            }

            //  Si no... agregamos un fallo a las acciones
            else {
                YTCTRL_ERROR_GET_ACTIONS_COUNT++;
            }
            

            //  Si aun no alcanzamos el limite
            if (YTCTRL_ERROR_GET_ACTIONS_COUNT < YTCTRL_MAX_ERROR_COUNT)
                //  Volvemos a intentar en n tiempo
                setTimeout(() => {
                    console.log(YTCTRL_TIME_BETWEEN_ACTIONS)
                    get_actions();
                }, YTCTRL_TIME_BETWEEN_ACTIONS);
            
            else
                //  Si ya no pudimos, reportamos el error...
                console.error('YTCtrl is bugged... reload Youtube tabs please');

        }
    );
}
function do_action(action) {
    //token	action_id	action_data	created_time

    //  Asignamos el tiempo mas reciente
    if (action.created_time > YTCTRL_LAST_ACTION_CREATION_TIME)
        YTCTRL_LAST_ACTION_CREATION_TIME = action.created_time;

    //  Si viene una accion
    if(action.action_id != 0) {

        //  Cargamos la accion
        let data = {};
        if(action.action_data)
            data = JSON.parse(action.action_data);
        //  preparamos el reproductor...
        const videoTag = document.querySelector('.video-stream');
    
        if(action.action_id == 1) { // PlayVideo

            if (data.video_id)
                location.href = 'https://www.youtube.com/watch?v=' + data.video_id;
                
        }

        else if(action.action_id == 2) { // SetVolume
            if (typeof(data.level) != 'undefined')
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

chrome.storage.local.get(['token','last_action_time'], function(result) {

    YTCTRL_TOKEN = result.token;
    YTCTRL_LAST_ACTION_CREATION_TIME = result.last_action_time >= 1 ? result.last_action_time : 0;
    
    //  Si hay token, continuamos...
    if(YTCTRL_TOKEN.length == 8) {
        //  Iniciamos la sincronización...
        get_actions();
        waitForChange();
    }
});