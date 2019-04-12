export class AuSample {
  public constructor(public l=0, public r=0){

  }
  get c(){ return (this.l+this.r)/2; }
  set c(val:number){ this.l = this.r = val; }
}