function preload() {
  createVRCanvas();
}

function setup() {
  setVRBackgroundColor(0, 0, 255);
  angleMode(DEGREES);
  noStroke();
}

function draw() {
  const left = getXRInput(LEFT);
  const right = getXRInput(RIGHT);
  
  [left, right].forEach((controller) => {
    // this should be error handled
	  if (controller) {
      // console.log(controller.gamepad)
      // console.log(controller.)
		  push();
      if(controller.trigger && controller.trigger.pressed) {
        fill(255, 255, 0);
      } else if (controller.grip && controller.grip.pressed){
        fill(0,255,255);
      }
      else {
        fill(255);
      }
      translate(controller.position.x, controller.position.y, controller.position.z);
      console.log(controller.rotation.x)
      // rotateX(controller.rotation.x)
      // rotateY()
		  box(0.05);
		  pop();
	  }
  });

  push();
  translate(0, -1, 0);
  rotateX(-90);
  fill(0, 255, 0);
  plane(10, 10);
  pop();
}
