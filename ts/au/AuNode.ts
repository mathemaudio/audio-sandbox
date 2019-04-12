/**
 * A basic audio node
 */
import {AuSample} from "./AuSample";
import {AuEngine} from "./AuEngine";

export class AuNode {



  oneSample(s:AuSample):void{
    /// this example makes things 6db quieter
    s.l *=.5;
    s.r *=.5;
  }
  process(buffer:AudioBuffer){
    AuEngine._.assertChannels(buffer.numberOfChannels);
    const spl=new AuSample(), channel=buffer.getChannelData;
    for(let i=0;i<buffer.length;++i){
      spl.l = channel(0)[i];
      spl.r = channel(1)[i];
      this.oneSample(spl);
      channel(0)[i] = spl.l;
      channel(1)[i] = spl.r;
    }
  }



  child:AuNode=null;
  parent:AuNode=null;
  outTo(child:AuNode){
    this.child=child;
    child.parent=this;
  }



  toStr():string{ return 'AuNode'; }
}
