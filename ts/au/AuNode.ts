/**
 * A basic audio node
 */
import {AuSample} from "./AuSample";
import {AuEngine} from "./AuEngine";

export class AuNode {



  onSample(s:AuSample):void{
    /// this example makes things 6db quieter
    s.l *=.5;
    s.r *=.5;
  }
  process(buffer:AudioBuffer){
    AuEngine._.assertChannels(buffer.numberOfChannels);

    const spl=new AuSample(), l=buffer.getChannelData(0), r=buffer.getChannelData(1);
    spl.rate=buffer.sampleRate;
    for(let i=0;i<buffer.length;++i){
      spl.l = l[i];
      spl.r = r[i];
      this.onSample(spl);
      l[i] = spl.l;
      r[i] = spl.r;
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
