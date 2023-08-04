class SimpleWebRTC{
    signaling;
    rtcConfiguration=null;
    ws;
    pc;
    dc;
    onroomcreated(){}
    ondatachannelopen(){}
    ondatachannelmessage(){}
    onwebsocketclose(){}
    onroomenterfail(){}
    constructor(signaling,stun){
        this.signaling=signaling;
        if(stun)this.rtcConfiguration={iceServers: [{ urls: stun }]}
    }
    createRoom() {
        this.connectToSignalingServer();
        this.ws.onopen = () => {
            console.log("websocket open")
            this.createWebRTC();
            this.setLocal(this.pc.createOffer());
            this.ws.send(JSON.stringify({type:"host"}))
        }
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            switch(data.type){
                case "hostid" : this.onroomcreated(data.id); break;
                case "sdp"    : this.setRemote(data.sdp); break;
                case "ice"    : this.pc.addIceCandidate(new RTCIceCandidate(data.ice)); break;
                default       : this.ws.close(); 
            }
        }
    }
    enterRoom(id){
        this.connectToSignalingServer();
        this.ws.onopen = (event) => {
            console.log("websocket open")
            this.createWebRTC();
            this.ws.send(JSON.stringify({ type: "guest", id:id}))
        }
        this.ws.onmessage = (event) => {
            const data=JSON.parse(event.data);
            console.log(data);
            switch(data.type){
                case "sdp":
                    this.setRemote(data.sdp);
                    this.setLocal(this.pc.createAnswer());
                    break;
                case "ice":
                    this.pc.addIceCandidate(new RTCIceCandidate(data.ice));
                    break;
                default :
                    this.onroomenterfail();
                    break;
            }
        }
    }
    connectToSignalingServer(){
        this.disconnectToSignalingServer();
        this.ws = new WebSocket(this.signaling);
        this.ws.onclose = () => { console.log("websocket close"); this.isOpenWS=false; this.onwebsocketclose();}
        this.ws.onerror = (error) => { console.log("websocket error:", error) }
        this.isOpenWS=true;
    }
    disconnectToSignalingServer(){
        if(this.ws)this.ws.close();
    }
    createWebRTC(){
        if(this.pc)this.pc.close();
        if(this.dc)this.dc.close()
        this.pc = new RTCPeerConnection(this.rtcConfiguration);
        this.pc.ondatachannel = (event) =>{this.dc=event.channel;};
        this.pc.onicecandidate = (event) =>{
            if(event.candidate){
                console.log("create ice");
                if(this.isWebSocketOpen()) this.ws.send(JSON.stringify({type:"ice", ice:event.candidate}))
                else if(this.isDataChannelOpen()) this.dc.send(JSON.stringify({type:"ice", ice:event.candidate}))
            }
        }
        this.dc = this.pc.createDataChannel("dataChannel", { reliable: true , ordered: false});
        this.dc.onopen = () => {this.ondatachannelopen(); this.ws.send('{"type":"complete"}'); console.log("datachannel open")};
        this.dc.onmessage = (event) => {this.ondatachannelmessage(event.data)}
    }
    isWebSocketOpen() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    isDataChannelOpen(){
        return this.dc && this.dc.readyState === 'open';
    }
    send(message){
        if(this.dc && this.dc.readyState == "open"){
            this.dc.send(message);
            return true;
        }
        console.log("datachannel not connected")
        return false;
    }
    setLocal(sdpPromise){
        sdpPromise.then((sdp)=>{
            console.log("set local")
            this.ws.send(JSON.stringify({type:"sdp",sdp:sdp})) // 시그널링 서버에 로컬 sdp 전송
            this.pc.setLocalDescription(sdp)
                .catch((e)=>{console.log(e,sdp)});
        }).catch((e)=>{console.log(e);})
    }
    setRemote(sdpObject){
        console.log("set remote")
        try{
            this.pc.setRemoteDescription(new RTCSessionDescription(sdpObject))
                .catch((e)=>{console.log(e, sdpObject)})
        }catch(e){
            console.log(e, sdpObject)
        }
    }

    resetEvent(){
        this.onroomcreated=()=>{};
        this.ondatachannelopen=()=>{};
        this.ondatachannelmessage=()=>{};
        this.onwebsocketclose=()=>{};
        this.onroomenterfail=()=>{};
    }
}