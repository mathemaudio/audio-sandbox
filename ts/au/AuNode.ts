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

  protected position=0.;
  protected incPosition(step:number){
    this.position+=step;
    if(this.position>1)this.position-=1;
  }
  processSample(s:number):number{
    return s;
  }
  getNextSample(s:number):number{
    if(this.parent)
      s = this.parent.getNextSample(s);
    this.beforeOnSample();
    s = this.processSample(s);
    // if(this.parentAmplitude)
    //   s = s * Calc.remix(
    //           -1, 1,
    //                 this.parentAmplitude.getNextSample(0),
    //           .0, 1);
    return s;
  }
  beforeOnSample:()=>void=()=>{};


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

  // parentAmplitude:AuNode=null;
  // amplitudeTo(child:AuNode){
  //   this.child=child;
  //   child.parentAmplitude=this;
  //   return child;
  // }

}
