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
let sphere;
var testLightPos = [0,3000.0,0];
let testSpotlightPos = [-10,18,0];
let testSpotlightAt = [1,1,0];
let spotlightCutoff = 0.5; //30 degrees
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

var normalBufferCube = [
  new Vector3([0.0, 0.0, -1.0]), // Face 0: (0, 1, 3, 2) - Front
  new Vector3([0.0, 0.0, 1.0]),  // Face 1: (5, 4, 6, 7) - Back
  new Vector3([-1.0, 0.0, 0.0]), // Face 2: (4, 0, 2, 6) - Left
  new Vector3([1.0, 0.0, 0.0]),  // Face 3: (1, 5, 7, 3) - Right
  new Vector3([0.0, -1.0, 0.0]), // Face 4: (4, 5, 1, 0) - Bottom
  new Vector3([0.0, 1.0, 0.0])   // Face 5: (2, 3, 7, 6) - Top
];


var VSHADER_SOURCE = 
  `attribute vec4 a_Position; 
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position; // Set the vertex coordinates of the point
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal,1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`
  // Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_spotLightPos;
  uniform int u_lightOn;
  uniform int u_spotLightOn;
  uniform vec3 u_cameraPos;
  uniform float u_cutoff;
  uniform vec3 u_spot_at;
  uniform int u_viewNormals;
  varying vec4 v_VertPos;
  uniform vec3 u_color;
  void main() {
    if (u_whichTexture == -3) {
      //gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
    }
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    }

    else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler, v_UV);
    }

    else {
      gl_FragColor = vec4(u_FragColor);
    }

    if (u_viewNormals == 1) {
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
    }
    vec3 color = vec3(gl_FragColor) * u_color;
    if (u_lightOn == 1) {
      vec3 lightVector = u_lightPos - vec3(v_VertPos);
      float r = length(lightVector);
  
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N,L), 0.0);
      
      vec3 R = reflect(-L,N);
  
      vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

      vec3 specular = u_color *pow(max(dot(E,R),0.0),200.0) * (10.0 / r);

      vec3 diffuse = vec3(color) * nDotL * (10.0 / r);
      vec3 ambient = vec3(gl_FragColor) * 0.005;
      gl_FragColor = vec4(diffuse + ambient + specular, 1.0);

    }
 
    if (u_spotLightOn == 1) {
      vec3 L = normalize(u_spotLightPos - vec3(v_VertPos));
      vec3 S = normalize(vec3(-u_spot_at));  
   
      // inside the cone?
      if (dot(S,L) > u_cutoff) {
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(N,L), 0.0);
   
          if (nDotL > 0.0) {
              vec3 diffuse = vec3(color) + vec3(color * nDotL);
              gl_FragColor = vec4(diffuse, 1.0);
          }
      }
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
let a_Normal;
let u_FragColor;
let u_NormalMatrix;
let u_Size;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler;
let u_whichTexture;
let u_lightPos;
let u_spotLightPos;
let u_lightOn;
let u_spotLightOn;
let u_cutoff;
let u_spot_at;
let u_viewNormals;
let viewNormals = 0;
let lightOn = 0;
let spotLightOn = 0;
let u_cameraPos;
let u_color;
let lightColor;
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
let lightTransform = [];
negativeJitter = true;
let origin = new Matrix4(); //set origin

function toggleLight() {
  if (lightOn == 0) {
    lightOn = 1;
  }

  else {
    lightOn = 0;
  }

}

function toggleSpotLight() {
  if (spotLightOn == 0) {
    spotLightOn = 1;
  }

  else {
    spotLightOn = 0;
  }

}

function toggleNormals() {
  console.log("normals");
  if (viewNormals == 0) {
    viewNormals = 1;
  }

  else {
    viewNormals = 0;
  }

}

