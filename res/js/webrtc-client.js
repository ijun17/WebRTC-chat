class Multi{
    ws;
    ip;//"wss://port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/",
    pc;
    dc;
    offer;
    answer;
    onroomcreated(){}
    ondatachannelopen(){}
    ondatachannelmessage(){}
    constructor(ip){
        this.ip=ip;//"localhost:8080"
    }
    createRoom() {
        this.createWebRTC();
        this.pc.createOffer()
            .then((offer)=>{
                this.offer=offer;
                this.pc.setLocalDescription(new RTCSessionDescription(offer))
                    .catch((e)=>{console.log(e)});
            }).catch((e)=>{console.error(e)})
        this.pc.onicecandidate = (event) => {
            let ice=event.candidate;
            if(!ice)return;
            this.connectToSignalingServer();
            this.ws.onopen = (event) => {
                console.log("websocket open")
                this.ws.send(JSON.stringify({ type: "host", offer: this.offer, ice: ice}))
            }
            this.ws.onmessage = (event) => {
                let data=JSON.parse(event.data);
                if(data.id){
                    this.onroomcreated(data.id)
                }else if(data.answer){
                    try{
                        this.pc.setRemoteDescription(new RTCSessionDescription(data.answer))
                        this.pc.addIceCandidate(new RTCIceCandidate(data.ice));
                    }catch(e){
                        console.error(e, data.answer, data.ice)
                    }
                    
                }
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
            let data=JSON.parse(event.data);
            try{
                this.pc.setRemoteDescription(new RTCSessionDescription(data.offer))
                this.pc.addIceCandidate(new RTCIceCandidate(data.ice));
            }catch(e){
                console.error(e, data.offer, data.ice)
            }
            this.pc.createAnswer()
                .then((answer)=>{
                    this.answer=answer;
                    this.pc.setLocalDescription(new RTCSessionDescription(answer))
                        .catch((e)=>{console.log(e)});
                }).catch((e)=>{console.log(e)});
            this.pc.onicecandidate = (event) =>{
                let ice=event.candidate;
                if(!ice)return;
                this.ws.send(JSON.stringify({answer:this.answer, ice:ice}))
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
    isConneted(){return this.ws!=null && this.ws.readyState == WebSocket.OPEN;}
}