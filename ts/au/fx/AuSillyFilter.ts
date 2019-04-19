import {AuNode} from "../AuNode";

export class AuSillyFilter extends AuNode{
  constructor(){
    super();
  }
  curr:number=0;
  delta:number=0;
  speed:number=0.03;/// .2 - high freq, .01 - low freq
  processSample(s: number): number{
    // if(s!=0)   debugger;
    const diff = s-this.curr;
    this.delta+= (diff>0?1:-1)*this.speed;
    if(this.delta>0 && diff<0 || this.delta<0 && diff>0)
      this.delta*=(1-(this.speed*1));
    this.curr+=this.delta;
    return this.curr*.3;
  }
}