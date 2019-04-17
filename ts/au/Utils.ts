export class Utils {
  static trig(event:string, param:any){
    $(document).trigger(event, [param]);
  }
  static on(event:string, handler:(param:any)=>void){
    $(document).on(event, (evt:JQueryEventObject, param:any)=>handler(param));
  }
  static dec2bin=(dec:number)=>'0b:'+(dec >>> 0).toString(2).padStart(8, '0');
  static dec2hex=(dec:number)=>'0x:'+(dec >>> 0).toString(16).padStart(2, '0');
  static debugNum=(n:number)=>`${Utils.dec2hex(n)} == ${Utils.dec2bin(n)} == ${n}`;
  static debugNumArray=(ns:number[])=>ns.map(n=>Utils.debugNum(n)).join('\n')+'\n<=======>';

}