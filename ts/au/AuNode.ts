/**
 * A basic audio node
 */
import {AuEngine} from "./AuEngine";
import {Oscillator} from "./examples/Oscillator";
import {Calc} from "../tools/Calc";

export class AuNode {
  constructor(){
    this.initSampleRate();
  }
  initSampleRate(){ this.sampleRate=AuEngine._.sampleRate; }

  onSample(s:number):number{
    return s;
  }
  onSampleParented(s:number):number{
    if(this.parent)
      s = this.parent.onSampleParented(s);
    s = this.onSample(this.beforeOnSample(s));
    if(this.parentAmplitude)
      s = s * Calc.remix(
              -1, 1,
                    this.parentAmplitude.onSampleParented(0),
              .0, 1);
    return s;
  }
  beforeOnSample:(s:number)=>number=s=>s;


  sampleRate:number;
  child:AuNode=null;
  parent:AuNode=null;
  outTo(child:AuNode){
    this.child=child;
    child.parent=this;
    return child;
  }
  fmTo(child:Oscillator){
    this.child=child;
    child.parentFm=this;
    return child;
  }

  parentAmplitude:AuNode=null;
  amplitudeTo(child:AuNode){
    this.child=child;
    child.parentAmplitude=this;
    return child;
  }

}
