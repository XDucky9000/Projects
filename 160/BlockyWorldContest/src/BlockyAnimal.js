//TOOD:
//Lighting 
//Collision
//BlockPlacer2.0 (USE UNITS)
//Store chunks to disk when not in use
//Fix textures
var num_textures = 256;
var BUFFER_SIZE = 65535;
var stats = new Stats();
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
let UV_X_S = [0,0];
let UV_Y_S = [0,1];
let UV_X_E = [1,0];
let UV_Y_E = [1,1];
var POINT = 0;
var TRIANGLE = 1;
var CIRCLE = 2;
var posToChunkMap = new Map();
var vertexBufferCube = [ //preloaded
  new Vector3([0.0,0.0,0.0]), //0
  new Vector3([1.0,0.0,0.0]), //1
  new Vector3([0.0,1.0,0.0]), //2
  new Vector3([1.0,1.0,0.0]), //3
  new Vector3([0.0,0.0,1.0]), //4
  new Vector3([1.0,0.0,1.0]), //5
  new Vector3([0.0,1.0,1.0]), //6
  new Vector3([1.0,1.0,1.0]) //7
];

var VSHADER_SOURCE = 
  `attribute vec4 a_Position; 
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position; // Set the vertex coordinates of the point
    v_UV = a_UV;
  }`
  // Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  varying vec2 v_UV;
  uniform int u_whichTexture;
  void main() {

    if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    }

    else {
      gl_FragColor = texture2D(u_Sampler, v_UV);
    }

  }` 
const Transform = {
	Scale: 0,
	Rotate: 1,
	Translate: 2
}
let chunksToRender = [];
let Endermen = [];
let chunks = [];
let chunk_load_dist = 6;
let canvas;
let camera;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler;
let u_whichTexture;
let armPivotAngle = 0;
let headPivotAngle = 0;
let eyeTranslate = 0;
var g_startTime = performance.now() / 1000;
var g_seconds;
var animation_running = [true, true, true, false]; //head, block, eyes, special
var jitter = [0.0,0.0];
let lastX = 0;
let lastY = 0;
let heightSeed = getRandomInt(20000);
let caveSeed = getRandomInt(20000);
negativeJitter = true;
let origin = new Matrix4(); //set origin


function main() {
  origin.setTranslate(0.0,0.0,0.0);
  noise.seed(heightSeed);
  setupWebGL();
  // Initialize shaders
  connectVariablesToGLSL();
  camera = new Camera();
  //event handler for click
  canvas.addEventListener("click", async function(event) {
    if (document.pointerLockElement === canvas) {
      //console.log("Click!");
      let returned = rayTrace(camera); //x, y, z Chunk
      let pos = [returned[0], returned[1], returned[2]]; //xyz
      let chunk = returned[3];
      if (pos[0] != -1) {
        if (event.shiftKey) {
          chunk.mine(pos[0],pos[1],pos[2]); //xyz
          animation_running[3] = true;
        }

        else {
          chunk.place(pos[0],pos[1],pos[2], camera, 1); //xyz
        }

      }
    }
    await canvas.requestPointerLock();
    //console.log("locked");
  });

  document.addEventListener("mousemove", function(event) {
    if (document.pointerLockElement === canvas) {
      //console.log("LOCKED");
      var movementX = event.movementX;
      var movementY = event.movementY;
      //console.log(movementX, movementY);

      camera.panLeft(movementX * -1);
      camera.panUp(movementY);
      renderScene();
    }
  });
  document.onkeydown = keydown;
  //canvas.onmousemove = function(ev) { if (ev.buttons == 1) {click(ev)} };
  // Specify the color for clearing <canvas>
  gl.clearColor(0.8, 1.0, 1.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  TextureAtlasHandler.createUVLookups();
  generateStartingChunks();
  placeEndermen(20);
  renderScene();
  tick();
}

function keydown(ev) {
  if (ev.keyCode == 38) { //up arrow
    camera.moveForward(chunks);
  }

  else if (ev.keyCode == 40) { //down arrow
    camera.moveBackward(chunks);
  }

  else if (ev.keyCode == 39) { //right arrow
    camera.moveRight(chunks);
  }

  else if (ev.keyCode == 37) { //left arrow
    camera.moveLeft(chunks);
  }

  else if (ev.keyCode == 81) { //q
    camera.panLeft(camera.ROTATE_DEGREES);
  }

  else if (ev.keyCode == 69) { //e
    camera.panRight(camera.ROTATE_DEGREES);
  }

  else if (ev.keyCode == 87) { //w
    camera.panUp(camera.ROTATE_DEGREES);
  }

  else if (ev.keyCode == 83) { //s
    camera.panUp(camera.ROTATE_DEGREES * -1);
  }
}

//generateStartingChunks()
//Input: N/A
//Output: N/A
//Function: Creates the first chunk at 0,0, tells it to render all chunks in render distance
function generateStartingChunks() {
  let mainChunk = new Chunk(0,0);
  posToChunkMap.set(turnPosToString(0,0), mainChunk); //add to thePosToChunkMap
  chunksToRender = mainChunk.getNearbyChunks();
}

//tick()
//Input: N/A
//Output: N/A
//Function: Tick function for animation and scene rendering
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
    /*if (Math.random() > 0.5) { //randomally move up and down when jitter is active
      jitter[0] *= -1;
    }

    if (Math.random() > 0.5) {
      jitter[1] *= -1;
    }*/
    //console.log("Running!\n");
  } 
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
  console.log("webGL intitalized");
}

//connectVariablesToGLSL()
//Input: N/A
//Output: N/A
//Function: Connects a lot of variables to their GPU positions
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

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log("Failed to get position for a_UV");
    return;
  }

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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return;
  }

  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log("Failed to get the storage location of u_Sampler");
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
  initTextures(gl, 1);
  console.log("initialized successfully");
}

function initTextures() {
  var image = new Image();
  if (!image) {
    console.log("Failed to create image object");
    return false;
  }

  image.onload = function() { sendImageToTEXTURE0(image)};
  image.src = 'atlas.jpg';
  console.log("Loading texture ", image.src);
  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler, 0);
}

//placeEndermen()
//Input: n (number of endermen to place)
//Output: none
//Function: Creates an enderman at a random position within render distance (x,z) and the y position of the first air block at that (x,z) point, then pushes it to the endermen list
function placeEndermen(n) {
  for (i = 0; i < n; i++) {
    let randX = getRandomInt(16); //x 
    let randZ = getRandomInt(16); //z
    let randChunk = chunksToRender[getRandomInt(chunksToRender.length)]; //get random chunk
    let randY = randChunk.findHighestBlock(randX, randZ)+2; //get the highest air block + 2 (because the endermen is 2 blocks tall)
    var e = new Enderman([randX + (16 * randChunk.x),randY, randZ + (16 * randChunk.y)]); //create the enderman
    Endermen.push(e); //push
  }
}

//renderScene():
//Input: N/A
//Output: N/A
//Function: Renders scene by activating relevant matrices in the GPU, rendering the chunks, and finally rendering mobs
function renderScene() {
  g_seconds = (performance.now() / 1000) - g_startTime;
  
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements); //set matrices in GPU
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  for (let i = 0; i < chunksToRender.length; i++) {
    //console.log(chunksToRender[i]);
    chunksToRender[i].renderChunk(); //go through chunksToRender and call render
  }

  for (let i = 0; i < Endermen.length; i++) {
    Endermen[i].render(); //do the same for the endermen
  }
}

