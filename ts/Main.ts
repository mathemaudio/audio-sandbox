import {AuEngine} from "./au/AuEngine";
import {Oscillator} from "./au/examples/Oscillator";
import {NoteOscillator} from "./au/examples/NoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {TheCoolOscillator} from "./TheCoolOscillator";

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
    const o1=new NoteOscillator(1);
    // const o2=new NoteOscillator(1.5);
    // o1.outTo(o2);
    o1.outTo(this.engine);

  }
}

new Main();


























