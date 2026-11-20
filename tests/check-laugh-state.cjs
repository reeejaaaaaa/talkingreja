'use strict';
const assert=require('node:assert/strict');
require('../laugh-state.js');
const Laugh=globalThis.CheekLaughController;

// Any four distinct pokes count: no hidden speed/timing requirement.
const laugh=new Laugh();
assert.equal(laugh.poke(0),false);
assert.equal(laugh.poke(4000),false);
assert.equal(laugh.poke(9000),false);
assert.equal(laugh.count,3);
assert.equal(laugh.poke(10000),true);
assert.equal(laugh.startTime,10000);
assert.equal(laugh.count,0);
assert.equal(laugh.progress(11200),.5);

// Rapid additional groups of four neither restart the clock nor queue a laugh.
for(let now=11201;now<11221;now++)assert.equal(laugh.poke(now),false);
assert.equal(laugh.startTime,10000);
assert.equal(laugh.count,0);
assert.equal(laugh.isActive(12399),true);
assert.equal(laugh.poke(12399.9),false);
assert.equal(laugh.isActive(12400),false);
assert.equal(laugh.count,0);
assert.equal(laugh.startTime,null);
assert.equal(laugh.progress(12401),0);

// Only four new pokes after completion can trigger the next animation.
assert.equal(laugh.poke(12401),false);
assert.equal(laugh.poke(12402),false);
assert.equal(laugh.poke(12403),false);
assert.equal(laugh.poke(12404),true);
assert.equal(laugh.startTime,12404);
assert.equal(laugh.poke(12405),false);

// The exact end timestamp is the first eligible poke, even without frame update.
const boundary=new Laugh({durationMs:100});
for(let i=0;i<3;i++)assert.equal(boundary.poke(0),false);
assert.equal(boundary.poke(0),true);
assert.equal(boundary.isActive(0),true);
assert.equal(boundary.poke(100),false);
assert.equal(boundary.count,1);
assert.equal(boundary.startTime,null);
assert.equal(boundary.poke(101),false);
assert.equal(boundary.poke(102),false);
assert.equal(boundary.poke(103),true);
assert.equal(boundary.progress(153),.5);

// Explicit reset clears both an in-flight laugh and a partial poke count.
boundary.reset();
assert.equal(boundary.isActive(154),false);
assert.equal(boundary.count,0);
assert.equal(boundary.poke(155),false);
boundary.reset();
assert.equal(boundary.count,0);
for(let i=0;i<3;i++)assert.equal(boundary.poke(160+i),false);
assert.equal(boundary.poke(163),true);
assert.equal(boundary.update(263),false);
assert.equal(boundary.progress(264),0);

console.log('Laugh state checks passed: four-poke trigger, ignored active input, exact boundary, repeated cycles, reset.');
