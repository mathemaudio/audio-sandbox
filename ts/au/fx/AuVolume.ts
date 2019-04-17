import {AuNode} from "../AuNode";

export class AuVolume extends AuNode{
  constructor(public volume:number){
    super();
  }
  processSample(s: number): number{
    return s*this.volume;
  }
}