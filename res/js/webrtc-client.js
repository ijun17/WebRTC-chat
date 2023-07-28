class Multi{
    ws;
    ip;//"wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/",
    pc;
    dc;
    localSDP;
    onroomcreated(){}
    ondatachannelopen(){}
    ondatachannelmessage(){}
    constructor(ip){
        this.ip=ip;//"localhost:8080"
    }
    createRoom() {
        this.createWebRTC();
        this.setLocal(this.pc.createOffer());
        this.pc.onicecandidate = (event) => {
            if(!event.candidate)return;
            this.connectToSignalingServer();
            this.ws.onopen = () => {
                console.log("websocket open")
                this.sendLocal("host",this.localSDP,event.candidate)
            }
            this.ws.onmessage = (event) => {
                const data=JSON.parse(event.data);
                if(data.id)this.onroomcreated(data.id)
                else if(data.sdp)this.setRemote(data.sdp,data.ice);
            }
        };
    }
    enterRoom(id){
        this.connectToSignalingServer();
        this.createWebRTC();
        this.ws.onopen = (event) => {
            console.log("websocket open")
            this.ws.send(JSON.stringify({ type: "guest", id:id}))
        }
        this.ws.onmessage = (event) => {
            const data=JSON.parse(event.data);
            this.setRemote(data.sdp,data.ice);
            this.setLocal(this.pc.createAnswer());
            this.pc.onicecandidate = (event) =>{
                if(event.candidate)this.sendLocal("answer",this.localSDP,event.candidate)
            } 
        }
    }
    connectToSignalingServer(){
        this.disconnectToSignalingServer(); 
        this.ws = new WebSocket(this.ip);
        this.ws.onclose = () => { console.log("websocket close") }
        this.ws.onerror = () => { console.log("websocket error") }
    }
    disconnectToSignalingServer(){if(this.isConneted())this.ws.close();}
    createWebRTC(){
        this.pc = new RTCPeerConnection(null);
        this.pc.ondatachannel = (event) =>{this.dc=event.channel;};
        this.dc = this.pc.createDataChannel("dataChannel", { reliable: true , ordered: false});
        this.dc.onopen = () => {this.ondatachannelopen(); this.ws.send('{"type":"complete"}'); console.log("datachannel open")};
        this.dc.onmessage = (event) => {this.ondatachannelmessage(event.data)}
    }
    send(message){
        if(this.pc && this.pc.connectionState == "connected"){
            this.dc.send(message);
            return true;
        }
        console.log("데이터 채널이 연결되지 않았습니다.")
        return false;
    }
    sendLocal(type, sdp, ice){
        this.ws.send(JSON.stringify({type:type,sdp:sdp,ice:ice}))
    }
    setLocal(sdpPromise){
        sdpPromise.then((sdp)=>{
            this.localSDP=sdp
            this.pc.setLocalDescription(sdp)
                .catch((e)=>{console.log(e,sdp)});
        }).catch((e)=>{console.log(e,this.localSDP);})
    }
    setRemote(sdpObject, iceObject){
        try{
            this.pc.setRemoteDescription(new RTCSessionDescription(sdpObject))
                .catch((e)=>{console.log(e, sdpObject)})
            this.pc.addIceCandidate(new RTCIceCandidate(iceObject));
        }catch(e){
            console.log(e, sdpObject, iceObject)
        }
    }
    isConneted(){return (this.ws && this.ws.readyState == WebSocket.OPEN);}
}