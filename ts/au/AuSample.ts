export class AuSample {
  public constructor(public l=0, public r=0){

  }
  get c(){ return this.l; }
  set c(val:number){ this.l = this.r = val; }
  rate:number;
}