
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
    this.uvBuffer = null;
    this.float32ArrayU = null;
    this.uvs = null;
    this.float32ArrayN = null;
    this.normals = null;
    this.normalBuffer = null;
    this.normalMatrix = new Matrix4();
    this.generateBuffers();
  }

  generateBuffers() {
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    if (this.float32ArrayV == null) {
      this.vertices = mergeArrays([vertexBufferCube[0].elements, vertexBufferCube[1].elements, vertexBufferCube[2].elements,
                                   vertexBufferCube[2].elements, vertexBufferCube[1].elements, vertexBufferCube[3].elements,
                                   vertexBufferCube[4].elements, vertexBufferCube[0].elements, vertexBufferCube[6].elements,
                                   vertexBufferCube[6].elements, vertexBufferCube[0].elements, vertexBufferCube[2].elements,
                                   vertexBufferCube[7].elements, vertexBufferCube[5].elements, vertexBufferCube[6].elements,
                                   vertexBufferCube[6].elements, vertexBufferCube[5].elements, vertexBufferCube[4].elements,
                                   vertexBufferCube[3].elements, vertexBufferCube[1].elements, vertexBufferCube[7].elements,
                                   vertexBufferCube[7].elements, vertexBufferCube[1].elements, vertexBufferCube[5].elements,
                                   vertexBufferCube[4].elements, vertexBufferCube[5].elements, vertexBufferCube[0].elements,
                                   vertexBufferCube[0].elements, vertexBufferCube[5].elements, vertexBufferCube[1].elements,
                                   vertexBufferCube[3].elements, vertexBufferCube[7].elements, vertexBufferCube[2].elements,
                                   vertexBufferCube[2].elements, vertexBufferCube[7].elements, vertexBufferCube[6].elements]);
      this.float32ArrayV = new Float32Array(this.vertices);
      //console.log(this.vertices);
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

    if (this.normals == null) {
      this.normals = mergeArrays([normalBufferCube[0].elements, normalBufferCube[0].elements, normalBufferCube[0].elements,
                                  normalBufferCube[0].elements, normalBufferCube[0].elements, normalBufferCube[0].elements,
                                  normalBufferCube[2].elements, normalBufferCube[2].elements, normalBufferCube[2].elements,
                                  normalBufferCube[2].elements, normalBufferCube[2].elements, normalBufferCube[2].elements,
                                  normalBufferCube[1].elements, normalBufferCube[1].elements, normalBufferCube[1].elements,
                                  normalBufferCube[1].elements, normalBufferCube[1].elements, normalBufferCube[1].elements,
                                  normalBufferCube[3].elements, normalBufferCube[3].elements, normalBufferCube[3].elements,
                                  normalBufferCube[3].elements, normalBufferCube[3].elements, normalBufferCube[3].elements,
                                  normalBufferCube[4].elements, normalBufferCube[4].elements, normalBufferCube[4].elements,
                                  normalBufferCube[4].elements, normalBufferCube[4].elements, normalBufferCube[4].elements,
                                  normalBufferCube[5].elements, normalBufferCube[5].elements, normalBufferCube[5].elements,
                                  normalBufferCube[5].elements, normalBufferCube[5].elements, normalBufferCube[5].elements
      ]);
      //console.log(this.normals);
      this.float32ArrayN = new Float32Array(this.normals);
      
    }
    

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayV, gl.STATIC_DRAW );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayU, gl.STATIC_DRAW );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayN, gl.STATIC_DRAW );
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
    this.normalMatrix.setInverseOf(this.matrix).transpose();
    //console.log(this.matrix); 
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1i(u_whichTexture, this.textureIndex);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0 , 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

    for (let i = 0; i < this.children.length; i++) { //tell all our children to render, giving them our coordinate system
      var child = this.children[i];
      child.render(this.movedCoordinates);
      //console.log(child);
    }
  }
}
