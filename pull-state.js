(function(root){
'use strict';

// A cheek pull latches until its pointer is released; idle time cannot clear it.
class CheekPullState {
 constructor(){this.pointers=new Map();}
 begin(id,part){this.pointers.set(id,{part,pulled:false});}
 move(id,distancePx){
  const pointer=this.pointers.get(id);
  if(pointer&&pointer.part==='cheek'&&Number.isFinite(distancePx)&&distancePx>8)pointer.pulled=true;
 }
 release(id){this.pointers.delete(id);}
 clear(){this.pointers.clear();}
 get active(){
  for(const pointer of this.pointers.values())if(pointer.pulled)return true;
  return false;
 }
}

root.CheekPullState=CheekPullState;
})(globalThis);
