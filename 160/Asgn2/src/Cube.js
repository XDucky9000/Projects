
// HelloTriangle.js (c) 2012 matsuda
// Vertex shader program
class Cube {
  constructor(){
    this.type = 'cube';
    this.color = [1.0,1.0,1.0,1.0];
    this.matrix = new Matrix4();
    this.children = [];
    this.transformations = [];
    this.movedCoordinates = new Matrix4();
  }

  render(coordSystem) { //take in our parent coordinate system (0,0 if no parent)
    this.matrix.set(coordSystem); //calibrate the coordinate system
    //console.log("Cur coord: ", this.matrix.elements);
    this.movedCoordinates.set(this.matrix); //tell all children to use our coordinate system
    //console.log(this.matrix);
    for (let transformIndex in this.transformations) { //execute our transformations
      let transform = this.transformations[transformIndex];
      let transformationType = transform[0];
        let transformOp = transform[1]
        //console.log("running", transformOp);
        switch(transformationType) {
          case Transform.Scale:
            this.matrix.scale(transformOp[0], transformOp[1], transformOp[2]);
            break;
          case Transform.Rotate: //if it's either a rotate or a translate, update the new coordinate system to
              this.matrix.rotate(transformOp[0], transformOp[1], transformOp[2], transformOp[3]);
              this.movedCoordinates.rotate(transformOp[0], transformOp[1], transformOp[2], transformOp[3]);
              break;
          case Transform.Translate:
              //console.log("before ",this.matrix.elements);
              //console.log(transformOp);
              this.matrix.translate(transformOp[0], transformOp[1], transformOp[2]);
              this.movedCoordinates.translate(transformOp[0], transformOp[1], transformOp[2]);
              //console.log("after ",this.matrix.elements);
              break;
      }
    }
    //console.log(this.matrix);

    var rgba = this.color;
    //var size = this.size;

    //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    //vertex initialization
    //front  
    gl.uniform4f(u_FragColor, rgba[0]*1.0, rgba[1]*1.0, rgba[2]*1.0, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[0]).concat(vertexBufferCube[1]).concat(vertexBufferCube[2]));
    drawTriangle3D([].concat(vertexBufferCube[2]).concat(vertexBufferCube[1]).concat(vertexBufferCube[3]));
    //top
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[4]).concat(vertexBufferCube[0]).concat(vertexBufferCube[6]));
    drawTriangle3D([].concat(vertexBufferCube[6]).concat(vertexBufferCube[0]).concat(vertexBufferCube[2]));
    //back
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[7]).concat(vertexBufferCube[5]).concat(vertexBufferCube[6]));
    drawTriangle3D([].concat(vertexBufferCube[6]).concat(vertexBufferCube[5]).concat(vertexBufferCube[4]));
    //bottom
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[3]).concat(vertexBufferCube[1]).concat(vertexBufferCube[7]));
    drawTriangle3D([].concat(vertexBufferCube[7]).concat(vertexBufferCube[1]).concat(vertexBufferCube[5]));
    //bottom2
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[4]).concat(vertexBufferCube[5]).concat(vertexBufferCube[0]));
    drawTriangle3D([].concat(vertexBufferCube[0]).concat(vertexBufferCube[5]).concat(vertexBufferCube[1]));
    //top 2
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([].concat(vertexBufferCube[3]).concat(vertexBufferCube[7]).concat(vertexBufferCube[2]));
    drawTriangle3D([].concat(vertexBufferCube[2]).concat(vertexBufferCube[7]).concat(vertexBufferCube[6]));
   
    //drawTriangle3D([0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0]);
    //drawTriangle3D([0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0]);

    /*
    gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
    drawTriangle3D([0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 0.0, 1.0]);
    drawTriangle3D([0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 1.0]);

    drawTriangle3D([1.0, 1.0, 0.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0]);
    drawTriangle3D([1.0, 1.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0]);
    
    drawTriangle3D([0.0, 1.0, 0.0,  0.0, 0.0, 1.0,  0.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  0.0, 0.0, 1.0]);
    
    drawTriangle3D([0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 1.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0]);*/

    for (let i = 0; i < this.children.length; i++) { //tell all our children to render, giving them our coordinate system
      var child = this.children[i];
      child.render(this.movedCoordinates);
      //console.log(child);
    }
  }
}
