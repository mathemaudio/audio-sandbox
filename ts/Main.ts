import {AuEngine} from "./au/AuEngine";
import {NoteOscillator} from "./au/examples/NoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {SubtrSynth} from "./au/examples/SubtrSynth";
import {AuVolume} from "./au/fx/AuVolume";
import {AuMidi} from "./au/AuMidi";
import {Oscillator} from "./au/examples/Oscillator";
import {Calc} from "./tools/Calc";

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
  };

  private connectMyDevices(){
    this.simpleFm();
  }
  private subtrSynth(){
    new SubtrSynth(3)
    .outTo(new AuVolume(.7))
    .outTo(new NoteOscillator(1))
    .outTo(new AuVolume(.3))
    .outTo(this.engine) ;
  }
  private simpleFm(){
    let fmStrength:AuVolume;
    // let osc=new NoteOscillator(3);
    let osc=new Oscillator(3);


    osc.outTo(fmStrength=new AuVolume(0))
    .fmTo(new NoteOscillator(1))
    .outTo(new AuVolume(.7))
    .outTo(this.engine);

    const res=AuMidi._.resonance;
    const freq = AuMidi._.cutoff;
    fmStrength.beforeOnSample=s=>{
      fmStrength.volume = res.nextSmoothed;
      osc.frequency=freq.nextSmoothed*200;
      // osc.multiplier = Calc.mix(.5, 4, freq.nextSmoothed);
      return s;
    }
  }
}

new Main();


























