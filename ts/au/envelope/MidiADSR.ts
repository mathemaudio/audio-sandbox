import {ADSR} from "./ADSR";
import {Note} from "../Note";
type N=number;

export class MidiADSR extends ADSR{
  constructor(attack:N=.01, decay:N=.75, sustain:N=.36, release:N=.4){
    super(attack, decay, sustain, release);
    $(document).on('midi.topNote', (e:any, note:Note)=>{
      if(note!=null)
        this.start();
      else
        this.end();
    });

  }
}