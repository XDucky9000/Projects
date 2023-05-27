class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0,0,10]);
        this.at = new Vector3([0,0,0]);
        this.up = new Vector3([0,1,0]);
        this.currentChunk = null;
        this.loadedChunks = null;
        this.ROTATE_DEGREES = 10;
        this.viewMatrix = new Matrix4();
        this.updateViewMatrix();
        
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(this.fov, canvas.width/canvas.height, 0.1, 10000);

    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(this.eye.elements[0],this.eye.elements[1],this.eye.elements[2], 
            this.at.elements[0],this.at.elements[1],this.at.elements[2], 
            this.up.elements[0],this.up.elements[1],this.up.elements[2]); //eye, at, up
            //console.log(this.viewMatrix);
    }

    moveForward(chunks) {
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
      
        d = d.normalize();  
        this.eye.add(d);
        this.at.add(d);
        this.updateChunk();
        this.updateViewMatrix();
    }
      
    moveBackward(chunks) {
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
      
        d = d.normalize();  
        this.eye.sub(d);
        this.at.sub(d);
        this.updateChunk();
        this.updateViewMatrix();
    }
      
    moveRight(chunks) {
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
        d = d.normalize();
      
        let left = new Vector3([0,0,0]);
        left = Vector3.cross(d, this.up);
      
        this.eye.add(left);
        this.at.add(left);
        this.updateChunk();
        this.updateViewMatrix();
    }
      
    moveLeft(chunks) {
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
        d = d.normalize();
        let left = new Vector3([0,0,0]);
        left = Vector3.cross(d, this.up);
      
        this.eye.sub(left);
        this.at.sub(left);
        this.updateChunk();
        this.updateViewMatrix();
    }

    panLeft(degrees) {
        //console.log("PANNING");
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
        d = d.normalize();

        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(degrees, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        //console.log("rot: ", rotationMatrix.elements);
        let f = new Vector3([0,0,0]);
        f = rotationMatrix.multiplyVector3(d);
        //console.log(f);
        let temp = new Vector3([0,0,0]);
        temp.set(this.eye);
        temp.add(f);
        this.at.set(temp);

        this.updateViewMatrix();
    }

    panRight(degrees) {
        //console.log("at: ", this.at.elements, "eye: ", this.eye.elements);
        let d = new Vector3([0,0,0]);
        d.set(this.at);
        d.sub(this.eye);
        d = d.normalize();
        //console.log("D: ", d.elements);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(degrees * -1, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        //console.log("rot L: ", rotationMatrix.elements);
        let f = new Vector3([0,0,0]);
        f = rotationMatrix.multiplyVector3(d);
        //console.log("F: ", f.elements);
        let temp = new Vector3([0,0,0]);
        temp.set(this.eye);
        temp.add(f);
        this.at.set(temp);
        this.updateViewMatrix();
    }
    
    panUp(degrees) { //this is VERY hacky lol
        //console.log("at: ", this.at, "eye: ", this.eye);
        let hackVec = new Vector3().set(this.at);
        hackVec.add(new Vector3([0, (degrees / 100) * -1, 0]));
        this.at.set(hackVec);
        this.updateViewMatrix();
        //console.log(this.at.elements);
    }

    updateChunk() { //stopgap
        //console.log(posToChunkMap);
        let pos = turnPosToString(Math.floor(this.eye.elements[0] / 16), Math.floor(this.eye.elements[2] / 16)); //x z
        //console.log(pos);
        let C = posToChunkMap.get(pos);
        //console.log(C);
        if (C != null) {
            if (C !== this.currentChunk) {
                //console.log("switching chunk!");
                this.currentChunk = C;
                chunksToRender = this.currentChunk.getNearbyChunks();
            }
        }
        else {
            this.currentChunk = null;
        }
        console.log(this.currentChunk);
        console.log(this.currentChunk.getHeight(Math.floor(this.eye.elements[0] / 16),  Math.floor(this.eye.elements[2] / 16)));
    }

}

//raytrace()
//Input: Camera Obj
//Output: the XYZ coordinate of a VALID BLOCK to be mined
function rayTrace(camera) {
    if (camera.currentChunk != null) {
      var tEye = new Vector3().set(camera.eye);
      let step = new Vector3().set(camera.at).sub(camera.eye).normalize();
      let prevStep = new Vector3().set(tEye);
      console.log("Current position: ", camera.eye.elements);
      console.log("at position: ", camera.at.elements);
      console.log("Step vector: ", step.elements);
      for (var i = 1; i < 10; i++) {
        let tPos = new Vector3().set(tEye.add(step));
        prevStep.set(tEye);
        tEye.set(tPos);
    
        let x = Math.abs(Math.floor(tEye.elements[0] % 16));
        let y = Math.abs(Math.floor(tEye.elements[1] % 16));
        let z = Math.abs(Math.floor(tEye.elements[2] % 16));
        console.log(tEye.elements);
        console.log("Chunk normalized: ", x,y,z);
        if (Chunk.withinBounds(x,y,z)) {
          console.log("XZY:",x,z,y); 
          curChunk = posToChunkMap.get(turnPosToString(Math.floor(tEye.elements[0] / 16), Math.floor(tEye.elements[2] / 16)));
        
          console.log("Chunk: ", curChunk);
          if (curChunk.chunk[x][z][y] != null) {
            console.log(x,y,z, "returned");
            return [x,y,z, curChunk]; 
          }
        }
      }
    }
  
    return [-1,-1,-1];
  }