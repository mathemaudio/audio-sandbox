/**
 * A basic audio node
 */
import {AuSample} from "./AuSample";
import {AuEngine} from "./AuEngine";

export class AuNode {
  constructor(){
    this.initSampleRate();
  }
  initSampleRate(){ this.sampleRate=AuEngine._.sampleRate; }

  onSample(s:AuSample):number{
    /// this example makes things 6db quieter
    return s;
  }
  process(buffer:AudioBuffer){
    AuEngine._.assertChannels(buffer.numberOfChannels);
    this.sampleRate=buffer.sampleRate;
    const spl=0, data=buffer.getChannelData(0);
    for(let i=0;i<buffer.length;++i)
      data[i] = this.onSample(data[i]);
  }


  sampleRate:number;
  child:AuNode=null;
  parent:AuNode=null;
  outTo(child:AuNode){
    this.child=child;
    child.parent=this;
    return child;
  }



  toStr():string{ return 'AuNode'; }
}
