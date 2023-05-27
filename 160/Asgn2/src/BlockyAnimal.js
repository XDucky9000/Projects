
var stats = new Stats();
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

var POINT = 0;
var TRIANGLE = 1;
var CIRCLE = 2;
let selectedType = POINT;
// HelloPoint1.js (c) 2012 matsuda
// Vertex shader program
var vertexBufferCube = [ //preloaded
  [0.0,0.0,0.0], //0
  [1.0,0.0,0.0], //1
  [0.0,1.0,0.0], //2
  [1.0,1.0,0.0], //3
  [0.0,0.0,1.0], //4
  [1.0,0.0,1.0], //5
  [0.0,1.0,1.0], //6
  [1.0,1.0,1.0] //7
];
var VSHADER_SOURCE = 
  `attribute vec4 a_Position; 
  uniform float u_Size; 
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_Global_RotateMatrix;
  void main() { 
    gl_Position = u_Global_RotateMatrix * u_ModelMatrix * a_Position; // Set the vertex coordinates of the point
  }`
const Transform = {
	Scale: 0,
	Rotate: 1,
	Translate: 2
}
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_Global_RotateMatrix;
let g_globalAngle = [0,0,0];
let redArmPivotAngle = 0;
let blueArmPivotAngle = 0;
let armPivotAngle = 0;
let headPivotAngle = 0;
let eyeTranslate = 0;
var g_startTime = performance.now() / 1000;
var g_seconds;
var animation_running = [true, true, true, false]; //head, block, eyes, special
var jitter = [0.0,0.0];
negativeJitter = true;
// Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor; // Set the point color
  }` 

function main() {
  addActionsForHTMLUI();
  setupWebGL();
  // Initialize shaders
  connectVariablesToGLSL();
  //event handler for click
  canvas.onmousemove = function(ev) { move(ev); };
  canvas.onmousedown = function(ev) { click(ev); };
  //canvas.onmousemove = function(ev) { if (ev.buttons == 1) {click(ev)} };
  // Specify the color for clearing <canvas>
  gl.clearColor(0.8, 1.0, 1.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderScene();
  tick();
}

function tick() {
  stats.begin(); //stats stuff
  var g_seconds = (performance.now() / 1000) - g_startTime;
  //console.log(g_seconds);
  updateAnimationAngles();
  renderScene();
  stats.end();
  requestAnimationFrame(tick);
}

function toggleAnimation(id) {
  console.log("toggling ", id);
  animation_running[id] = !animation_running[id]; //works for everything except the jitter
}

function updateAnimationAngles() {
  if (animation_running[0]) { //head
    headPivotAngle = (5*Math.sin(g_seconds));
  }

  if (animation_running[1]) {
    armPivotAngle = (5*Math.sin(g_seconds));
  }

  if (animation_running[2]) { //eyes
    eyeTranslate = (0.05*Math.sin(g_seconds));
  }

  if (animation_running[3]) {//jitter
    if (Math.random() > 0.5) { //randomally move up and down when jitter is active
      jitter[0] *= -1;
    }

    if (Math.random() > 0.5) {
      jitter[1] *= -1;
    }
  } 
}



function addActionsForHTMLUI() {
  document.getElementById('CameraRotationSliderX').addEventListener('mousemove', function() {g_globalAngle[0] = this.value; renderScene()});
  document.getElementById('CameraRotationSliderY').addEventListener('mousemove', function() {g_globalAngle[1] = this.value; renderScene()});
  document.getElementById('CameraRotationSliderZ').addEventListener('mousemove', function() {g_globalAngle[2] = this.value; renderScene()}); 
  //document.getElementById('RedArmPivotSlider').addEventListener('mousemove', function() {redArmPivotAngle = this.value; renderScene()}); 
  //document.getElementById('BlueArmPivotSlider').addEventListener('mousemove', function() {blueArmPivotAngle = this.value; renderScene()}); 
  document.getElementById('ArmPivotSlider').addEventListener('mousemove', function() {armPivotAngle = this.value; renderScene()}); 
  document.getElementById('HeadPivotSlider').addEventListener('mousemove', function() {headPivotAngle = 5*Math.sin((this.value / 100)); renderScene()}); 
  document.getElementById('EyePivotSlider').addEventListener('mousemove', function() {eyeTranslate = -0.05*Math.sin((this.value / 100)); renderScene()});
}

function setupWebGL() {
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer : true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.GL_DEPTH_BUFFER_BIT);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log("Failed to get position for a_Position");
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  /*if (!u_Size) {
    console.log("Failed to get position for u_Size");
    return;
  }*/
  

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (u_FragColor < 0) {
    console.log("ERROR");
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_modelMatrix");
    return;
  }

  u_Global_RotateMatrix = gl.getUniformLocation(gl.program, 'u_Global_RotateMatrix');
  if (!u_Global_RotateMatrix) {
    console.log("Failed to get the storage location of u_Global_RotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  console.log("initialized successfully");
}


var g_shapesList = [];

function move(ev) { //just grab the x,y, and rotate by that
  //console.log("click!");
  [x,y] = convertCoordinateEventToGL(ev);
  g_globalAngle[0] = y * 180;
  g_globalAngle[1] = -x * 180;
  renderScene();
}

function click(ev) { //activate jitter, deactivate everything else
  if (ev.shiftKey) {
    console.log("shift!\n");
    animation_running[0] = false;
    animation_running[1] = false;
    animation_running[3] = !animation_running[3];
    jitter[0] = 0.005;
    jitter[1] = 0.005;
  }
}


function convertCoordinateEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
  y = (canvas.width/2 - (y-rect.top))/(canvas.width/2);
  return [x,y];
}


function renderScene() {
  g_seconds = (performance.now() / 1000) - g_startTime;
  origin = new Matrix4(); //set origin
  origin.setTranslate(0.0,0.0,0.0);
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
  var globalRotMat = new Matrix4().rotate(g_globalAngle[0],1,0,0); //activate global rotation matrix
  globalRotMat = globalRotMat.rotate(g_globalAngle[1],0,1,0);
  globalRotMat = globalRotMat.rotate(g_globalAngle[2],0,0,1);
  ///console.log(g_globalAngle);
  gl.uniformMatrix4fv(u_Global_RotateMatrix, false, globalRotMat.elements);

  //initialize all the parts
  var body = new Cube();
  var head = new Cube();
  var leftEye = new Cube();
  var leftEyePupil = new Cube();
  var rightEyePupil = new Cube();
  var rightEye = new Cube();
  var leftArm = new Cube();
  var block = new Cube();
  var blockTop = new Cube();
  var rightArm = new Cube();
  var leftLeg = new Cube();
  var rightLeg = new Cube();

  //assign the parts their children (helps keep coordinate systems coherant)
  body.children.push(head);
  body.children.push(leftArm);
  body.children.push(rightArm);
  body.children.push(leftLeg);
  body.children.push(rightLeg);

  head.children.push(leftEye);
  head.children.push(rightEye);

  leftEye.children.push(leftEyePupil);
  rightEye.children.push(rightEyePupil);
  leftArm.children.push(block);

  block.children.push(blockTop);

  //begin transformations, NOTE: ALL TRANSFORMATIONS ARE RELATIVE TO THE PARENT

  //body
  body.color = [0.05,0.05,0.05,1.0];
  body.transformations.push([Transform.Translate, [-0.25,0.0,-0.1]]);
  body.transformations.push([Transform.Translate, [jitter[0], jitter[1], 0]]);
  body.transformations.push([Transform.Scale, [0.4,0.5,0.5]]);

  //head
  head.color = [0.0,0.0,0.0,1.0];
  head.transformations.push([Transform.Translate, [-0.05,0.5,0.0]]);
  head.transformations.push([Transform.Rotate, [headPivotAngle, 0,1,0]]);
  head.transformations.push([Transform.Scale, [0.5,0.5,0.5]]);

  //left eye
  leftEye.color = [1.0,1.0,1.0,1.0];
  leftEye.transformations.push([Transform.Translate, [0.0,0.25,-0.01]]);
  leftEye.transformations.push([Transform.Scale, [0.15,0.1,0.01]]);

  //left eye pupil
  leftEyePupil.color = [1.0,0.0,1.0,1.0];
  leftEyePupil.transformations.push([Transform.Translate, [0.05,0.0,-0.001]]);
  leftEyePupil.transformations.push([Transform.Translate, [-eyeTranslate,0.0,0.0]]);
  leftEyePupil.transformations.push([Transform.Scale, [0.05,0.1,0.01]]);

  //right eye
  rightEye.color = [1.0,1.0,1.0,1.0];
  rightEye.transformations.push([Transform.Translate, [0.35,0.25,-0.01]]);
  rightEye.transformations.push([Transform.Scale, [0.15,0.1,0.01]]);
  
  //right eye pupil
  rightEyePupil.color = [1.0,0.0,1.0,1.0];
  rightEyePupil.transformations.push([Transform.Translate, [0.05,0.0,-0.001]]);
  rightEyePupil.transformations.push([Transform.Translate, [-eyeTranslate,0.0,0.0]]);
  rightEyePupil.transformations.push([Transform.Scale, [0.05,0.1,0.01]]);
  
  //left leg
  leftLeg.color = [0.0,0.0,0.0,1.0];
  leftLeg.transformations.push([Transform.Translate, [0.225,-1.0,0.1875]]);
  leftLeg.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

  //right leg
  rightLeg.color = [0.0,0.0,0.0,1.0];
  rightLeg.transformations.push([Transform.Translate, [0.025,-1.0,0.1875]]);
  rightLeg.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

  //left arm
  leftArm.color = [0.0,0.0,0.0,1.0];
  //leftArm.transformations.push([Transform.Scale, [-1,-1.0,1.0]]);
  leftArm.transformations.push([Transform.Translate, [-0.15,0.5,0.25]]);
  leftArm.transformations.push([Transform.Rotate, [-180,1,0,0]])
  leftArm.transformations.push([Transform.Rotate, [20,1,0,0]])
  leftArm.transformations.push([Transform.Rotate, [armPivotAngle,1,0,0]]);
  leftArm.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

  //right arm
  rightArm.color = [0.0,0.0,0.0,1.0];
  rightArm.transformations.push([Transform.Translate, [0.4,0.5,0.25]]);
  rightArm.transformations.push([Transform.Rotate, [-180,1,0,0]])
  rightArm.transformations.push([Transform.Rotate, [20,1,0,0]])
  rightArm.transformations.push([Transform.Rotate, [armPivotAngle,1,0,0]]);
  rightArm.transformations.push([Transform.Scale, [0.15,1.0,0.15]]);

  //block
  block.color = [0.0,.75,0.0,1.0];
  block.transformations.push([Transform.Translate, [0.35,1,0.25]]);
  block.transformations.push([Transform.Rotate, [270,1,0,0]])
  block.transformations.push([Transform.Rotate, [45,0,0,1]])
  block.transformations.push([Transform.Scale, [0.3,0.3,0.3]]);

  blockTop.color = [0.58,0.3,0.0,1.0];
  blockTop.transformations.push([Transform.Translate, [-0.0,0.0,-0.01]]);
  blockTop.transformations.push([Transform.Scale, [0.3,0.3,0.01]]);
  body.render(origin);

  //TEST
  /*var base = new Cube();
  base.color = [0.0,1.0,0.0,1.0];
  base.transformations.push([Transform.Translate, [-0.25,-1.0,-0.1]]);
  base.transformations.push([Transform.Scale, [0.5,0.25,0.25]]);

  var body = new Cube();
  body.color = [1.0,0.0,0.0,1.0];
  body.transformations.push([Transform.Translate, [0.125, 0.25, 0.0]])
  body.transformations.push([Transform.Rotate, [-redArmPivotAngle,1,0,0]]);
  body.transformations.push([Transform.Scale, [0.25,0.5,0.25]]);
  base.children.push(body);

  var hand = new Cube();
  hand.color = [0.0,0.0,1.0,1.0];
  hand.transformations.push([Transform.Translate, [0.03125, 0.5, 0.0]]);
  hand.transformations.push([Transform.Rotate, [-blueArmPivotAngle,1,0,0]]);
  hand.transformations.push([Transform.Scale, [0.2,0.25,0.5]]);
  body.children.push(hand);
  base.render(origin);


  
  /*var hand = new Cube();
  hand.color = [0.0,0.0,1.0,1.0];
  hand.matrix.translate(-0.1, -0.25, 0.0);
  hand.matrix.rotate(-45,1,0,0);
  hand.matrix.rotate(-blueArmPivotAngle,1,0,0);
  hand.matrix.scale(0.2,0.25,0.5);
  hand.render();*/


  //body.matrix.rotate(-5,0,1,0)
  /*var leftArm = new Cube();
  leftArm.color = [1,1,1,1];
  leftArm.matrix.setTranslate(0.7, 0.0, 0.0);
  leftArm.matrix.rotate(45, 0, 0, 1);
  leftArm.matrix.scale(0.25, 0.7, 0.5);
  leftArm.render();*/
}
