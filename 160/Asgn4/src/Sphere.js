
class Sphere {
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
    this.generateBuffers();
  }

  generateBuffers() {
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    var d = Math.PI / 10;
    var dd = Math.PI / 10;
    var v = [];
    var uv = [];
    for (var t = 0; t < Math.PI; t += d) {
      for (var r = 0; r < (2*Math.PI); r += d) {
        var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
        //console.log(p1);
        var p2 = [Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
        var p3 = [Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
        var p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];
        v = v.concat(p1).concat(p2).concat(p4).concat(p1).concat(p4).concat(p3);
        var uv1 = [t/Math.PI,r/(2*Math.PI)];
        var uv2 = [(t+dd)/Math.PI,r/(2*Math.PI)];
        var uv3 = [t/Math.PI,(r+dd)/(2*Math.PI)];
        var uv4 = [(t+dd)/Math.PI,(r+dd)/(2*Math.PI)]
        uv = uv.concat([uv1]).concat(uv2).concat(uv4).concat(uv1).concat(uv2).concat(uv3);
      }
    }
    this.vertices = v;
    this.uvs = uv;;
    this.normals = v;

    this.float32ArrayV = new Float32Array(this.vertices);
    this.float32ArrayU = new Float32Array(this.uvs);
    this.float32ArrayN = new Float32Array(this.normals);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayV, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayU, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.float32ArrayN, gl.STATIC_DRAW);
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
    gl.uniform1i(u_whichTexture, -3);
    
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

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

    for (let i = 0; i < this.children.length; i++) { //tell all our children to render, giving them our coordinate system
      var child = this.children[i];
      child.render(this.movedCoordinates);
      //console.log(child);
    }
  }
}
