const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

class RoomManager{
    MAX_SIZE;
    rooms;
    emptyRooms;
    constructor(){
        this.MAX_SIZE=1000;
        this.rooms=new Array(this.MAX_SIZE);
        this.emptyRooms=new Stack(this.MAX_SIZE);
        for(let i=0; i<this.MAX_SIZE; i++)this.emptyRooms.push(i);
    }
    createRoom(ws,offer,ice){
        if(this.isFull())return;
        const id = this.emptyRooms.pop();
        this.rooms[id] = new Room(ws,offer,ice);
        ws.send(JSON.stringify({id:id}))
        ws.onmessage=(event)=>{console.log("Room complete: "+id); this.killRoom(id); }
        ws.onclose=()=>{this.killRoom(id)};
        console.log('Room created: '+id);
    }
    enterRoom(id, ws){
        if(!this.isLive(id))return;
        let room=this.rooms[id];
        room.setGuest(ws);
        console.log('Room entered: '+ id);
    }
    
    killRoom(id){
        if(this.isLive(id)){
            this.rooms[id].reset();
            this.rooms[id]=null;
            this.emptyRooms.push(id);
            console.log('Room killed: '+id);
        }
    }
    isLive(id){return id>0 && id<this.MAX_SIZE && this.rooms[id]!=null}
    isFull(){return this.emptyRooms.isEmpty();}
}

class Room{
    host=null;
    guest=null;
    constructor(ws, offer, ice){
        this.host={ws:ws,offer:offer, ice:ice}
        this.guest=null;
    }
    setGuest(ws){
        if(this.guest!=null)return;
        this.guest = { ws: ws };
        ws.send(JSON.stringify({ type: "offer", offer: this.host.offer, ice: this.host.ice }));
        ws.onmessage = (event) => {this.host.ws.send(event.data.toString("utf-8"));}
        ws.onclose = () => { this.guest = null;}
    }
    reset(){
        if(this.host!= null && this.host.ws.readyState==WebSocket.OPEN)this.host.ws.close();
        if(this.guest!= null && this.guest.ws.readyState==WebSocket.OPEN)this.guest.ws.close();
        this.host=null;
        this.guest=null;
    }
}

class Stack {
    arr;
    MAX_SIZE;
    t;
    constructor(MAX_SIZE = 1000) {
        this.MAX_SIZE = MAX_SIZE;
        this.arr = new Array(this.MAX_SIZE);
        this.t = -1;
    }
    push(e) { if (this.size() < this.MAX_SIZE) this.arr[++this.t] = e; }
    pop() { if (!this.isEmpty()) return this.arr[this.t--]; }
    top() { if (!this.isEmpty()) return this.arr[this.t]; }
    size() { return this.t + 1; }
    isEmpty() { this.t == -1; }
}

const connections = new Set(); //대기방
const roomManager = new RoomManager();

wss.on('connection', (ws) => {
    connections.delete(ws);
    ws.onmessage = (event) => {
        try {
            let data = JSON.parse(event.data);
            if (data.type == "host" && data.offer && data.ice) roomManager.createRoom(ws, data.offer, data.ice);
            else if (data.type == "guest" && data.id) roomManager.enterRoom(Number(data.id), ws);
            else ws.close();
        } catch (e) {
            ws.close();
            console.error(e);
        }
    };
    ws.onclose = () => { connections.delete(ws); };
    ws.onerror = (error) => { console.log(error) }
});

console.log("start")