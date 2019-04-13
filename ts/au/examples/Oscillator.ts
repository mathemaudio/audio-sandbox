import {AuNode} from "../AuNode";
import {WaveForm} from "../WaveForm";

type FnWaveGenerator =(position:number)=>number;


export class Oscillator extends AuNode{
  constructor(public frequency:number, public waveGenerator:FnWaveGenerator=null){
    super();
    if(this.waveGenerator==null)
      this.waveGenerator=(pos:number)=>WaveForm.sine(pos);
  }
  protected position=0.;
  protected incPosition(step:number){
    this.position+=step;
    if(this.position>1)this.position-=1;
  }
  on:boolean=true;
  onSample(s: number){
    const freqMul = 1+(this.parentFm?(this.parentFm.onSampleParented(0)*10):0);
    const step = (this.frequency*freqMul)/this.sampleRate;
    this.incPosition(step);
    return s + (this.on? this.waveGenerator(this.position):0);
  }


  parentFm:AuNode=null;

}