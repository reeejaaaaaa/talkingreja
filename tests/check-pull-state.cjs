'use strict';
const assert=require('node:assert/strict');
require('../pull-state.js');
const Pull=globalThis.CheekPullState;
const pull=new Pull();

// A press alone, unknown pointer, or exactly eight pixels is not a pull.
assert.equal(pull.active,false);
pull.move('missing',50);
assert.equal(pull.active,false);
pull.begin('left','cheek');
assert.equal(pull.active,false);
for(const distance of [0,4,8,NaN,Infinity]){pull.move('left',distance);assert.equal(pull.active,false);}
pull.move('left',8.01);
assert.equal(pull.active,true);

// It remains latched with no movement, after returning to the start, and
// regardless of elapsed time. The state machine deliberately has no clock.
for(let frame=0;frame<10000;frame++)assert.equal(pull.active,true);
pull.move('left',0);
assert.equal(pull.active,true);
pull.release('left');
assert.equal(pull.active,false);

// A nose drag never causes the cheek expression.
pull.begin('nose','nose');
pull.move('nose',999);
assert.equal(pull.active,false);

// Releasing/cancelling one cheek preserves any other held cheek pull.
pull.begin(1,'cheek');pull.begin(2,'cheek');
pull.move(1,40);pull.move(2,30);
pull.release(1);
assert.equal(pull.active,true);
pull.release('nose');
assert.equal(pull.active,true);
pull.release(2);
assert.equal(pull.active,false);
pull.release(2);
assert.equal(pull.active,false);

// A new press reusing a pointer ID resets that pointer's prior latch.
pull.begin(1,'cheek');pull.move(1,12);
assert.equal(pull.active,true);
pull.begin(1,'cheek');
assert.equal(pull.active,false);
pull.move(1,20);
pull.begin(1,'nose');
assert.equal(pull.active,false);

// Blur, Reset, or rotation-mode entry may clear all held input.
pull.begin(1,'cheek');pull.move(1,20);
pull.begin(2,'cheek');pull.move(2,20);
pull.clear();
assert.equal(pull.active,false);
pull.move(1,50);
assert.equal(pull.active,false);
pull.begin(3,'cheek');pull.move(3,12);
assert.equal(pull.active,true);
console.log('Pull state checks passed: cheek-only threshold, held latch, multiple pointers, release/cancel, pointer reuse, clear.');
