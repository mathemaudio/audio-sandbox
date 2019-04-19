import {AuNode} from "../AuNode";

export type AuBiquadType=
   "one-pole lp"
  |"one-pole hp"
  |"lowpass"
  |"highpass"
  |"bandpass"
  |"notch"
  |"peak"
  |"lowShelf"
  |"highShelf";


export type AuBiquadCoefficients={
  a0:number,
  a1:number,
  a2:number,
  b1:number,
  b2:number,
}


type MemoryCell={
  xi1?: number,
  xi2?: number,
  yi1: number,
  yi2: number,
}


export class AuBiquadFilter extends AuNode{


  constructor(type:AuBiquadType,
              frequency:number, sampleRate:number,
              Q:number, peakGain:number) {
    super();
    this.initOnSampleAction();
    this.resetMemories();
    this._type=type;
    this._frequency=frequency;
    this._sampleRate=sampleRate;
    this._Q=Q;
    this._peakGain=peakGain;
    this.apply(true);
  }
  get type(){return this._type} set type(t){if(this._type==t)return;this._type=t;this.apply();}  _type:AuBiquadType;
  get frequency(){return this._frequency} set frequency(t){if(this._frequency==t)return;this._frequency=t;this.apply();}  _frequency:number;
  get sampleRate(){return this._sampleRate} set sampleRate(t){if(this._sampleRate==t)return;this._sampleRate=t;this.apply();}  _sampleRate:number;
  get Q(){return this._Q} set Q(t){if(this._Q==t)return;this._Q=t;this.apply();}  _Q:number;
  get peakGain(){return this._peakGain} set peakGain(t){if(this._peakGain==t)return;this._peakGain=t;this.apply();}  _peakGain:number;


  appliedTimes=0;
  apply(reset=false){
    this.appliedTimes++;
    const p=this;
    const coef = this.calcBiquad(p.type, p.frequency, p.sampleRate, p.Q, p.peakGain);
    this.setCoefficients(coef, reset);
  }


