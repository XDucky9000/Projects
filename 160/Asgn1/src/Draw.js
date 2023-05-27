var POINT = 0;
var TRIANGLE = 1;
var CIRCLE = 2;
let selectedType = POINT;
// HelloPoint1.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = 
  `attribute vec4 a_Position; 
  uniform float u_Size; 
  void main() { 
    gl_Position = a_Position; // Set the vertex coordinates of the point
    gl_PointSize = u_Size;                     // Set the point size
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
// Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor; // Set the point color
  }` 

function main() {
  setupWebGL();
  // Initialize shaders
  connectVariablesToGLSL();
  //event handler for click
  canvas.onmousedown = function(ev) { click(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) {click(ev)} };
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

}

function setupWebGL() {
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer : true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
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
  if (!u_Size) {
    console.log("Failed to get position for u_Size");
    return;
  }
  

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (u_FragColor < 0) {
    console.log("ERROR");
    return;
  }
}


var g_shapesList = [];

function click(ev) {
  [x,y] = convertCoordinateEventToGL(ev);
  [rVal, gVal, bVal, size, segments, oppLength, adjLength, hypoLength] = getDataFromUIElements();

  let point;
  if (selectedType == POINT) {
    point = new Point();
  }

  else if (selectedType == TRIANGLE) {
    point = new Triangle();
    console.log(hypoLength);
    if (hypoLength != 0) {
      console.log("h set");
      point.adjLength = adjLength;
      point.oppLength = oppLength;
      point.hypoLength = hypoLength;
    }

  }

  else {
    point = new Circle();
    point.segments = segments;
  }

  point.position = [x,y];
  point.color = [rVal, gVal, bVal, 1.0];
  point.size = size;
  g_shapesList.push(point);

  gl.clear(gl.COLOR_BUFFER_BIT);

  renderAllShapes();
}

function drawPicture() {
  ClearCanvas();
  TriBuffer = 
   [
    [[-20,0], [255,165,0], [40, 60]],
    [[20,60], [255,165,0], [-40, -60]],
    [[-16,60], [255,255,0], [-4, -10]],
    [[-16,60], [255,255,0], [4, -10]],
    [[-8,60], [255,255,0], [-4, -10]],
    [[-8,60], [255,255,0], [4, -10]],
    [[0,60], [255,255,0], [-4, -10]],
    [[0,60], [255,255,0], [4, -10]],
    [[8,60], [255,255,0], [-4, -10]],
    [[8,60], [255,255,0], [4, -10]],
    [[16,60], [255,255,0], [-4, -10]],
    [[16,60], [255,255,0], [4, -10]],
    [[-12,60], [128,128,128],[-8,10]],
    [[12, 60], [128,128,128],[-24,10]],
    [[-12, 70], [128,128,128],[24,-10]],
    [[12,60], [128,128,128],[8,10]],
    [[-12,60], [128,128,128],[24,60]],
    [[12,120], [128,128,128],[-24,-60]],
    [[0,120], [255,0,0],[12,20]],
    [[0,120], [255,0,0],[-12,20]]
  ];

  TriBuffer.forEach(function(tri) {
    let point = new Triangle();
    point.position = [tri[0][0] / 200, tri[0][1] / 200];
    point.color = [tri[1][0] / 255, tri[1][1] / 255, tri[1][2] / 255, 1];
    point.adjLength = tri[2][0];
    point.oppLength = tri[2][1];
    //console.log(point.position, point.color, point.adjLength, point.oppLength);
    g_shapesList.push(point);
  });
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();


}
function getDataFromUIElements() {
  let rVal = (redSlider.value / 255);
  let gVal = (greenSlider.value / 255);
  let bVal = (blueSlider.value / 255);
  let size = shapeSizeSlider.value;
  let segments = circleSegmentSlider.value;
  let oppLength = triOppBox.value;
  let adjLength = triAdjBox.value;
  let hypoLength = triHypoBox.value;
  return [rVal, gVal, bVal, size, segments, oppLength, adjLength, hypoLength];
}
function convertCoordinateEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
  y = (canvas.width/2 - (y-rect.top))/(canvas.width/2);
  return [x,y];
}


function renderAllShapes() {
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    let p = g_shapesList[i];
    p.render();
  }
}

function ClearCanvas() {
  g_shapesList = [];
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
}

function setMode(mode) {
  switch (mode) {
    case 0:
      selectedType = POINT;
      //document.getElementById("shapeSizeDiv").style.display = 'block';
      document.getElementById("circleDiv").style.display = 'none';
      document.getElementById("triInfo").style.display = 'none';
      break;
    case 1:
      selectedType = TRIANGLE;
      //document.getElementById("shapeSizeDiv").style.display = 'none';
      document.getElementById("triInfo").style.display = 'block';
      break;
    case 2:
      selectedType = CIRCLE;
      //document.getElementById("shapeSizeDiv").style.display = "block";
      document.getElementById("triInfo").style.display = 'none';
      document.getElementById("circleDiv").style.display = 'block';
      break;
  }

}

function updateTriBoxes() {
  let hypoBox = document.getElementById("triHypoBox");
  let adjBox = document.getElementById("triAdjBox");
  let oppBox = document.getElementById("triOppBox");

  if (oppBox.value != "" && adjBox.value != "") {
    hypoBox.value = Math.sqrt(Math.pow(adjBox.value, 2) + Math.pow(oppBox.value, 2));
  }
}