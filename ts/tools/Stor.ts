/**
 * Created by dev on 01.12.2017.
 */
export class Stor{
  static can=()=> (typeof(Storage) !== "undefined");

  static has=(key:string)=>{
    console.log('stor.has '+key+' => '+(Stor.get(key)!=null));
    return Stor.get(key)!=null;
  };

  static get=(key:string)=>  {
    console.log('stor.get '+key+' => '+JSON.parse(localStorage.getItem(key)));
    return JSON.parse(localStorage.getItem(key));
  };
  static set=(key:string, val:any)=>{
    console.log('stor.set '+key+' => '+val);
    return localStorage.setItem(key, JSON.stringify(val));
  };
}