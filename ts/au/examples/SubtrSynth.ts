import {NoteOscillator} from "./NoteOscillator";
import {AuBiquadFilter} from "../fx/AuBiquadFilter";
import {AuSmoother} from "../AuSmoother";
import {AuNode} from "../AuNode";
import {Calc} from "../../tools/Calc";

export class SubtrSynth extends NoteOscillator{
  readonly lowpass:AuBiquadFilter;

  constructor(multiplier:number){
    super(multiplier);
    this.resonance=this.midi.resonance;
    this.lowpass=new AuBiquadFilter('lowpass', 1000,this.sampleRate,3,6);
    this.midi2lowpass();
  }
  private readonly resonance:AuSmoother;
  private midi2lowpass=()=>{
    this.lowpass.frequency=Calc.mix(300, 8000, this.cutoff.nextSmoothed);
    this.lowpass.Q = Calc.mix(1, 22, this.resonance.nextSmoothed);
    // this.lowpass.peakGain=6;
    // this.lowpass.apply();
  };
  onSample(s: number){
    this.midi2lowpass();
    return super.onSample(s);
  }

  outTo(child: AuNode){
    super.outTo(this.lowpass);
    this.lowpass.outTo(child);
    return child;
  }
}