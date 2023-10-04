class SimpleWebRTC{
    signaling;
    rtcConfiguration=null;
    ws;
    pc;
    dc;
    onroomcreated(){}
    ondatachannelopen(){}
    ondatachannelclose(){}
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
            this.createWebRTC();
            this.ws.send(JSON.stringify({type:"host"}))
            this.log("ws.onopen")
            this.setLocal(this.pc.createOffer());
        }
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.log("ws.onmessage:",data.type);
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
            this.createWebRTC();
            this.ws.send(JSON.stringify({ type: "guest", id:id}))
            this.log("ws.onopen")
        }
        this.ws.onmessage = (event) => {
            const data=JSON.parse(event.data);
            this.log("ws.onmessage:",data.type);
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
        this.ws.onclose = () => { this.log("ws.onclose"); this.onwebsocketclose();}
        this.ws.onerror = (error) => { this.log("ws.onerror:", error) }
    }
    disconnectToSignalingServer(){
        if(this.ws)this.ws.close();
    }
    createWebRTC(){
        if(this.pc)this.pc.close();
        if(this.dc)this.dc.close()
        this.pc = new RTCPeerConnection(this.rtcConfiguration);
        this.pc.ondatachannel = (event) =>{this.dc=event.channel;this.log("pc.ondatachannel")};
        this.pc.onicecandidate = (event) =>{
            if(event.candidate){
                this.log("pc.onicecandidate");
                if(this.isWebSocketOpen()) this.ws.send(JSON.stringify({type:"ice", ice:event.candidate}))
                else if(this.isDataChannelOpen()) this.dc.send(JSON.stringify({type:"ice", ice:event.candidate}))
            }
        }
        this.dc = this.pc.createDataChannel("dataChannel", { reliable: true , ordered: false});
        this.dc.onopen = () => {this.ondatachannelopen(); this.disconnectToSignalingServer(); this.log("dc.onopen")};
        this.dc.onmessage = (event) => {this.ondatachannelmessage(event.data)}
        this.dc.onclose = () => {this.ondatachannelclose();}
    }
    isWebSocketOpen() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    isDataChannelOpen(){
        return this.dc && this.dc.readyState === 'open';
    }
    send(message){
        this.dc.send(message);
        return this.isDataChannelOpen();
    }
    log(){
        let args = Array.from(arguments);
        let message = args.join(' ');
        console.log(message)
        if(this.isWebSocketOpen())this.ws.send(JSON.stringify({type:"log", log:message}))
    }
    setLocal(sdpPromise){
        sdpPromise.then((sdp)=>{
            this.log("setLocal")
            this.ws.send(JSON.stringify({type:"sdp",sdp:sdp})) // 시그널링 서버에 로컬 sdp 전송
            this.pc.setLocalDescription(sdp)
                .catch((e)=>{this.log(e)});
        }).catch((e)=>{this.log(e);})
    }
    setRemote(sdpObject){
        this.log("setRemote")
        try{
            this.pc.setRemoteDescription(new RTCSessionDescription(sdpObject))
                .catch((e)=>{this.log(e)})
        }catch(e){
            this.log(e)
        }
    }

    resetEvent(){
        this.onroomcreated=()=>{};
        this.ondatachannelopen=()=>{};
        this.ondatachannelclose=()=>{};
        this.ondatachannelmessage=()=>{};
        this.onwebsocketclose=()=>{};
        this.onroomenterfail=()=>{};
    }
}