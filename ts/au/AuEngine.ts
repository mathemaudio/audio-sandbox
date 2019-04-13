import {Stor} from "../tools/Stor";
import {AuNode} from "./AuNode";
import {AuMidi} from "./AuMidi";

export class AuEngine extends AuNode{
  static readonly LEARN_MODE=false;
  private midi:AuMidi;
  private constructor(){
    super();
    this.audioCtx = new AudioContext();
    this.attachNodes();
    this.midi=AuMidi._;
    $(document).keydown(this.switchSkip);
    this.switchSkip({keyCode:0});
  }
  private readonly nameSkip='skipAudio__';

  private switchSkip=(k:{keyCode:number})=>{
    if(k.keyCode==32){
      this.skipProcessing=!this.skipProcessing;
      Stor.set(this.nameSkip, this.skipProcessing);
    }
    const sk=this.skipProcessing;
    if(AuEngine.LEARN_MODE)return;
    $('#engineInfo').html('<b style="color:'+(sk?'#f00':'#090')+'">'
          +(sk?'Audio OFF':'Audio ON')+' (press Space to Switch)</b>');
  };
  private skipProcessing=Stor.has(this.nameSkip)?Stor.get(this.nameSkip):false;
  private veryFirst = true;
  readonly audioCtx:AudioContext;
  private readonly channels = 2;/// should not be changed, otherwise it will not work with AuSample Class
  volume=1;//.3;
  getFirstNode=(fin?:AuNode)=>{
    if(typeof fin=='undefined')fin=this;
    let n=fin;
    while (n.parent!=null)n=n.parent;
    return n;
  };
  totalSamplesProcssed=0;
  lastBuffer:AudioBuffer;
  process(buf:AudioBuffer) {
    this.erease(buf);
    if(this.skipProcessing)
      return;
    const fin:AuNode=this;
    let node=this.getFirstNode(fin);
    while (node!=fin && node.child!=null){
      node.process(buf);
      node=node.child;
    }
    this.setVolume(buf, this.volume);
    this.lastBuffer=buf;
    this.totalSamplesProcssed+=buf.length;
  }
  toStr(){   return "AuEngine"; }
  getDebugList(){
    const r:string[]=[];
    const fin:AuNode=this;
    let node=this.getFirstNode(fin);
    while (node!=fin && node.child!=null){
      r.push(node.toStr());
      node=node.child;
    }
    return r.join(' => \n');
  }
  private setVolume(buf:AudioBuffer, vol:number){
    for(let i=0;i<buf.length;++i)
      for (let channel=0; channel<buf.numberOfChannels;++channel)
        buf.getChannelData(channel)[i]*=vol;
  }
  private erease(buf:AudioBuffer){
    for(let i=0;i<buf.length;++i)
      for (let channel=0; channel<buf.numberOfChannels;++channel)
        buf.getChannelData(channel)[i]=0;
  }
  assertChannels(num:number){
    if(num!=2){
      const msg='Number of channels must be exactly 2, otherwise this engine will not be able to work';
      alert(msg);
      throw msg;
    }
  }
  static readonly BUF_SZ=1024;
  private attachNodes(){
    this.assertChannels(this.channels);

    const node = this.mainScriptNode = this.audioCtx.createScriptProcessor(
      AuEngine.BUF_SZ, this.channels, this.channels
    );
    node.onaudioprocess = (e:AudioProcessingEvent)=>this.process(e.outputBuffer);
    node.connect(this.audioCtx.destination);
    this.lastAttachedNode=node;
  }
  get sampleRateGlobal(){ return this.audioCtx.sampleRate; }
  private mainScriptNode:ScriptProcessorNode;
  private lastAttachedNode:AudioNode;
  insertJSAudioNodeToEnd(node:AudioNode){
    this.lastAttachedNode.connect(node);
    node.connect(this.audioCtx.destination);
    this.lastAttachedNode=node;
  }
  private static __self:AuEngine;
  public static get _(){  return this.__self || (this.__self = new this());  }

}