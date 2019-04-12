/**
 * A basic audio node
 */
export abstract class AuNode {
  abstract process(buffer:AudioBuffer):void;
  sampleRate:number;
  child:AuNode=null;
  parent:AuNode=null;
  outTo(child:AuNode){
    this.child=child;
    child.parent=this;
  }
  toStr():string{ return 'AuNode'; }
}
