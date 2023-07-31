const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

class RoomManager{
    MAX_SIZE;
    rooms;
    emptyRooms;
    constructor(){
        this.MAX_SIZE=1000;
        this.rooms=new Array(this.MAX_SIZE);
        this.emptyRooms=new Queue(this.MAX_SIZE);
        for(let i=0; i<this.MAX_SIZE; i++)this.emptyRooms.push(i);
    }
    createRoom(ws,data){
        if(this.emptyRooms.isEmpty()){
            ws.send(JSON.stringify({type:"hostid",id:-1}));
            ws.close();
        }else{
            const id = this.emptyRooms.pop();
            this.rooms[id] = new Room(ws,data);
            ws.send(JSON.stringify({type:"hostid",id:id}))
            ws.onmessage=()=>{console.log("Room complete: "+id); this.killRoom(id); }
            ws.onclose=()=>{this.killRoom(id)};
            console.log('Room created: '+id);
        }
        
    }
    enterRoom(ws, id){
        if(this.isLive(id)){
            let room=this.rooms[id];
            room.setGuest(ws);
            console.log('Room entered: '+ id);
        }else {
            ws.send(JSON.stringify({type:"error"}))
            ws.close();
        }
    }
    
    killRoom(id){
        if(this.isLive(id)){
            this.rooms[id].reset();
            this.rooms[id]=null;
            this.emptyRooms.push(id);
            console.log('Room killed: '+id);
        }
    }
    isLive(id){return id>=0 && id<this.MAX_SIZE && this.rooms[id]}
}

class Room {
    host;//host ws
    data;//host sdp, ice
    guest;//guest ws
    constructor(ws, data) {
        this.host = ws;
        this.data = data;
        this.guest = null;
    }
    setGuest(ws) {
        if (this.guest) return;
        this.guest = ws;
        ws.send(JSON.stringify(this.data));
        ws.onmessage = (event) => { if (this.host) this.host.send(event.data.toString("utf-8")); }
        ws.onclose = () => { this.guest = null; }
    }
    reset() {
        if (this.host) this.host.close();
        if (this.guest) this.guest.close();
        this.host = null;
        this.guest = null;
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
    push(e) { if (!this.isFull()) this.arr[++this.t] = e; }
    pop() { if (!this.isEmpty()) return this.arr[this.t--]; }
    top() { if (!this.isEmpty()) return this.arr[this.t]; }
    isFull() { return (this.t + 1 == this.MAX_SIZE); }
    isEmpty() { this.t == -1; }
}

class Queue {
    arr;
    MAX_SIZE;
    f;
    b;
    size;
    constructor(MAX_SIZE = 1000) {
        this.MAX_SIZE = MAX_SIZE;
        this.arr = new Array(this.MAX_SIZE);
        this.f = 0;
        this.b = 0;
        this.size=0;
    }
    push(e) {
        if (!this.isFull()) {
            this.size++;
            this.arr[this.b] = e;
            this.b = this.next(this.b);
        }
    }
    pop() {
        if (!this.isEmpty()) {
            this.size--;
            const e = this.arr[this.f];
            this.f = this.next(this.f);
            return e;
        }
    }
    front() { if (!this.isEmpty()) return this.arr[this.f]; }
    isFull() { return this.size==this.MAX_SIZE; }
    isEmpty() { return this.size==0; }
    next(i) { return (i + 1) % this.MAX_SIZE; }
}

const connections = new Set(); //대기방
const roomManager = new RoomManager();

wss.on('connection', (ws) => {
    connections.delete(ws);
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case "wait": break;
                case "host": roomManager.createRoom(ws, data); connections.delete(ws); break;
                case "guest": roomManager.enterRoom(ws, Number(data.id)); connections.delete(ws); break;
                default: ws.close(); break;
            }
        } catch (e) {
            ws.close();
            console.log(e);
        } 
    };
    ws.onclose = () => { connections.delete(ws); };
    ws.onerror = (error) => { connections.delete(ws); console.log(error) }
});

console.log("start")