'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const name of ['check-tap-gestures','check-laugh-state','check-pull-state','check-laugh-face','check-pull-face']){
 const result=spawnSync(process.execPath,[path.join(__dirname,name+'.cjs')],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
