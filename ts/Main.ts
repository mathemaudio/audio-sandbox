import {AuEngine} from "./au/AuEngine";
import {Oscillator} from "./au/examples/Oscillator";
import {NoteOscillator} from "./au/examples/NoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {TheCoolOscillator} from "./TheCoolOscillator";
import {AuBiquadFilter, AuBiquadType} from "./au/fx/AuBiquadFilter";
import {AuMidi} from "./au/AuMidi";
import {SubtrSynth} from "./au/examples/SubtrSynth";
import {AuVolume} from "./au/fx/AuVolume";

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
    new SubtrSynth(3)
    .outTo(new AuVolume(.7))
    .outTo(new NoteOscillator(1))
    .outTo(new AuVolume(.3))
    .outTo(this.engine)
    ;
  }
}

new Main();


























