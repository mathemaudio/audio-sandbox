import {Calc} from "../tools/Calc";
import {AuEngine} from "./AuEngine";
import {AuSmoother} from "./AuSmoother";


type Num = number;

type Velocity = number;
type Note = {
  note: number,
  freqBase: number,
  freqPitched: number,
  vel: Velocity
};
type KeysMap = { [key: number]: Note };

export class AuMidi {
  private constructor(){
    this.connect();
  }

  private info(msg: string, clr: string){
    if(AuEngine.LEARN_MODE)return;
    $('#midiInfo').html(`<b style="color:#${clr}">${msg}</b>`);
  }
  private connect(){
    const onMIDISuccess = (midiAccess: any) => {
      // when we get a succesful response, run this code
      console.log('MIDI Access Object', midiAccess);
      this.info('MIDI ON', '0a0');
      const inputs = midiAccess.inputs.values();
      for (let input = inputs.next(); input && !input.done; input = inputs.next())
        input.value.onmidimessage = this.onMessage;
    };

    const onMIDIFailure = (e: Object) => {
      this.info('No access to MIDI devices or your browser doesn\'t support WebMIDI API. Please use WebMIDIAPIShim' + e, 'f70');
    };
    if (navigator.requestMIDIAccess){
      navigator.requestMIDIAccess({
        sysex:false // this defaults to 'false' and we won't be covering sysex in this article.
      }).then(onMIDISuccess, onMIDIFailure);
    } else
      this.info('Browser does not support MIDI', 'f70');


  }

  private findPitchedFreq(note: number){
    const p = this.pitch, n2f = this.noteToFreq;
    if (Math.abs(p) < 1 / 126) return n2f(note);
    return n2f(Calc.mix(note, note + 2, p));
  }

  pitchAllNotes(){
    for (let k in this.keys) {
      const n = this.keys[k];
      n.freqPitched = this.findPitchedFreq(n.note);
    }
  }
  private _lastEvent:Num[];
  get lastEvent(){ return this._lastEvent; }
  private onMessage = (e: any) => {
    const rawMsg = this._lastEvent = <Num[]>e.data,
      cmd = rawMsg[0] >> 4,
      channel = rawMsg[0] & 0xf,
      note = rawMsg[1];
    if(this.onMidiEvent)this.onMidiEvent(rawMsg);
    const getHqNumber = (msb: number, lsb: number) => {
      const l =msb<<7 | lsb;
      const low=21, mid=8192, hi=16266;
      if(l<mid) return Math.max(0, Calc.remix(low, mid, l, 0, .5));
      else return Math.min(Calc.remix(mid, hi, l, .5, 1), 1);
    };
    const velHQ = getHqNumber(rawMsg[2], rawMsg[1]);
    const velRaw=rawMsg[2];
    const velLofi01=velRaw/127;
    switch (cmd) {
      case 8:
      case 9:
        const noteOn = cmd == 9 && velRaw!=0/*a special case: velocity=0 is actually "note off" cmd */;
        if (noteOn)
          this.keys[note] = {
            note:note,
            vel:velLofi01,
            freqBase:this.noteToFreq(note),
            freqPitched:this.findPitchedFreq(note),
          };
        else
          delete this.keys[note];
        break;
      case 14:
        this.pitch = Calc.mix(-1, 1, velHQ);
        this.pitchAllNotes();
        break;
      case 11:
        switch (note) {
          case 1:this.modulationRaw = velHQ;break;
          case 73:this.attackRaw = velLofi01;break;
          case 75:this.decayRaw = velLofi01;break;
          case 72:this.releaseRaw = velLofi01;break;
          case 74:this.cutoffRaw = velLofi01;break;
          case 71:this.resonanceRaw = velLofi01;break;
          default: break;
        }
        break;
      default:
        console.log('not parsed');
        break;
    }
    // const R=(n:number) => Math.round(n*1000)/1000;
    const R = (n: number) => n;
    // console.log(JSON.stringify(this.keys) + `\npitch: ${R(this.pitch)}, mod: ${R(this.modulation)}, br: ${R(this.brightness)}`);
    console.log(`cmd=${cmd}, ch=${channel}, note=${note}, vel=${velRaw}`);
  };
  pitch = 0;
  onMidiEvent:(data:number[])=>void;

  get modulation(){ return new AuSmoother(()=>this.modulationRaw); }  private modulationRaw = 0;
  get attack(){ return new AuSmoother(()=>this.attackRaw); }  private attackRaw = 0;
  get decay(){ return new AuSmoother(()=>this.decayRaw); }  private decayRaw = 0;
  get release(){ return new AuSmoother(()=>this.releaseRaw); }  private releaseRaw = .5;
  get cutoff(){ return new AuSmoother(()=>this.cutoffRaw); }  private cutoffRaw = 0.5;
  get resonance(){ return new AuSmoother(()=>this.resonanceRaw); }  private resonanceRaw = .5;

  get on(){
    for (let i in this.keys) return true;
    return false;
  }

  keyIdx(idx: number): Note{
    let i = 0;
    for (let k in this.keys) {
      if (idx == i)
        return this.keys[k];
      i++;
    }
    return null;
  }

  keys: KeysMap = <KeysMap>{};

  noteToFreq(note: number){
    const a = 440 * .9857;
    return (a / 32) * Math.pow(2, ((note - 9) / 12));
  }

  private static __self: AuMidi;

  public static get _(){
    return this.__self || (this.__self = new this());
  }

}