function main() {
  lightColor = [0,0,0];
  document.getElementById('LightColorSliderX').addEventListener('mousemove', function() {lightColor[0] = parseInt(this.value); renderScene()});
  document.getElementById('LightColorSliderY').addEventListener('mousemove', function() {lightColor[1] = parseInt(this.value); renderScene()});
  document.getElementById('LightColorSliderZ').addEventListener('mousemove', function() {lightColor[2] = parseInt(this.value); renderScene()}); 
  document.getElementById('LightSliderX').addEventListener('mousemove', function() {lightTransform[0] = parseInt(this.value) / 20; renderScene()});
  document.getElementById('LightSliderY').addEventListener('mousemove', function() {lightTransform[1] = parseInt(this.value) / 20; renderScene()});
  document.getElementById('LightSliderZ').addEventListener('mousemove', function() {lightTransform[2] = parseInt(this.value) / 20; renderScene()}); 
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
  sphere = new Sphere();
  sphere.transformations.push([Transform.Translate, [-5.0,18.0,-0.01]]);
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
  testLightPos = [Math.sin(g_seconds / 10) * 50000, Math.cos(g_seconds / 19) * 50000, 0];

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

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log("Failed to get position for a_Normal");
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

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_NormalMatrix");
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

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightPos");
    return;
  }

  u_spotLightPos = gl.getUniformLocation(gl.program, 'u_spotLightPos');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_spotLightPos");
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightOn");
    return;
  }

  u_spotLightOn = gl.getUniformLocation(gl.program, 'u_spotLightOn');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_spotLightOn");
    return;
  }
  
  u_cutoff = gl.getUniformLocation(gl.program, 'u_cutoff');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_cutoff");
    return;
  }

  u_spot_at = gl.getUniformLocation(gl.program, 'u_spot_at');
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_spot_at");
    return;
  }
  u_viewNormals = gl.getUniformLocation(gl.program, 'u_viewNormals');
  if (!u_viewNormals) {
    console.log("Failed to get the storage location of u_viewNormals");
    return;
  }
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log("Failed to get the storage location of u_cameraPos");
    return;
  }

  u_color = gl.getUniformLocation(gl.program, 'u_color');
  if (!u_color) {
    console.log("Failed to get the storage location of u_color");
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
  gl.uniform3f(u_color, lightColor[0] / 255, lightColor[1] / 255, lightColor[2] / 255);
  gl.uniform1i(u_viewNormals, viewNormals);
  gl.uniform1i(u_lightOn, lightOn);
  gl.uniform1i(u_spotLightOn, spotLightOn);
  gl.uniform3f(u_spotLightPos, testSpotlightPos[0], testSpotlightPos[1], testSpotlightPos[2]);
  gl.uniform1i(u_spotLightOn, spotLightOn);
  gl.uniform1f(u_cutoff, spotlightCutoff);
  gl.uniform3f(u_spot_at, testSpotlightAt[0], testSpotlightAt[1], testSpotlightAt[2]);
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


  sphere.render(origin);

  gl.uniform3f(u_lightPos, camera.eye.elements[0] - 1 + lightTransform[0], camera.eye.elements[1]+ lightTransform[1], camera.eye.elements[2]+ lightTransform[2]);
  gl.uniform3f(u_cameraPos, camera.eye.elements[0],camera.eye.elements[1],camera.eye.elements[2]);
  //console.log(camera.eye.elements[0],camera.eye.elements[1],camera.eye.elements[2]);
  let light = new Cube();
  light.textureNum = 3;
  light.transformations.push([Transform.Translate, [camera.eye.elements[0] - 1 + lightTransform[0], camera.eye.elements[1]+ lightTransform[1],  camera.eye.elements[2]+ lightTransform[2]]]);
  light.transformations.push([Transform.Scale, [-1,-1,-1]]);
  light.color = [1.0, 1.0, 0.0, 1.0];
  light.color = [1,1,0];
  light.u_whichTexture = -3;
  light.render(origin);

  let spotLight = new Cube();
  spotLight.color = [1.0, 0.0, 0.0, 1.0];
  spotLight.textureNum = -3;
  spotLight.transformations.push([Transform.Translate, [testSpotlightPos[0], testSpotlightPos[1], testSpotlightPos[2]]]);
  spotLight.transformations.push([Transform.Scale, [2,2,2]]);
  spotLight.render(origin);
}

