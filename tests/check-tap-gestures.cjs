'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const T=require('../vendor/three.min.js');
require('../laugh-state.js');
require('../pull-state.js');
const appSource=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');

// Exercise the production app event handlers with deterministic time and ray hits.
// Rendering/model geometry are irrelevant to input classification and are stubbed.
function harness(){
 let now=0,frame,controller,hitPart='cheek';
 const nodes=new Map(),windowEvents=new Map();
 function element(dataset={}){return {dataset,style:{},textContent:'',clientWidth:800,clientHeight:600,events:new Map(),
  addEventListener(type,handler){this.events.set(type,handler);},setAttribute(){},remove(){},setPointerCapture(){},
  getBoundingClientRect(){return {left:0,top:0,width:800,height:600};}};}
 for(const id of ['scene','stage','bubble','reaction','loading','rotate','mode-label','reset','download','character-name'])nodes.set('#'+id,element());
 const demos=['press','pull','nose'].map(demo=>element({demo}));
 const characters=['rheza','dudu'].map(character=>element({character}));
 class Renderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}}
 class Raycaster{
  constructor(){this.point=new T.Vector3();this.ray={intersectPlane:(plane,target)=>target.copy(this.point)};}
  setFromCamera(ndc){this.point.set(ndc.x*4,ndc.y*4,1);}
  intersectObject(){return [{point:new T.Vector3(hitPart==='nose'?0:.69,.64-.28,1),face:{normal:new T.Vector3(0,0,1)}}];}
 }
 class Laugh extends CheekLaughController{constructor(options){super(options);controller=this;}}
 class Soft{begin(){}target(){}release(){}releaseAll(){}reset(){}step(){}}
 class Animator{apply(){}reset(){}}
 function createCharacter(){const group=new T.Group(),head=new T.Group(),face=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());head.position.y=.64;group.add(head);head.add(face);return {group,head,face,eyes:[],softMeshes:[],faceZ:()=>1};}
 const context={THREE:{...T,WebGLRenderer:Renderer,Raycaster},
  document:{querySelector:selector=>nodes.get(selector),querySelectorAll:selector=>selector==='[data-demo]'?demos:characters},
  window:{addEventListener:(type,handler)=>windowEvents.set(type,handler)},
  devicePixelRatio:1,performance:{now:()=>now},matchMedia:()=>({matches:true}),
  ResizeObserver:class{observe(){}},requestAnimationFrame:callback=>{frame=callback;},
  MiniRheza:{createCharacter},MiniDudu:{createCharacter},SoftFaceDeformer:Soft,
  FaceLaughAnimator:Animator,FacePullAnimator:Animator,DuduLaughAnimator:Animator,DuduPullAnimator:Animator,
  CheekLaughController:Laugh,CheekPullState,console,setTimeout};
 vm.runInNewContext(appSource,context,{filename:'app.js'});
 const canvas=nodes.get('#scene');
 function dispatch(type,id=1,x=100,y=100){canvas.events.get(type)({type,pointerId:id,clientX:x,clientY:y,preventDefault(){}});}
 return {get laugh(){return controller;},get status(){return nodes.get('#reaction').textContent;},
  down:(id=1,x=100,y=100)=>dispatch('pointerdown',id,x,y),move:(id=1,x=130,y=100)=>dispatch('pointermove',id,x,y),
  up:(id=1,x=100,y=100)=>dispatch('pointerup',id,x,y),cancel:(id=1)=>dispatch('pointercancel',id),lost:(id=1)=>dispatch('lostpointercapture',id),
  tap(id=1){dispatch('pointerdown',id);dispatch('pointerup',id);now+=50;},
  tick(ms){now+=ms;frame(now);},get now(){return now;},
  blur:()=>windowEvents.get('blur')(),demo:type=>demos.find(x=>x.dataset.demo===type).onclick(),
  rotate:()=>nodes.get('#rotate').onclick(),select:id=>characters.find(x=>x.dataset.character===id).events.get('click')(),
  nose(value=true){hitPart=value?'nose':'cheek';}};
}

