//const multi = new SimpleWebRTC("wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/")
const multi= new SimpleWebRTC("ws://localhost:8080");

const roomForm = document.querySelector(".room-form");
const loader = document.querySelector(".loader");
const chatingContainer = document.querySelector(".chating-container");
function visible(ele){
    roomForm.style.display="none";
    loader.style.display="none";
    chatingContainer.style.display="none";
    ele.style.display="block";
}

const createRoomButton = document.querySelector(".create-room-button")
const enterRoomButton = document.querySelector(".enter-room-button")
const createRoomInputContainer = document.querySelector(".create-room-input-container");
const enterRoomInputContainer = document.querySelector(".enter-room-input-container");
const createRoomInput = document.querySelector(".create-room-input")
const enterRoomInput = document.querySelector(".enter-room-input")

createRoomButton.onclick = () => {
    if(createRoomButton.classList.contains("room-button-click"))return;
    multi.createRoom();
    createRoomButton.classList.add("room-button-click");
    enterRoomButton.classList.remove("room-button-click");
    createRoomInputContainer.style.display="block";
    enterRoomInputContainer.style.display="none";
}

enterRoomButton.onclick = () => {
    if(enterRoomButton.classList.contains("room-button-click"))return;
    multi.disconnectToSignalingServer();
    createRoomButton.classList.remove("room-button-click");
    enterRoomButton.classList.add("room-button-click");
    createRoomInputContainer.style.display="none";
    enterRoomInputContainer.style.display="block";
}
enterRoomButton.click();

enterRoomInput.addEventListener("keyup",(event)=>{
    if (event.key === 'Enter') {
        multi.enterRoom(Number(enterRoomInput.value));
        visible(loader)
    }
})
multi.onroomenterfail=()=>{visible(roomForm)}
multi.onwebsocketclose=()=>{}
multi.onroomcreated = (id) => { createRoomInput.value = (id == -1 ? "방이 꽉찼습니다." : id); }
multi.ondatachannelopen = ()=>{visible(chatingContainer)}

const chatingContent = document.querySelector(".chating-content");
const chatingSendInput = document.querySelector(".chating-send-input");
const chatingSendButton = document.querySelector(".chating-send-button");

function sendMessage() {
    let message = multi.send(chatingSendInput.value) ? chatingSendInput.value : "연결되지 끊어졌습니다.";
    chatingContent.innerHTML += `<p class="chating-message-me">${message}</p>`;
    chatingContent.scrollTop = chatingContent.scrollHeight;
    chatingSendInput.value = "";
}

chatingSendInput.addEventListener("keyup",(event)=>{
    if (event.key === 'Enter') sendMessage()
})

chatingSendButton.onclick=()=>{
    sendMessage()
}

multi.ondatachannelmessage = (message) => {
    chatingContent.innerHTML += `<p class="chating-message-other">${message}</p>`;
    chatingContent.scrollTop = chatingContent.scrollHeight;
}