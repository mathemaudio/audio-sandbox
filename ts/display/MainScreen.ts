import SystemRenderer = PIXI.SystemRenderer;
import Container = PIXI.Container;
import {DispGraph} from "./DispGraph";
import {AuEngine} from "../au/AuEngine";
import Graphics = PIXI.Graphics;

export class MainScreen {
  renderer:SystemRenderer;
  stage:Container;
  size:{w:number, h:number};
  signalOutput:DispGraph;
  skipRender=false;
  changed=false;
  get engine(){ return AuEngine._;}
  constructor(){
    const sz = this.size={
      w:Math.round(window.innerWidth*.8),
      h:Math.round(window.innerHeight*.8)};
    this.renderer = PIXI.autoDetectRenderer(sz.w, sz.h);
    document.body.appendChild(this.renderer.view);
    this.stage=new Container();
    this.stage.interactive=true;
    // this.addLine();
    this.reqNext();
    this.stage.addChild(this.signalOutput = new DispGraph({w:sz.w, h:sz.h*.35}));
  }
  animate=()=>{
    if(this.skipRender)return;
    this.changed = false;
    this.changed = this.changed || this.signalOutput.drawFrame();
    if (this.changed){
      this.renderer.render(this.stage);
      // console.log('rendered');
    }
    this.reqNext();
  };
  reqNext=()=>  requestAnimationFrame(this.animate);
  // addLine(){
  //   var g = new Graphics();
  //   g.lineStyle(2, 0x00ff00, 1);
  //   g.moveTo(0, 1);
  //   g.lineTo(111, 111);
  //   g.lineTo(77, 3);
  //   this.stage.addChild(g);
  // }

}