let checks=0;
function test(name,run){run();checks++;console.log('PASS '+name);}
test('Only release counts; fourth press can remain held without triggering',()=>{
 const h=harness();for(let i=0;i<3;i++)h.tap();assert.equal(h.laugh.count,3);
 h.down();h.tick(3000);assert.equal(h.laugh.count,3);assert.equal(h.laugh.isActive(h.now),false);
 h.up();assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),true);
 assert.equal(h.status,'HAHAHA · LAGI KETAWA');
 h.lost();assert.equal(h.laugh.startTime,h.now,'normal lost capture after up must not change laugh');
});
test('Four actual drags never accumulate pokes or trigger laughter',()=>{
 const h=harness();for(let i=0;i<4;i++){h.down();h.move();h.tick(300);assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),false);h.up(1,130,100);}
 assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),false);
});
test('Three taps followed by drag reset immediately; returning to start stays invalid',()=>{
 const h=harness();for(let i=0;i<3;i++)h.tap();h.down();assert.equal(h.laugh.isActive(h.now),false);
 h.move();assert.equal(h.laugh.count,0);h.move(1,100,100);h.up();assert.equal(h.laugh.count,0);
 for(let i=0;i<3;i++)h.tap();assert.equal(h.laugh.isActive(h.now),false);h.tap();assert.equal(h.laugh.isActive(h.now),true);
});
test('Fast drag ending without a pointermove is not a tap',()=>{
 const h=harness();for(let i=0;i<3;i++)h.tap();h.down();h.up(1,130,100);
 assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),false);
});
test('Small input jitter remains a valid press',()=>{
 const h=harness();h.down();h.move(1,103,102);h.up(1,103,102);assert.equal(h.laugh.count,1);
});
for(const action of ['cancel','lost','blur'])test(action+' clears stack and prevents later release counting',()=>{
 const h=harness();h.tap();h.tap();h.down();h[action]();assert.equal(h.laugh.count,0);h.up();assert.equal(h.laugh.count,0);
});
test('A second finger cannot add pokes while another cheek is being pulled',()=>{
 const h=harness();h.tap();h.tap();h.down(1);h.down(2);h.move(1);assert.equal(h.laugh.count,0);
 h.up(2);assert.equal(h.laugh.count,0);for(let i=0;i<4;i++)h.tap(2);assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),false);
 h.up(1,130,100);h.tap();assert.equal(h.laugh.count,1);
});
test('Pending second finger stays invalid even if dragged finger is released first',()=>{
 const h=harness();h.tap();h.down(1);h.down(2);h.move(1);h.up(1,130,100);h.up(2);
 assert.equal(h.laugh.count,0);assert.equal(h.laugh.gestures.size,0);
});
test('Touches begun during laugh do not count when released after animation ends',()=>{
 const h=harness();for(let i=0;i<4;i++)h.tap();const start=h.laugh.startTime;
 h.down();h.tick(2500);assert.equal(h.laugh.isActive(h.now),false);h.up();assert.equal(h.laugh.count,0);
 assert.equal(start,150);h.tap();assert.equal(h.laugh.count,1);
});
test('Touches already held when another finger starts laugh cannot count afterward',()=>{
 const h=harness();for(let i=0;i<3;i++)h.tap();h.down(1);h.tap(2);
 assert.equal(h.laugh.isActive(h.now),true);h.tick(2500);h.up(1);
 assert.equal(h.laugh.count,0,'a touch spanning the laugh is not a new post-laugh press');
 h.tap();assert.equal(h.laugh.count,1);
});
test('Active laughter does not restart, stop, or queue during repeated taps/pulls',()=>{
 const h=harness();for(let i=0;i<4;i++)h.tap();const start=h.laugh.startTime;
 for(let i=0;i<4;i++)h.tap();h.down();h.move();h.up(1,130,100);
 assert.equal(h.laugh.startTime,start);assert.equal(h.laugh.count,0);assert.equal(h.laugh.isActive(h.now),true);
 h.tick(2500);assert.equal(h.laugh.isActive(h.now),false);assert.equal(h.laugh.count,0);
 for(let i=0;i<3;i++)h.tap();assert.equal(h.laugh.isActive(h.now),false);h.tap();assert.equal(h.laugh.isActive(h.now),true);
});
test('Demo pull clears partial sequence; four new press demos trigger',()=>{
 const h=harness();h.demo('press');h.demo('press');h.demo('press');assert.equal(h.laugh.count,3);
 h.demo('pull');assert.equal(h.laugh.count,0);h.tick(500);assert.equal(h.laugh.isActive(h.now),false);
 for(let i=0;i<3;i++)h.demo('press');assert.equal(h.laugh.isActive(h.now),false);h.demo('press');assert.equal(h.laugh.isActive(h.now),true);
});
test('Nose press, rotate mode, and switching characters break the tap sequence',()=>{
 const h=harness();h.tap();h.nose();h.tap();assert.equal(h.laugh.count,0);h.nose(false);h.tap();h.rotate();assert.equal(h.laugh.count,0);
 h.rotate();h.tap();h.select('dudu');assert.equal(h.laugh.count,0);h.tap();assert.equal(h.laugh.count,1);
});
console.log(`Gesture regression checks passed: ${checks} scenarios through production app handlers.`);
