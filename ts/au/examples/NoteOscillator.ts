import {FnWaveGenerator, Oscillator} from "./Oscillator";
// import {AuMidi} from "../AuMidi";
import {WaveForm} from "../WaveForm";
import {AuSmoother} from "../AuSmoother";
import {Main} from "../../Main";
import {Note} from "../Note";

export class NoteOscillator extends Oscillator{
  constructor(public multiplier:number, waveGenerator:FnWaveGenerator=null){
    super(0, waveGenerator);
    Main.me.screen.signalOutput.baseFrequencyProvider=()=>this.frequency;

  }
  public note:Note;
  processSample(s: number){
    const n=this.note;
    this.on=n!=null;
    this.frequency = (this.on?(n.freqPitched):0)*this.multiplier;
    return super.processSample(s);
  }
  // readonly midi:AuMidi;
}