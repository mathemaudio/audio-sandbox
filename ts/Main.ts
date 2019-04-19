import {AuEngine} from "./au/AuEngine";
import {MidiNoteOscillator} from "./au/examples/MidiNoteOscillator";
import {MainScreen} from "./display/MainScreen";
import {AuVolume} from "./au/fx/AuVolume";
import {AuMidi} from "./au/AuMidi";
import {MidiADSR} from "./au/envelope/MidiADSR";
import {TheCoolOscillator} from "./TheCoolOscillator";
import {Calc} from "./tools/Calc";
import {WaveForm} from "./au/WaveForm";
import {AuBiquadFilter} from "./au/fx/AuBiquadFilter";
import {Note} from "./au/Note";
import {AuSillyFilter} from "./au/fx/AuSillyFilter";

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

    this.connectMyDevices();


    setTimeout(()=>$('#wait').remove(), 300);
  };


  private connectMyDevices(){
    this.subtrSynth();
  }





  private coolOne(){
    const coolOne = new TheCoolOscillator();
    coolOne.outTo(this.engine);
  }





  private subtrSynth(){
    let note:Note=null;
    const envFilter=new MidiADSR(.1, .5, .02);
    $(document).on('midi.topNote', (e:any, _note:Note)=>{
      if(_note!=null){
        note=_note;
        envFilter.decay = Calc.mix(.1, 1, note.vel);
        // envFilter.attack = Calc.mix(.1, .0003, Math.random());
      }
    });
    const osc=new MidiNoteOscillator(1, WaveForm.saw),
              envVol=new MidiADSR(.01, .75, .5, .9);
    const filter=new AuBiquadFilter('lowpass', 1000,this.engine.sampleRate,3,6);
    const sillyFilter=new AuSillyFilter();
    const res = AuMidi._.resonance;
    osc.portamento=.0;
    osc
      .outTo(filter)
      // .outTo(sillyFilter)
      .outTo(envVol)
      .outTo(this.engine);

    sillyFilter.beforeOnSample=()=>{
      const vol = note!=null?Calc.mix(.4, 1, note.vel):.8;
      sillyFilter.speed = Calc.mix(.007, .2, envFilter.getNextSample(vol));
    };
    filter.beforeOnSample=()=>{
      const vol = note!=null?Calc.mix(.2, 1, note.vel):.8;
      filter.frequency = Calc.mix(300, 4000, envFilter.getNextSample(vol));
      filter.Q = Calc.mix(1,6, res.nextSmoothed);
    };
  }





  private simpleFm(){
    let fmStrength:AuVolume;
    let osc=new MidiNoteOscillator(3);
    // let osc=new Oscillator(3);

    osc.outTo(fmStrength=new AuVolume(0))
    .outTo(new MidiADSR(.00005, 2.4, .1, .1))
    .fmTo(new MidiNoteOscillator(1))
    .outTo(new MidiADSR(0.001, 2, .5, .3))
    .outTo(new AuVolume(.7))
    .outTo(this.engine);

    const res=AuMidi._.resonance;
    const freq = AuMidi._.cutoff;
    fmStrength.beforeOnSample=()=>{
      fmStrength.volume = res.nextSmoothed*3;
      // osc.frequency=freq.nextSmoothed*200;
      osc.multiplier = Calc.mix(0, 2, freq.nextSmoothed)
    };
  }
}

new Main();


























