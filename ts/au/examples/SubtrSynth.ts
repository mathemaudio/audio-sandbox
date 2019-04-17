import {NoteOscillator} from "./NoteOscillator";
import {AuBiquadFilter} from "../fx/AuBiquadFilter";
import {AuSmoother} from "../AuSmoother";
import {AuNode} from "../AuNode";
import {Calc} from "../../tools/Calc";
import {AuMidi} from "../AuMidi";

export class SubtrSynth extends NoteOscillator{
  readonly lowpass:AuBiquadFilter;

  constructor(multiplier:number){
    super(multiplier);
    this.midi=AuMidi._;
    this.cutoff=this.midi.cutoff;
    this.attack=this.midi.attack;
    this.modulation=this.midi.modulation;
    // this.waveGenerator=(pos:number)=>{
    //   const n=this.midi.keyIdx(0);
    //   // return WaveForm.simplePhaseModulation(pos,
    //   //     Calc.mix(.2, 3, this.cutoff.nextSmoothed),
    //   //     Calc.mix(-Math.PI, Math.PI, this.attack.nextSmoothed)
    //   // );
    //   // return WaveForm.trohoid(pos, Calc.mix(.2,4, this.cutoff.nextSmoothed));
    //   return WaveForm.triSawFolded(pos, 1-this.modulation.nextSmoothed);
    //   // return WaveForm.pow(WaveForm.sine, pos, Calc.mix(.02,1024*8, Math.pow(this.cutoff.nextSmoothed, 4)))
    // };
    this.resonance=this.midi.resonance;
    this.lowpass=new AuBiquadFilter('lowpass', 1000,this.sampleRate,3,6);
    this.midi2lowpass();
  }
  protected readonly cutoff:AuSmoother;
  protected readonly attack:AuSmoother;
  protected readonly modulation:AuSmoother;
  private readonly resonance:AuSmoother;
  private midi2lowpass=()=>{
    this.lowpass.frequency=Calc.mix(300, 8000, this.cutoff.nextSmoothed);
    this.lowpass.Q = Calc.mix(1, 22, this.resonance.nextSmoothed);
    // this.lowpass.peakGain=6;
    // this.lowpass.apply();
  };
  protected midi:AuMidi;
  processSample(s: number){
    this.midi2lowpass();
    return super.processSample(s);
  }

  outTo(child: AuNode){
    super.outTo(this.lowpass);
    this.lowpass.outTo(child);
    return child;
  }
}