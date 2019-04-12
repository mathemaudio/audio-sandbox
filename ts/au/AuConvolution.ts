/**
 * this one won't inherit Node, because it stands apart with a connection mechanism
 */
import {AuEngine} from "./AuEngine";

export class AuConvolution {
  private convolver:ConvolverNode;
  constructor(){
    this.convolver = this.ctx.createConvolver();
  }
  get ctx(){ return AuEngine._.audioCtx; }
  url='';
  impulseResponse:AudioBuffer;
  source:AudioBufferSourceNode;
  loadImpulseResponse(url:string, done:()=>void){
    this.url=url;

    const ajaxRequest = new XMLHttpRequest();
    ajaxRequest.open('GET', 'concert-crowd.ogg', true);
    ajaxRequest.responseType = 'arraybuffer';

    ajaxRequest.onload = ()=> {
      const audioData = <ArrayBuffer>ajaxRequest.response;
      this.ctx.decodeAudioData(audioData, buffer=> {
        this.impulseResponse = buffer;
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.impulseResponse;
        this.convolver.buffer = this.impulseResponse;
        if(done)done();
      }, e=> {throw "Error with decoding audio data" + e});
    };

    ajaxRequest.send();


  }
  loadAndPlug(url:string, done:()=>void){
    this.loadImpulseResponse(url, ()=>{
      this.plugToEngine();
      if(done)done();
    });
  }
  plugToEngine(){
    AuEngine._.insertJSAudioNodeToEnd(this.convolver);
  }
}