
// HelloTriangle.js (c) 2012 matsuda
// Vertex shader program
class Triangle{
  constructor(){
    this.type="triangle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.adjLength = this.size;
    this.oppLength = this.size;
    this.hypoLength = 0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);
    var d = this.size/200.0
    drawTriangle([xy[0], xy[1], xy[0]+(this.adjLength / 200), xy[1], xy[0], xy[1]+(this.oppLength / 200)]);
  }
}


function drawTriangle(vertices) {
  //console.log(vertices);
  var n = 3;

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create buffer object");
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  /*var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log("Failed to get storage location of a_Position");
    return -1;
  }*/

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0 , 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}