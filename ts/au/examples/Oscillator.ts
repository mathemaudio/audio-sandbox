import {AuNode} from "../AuNode";
import {WaveForm} from "../WaveForm";
import {AuSample} from "../AuSample";

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
  onSample(s: AuSample){
    const step = this.frequency/this.sampleRate;
    this.incPosition(step);
    return s + (this.on? this.waveGenerator(this.position):0);
  }

  toStr(){   return `Osc(${this.frequency})`;  }
}