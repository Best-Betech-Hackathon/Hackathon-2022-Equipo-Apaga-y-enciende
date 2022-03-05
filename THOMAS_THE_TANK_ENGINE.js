importScripts('lib/tank.js');

var turnTime;

function shootEnemy(state, control) {
  let enemy = state.radar.enemy;
  if(!enemy) {
    //control.GUN_TURN = 0.3
    //control.SHOOT = 0.1;
    return;
  }

  // predict position of moving target
  let bulletSpeed = 4;
  let distance = Math.distance(state.x, state.y, enemy.x, enemy.y)
  let bulletTime = distance / bulletSpeed;
  let targetX = enemy.x + bulletTime * enemy.speed * Math.cos(Math.deg2rad(enemy.angle));
  let targetY = enemy.y + bulletTime * enemy.speed * Math.sin(Math.deg2rad(enemy.angle));

  // calculate desired direction of the gun
  let targetAngle = Math.deg.atan2(targetY - state.y, targetX - state.x);
  let gunAngle = Math.deg.normalize(targetAngle - state.angle);

  // point the gun at the target
  let angleDiff = Math.deg.normalize(gunAngle - state.gun.angle);
  control.GUN_TURN = 0.3 * angleDiff;

  // shoot when aiming at target
  if(Math.abs(angleDiff) < 1) {
   // if (distance > 150)
     // control.SHOOT = 0.3;
     control.SHOOT = 1;
  }
}

function scanEnemy(state, control) {
  if(!state.radar.enemy) {
    // scan around for the enemy
    control.RADAR_TURN = 1;
  } else {
    //keep the enemy in the middle of radar beam
    let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
    let radarAngle = Math.deg.normalize(targetAngle - state.angle);
    let angleDiff = Math.deg.normalize(radarAngle - state.radar.angle);
    control.RADAR_TURN = angleDiff;
  }
}

function followEnemy(state, control) {
  if(!state.radar.enemy) {
    return;
  }
  
  control.DEBUG = state.radar.enemy;

  let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
  let bodyAngleDiff = Math.deg.normalize(targetAngle - state.angle);
  control.TURN = 0.5 * bodyAngleDiff;

  let targetDistance = Math.distance(state.x, state.y, state.radar.enemy.x, state.radar.enemy.y);
  let distanceDiff = targetDistance - 150;
  
  control.THROTTLE = 1;
  //control.BOOST = 1;
  
  control.DEBUG = control.THROTTLE;
}

function flee(state, control){
  control.TURN = 1;
	control.THROTTLE = -1;
  control.BOOST = 1;
}

function exploreBattlefiield(state, control) {
  if(state.radar.enemy) {
    let targetDistance = Math.distance(state.x, state.y, state.radar.enemy.x, state.radar.enemy.y);
    if (!state.radar.targetingAlarm ){
    	control.BOOST = (targetDistance>100);
    }
    else flee(state, control);
    control.DEBUG = state.boost;
    return;
  }

  if(state.collisions.wall || turnTime > 0 || state.radar.enemy) {
    control.THROTTLE = 0;
  } else {
    control.THROTTLE = 1;
  }

  if(state.collisions.wall) {
    // start turning when hitting a wall
    turnTime = 10;
  }

  // keep turning whenever turn timer is above zero
  // reduce the timer with each step of the simulation
  if(turnTime > 0) {
    control.TURN = 1;
    turnTime--;
  } else {
    control.TURN = 0;
  }
}

tank.init(function(settings, info) {
  // do not turn at the beginning
turnTime = 0;
  settings.SKIN = 'ocean';
});

tank.loop(function(state, control) {
  shootEnemy(state, control);
  scanEnemy(state, control);
  followEnemy(state, control);
  exploreBattlefiield(state, control);
});
