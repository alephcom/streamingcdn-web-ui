let divSelectRoom = document.getElementById("selectRoom")
let inputstreamKey = document.getElementById("streamkey")
let createSessionButton = document.getElementById('createSessionButton')
let stopSessionButton = document.getElementById('stopSessionButton')
let videoText = document.getElementById("videoText")

let streamKey, encryptedSdp, remoteSessionDescription

/* eslint-env browser */
var log = msg => {
    document.getElementById('logs').innerHTML += msg + '<br>'
}

const videoConstraints = {
    audio: true,
    video: {
        width: { max: 1920, ideal: 1280 },
        height: { max: 1080, ideal: 720 }
    }
};

const audioConstraints = {
    audio: true,
    video: false,
};

let displayVideo = video => {
    var el = document.createElement('video')
    el.srcObject = video
    el.autoplay = true
    el.muted = true
    el.width = 160
    el.height = 120
    el.setAttribute("id", "videoBroadcast")
    el.classList.add("embed-responsive-item")

    document.getElementById('localVideos').appendChild(el)
    document.getElementById('localVideos').removeAttribute("hidden")

    stopSessionButton.removeAttribute("hidden")
    return video
}

function postRequest () {
    var data = JSON.stringify({
        "sdp": encryptedSdp,
        "streamKey": streamKey
    })
    console.log(data);
    const url = `${window.location.protocol}//${window.location.hostname}:8080/sdp`;
    (async () => {
        const rawResponse = await fetch(url, {
            method : "POST",
            //body: new FormData(document.getElementById("inputform")),
            // -- or --
            body : data,
            headers :{
                'Content-Type': 'application/json'
            }
        });
        const content = await rawResponse.json();
        remoteSessionDescription = content.sdp
        window.startSession()
    })();
}

window.createSession = isPublisher => {
    if (inputstreamKey.value === '') {
        alert("Please enter a something unique.")
    } else{
        streamKey = inputstreamKey.value
        let pc = new RTCPeerConnection()
        pc.oniceconnectionstatechange = e => log(pc.iceConnectionState)
        pc.onicecandidate = event => {
            if (event.candidate === null) {
                encryptedSdp = btoa(JSON.stringify(pc.localDescription))
                postRequest();
            }
        }

        if (isPublisher) {
            navigator.mediaDevices.getUserMedia(videoConstraints)
                .then(stream => {
                    videoText.removeAttribute("hidden")
                    stream.getTracks().forEach(function(track) {
                        pc.addTrack(track, stream);
                    });
                    displayVideo(stream);
                    pc.createOffer()
                        .then(d => {
                            pc.setLocalDescription(d)
                        }).catch(log)
                }).catch(log)
        }
        window.startSession = () => {
            let sd = remoteSessionDescription
            if (sd === '') {
                return alert('Session ID must not be empty')
            }
            try {
                pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sd))))
            } catch (e) {
                alert(e)
            }
        }

        createSessionButton.setAttribute("hidden","true")
        divSelectRoom.setAttribute("hidden","true")
    }
}

function stopVideoSession() {
    let el = document.getElementById('videoBroadcast')
    document.getElementById('localVideos').setAttribute("hidden","true")
    let mediaStream = el.srcObject;
    let tracks = mediaStream.getTracks();
    tracks[0].stop();
    tracks.forEach(track => track.stop());
    el.remove()

    createSessionButton.removeAttribute("hidden")
    stopSessionButton.setAttribute("hidden", "true")
    videoText.setAttribute("hidden", "true")
    divSelectRoom.removeAttribute("hidden")
}