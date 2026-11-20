(function(root){
'use strict';

// One laugh owns its full duration. Input during that duration is discarded.
class CheekLaughController {
 constructor({durationMs=2400}={}) {
  if(!Number.isFinite(durationMs)||durationMs<=0)throw new RangeError('durationMs must be positive');
  this.durationMs=durationMs;
  this.reset();
 }
 reset() {
  this.count=0;
  this.startTime=null;
  this.gestures=new Map();
 }
 update(now) {
  if(this.startTime!==null&&now-this.startTime>=this.durationMs){this.count=0;this.startTime=null;}
  return this.startTime!==null;
 }
 // A press is provisional until release: it may still become a cheek pull.
 beginGesture(id,part,now) {
  if(part!=='cheek')this.breakSequence();
  this.gestures.set(id,{part,dragged:false,eligible:part==='cheek'&&!this.update(now)&&!this.hasPull});
 }
 moveGesture(id,distancePx) {
  const gesture=this.gestures.get(id);
  if(gesture&&gesture.part==='cheek'&&Number.isFinite(distancePx)&&distancePx>8&&!gesture.dragged){
   gesture.dragged=true;
   this.breakSequence();
  }
 }
 finishGesture(id,now,cancelled=false) {
  const gesture=this.gestures.get(id);
  if(!gesture)return false;
  this.gestures.delete(id);
  if(cancelled){this.breakSequence();return false;}
  return gesture.eligible&&!gesture.dragged&&!this.hasPull&&!this.update(now);
 }
 get hasPull(){return [...this.gestures.values()].some(gesture=>gesture.dragged);}
 breakSequence() {
  this.count=0;
  for(const gesture of this.gestures.values())gesture.eligible=false;
 }
 clearGestures(){this.breakSequence();this.gestures.clear();}
 poke(now) {
  if(this.update(now)||this.hasPull)return false;
  this.count++;
  if(this.count<4)return false;
  this.breakSequence();
  this.startTime=now;
  return true;
 }
 isActive(now) {
  return this.update(now);
 }
 progress(now) {
  if(!this.update(now))return 0;
  return Math.max(0,Math.min(1,(now-this.startTime)/this.durationMs));
 }
}

root.CheekLaughController=CheekLaughController;
})(globalThis);
