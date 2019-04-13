import {AuEngine} from "./au/AuEngine";
import {Oscillator} from "./au/examples/Oscillator";
import {NoteOscillator} from "./au/examples/NoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {TheCoolOscillator} from "./TheCoolOscillator";
import {AuBiquadFilter, AuBiquadType} from "./au/fx/AuBiquadFilter";

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
    const osc=new NoteOscillator(1);
    // const o1=new Oscillator(441);
    // const o2=new NoteOscillator(1.5);
    // o1.outTo(o2)
    const lowpass = new AuBiquadFilter({
      type:'lowpass',
      frequency:1000, sampleRate:AuEngine._.sampleRateGlobal,
      Q:22, peakGain:6
    });
    osc.outTo(lowpass);
    lowpass.outTo(this.engine);

  }
}

new Main();


























