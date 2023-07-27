let multi = new Multi("wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/")//"port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/");
//multi.createRoom();

const roomForm = document.querySelector(".room-form");
const loader = document.querySelector(".loader");
const chatingContainer = document.querySelector(".chating-container");

const createRoomButton = document.querySelector(".create-room-button")
const enterRoomButton = document.querySelector(".enter-room-button")
const createRoomInputContainer = document.querySelector(".create-room-input-container");
const enterRoomInputContainer = document.querySelector(".enter-room-input-container");
const createRoomInput = document.querySelector(".create-room-input")
const enterRoomInput = document.querySelector(".enter-room-input")

createRoomButton.onclick = () => {
    multi.createRoom();
    createRoomButton.classList.add("room-button-click");
    enterRoomButton.classList.remove("room-button-click");
    createRoomInputContainer.style.display="block";
    enterRoomInputContainer.style.display="none";
}

enterRoomButton.onclick = () => {
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
        roomForm.style.display="none";
        loader.style.display="block";
        chatingContainer.display="none";
    }
})

multi.onroomcreated=(id)=>{createRoomInput.value=id;}
multi.ondatachannelopen = ()=>{
    roomForm.style.display="none";
    loader.style.display="none";
    chatingContainer.style.display="block";
}

const chatingContent = document.querySelector(".chating-content");
const chatingSendInput = document.querySelector(".chating-send-input");
const chatingSendButton = document.querySelector(".chating-send-button");

function sendMessage() {
    multi.send(chatingSendInput.value);
    chatingContent.innerHTML += `<p class="chating-message-me">${chatingSendInput.value}</p>`;
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