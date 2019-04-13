import {Calc} from "../tools/Calc";

export class AuSmoother {
  constructor(public inputFn:()=>number, public strength:number=.0006){
    this.currVal=this.inputFn();
  }
  private currVal:number;
  get nextSmoothed(){
    return this.currVal = Calc.mix(this.currVal, this.inputFn(), this.strength);
  }
  get nextSmoothedRound(){ return Math.round(this.nextSmoothed*1000)/1000; }
}