import {AuNode} from "../AuNode";
import {AuEngine} from "../AuEngine";

type N=number;
const fromSec=(sec:number)=>AuEngine._.sec2spl(sec);
const toSec=(spl:number)=>AuEngine._.spl2sec(spl);

enum ADSRStage{
  nothing=-1,
  attack=0,
  decay=1,
  sustain=2,
  release=3,
}

export class ADSR extends AuNode {
  /**
   *
   * @param attack in seconds
   * @param decay in seconds
   * @param sustain value 0 to 1
   * @param release in seconds
   */
  constructor(attack:N=.1, decay:N=.5, sustain:N=.6, release:N=.7){
    super();
    this.attack=attack;
    this.decay=decay;
    this.sustain=sustain;
    this.release=release;
  }
  attack:number;
  decay:number;
  release:number;
  sustain:number;
  private val=0;
  private step=0;
  private stage:ADSRStage=ADSRStage.nothing;
  start=()=>{
    this.position=0;
    this.switchStage(ADSRStage.attack);
  };
  end=()=>{
    this.switchStage(ADSRStage.release);
  };
  processSample(s: number): number{
    if(this.stage!=ADSRStage.nothing)
      this.position++;/// in ADSR case, position means samples past since a note began
    this.val+=this.step;
    const sw=(to:ADSRStage)=>this.switchStage(to);
    switch (this.stage) {
      case ADSRStage.attack: if(this.val>=1){ this.val=1; sw(ADSRStage.decay); } break;
      case ADSRStage.decay:  if(this.val<=this.sustain){ this.val=this.sustain; sw(ADSRStage.sustain);}break;
      case ADSRStage.release:if(this.val<=0){  this.val=0;      sw(ADSRStage.nothing)     }    break;
    }
    return this.val*s;
  }

  private switchStage(newStage:ADSRStage){
    if(this==undefined)
      debugger;
    this.stage=newStage;
    const updateStep=(sec:number, targetVal:number)=>{
      const gap = targetVal - this.val;
      this.step= ((sec==0?1:Math.min(1, 1/this.sampleRate/sec))*gap);
    };
    switch (this.stage) {
      case ADSRStage.attack: updateStep(this.attack, 1);break;
      case ADSRStage.decay: updateStep(this.decay, this.sustain);  break;
      case ADSRStage.sustain: this.step=0;   break;
      case ADSRStage.release: updateStep(this.release, 0); break;
      case ADSRStage.nothing:  this.step=0; break;
    }
  }
}