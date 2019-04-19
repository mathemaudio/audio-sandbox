import {FnWaveGenerator, Oscillator} from "./Oscillator";
// import {AuMidi} from "../AuMidi";
import {WaveForm} from "../WaveForm";
import {AuSmoother} from "../AuSmoother";
import {Main} from "../../Main";
import {Note} from "../Note";
import {Calc} from "../../tools/Calc";

export class NoteOscillator extends Oscillator{
  constructor(public multiplier:number, waveGenerator:FnWaveGenerator=null){
    super(0, waveGenerator);
    Main.me.screen.signalOutput.baseFrequencyProvider=()=>this.frequency;

  }
  public note:Note;
  public portamento:number;/// zero - immediate, 1 - too slow (even won't change!)
  processSample(s: number){
    const n=this.note;
    this.on=n!=null;
    const targetFreq=(this.on?(n.freqPitched):0)*this.multiplier;
    this.frequency = Calc.mix(targetFreq, this.frequency, this.porto2coef(this.portamento));
    const r=(n:number)=>Math.round(n*100)/100;
    // if(this.count++ %100==0)
    //   $('#freqInfo2').html(`target: ${targetFreq}, freq: ${this.frequency}`);
    return super.processSample(s);
  }
  porto2coef(porto:number){
    const r=Calc.remix;
    if(porto==0)return 0;
    if(porto<.1)return r(0, .1, porto, 0, .999);
    if(porto<.5)return r(.1, .5, porto, .99, .9993);
    if(porto<1)return r(.5, .1, porto, .999, .9999);
    return .99999;
  }
  private count=0;
  // readonly midi:AuMidi;
}