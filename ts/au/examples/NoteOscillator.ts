import {Oscillator} from "./Oscillator";
import {AuMidi} from "../AuMidi";
import {WaveForm} from "../WaveForm";
import {Calc} from "../../tools/Calc";

export class NoteOscillator extends Oscillator{
  constructor(public multiplier:number){
    super(0);
  }
  process(buffer: AudioBuffer){
    const midi=AuMidi._;
    for(let i=0;i<buffer.length;++i){
      const n=midi.keyIdx(0);
      const on=this.on=n!=null;
      if(this.on)
        this.frequency = (on?(n.freqPitched):0)*this.multiplier;
      const step = this.frequency/buffer.sampleRate;
      this.incPosition(step);
      const val=this.on?
        // WaveForm.trohoid(this.position,(on?n.vel:.5)*Calc.mix(1,3, midi.modulation))
        // WaveForm.trohoid(this.position, Calc.mix(.4,1, midi.modulation))
        // WaveForm.sine(this.position)
        WaveForm.pow(WaveForm.sine, this.position, Calc.mix(8,2048, Math.pow(midi.modulation, 4)))
        // WaveForm.triSawFolded(this.position, Calc.mix(.0,1, midi.modulation))
        :0;
      for (let channel=0; channel<buffer.numberOfChannels;++channel)
        buffer.getChannelData(channel)[i]+= val;
    }
  }
  toStr(){   return `NoteOsc(${this.frequency})`;  }
}