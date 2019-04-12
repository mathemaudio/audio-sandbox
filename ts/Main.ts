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

    const coolOne = new TheCoolOscillator();
     coolOne.outTo(this.engine);


    setTimeout(()=>$('#wait').remove(), 300);
    console.log(this.engine.getDebugList());
  };
}

new Main();


























