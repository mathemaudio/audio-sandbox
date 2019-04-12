type Value = number;// range 0-1
export class Calc {
  static log(base:number, val:number):number {		return Math.log(val) / Math.log(base);	}
  static mix(a:number, b:number, val:Value):number {		return a * (1 - val) + b * val;	}
  static diff(a:number, b:number):number {		return Math.max(a, b) - Math.min(a, b);	}

  static remix(fromStart:number, fromEnd:number, fromPos:number, toStart:number, toEnd:number):Value {
    return Calc.mix(toStart, toEnd,
      Calc.unmix(fromStart, fromEnd, fromPos)
    );
  }

  /// finds the Value, which is made by pos between a and b:
  static unmix(a:number, b:number, pos:number):Value {
    if (b == a) return a;
    else return 1-( (b - pos) / (b - a) );
  }
  static limit(num:number, min:number, max:number){
    return num>max?max:num<min?min:num;
  }
}