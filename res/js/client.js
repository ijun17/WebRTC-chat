let multi = new Multi("wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/")//"port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/");
//multi.createRoom();

const HTML_messageSender=document.getElementById("messageSender")
const HTML_messageReceiver=document.getElementById("messageReceiver")
const HTML_createRoomButton=document.getElementById("createRoomButton")
const HTML_enterRoomInput=document.getElementById("enterRoomInput")
const HTML_roomID = document.getElementById("roomID");

HTML_createRoomButton.onclick=()=>{
    multi.createRoom();
}

HTML_enterRoomInput.addEventListener("keyup",(event)=>{
    if (event.key === 'Enter') {
        multi.enterRoom(Number(HTML_enterRoomInput.value));
    }
})

multi.onroomcreated=(id)=>{HTML_roomID.value=id;}
multi.ondatachannelopen=()=>{console.log("ondatachannelopen")}