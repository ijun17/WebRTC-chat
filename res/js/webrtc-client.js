class Multi{
    ws=null
    ip=null//"port-0-webrtc-test-eg4e2alkj86xoo.sel4.cloudtype.app/",
    pc;
    dc;
    offer;
    onroomcreated(){}
    ondatachannelopen(){}
    constructor(ip){
        this.ip=ip;//"localhost:8080"
    }
    createRoom() {
        this.createWebRTC();
        this.pc.createOffer()
            .then((offer)=>{
                this.offer=offer;
                this.pc.setLocalDescription(new RTCSessionDescription(offer));
            }).catch((e)=>{console.error(e)})
        this.pc.onicecandidate = (event) => {
            let ice=event.candidate;
            if(!ice)return;
            this.connectToSignalingServer();
            this.ws.onopen = (event) => {
                console.log("onopen")
                this.ws.send(JSON.stringify({ type: "host", offer: this.offer, ice: ice}))
            }
            this.ws.onmessage = (event) => {
                let data=JSON.parse(event.data);
                if(data.id){
                    this.onroomcreated(data.id)
                }else if(data.answer){
                    this.pc.setRemoteDescription(data.answer)
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
            this.pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            this.pc.createAnswer()
                .then((answer)=>{
                    this.ws.send(JSON.stringify({answer:answer}))
                    this.pc.setLocalDescription(new RTCSessionDescription(answer));
                    this.pc.addIceCandidate(new RTCIceCandidate(data.ice));
                }).catch((e)=>{console.log(e)});
        }
    }
    connectToSignalingServer(){
        this.disconnectToSignalingServer(); 
        this.ws = new WebSocket("wss://"+this.ip);
        this.ws.onclose = () => { console.log("websocket close") }
        this.ws.onerror = () => { console.log("websocket error") }
    }
    disconnectToSignalingServer(){if(this.isConneted())this.ws.close();}
    createWebRTC(){
        this.pc = new RTCPeerConnection(null);
        this.pc.ondatachannel = (event) =>{this.dc=event.channel;};
        this.dc = this.pc.createDataChannel("dataChannel", { reliable: true , ordered: false});
        this.dc.onopen = () => {this.ondatachannelopen(); this.ws.send('{"type":"complete"}')};
    }
    isConneted(){return this.ws!=null && this.ws.readyState == WebSocket.OPEN;}
}