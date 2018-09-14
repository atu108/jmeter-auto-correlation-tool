class Message{
  constructor(){
    return {
      send: this.send.bind(this)
    }
  }

  send(data, callback){

  }
}

export default new Message();
