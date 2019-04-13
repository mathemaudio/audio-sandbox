import {AuEngine} from "./au/AuEngine";
import {Oscillator} from "./au/examples/Oscillator";
import {NoteOscillator} from "./au/examples/NoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {TheCoolOscillator} from "./TheCoolOscillator";
import {AuBiquadFilter, AuBiquadType} from "./au/fx/AuBiquadFilter";
import {AuMidi} from "./au/AuMidi";
import {SubtrSynth} from "./au/examples/SubtrSynth";

/**
 * todo: 
 * - on sample cascade upward instead of running in AuEngine process after process
 * - power modulation - where another osc is feeded to the power value of a wave, like FM feeds to a frequency
 */

export class Main{
  static me:Main;
  constructor(){
    Main.me=this;
    $(document).ready(this.run);
  }
  engine:AuEngine;
  screen:MainScreen;
  private run=()=>{
    $('#forCanvas').html('');

    this.engine = AuEngine._;
    this.screen=new MainScreen();

    // const coolOne = new TheCoolOscillator();
    // coolOne.outTo(this.engine);
    this.connectMyDevices();


    setTimeout(()=>$('#wait').remove(), 300);
    console.log(this.engine.getDebugList());
  };

  private connectMyDevices(){
    const moog=new SubtrSynth();
    moog.outTo(this.engine);
    const logApplied=()=>{ console.log(`applied ${moog.lowpass.appliedTimes} times`);setTimeout(logApplied, 250)};logApplied();
    return;
    const osc=new NoteOscillator(1);
    // const o1=new Oscillator(441);
    // const o2=new NoteOscillator(1.5);
    // o1.outTo(o2)
    const lowpass = new AuBiquadFilter('lowpass',1000,
      AuEngine._.sampleRateGlobal,3, 6);
    const procLowPass=()=>{
      const m=AuMidi._;
      const cutoff=m.cutoff;
      const res=m.resonance;
      const controlLowPass=()=>{
        lowpass.frequency=cutoff.next*8000;
        lowpass.Q = res.next*22;
        requestAnimationFrame(controlLowPass);
      };
      controlLowPass();
    };
    procLowPass();
    osc.outTo(lowpass);
    lowpass.outTo(this.engine);

  }
}

new Main();


























