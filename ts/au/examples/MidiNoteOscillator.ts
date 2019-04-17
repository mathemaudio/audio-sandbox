import {NoteOscillator} from "./NoteOscillator";
import {Note} from "../Note";
import {FnWaveGenerator} from "./Oscillator";

export class MidiNoteOscillator extends NoteOscillator{
  constructor(multiplier:number, waveGenerator:FnWaveGenerator=null){
    super(multiplier, waveGenerator);
    $(document).on('midi.topNote', (e:any, note:Note)=>{
      if(note!=null)this.note=note;
    });

  }
}