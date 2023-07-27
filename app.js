const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected.');
    ws.on('message', (message) => {
        console.log('Received message:', message);
        onmessage(message)
    });


    ws.on('close', () => {
        console.log('Client disconnected.'+);
        connections.delete(ws);
    });
});

let queue = new Queue(1000); //웹소켓 대기열

function getConnectionCount(){return queue.size()}

function onmessage(message){
    try{
        let data=JSON.parse(message);
        if(data.type=="offer");
    }catch(e){
        return;
    }
}


class Queue{
    arr;
    MAX_SIZE;
    f;
    b;
    constructor(MAX_SIZE=1000){
        this.MAX_SIZE=MAX_SIZE;
        this.arr=new Array(this.MAX_SIZE);
        f=0;
        b=0;
    }
    push(e){
        if(this.size()<this.MAX_SIZE){
            this.arr[this.b]=e;
            this.b=this.next(this.b);
        }
    }
    pop(){
        if(!this.isEmpty())this.f=this.next(this.f);
    }
    front(){
        if(!this.isEmpty())return this.arr[this.f];
    }
    size(){
        return (this.b<this.f ? this.b-this.f+this.MAX_SIZE : this.b-this.f)
    }
    isEmpty(){
        return this.f==this.b;
    }
    next(i){
        return (i+1)%this.MAX_SIZE;
    }
}