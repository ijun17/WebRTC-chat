let Multi = {
    ws:null,
    connect:false,
    serverOn:false,
    gameOn:false,
    IP:"211.194.75.223",
    playerNum:'n', //n:익명 0:1번째플레이어 1:2번째플레이어
    makeWebSocket: function () {
        this.ws = new WebSocket("ws://"+Multi.IP+":777");
        // 연결이 수립되면 서버에 메시지를 전송한다
        this.ws.onopen = function (event) {
            Multi.serverOn=true;
        }
        // 서버로 부터 메시지를 수신한다
        this.ws.onmessage = function (event) {
            //console.log("SERVER: "+event.data);
            if(Multi.gameOn)Multi.requestHandlerGameOn(event.data);
            else Multi.requestHandlerGameOff(event.data);
        }
        // error event handler
        this.ws.onerror = function (event) {
            Multi.serverOn=false;
            if(Multi.connect)Multi.makeWebSocket();
        }
    },
    connectOn:function(){
        this.makeWebSocket();
        this.connect=true;
    },
    connectOff:function(){
        this.connect=false;
        if(this.ws!=null)this.ws.close();
        this.serverOn=false;
        this.setGameStatus(false);
        this.playerNum='n';
    }
}