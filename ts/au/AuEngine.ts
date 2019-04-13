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
  private readonly channels = 1;/// should not be changed
  getFirstNode=(fin?:AuNode)=>{
    if(typeof fin=='undefined')fin=this;
    let n=fin;
    while (n.parent!=null)n=n.parent;
    return n;
  };
  totalSamplesProcssed=0;
  lastBuffer:AudioBuffer;
  process(buffer:AudioBuffer) {
    if(this.skipProcessing){
      this.erease(buffer);
      return;
    }
    AuEngine._.assertChannels(buffer.numberOfChannels);
    this.sampleRate=buffer.sampleRate;
    const spl=0, data=buffer.getChannelData(0);
    for(let i=0;i<buffer.length;++i)
      data[i] = this.onSampleParented(/*data[i]*/0);
    this.lastBuffer=buffer;
    this.totalSamplesProcssed+=buffer.length;
  }
  private erease(buf:AudioBuffer){
    for(let i=0;i<buf.length;++i)
      for (let channel=0; channel<buf.numberOfChannels;++channel)
        buf.getChannelData(channel)[i]=0;
  }
  assertChannels(num:number){
    if(num!=1){
      const msg='Number of channels must be exactly 1, otherwise this engine will not be able to work';
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
    this.initSampleRate();
    node.onaudioprocess = (e:AudioProcessingEvent)=>this.process(e.outputBuffer);
    node.connect(this.audioCtx.destination);
    this.lastAttachedNode=node;
  }
  initSampleRate(){  if(this.audioCtx)  this.sampleRate=this.audioCtx.sampleRate;  }

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