  /**
   * calculator is taken from here: http://www.earlevel.com/main/2013/10/13/biquad-calculator-v2/
   */
  private calcBiquad(type:AuBiquadType,
             frequency:number, sampleRate:number,
             Q:number, peakGain:number)  : AuBiquadCoefficients {
    let a0:number,a1:number,a2:number,b1:number,b2:number,norm:number;

    let V = Math.pow(10, Math.abs(peakGain) / 20);
    let K = Math.tan(Math.PI * frequency / sampleRate);
    switch (type) {
      case "one-pole lp":
        b1 = Math.exp(-2.0 * Math.PI * (frequency / sampleRate));
        a0 = 1.0 - b1;
        b1 = -b1;
        a1 = a2 = b2 = 0;
        break;

      case "one-pole hp":
        b1 = -Math.exp(-2.0 * Math.PI * (0.5 - frequency / sampleRate));
        a0 = 1.0 + b1;
        b1 = -b1;
        a1 = a2 = b2 = 0;
        break;

      case "lowpass":
        norm = 1 / (1 + K / Q + K * K);
        a0 = K * K * norm;
        a1 = 2 * a0;
        a2 = a0;
        b1 = 2 * (K * K - 1) * norm;
        b2 = (1 - K / Q + K * K) * norm;
        break;

      case "highpass":
        norm = 1 / (1 + K / Q + K * K);
        a0 = 1 * norm;
        a1 = -2 * a0;
        a2 = a0;
        b1 = 2 * (K * K - 1) * norm;
        b2 = (1 - K / Q + K * K) * norm;
        break;

      case "bandpass":
        norm = 1 / (1 + K / Q + K * K);
        a0 = K / Q * norm;
        a1 = 0;
        a2 = -a0;
        b1 = 2 * (K * K - 1) * norm;
        b2 = (1 - K / Q + K * K) * norm;
        break;

      case "notch":
        norm = 1 / (1 + K / Q + K * K);
        a0 = (1 + K * K) * norm;
        a1 = 2 * (K * K - 1) * norm;
        a2 = a0;
        b1 = a1;
        b2 = (1 - K / Q + K * K) * norm;
        break;

      case "peak":
        if (peakGain >= 0) {
          norm = 1 / (1 + 1/Q * K + K * K);
          a0 = (1 + V/Q * K + K * K) * norm;
          a1 = 2 * (K * K - 1) * norm;
          a2 = (1 - V/Q * K + K * K) * norm;
          b1 = a1;
          b2 = (1 - 1/Q * K + K * K) * norm;
        }
        else {
          norm = 1 / (1 + V/Q * K + K * K);
          a0 = (1 + 1/Q * K + K * K) * norm;
          a1 = 2 * (K * K - 1) * norm;
          a2 = (1 - 1/Q * K + K * K) * norm;
          b1 = a1;
          b2 = (1 - V/Q * K + K * K) * norm;
        }
        break;
      case "lowShelf":
        if (peakGain >= 0) {
          norm = 1 / (1 + Math.SQRT2 * K + K * K);
          a0 = (1 + Math.sqrt(2*V) * K + V * K * K) * norm;
          a1 = 2 * (V * K * K - 1) * norm;
          a2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm;
          b1 = 2 * (K * K - 1) * norm;
          b2 = (1 - Math.SQRT2 * K + K * K) * norm;
        }
        else {
          norm = 1 / (1 + Math.sqrt(2*V) * K + V * K * K);
          a0 = (1 + Math.SQRT2 * K + K * K) * norm;
          a1 = 2 * (K * K - 1) * norm;
          a2 = (1 - Math.SQRT2 * K + K * K) * norm;
          b1 = 2 * (V * K * K - 1) * norm;
          b2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm;
        }
        break;
      case "highShelf":
        if (peakGain >= 0) {
          norm = 1 / (1 + Math.SQRT2 * K + K * K);
          a0 = (V + Math.sqrt(2*V) * K + K * K) * norm;
          a1 = 2 * (K * K - V) * norm;
          a2 = (V - Math.sqrt(2*V) * K + K * K) * norm;
          b1 = 2 * (K * K - 1) * norm;
          b2 = (1 - Math.SQRT2 * K + K * K) * norm;
        }
        else {
          norm = 1 / (V + Math.sqrt(2*V) * K + K * K);
          a0 = (1 + Math.SQRT2 * K + K * K) * norm;
          a1 = 2 * (K * K - 1) * norm;
          a2 = (1 - Math.SQRT2 * K + K * K) * norm;
          b1 = 2 * (K * K - V) * norm;
          b2 = (V - Math.sqrt(2*V) * K + K * K) * norm;
        }
        break;
    }
    // let coefsList = "a0 = " + a0 + "\n";
    // coefsList += "a1 = " + a1 + "\n";
    // coefsList += "a2 = " + a2 + "\n";
    // coefsList += "b1 = " + b1 + "\n";
    // coefsList += "b2 = " + b2;
    return {      a0,      a1,      a2,      b1,      b2,    };
  }






































  private coefficients:AuBiquadCoefficients;
  /**
   * Set biquad filter coefficients
   * @public
   * @param coef Object of biquad coefficients
   * @param reset force resetting
   */
  setCoefficients(coef:AuBiquadCoefficients, reset:boolean) {
    if (coef) {
      // Global gain
        // Four coefficients for each biquad
      /// either in calculator, or in filter -these values were mixed up! Let's leave it like it is now:
      this.coefficients = {
        b1: coef.a1,
        b2: coef.a2,
        a0: coef.a0,
        a1: coef.b1,
        a2: coef.b2
      };
      // Need to reset the memories after change the coefficients
      if(reset)
        this.resetMemories();
      return true;
    } else {
      throw new Error("No coefficients are set");
    }
  }


  /**
   * Reset memories of biquad filters.
   * @public
   */
  resetMemories() {
    const mem = this.memories;
    mem.xi1 = mem.xi2 = mem.yi1 = mem.yi2 = 0;
  }
  memories:MemoryCell = {    xi1: 0,    xi2: 0,    yi1: 0,    yi2: 0  };

  processSample(s: number){
    if(this.onSampleAction!=null)
      return this.onSampleAction(s);
    return s;
  }

  onSampleAction:(s:number)=>number;

  initOnSampleAction(){
    let y:number;
    const mem=this.memories;
    this.onSampleAction=x=>{
      const coef=this.coefficients;

      // Formula: y[n] = x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
      y = x
        + coef.b1 * mem.xi1
        + coef.b2 * mem.xi2
        - coef.a1 * mem.yi1
        - coef.a2 * mem.yi2;


      // Update the memories
      mem.xi2 = mem.xi1;      mem.xi1 = x;

      mem.yi2 = mem.yi1;      mem.yi1 = y;

      return y * coef.a0;
    };
  }



}