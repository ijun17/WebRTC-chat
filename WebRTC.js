const HTML_text = document.getElementById("text");
const HTML_local = document.getElementById("local");
const HTML_remote = document.getElementById("remote");
const HTML_candidate_local = document.getElementById("candidate-local");
const HTML_candidate_remote = document.getElementById("candidate-remote");

const configuration = null;
let peerConnection = new RTCPeerConnection(configuration);
let dataChannel = peerConnection.createDataChannel("dataChannel", { reliable: true , ordered: false});
peerConnection.ondatachannel = function (event) {
    dataChannel = event.channel;
};
dataChannel.onopen = () => {
    console.log("dataChannel: open");
    dataChannel.send("Hello, world!");
};
dataChannel.onmessage = function(event) {
    console.log("Message:", event.data);
    HTML_text.innerText=event.data;
};
dataChannel.onerror = function(error) {
    console.log("Error:", error);
};
dataChannel.onclose = function() {
    console.log("Data channel is closed");
};
function send(message){
    dataChannel.send(message);
}





peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
        HTML_candidate_local.value=JSON.stringify(event.candidate)
    }
};




function offer(){
    peerConnection.createOffer(function(offer) {
        peerConnection.setLocalDescription(offer);
        HTML_local.value=JSON.stringify(offer);
    }, function(error) {console.log(error)});
}


function answer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    if(offer.type=="answer")return
    peerConnection.createAnswer(function (answer) {
        peerConnection.setLocalDescription(answer);
        HTML_local.value=JSON.stringify(answer);
    }, function (error) { console.log(error)});
}

HTML_remote.addEventListener("keydown", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        answer(JSON.parse(HTML_remote.value))
    }
});


HTML_candidate_remote.addEventListener("keydown", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(HTML_candidate_remote.value)));
    }
});