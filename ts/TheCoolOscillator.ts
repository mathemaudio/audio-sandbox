import {AuNode} from "./au/AuNode";

export class TheCoolOscillator extends AuNode{
  constructor(){
    super();
  }
  phase = 0;
  frequency = 500;
  process(buffer: AudioBuffer): void{
    for(let sample=0;sample<buffer.length;++sample){
      this.phase += this.frequency / buffer.sampleRate;
      this.frequency += .005;
      if(this.phase > 1) this.phase-=1;
      for(let channel=0;channel<buffer.numberOfChannels;++channel)
        buffer.getChannelData(channel)[sample] = Math.sin(this.phase * Math.PI*2);
    }
  }
}

