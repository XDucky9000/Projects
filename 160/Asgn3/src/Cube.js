
class Cube {
  static TextureAtlasHandler;
  constructor(){
    this.type = 'cube';
    this.color = [1.0,1.0,1.0,1.0];
    this.matrix = new Matrix4();
    this.children = [];
    this.transformations = [];
    this.movedCoordinates = new Matrix4();
    this.textureIndex = -2;
    this.vertexBuffer = null;
    this.float32ArrayV = null
    this.vertices = null;
    this.float32ArrayN = null;
    this.normals = null;
    this.normalBuffer = null;
    this.uvs = null;
    this.uvBuffer = null;
    this.float32ArrayU = null;
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

    if (this.vertices == null) {
      this.vertices = mergeArrays([vertexBufferCube[0].elements, vertexBufferCube[1].elements, vertexBufferCube[2].elements, //front
                                   vertexBufferCube[2].elements, vertexBufferCube[1].elements, vertexBufferCube[3].elements, //front
                                   vertexBufferCube[4].elements, vertexBufferCube[0].elements, vertexBufferCube[6].elements, //left
                                   vertexBufferCube[6].elements, vertexBufferCube[0].elements, vertexBufferCube[2].elements, //left
                                   vertexBufferCube[7].elements, vertexBufferCube[5].elements, vertexBufferCube[6].elements, //back
                                   vertexBufferCube[6].elements, vertexBufferCube[5].elements, vertexBufferCube[4].elements, //back
                                   vertexBufferCube[3].elements, vertexBufferCube[1].elements, vertexBufferCube[7].elements, //right
                                   vertexBufferCube[7].elements, vertexBufferCube[1].elements, vertexBufferCube[5].elements, //right 
                                   vertexBufferCube[4].elements, vertexBufferCube[5].elements, vertexBufferCube[0].elements, //bottom
                                   vertexBufferCube[0].elements, vertexBufferCube[5].elements, vertexBufferCube[1].elements, //bottom
                                   vertexBufferCube[3].elements, vertexBufferCube[7].elements, vertexBufferCube[2].elements, //top
                                   vertexBufferCube[2].elements, vertexBufferCube[7].elements, vertexBufferCube[6].elements  //top
                                  ]); 
      this.float32ArrayV = new Float32Array(this.vertices);
    }

    if (this.normals == null) {
      this.normals = mergeArrays([normalBufferCube[0].elements, normalBufferCube[2].elements, normalBufferCube[1].elements, normalBufferCube[3].elements, normalBufferCube[4].elements, normalBufferCube[5].elements]);
    }
    

    if (this.uvs == null) {
      this.uvs = mergeArrays([[UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E], 
                              [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E, UV_Y_E], 
                              [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E],
                              [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E],
                              [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E],
                              [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S],
                              [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E],
                              [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S],
                              [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E],
                              [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E],
                              [UV_X_E,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_S],
                              [UV_X_S,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_E]]);
      this.float32ArrayU = new Float32Array(this.uvs);
    }

    if (this.vertexBuffer == null) {
      this.vertexBuffer = gl.createBuffer();
    }

    if (this.uvBuffer == null) {
      this.uvBuffer = gl.createBuffer();
    }

    if (this.normalBuffer == null) {
      this.normals = gl.createBuffer();
    }
    //console.log(this.matrix); 

    var rgba = this.color;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayV, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0 , 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayU, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayN, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform1i(u_whichTexture, this.textureIndex);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

    for (let i = 0; i < this.children.length; i++) { //tell all our children to render, giving them our coordinate system
      var child = this.children[i];
      child.render(this.movedCoordinates);
      //console.log(child);
    }
  }
}
