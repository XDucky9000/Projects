
class Enderman {
  constructor(coords) {
    this.coords = coords;
    this.randRotation = getRandomInt(180);
    this.origin = new Matrix4();
    this.body = new Cube();
    this.head = new Cube();
    this.leftEye = new Cube();
    this.leftEyePupil = new Cube();
    this.rightEyePupil = new Cube();
    this.rightEye = new Cube();
    this.leftArm = new Cube();
    this.block = new Cube();
    this.blockTop = new Cube();
    this.rightArm = new Cube();
    this.leftLeg = new Cube();
    this.rightLeg = new Cube();

    //assign the parts their children (helps keep coordinate systems coherant)
    this.body.children.push(this.head);
    this.body.children.push(this.leftArm);
    this.body.children.push(this.rightArm);
    this.body.children.push(this.leftLeg);
    this.body.children.push(this.rightLeg);

    this.head.children.push(this.leftEye);
    this.head.children.push(this.rightEye);

    this.leftEye.children.push(this.leftEyePupil);
    this.rightEye.children.push(this.rightEyePupil);
    this.leftArm.children.push(this.block);

    this.block.children.push(this.blockTop);

    //begin transformations, NOTE: ALL TRANSFORMATIONS ARE RELATIVE TO THE PARENT

    //body
    //body.render(origin);
  }
  render() { //take in our parent coordinate system (0,0 if no parent)
    if (animation_running[3]) {
      this.rotateToPlayer();
    }
    this.body.transformations = []
    this.head.transformations = []
    this.leftEye.transformations = []
    this.rightEye.transformations = []
    this.leftEyePupil.transformations = []
    this.rightEyePupil.transformations = []
    this.leftArm.transformations = []
    this.rightArm.transformations = []
    this.leftLeg.transformations = [];
    this.rightLeg.transformations = [];
    this.block.transformations = [];
    this.blockTop.transformations = [];

    this.body.color = [0.05,0.05,0.05,1.0];
    this.body.transformations.push([Transform.Translate, [this.coords[0], this.coords[1], this.coords[2]]]);
    this.body.transformations.push([Transform.Translate, [jitter[0], jitter[1], 0]]);
    this.body.transformations.push([Transform.Rotate, [(this.randRotation * -1) + 90, 0,1,0]]);
    this.body.transformations.push([Transform.Scale, [0.4,0.5,0.5]]);

    //head
    this.head.color = [0.0,0.0,0.0,1.0];
    this.head.transformations.push([Transform.Translate, [-0.05,0.5,0.0]]);
    this.head.transformations.push([Transform.Rotate, [headPivotAngle, 0,1,0]]);
    this.head.transformations.push([Transform.Scale, [0.5,0.5,0.5]]);

    //left eye
    this.leftEye.color = [1.0,1.0,1.0,1.0];
    this.leftEye.transformations.push([Transform.Translate, [0.0,0.25,-0.01]]);
    this.leftEye.transformations.push([Transform.Scale, [0.15,0.1,0.01]]);

    //left eye pupil
    this.leftEyePupil.color = [1.0,0.0,1.0,1.0];
    this.leftEyePupil.transformations.push([Transform.Translate, [0.05,0.0,-0.001]]);
    this.leftEyePupil.transformations.push([Transform.Translate, [-eyeTranslate,0.0,0.0]]);
    this.leftEyePupil.transformations.push([Transform.Scale, [0.05,0.1,0.01]]);

    //right eye
    this.rightEye.color = [1.0,1.0,1.0,1.0];
    this.rightEye.transformations.push([Transform.Translate, [0.35,0.25,-0.01]]);
    this.rightEye.transformations.push([Transform.Scale, [0.15,0.1,0.01]]);
    
    //right eye pupil
    this.rightEyePupil.color = [1.0,0.0,1.0,1.0];
    this.rightEyePupil.transformations.push([Transform.Translate, [0.05,0.0,-0.001]]);
    this.rightEyePupil.transformations.push([Transform.Translate, [-eyeTranslate,0.0,0.0]]);
    this.rightEyePupil.transformations.push([Transform.Scale, [0.05,0.1,0.01]]);
    
    //left leg
    this.leftLeg.color = [0.0,0.0,0.0,1.0];
    this.leftLeg.transformations.push([Transform.Translate, [0.225,-1.0,0.1875]]);
    this.leftLeg.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

    //right leg
    this.rightLeg.color = [0.0,0.0,0.0,1.0];
    this.rightLeg.transformations.push([Transform.Translate, [0.025,-1.0,0.1875]]);
    this.rightLeg.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

    //left arm
    this.leftArm.color = [0.0,0.0,0.0,1.0];
    //leftArm.transformations.push([Transform.Scale, [-1,-1.0,1.0]]);
    this.leftArm.transformations.push([Transform.Translate, [-0.15,0.5,0.25]]);
    this.leftArm.transformations.push([Transform.Rotate, [-180,1,0,0]])
    this.leftArm.transformations.push([Transform.Rotate, [20,1,0,0]])
    this.leftArm.transformations.push([Transform.Rotate, [armPivotAngle,1,0,0]]);
    this.leftArm.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

    //right arm
    this.rightArm.color = [0.0,0.0,0.0,1.0];
    this.rightArm.transformations.push([Transform.Translate, [0.4,0.5,0.25]]);
    this.rightArm.transformations.push([Transform.Rotate, [-180,1,0,0]])
    this.rightArm.transformations.push([Transform.Rotate, [20,1,0,0]])
    this.rightArm.transformations.push([Transform.Rotate, [armPivotAngle,1,0,0]]);
    this.rightArm.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

    //block
    this.block.color = [0.0,.75,0.0,1.0];
    this.block.transformations.push([Transform.Translate, [0.35,1,0.25]]);
    this.block.transformations.push([Transform.Rotate, [270,1,0,0]])
    this.block.transformations.push([Transform.Rotate, [45,0,0,1]])
    this.block.transformations.push([Transform.Scale, [0.3,0.3,0.3]]);

    this.blockTop.color = [0.58,0.3,0.0,1.0];
    this.blockTop.transformations.push([Transform.Translate, [-0.0,0.0,-0.01]]);
    this.blockTop.transformations.push([Transform.Scale, [0.3,0.3,0.01]]);

    this.body.render(this.origin);
  }

  rotateToPlayer() {
    let cam = new Vector3([camera.eye.elements[0], 0, camera.eye.elements[2]]);
    let forward = new Vector3([1,0,0]);
    let pos = new Vector3([this.coords[0], 0, this.coords[2]]);
    let d = pos.sub(cam);
    let dot = Vector3.dot(forward, d);
    //console.log("d:",d.elements);
    let divisor = forward.magnitude() * d.magnitude();
    //console.log("D:",divisor);
    let mult = 1;
    if (d.elements[2] < 0) {
      mult = -1;
    }
    let angleBetween = (dot / (divisor));
   // console.log(angleBetween);
    angleBetween = Math.acos(angleBetween);
    //console.log(angleBetween);  
    angleBetween = radsToDegrees(angleBetween);
    this.randRotation = angleBetween * mult;
    //console.log("AB: ", this.randRotation);
  }
}
