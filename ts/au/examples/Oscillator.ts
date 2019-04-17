import {AuNode} from "../AuNode";
import {WaveForm} from "../WaveForm";

export type FnWaveGenerator =(position:number)=>number;


export class Oscillator extends AuNode{
  constructor(public frequency:number, public waveGenerator:FnWaveGenerator=null){
    super();
    if(this.waveGenerator==null)
      this.waveGenerator=WaveForm.sine;
  }
  on:boolean=true;
  processSample(s: number){
    const freqMul = 1+(this.parentFm?(this.parentFm.getNextSample(0)*10):0);
    const step = (this.frequency*freqMul)/this.sampleRate;
    this.incPosition(step);
    return s + (this.on? this.waveGenerator(this.position):0);
  }


  parentFm:AuNode=null;

}