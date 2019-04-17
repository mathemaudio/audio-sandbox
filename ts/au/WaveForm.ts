import {Calc} from "../tools/Calc";






class Trohoid{
  constructor(){

  }
  auxRadius = .0;
  radiusVal = .3;
  compensate = .9;/// conpensate for radius volume, 0 - none, 1 - full
  targetExact = 88200;
  iterationsTotal = 0;
  funcRude(x:number){  return this.funcRudeAux(x, 1);}
  funcRudeAux(x:number, amountOfAux:number) {
    const radiusVal=this.radiusVal, auxRadius=this.auxRadius;
    let iterationsTotal=this.iterationsTotal, lastI=.0, result=0., exa = 2.;
    const radius = Math.min(1, radiusVal + auxRadius*amountOfAux);
    const Pi2 = Math.PI*2;
    iterationsTotal = 0;
    /// let's just go through some values to find if we have anything:
    //x -= Math.floor(x);
    x -= ~~x;
    const find=(start:number, roughness:number)=>{
      const step = 1 / roughness;
      let i = start, I = .0, X=0;
      while (i < 1) {
        I = i * Pi2;
        X = x * Pi2;
        if (X < I + Math.sin(I) * radius)
          break;
        lastI = i;
        i += step;
        iterationsTotal++;
      }
      return Math.cos(I) * radius/Calc.mix(1, radius*2, this.compensate);
    };
    while (exa <= this.targetExact) {
      result = find(lastI, exa);
      exa *= 5;
    }
    return result;
  }

}


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


const remix=Calc.remix;



export class WaveForm {
  static sine=(phase:number)=>Math.sin(phase*Math.PI*2);
  static square=(phase:number)=>phase<.5?1:-1;
  static triangle=(phase:number)=>
    phase < .25?remix(0,.25, phase, 0, 1):
      phase < .75?remix(.25, .75, phase, 1, -1):
        remix(.75, 1, phase, -1, 0);
  static saw=(phase:number)=> Calc.mix(1, -1, phase);
  static pulse=(phase:number, size:number=.05)=> {
    const sz=size;
    if(phase<sz)return 1;
    if(phase<sz*2)return -1;
    return 0;
  };


  /**
   *
   * @param phase
   * @param fold - 0 means "use triangle", 1 means "use sawtooth"
   */
  static triSawFolded=(phase:number, fold:number)=>{
    const top=(1-fold)*.25;
    const bottom = 1-top;
    return phase < top?remix(0,top, phase, 0, 1):
      phase < bottom?remix(top, bottom, phase, 1, -1):
        remix(bottom, 1, phase, -1, 0);
  };

  static pow=(fn:(phase:number)=>number, phase:number, strength:number)=>{
    let v = Calc.unmix(-1, 1, fn(phase));
    v = Math.pow(v, strength);
    return Calc.mix(-1, 1, v);
  };

  static simplePhaseModulation=(phase:number,
                                secondModulationLevel:number,
                                secondPhaseChanger:number=0)=>{
    // doing it using position modulated wave:
    const s = WaveForm.sine(phase+WaveForm.sine(phase+secondPhaseChanger)*secondModulationLevel);
    return s;
  };



  static trohoid=(phase:number, radius:number)=>{
    // doing it using position modulated wave:
    const tro=WaveForm.tro;
    tro.radiusVal=radius;
    return tro.funcRude(phase);
  };
  private static tro=new Trohoid();
}

