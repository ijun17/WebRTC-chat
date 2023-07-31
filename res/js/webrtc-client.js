class SimpleWebRTC{
    ip;
    ws;
    pc;
    dc;
    localSDP;
    onroomcreated(){}
    ondatachannelopen(){}
    ondatachannelmessage(){}
    onwebsocketclose(){}
    onroomenterfail(){}
    constructor(ip){
        this.ip=ip;
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
                if(data.type=="hostid")this.onroomcreated(data.id)
                else if(data.type=="guest")this.setRemote(data.sdp,data.ice);
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
            if(data.type=="host"){
                this.setRemote(data.sdp,data.ice);
                this.setLocal(this.pc.createAnswer());
                this.pc.onicecandidate = (event) =>{
                    if(event.candidate)this.sendLocal("guest",this.localSDP,event.candidate)
                } 
            }else this.onroomenterfail();
            
        }
    }
    connectToSignalingServer(){
        this.disconnectToSignalingServer();
        this.ws = new WebSocket(this.ip);
        this.ws.onclose = () => { console.log("websocket close"); this.onwebsocketclose();}
        this.ws.onerror = () => { console.log("websocket error") }
    }
    disconnectToSignalingServer(){
        if(this.ws)this.ws.close();
    }
    createWebRTC(){
        if(this.pc)this.pc.close();
        if(this.dc)this.dc.close()
        this.pc = new RTCPeerConnection(null);
        this.pc.ondatachannel = (event) =>{this.dc=event.channel;};
        this.dc = this.pc.createDataChannel("dataChannel", { reliable: true , ordered: false});
        this.dc.onopen = () => {this.ondatachannelopen(); this.ws.send('{"type":"complete"}'); console.log("datachannel open")};
        this.dc.onmessage = (event) => {this.ondatachannelmessage(event.data)}
    }
    send(message){
        if(this.dc && this.dc.readyState == "open"){
            this.dc.send(message);
            return true;
        }
        console.log("datachannel not connected")
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
    resetEvent(){
        this.onroomcreated=()=>{};
        this.ondatachannelopen=()=>{};
        this.ondatachannelmessage=()=>{};
        this.onwebsocketclose=()=>{};
        this.onroomenterfail=()=>{};
    }
}