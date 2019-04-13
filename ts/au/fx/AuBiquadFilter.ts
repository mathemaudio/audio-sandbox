import {AuNode} from "../AuNode";

export type AuBiquadType="one-pole lp"
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
    this.coefficients = [];
    this.numberOfCascade = 1;
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
    this.setCoefficients([coef.a0, coef.a1, coef.a2, coef.b1, coef.b2], reset);
  }


  /**
   * calculator is taken from here: http://www.earlevel.com/main/2013/10/13/biquad-calculator-v2/
   */
  private calcBiquad(type:AuBiquadType,
             frequency:number, sampleRate:number,
             Q:number, peakGain:number)  : AuBiquadCoefficients {
    let a0,a1,a2,b1,b2,norm;
    let ymin, ymax, minVal, maxVal;

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






































  private coefficients:AuBiquadCoefficients[];
  private numberOfCascade:number;
  private coeffGain:number;
  /**
   * Set biquad filter coefficients
   * @public
   * @param coef Array of biquad coefficients in the following order:
   gain,
   firstBiquad b1,
   firstBiquad b2,
   firstBiquad a1,
   firstBiquad a2,
   //secondBiquad b1,
   //secmondBIquad b2, etc.
   * @param reset force resetting
   */
  setCoefficients(coef:number[], reset:boolean) {
    if (coef) {
      // If there is not a number of biquads, we consider that there is only 1 biquad.
      this.numberOfCascade = this.getNumberOfCascadeFilters(coef);
      // Reset     coefficients
      this.coefficients = [];
      // Global gain
      this.coeffGain = coef[0];
      for (let i = 0; i < this.numberOfCascade; i++) {
        // Four coefficients for each biquad
        this.coefficients[i] = {
          b1: coef[1 + i * 4],
          b2: coef[2 + i * 4],
          a0: 1,
          a1: coef[3 + i * 4],
          a2: coef[4 + i * 4]
        };
      }
      // Need to reset the memories after change the coefficients
      if(reset)
        this.resetMemories();
      return true;
    } else {
      throw new Error("No coefficients are set");
    }
  }

  /**
   * Get the number of cascade filters from the list of coefficients
   * @private
   */
  getNumberOfCascadeFilters(coef:number[]) {    return (coef.length - 1) / 4;  }

  /**
   * Reset memories of biquad filters.
   * @public
   */
  resetMemories() {
    this.memories = [{
      xi1: 0,
      xi2: 0,
      yi1: 0,
      yi2: 0
    }];
    // see http://stackoverflow.com/a/19892144
    for (let i = 1; i < this.numberOfCascade; i++) {
      this.memories[i] = {
        yi1: 0,
        yi2: 0
      };
    }
  }
  memories:MemoryCell[];

  onSample(s: number){
    if(this.onSampleAction!=null)
      return this.onSampleAction(s);
    return s;
  }

  onSampleAction:(s:number)=>number;

  initOnSampleAction(){
    let x:number;
    let y:number[] = [];
    let b1:number, b2:number, a1:number, a2:number;
    let xi1:number, xi2:number, yi1:number, yi2:number, y1i1:number, y1i2:number;
    this.onSampleAction=x=>{
      // Save coefficients in local variables
      b1 = this.coefficients[0].b1;
      b2 = this.coefficients[0].b2;
      a1 = this.coefficients[0].a1;
      a2 = this.coefficients[0].a2;
      // Save memories in local variables
      xi1 = this.memories[0].xi1;
      xi2 = this.memories[0].xi2;
      yi1 = this.memories[0].yi1;
      yi2 = this.memories[0].yi2;

      // Formula: y[n] = x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
      // First biquad
      y[0] = x + b1 * xi1 + b2 * xi2 - a1 * yi1 - a2 * yi2;

      for (let e = 1; e < this.numberOfCascade; e++) {
        // Save coefficients in local variables
        b1 = this.coefficients[e].b1;
        b2 = this.coefficients[e].b2;
        a1 = this.coefficients[e].a1;
        a2 = this.coefficients[e].a2;
        // Save memories in local variables
        y1i1 = this.memories[e - 1].yi1;
        y1i2 = this.memories[e - 1].yi2;
        yi1 = this.memories[e].yi1;
        yi2 = this.memories[e].yi2;

        y[e] = y[e - 1] + b1 * y1i1 + b2 * y1i2 - a1 * yi1 - a2 * yi2;
      }

      // Write the output
      const ret = y[this.numberOfCascade - 1] * this.coeffGain;

      // Update the memories
      this.memories[0].xi2 = this.memories[0].xi1;
      this.memories[0].xi1 = x;

      for (let p = 0; p < this.numberOfCascade; p++) {
        this.memories[p].yi2 = this.memories[p].yi1;
        this.memories[p].yi1 = y[p];
      }
      return ret;
    };
  }

  /**
   * Calculate the output of the cascade of biquad filters for an inputBuffer.
   * @public
   * @param inputBuffer Array of the same length of outputBuffer
   * @param outputBuffer Array of the same length of inputBuffer
   */
  ssssprocesss(inputBuffer:number[], outputBuffer:number[]) {
    let x:number;
    let y:number[] = [];
    let b1:number, b2:number, a1:number, a2:number;
    let xi1:number, xi2:number, yi1:number, yi2:number, y1i1:number, y1i2:number;

    for (let i = 0; i < inputBuffer.length; i++) {
      x = inputBuffer[i];
      // Save coefficients in local variables
      b1 = this.coefficients[0].b1;
      b2 = this.coefficients[0].b2;
      a1 = this.coefficients[0].a1;
      a2 = this.coefficients[0].a2;
      // Save memories in local variables
      xi1 = this.memories[0].xi1;
      xi2 = this.memories[0].xi2;
      yi1 = this.memories[0].yi1;
      yi2 = this.memories[0].yi2;

      // Formula: y[n] = x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
      // First biquad
      y[0] = x + b1 * xi1 + b2 * xi2 - a1 * yi1 - a2 * yi2;

      for (let e = 1; e < this.numberOfCascade; e++) {
        // Save coefficients in local variables
        b1 = this.coefficients[e].b1;
        b2 = this.coefficients[e].b2;
        a1 = this.coefficients[e].a1;
        a2 = this.coefficients[e].a2;
        // Save memories in local variables
        y1i1 = this.memories[e - 1].yi1;
        y1i2 = this.memories[e - 1].yi2;
        yi1 = this.memories[e].yi1;
        yi2 = this.memories[e].yi2;

        y[e] = y[e - 1] + b1 * y1i1 + b2 * y1i2 - a1 * yi1 - a2 * yi2;
      }

      // Write the output
      outputBuffer[i] = y[this.numberOfCascade - 1] * this.coeffGain;

      // Update the memories
      this.memories[0].xi2 = this.memories[0].xi1;
      this.memories[0].xi1 = x;

      for (let p = 0; p < this.numberOfCascade; p++) {
        this.memories[p].yi2 = this.memories[p].yi1;
        this.memories[p].yi1 = y[p];
      }
    }
  }









}