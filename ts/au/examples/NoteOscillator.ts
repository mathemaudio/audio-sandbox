import {Oscillator} from "./Oscillator";
import {AuMidi} from "../AuMidi";
import {WaveForm} from "../WaveForm";
import {Calc} from "../../tools/Calc";
import {AuSample} from "../AuSample";
import {AuSmoother} from "../AuSmoother";
import {Main} from "../../Main";

export class NoteOscillator extends Oscillator{
  constructor(public multiplier:number){
    super(0);
    Main.me.screen.signalOutput.baseFrequencyProvider=()=>this.frequency;
    this.midi=AuMidi._;
    this.cutoff=this.midi.cutoff;
    this.attack=this.midi.attack;
    this.modulation=this.midi.modulation;
    this.waveGenerator=(pos:number)=>{
      const n=this.midi.keyIdx(0);
      // return WaveForm.simplePhaseModulation(pos,
      //     Calc.mix(.2, 3, this.cutoff.nextSmoothed),
      //     Calc.mix(-Math.PI, Math.PI, this.attack.nextSmoothed)
      // );
      // return WaveForm.trohoid(pos, Calc.mix(.2,4, this.cutoff.nextSmoothed));
      return WaveForm.triSawFolded(pos, 1-this.modulation.nextSmoothed);
      // return WaveForm.pow(WaveForm.sine, pos, Calc.mix(.02,1024*8, Math.pow(this.cutoff.nextSmoothed, 4)))
    };
  }
  protected readonly cutoff:AuSmoother;
  protected readonly attack:AuSmoother;
  protected readonly modulation:AuSmoother;
  onSample(s: AuSample): void{
    const n=this.midi.keyIdx(0);
    this.on=n!=null;
    this.frequency = (this.on?(n.freqPitched):0)*this.multiplier;
    super.onSample(s);
  }
  readonly midi:AuMidi;
  toStr(){   return `NoteOsc(${this.frequency})`;  }
}