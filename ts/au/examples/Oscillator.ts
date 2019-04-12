import {AuNode} from "../AuNode";
import {WaveForm} from "../WaveForm";

export class Oscillator extends AuNode{
  constructor(public frequency:number){
    super();
  }
  protected position=0.;
  protected incPosition(step:number){
    this.position+=step;
    if(this.position>1)this.position-=1;
  }
  on:boolean=true;
  process(buffer: AudioBuffer){
    for(let i=0;i<buffer.length;++i){
      const step = this.frequency/buffer.sampleRate;
      this.incPosition(step);
      if(this.position>1)this.position-=1;
      const val=this.on? WaveForm.sine(this.position):0;
      for (let channel=0; channel<buffer.numberOfChannels;++channel)
        buffer.getChannelData(channel)[i]+= val;
    }
  }
  toStr(){   return `Osc(${this.frequency})`;  }
}