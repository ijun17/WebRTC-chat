const multi = new SimpleWebRTC("wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/")
//const multi= new SimpleWebRTC("ws://localhost:8080");

const roomForm = document.querySelector(".room-form");
const loader = document.querySelector(".loader");
const chatingContainer = document.querySelector(".chating-container");

const createRoomButton = document.querySelector(".create-room-button")
const enterRoomButton = document.querySelector(".enter-room-button")
const createRoomInputContainer = document.querySelector(".create-room-input-container");
const enterRoomInputContainer = document.querySelector(".enter-room-input-container");
const createRoomInput = document.querySelector(".create-room-input")
const enterRoomInput = document.querySelector(".enter-room-input")

const chatingContent = document.querySelector(".chating-content");
const chatingSendInput = document.querySelector(".chating-send-input");
const chatingSendButton = document.querySelector(".chating-send-button");

function visible(ele) {
    roomForm.style.display = "none";
    loader.style.display = "none";
    chatingContainer.style.display = "none";
    ele.style.display = "block";
}

const SceneType = { enterRoomForm: 0, createRoomForm: 1, loading: 2, chat: 3 };
Object.freeze(SceneType);
const SceneSet = {};
let currentScene;
function changeScene(sceneType, para) {
    if (currentScene === sceneType) return;
    currentScene = sceneType;
    multi.resetEvent();
    SceneSet[sceneType](para);
}



SceneSet[SceneType.enterRoomForm] = () => {
    visible(roomForm);
    multi.disconnectToSignalingServer();
    createRoomButton.classList.remove("room-button-click");
    enterRoomButton.classList.add("room-button-click");
    createRoomInputContainer.style.display = "none";
    enterRoomInputContainer.style.display = "block";
    enterRoomInput.value = "";
}


SceneSet[SceneType.createRoomForm] = () => {
    visible(roomForm);
    multi.onwebsocketclose = () => {
        alert("서버와의 연결이 끊어졌습니다.\n(확인을 누르시면 다시 접속합니다.)")
        multi.createRoom();
    }
    multi.onroomcreated = (id) => {
        if (id == -1) {
            alert("방이 꽉찼습니다.\n(확인을 누르시면 방만들기를 다시 시도합니다.)")
            multi.createRoom();
        } else createRoomInput.value = id;
    }
    multi.ondatachannelopen = () => { changeScene(SceneType.chat) }

    multi.createRoom();
    createRoomButton.classList.add("room-button-click");
    enterRoomButton.classList.remove("room-button-click");
    createRoomInputContainer.style.display = "block";
    enterRoomInputContainer.style.display = "none";
    createRoomInput.value = "";
}


SceneSet[SceneType.loading] = (roomID) => {
    visible(loader);
    multi.enterRoom(roomID);
    multi.onroomenterfail = () => {
        changeScene(SceneType.enterRoomForm)
        alert("연결을 실패했습니다.")
    }
    multi.onwebsocketclose = () => {
        changeScene(SceneType.enterRoomForm)
        alert("연결을 실패했습니다.")
    }
    multi.ondatachannelopen = () => { changeScene(SceneType.chat) }
}

SceneSet[SceneType.chat] = () => {
    visible(chatingContainer);
    multi.ondatachannelmessage = (message) => {
        chatingContent.innerHTML += `<p class="chating-message-other">${message}</p>`;
        chatingContent.scrollTop = chatingContent.scrollHeight;
    }
}

createRoomButton.onclick = () => { changeScene(SceneType.createRoomForm) };
enterRoomButton.onclick = () => { changeScene(SceneType.enterRoomForm) };
enterRoomInput.onkeyup = (event) => { if (event.key === 'Enter') changeScene(SceneType.loading, Number(enterRoomInput.value)) }

function sendMessage() {
    let message = multi.send(chatingSendInput.value) ? chatingSendInput.value : "연결이 끊어졌습니다.";
    chatingContent.innerHTML += `<p class="chating-message-me">${message}</p>`;
    chatingContent.scrollTop = chatingContent.scrollHeight;
    chatingSendInput.value = "";
}

chatingSendInput.onkeyup = (event) => { if (event.key === 'Enter') sendMessage() }
chatingSendButton.onclick = () => { sendMessage() }



changeScene(SceneType.enterRoomForm);