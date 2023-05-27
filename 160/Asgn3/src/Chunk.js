class TextureAtlasHandler {
    static resolution = 16;
    static UVs = [];
    static createUVLookups() { //startup
        for (let index = 0; index < (this.resolution * this.resolution); index++) {
            var UV_X_START = ((index) % this.resolution) / this.resolution;
            var UV_Y_START = 1 - ((Math.floor(((index) / this.resolution))) / this.resolution);
            let uv = TextureAtlasHandler.get_texel_coords(UV_X_START,UV_Y_START, this.resolution, this.resolution);
            //console.log(u,v);
            var UV_X_END = UV_X_START + (1 / this.resolution);
            var UV_Y_END = UV_Y_START - (1 / this.resolution);
            TextureAtlasHandler.UVs[index] = [UV_X_START, UV_Y_END, UV_X_END, UV_Y_START];
        }
    }

    static get_texel_coords(x,y, width, height) {
        var u = (x + 0.5) / width
        var v = (y + 0.5) / height
        return [u, v]
    }
  }

class Chunk {
    static dimensionX = 16;
    static dimensionY = 16;
    static dimensionZ = 16;
    static startFrequency = 1.0;
    static octaves = 5;
    static exp = 2.0
    static fudgeFactor = 1.2
    constructor(x, y) {
        this.matrix = new Matrix4();
        this.matrix.translate(x * 16,0,y * 16);
        this.x = x;
        this.y = y;
        this.chunk = null;
        this.vertices = [];
        this.uvs = [];
        this.vertexBuffer = null;
        this.float32ArV = null;
        this.uvBuffer = null;
        this.float32ArUV = null;
        this.indexBuffer = null;
        this.numVerts = 0;
        this.posBuffers = null;
        this.vertBuffers = null;
        this.generateChunk();
    }

    static withinBounds(x,y,z) {
        return (x >= 0 && x < Chunk.dimensionX && y >=0 && y < Chunk.dimensionY && z >=0 && z < Chunk.dimensionZ);
    }

    generateChunk() {
        this.chunk = [];
        for (var x = 0; x < Chunk.dimensionX; x += 1) {
            this.chunk[x] = [];
            for (var y = 0; y < Chunk.dimensionY; y += 1) {
                this.chunk[x][y] = [];
                for (var z = 0; z < Chunk.dimensionZ; z += 1) {
                    let el = 0;
                    let curFreq = Chunk.startFrequency;
                    let divisor = 0;
                    for (let i = 1; i < Chunk.octaves; i++) {
                        divisor += (curFreq / i);
                        el = (curFreq / i ) * noise.simplex2(curFreq * i * x, curFreq * i * z);
                    }
                    el /= divisor;
                    el += 1;
                    el /= 2;
                    el = Math.pow(el * Chunk.fudgeFactor, Chunk.exp);
                    
                    el *= Chunk.dimensionY;
                    el = Math.ceil(el);
                    let ThreeDNoise = noise.simplex3(x,y,z);
                    ThreeDNoise *= (y / (el / 2));

                    let id = -1;
                    if (el - 1 == y) {
                        id = 2;
                    }
                    
                    else if (el > y) {
                        id = 1;
                    }
                    else {
                        id = -1;
                    }

                    if (ThreeDNoise < 0) {
                        id = -1;
                    }
                
                    /*if (Math.random() > 0.5) {
                        id = getRandomInt(100);
                    }*/
                    this.chunk[x][y][z] = new Block(id, x,y,z);
                }
            }
        }
        this.findVisible();
        
        return this.chunk;
    }
    findVisible() {
        this.vertices = [];
        this.uvs = [];
        for (var x = 0; x < Chunk.dimensionX; x++) {
            for (var y = 0; y < Chunk.dimensionY; y++) {
                for (var z = 0; z < Chunk.dimensionZ; z++) {
                    if (this.chunk[x][y][z].is_Visible) {
                        this.getVisibileFaces(x,y,z);
                        //console.log("VUV:", vertUV);
                    }

                }
            }
        }
        this.float32ArV = new Float32Array(this.vertices);
        this.float32ArUV = new Float32Array(this.uvs);
        console.log(this.vertices);
        console.log(this.uvs);
        //console.log("Calls:", numCalls);
    }

    getVisibileFaces(x,y,z) {
        //console.log(x,y,z);
        let block = this.chunk[x][y][z];
        let blockId = block.id;
        let UV_Coords = TextureAtlasHandler.UVs[blockId];
        let UV_X_S = UV_Coords[0];
        let UV_Y_S = UV_Coords[1];
        let UV_X_E = UV_Coords[2];
        let UV_Y_E = UV_Coords[3];
        let addRightFace = false;
        let addLeftFace = false;
        let addTopFace = false;
        let addBottomFace = false;
        let addFrontFace = false;
        let addBackFace = false;
        if (x+1 < Chunk.dimensionX) { //if the right block is within bounds
            var rightBlock = this.chunk[block.rightPos.elements[0]][block.rightPos.elements[1]][block.rightPos.elements[2]]; //get the block
            if (!rightBlock.is_Visible) { //if the block is NOT visible (air)
                addLeftFace = true;
            }
        }
        else{ //if the right block is not in bounds, add our verts
            addLeftFace = true;
        }

        if (x-1 >= 0) {
            var leftBlock = this.chunk[block.leftPos.elements[0]][block.leftPos.elements[1]][block.leftPos.elements[2]];
            if (!leftBlock.is_Visible) {
                addRightFace = true;
            }
        }

        else {
            addRightFace = true;
        }

        if (y+1 < Chunk.dimensionY){ 
            var topBlock = this.chunk[block.topPos.elements[0]][block.topPos.elements[1]][block.topPos.elements[2]];
            if (!topBlock.is_Visible) {
                addTopFace = true;
            }
        }

        else {
            addTopFace = true;
        }

        if (y-1 >= 0) {
            var bottomBlock = this.chunk[block.bottomPos.elements[0]][block.bottomPos.elements[1]][block.bottomPos.elements[2]];
            if (!bottomBlock.is_Visible) {
                addBottomFace = true;
            }
        }

        else {
            addBottomFace = true;
        }

        if (z+1 < Chunk.dimensionZ) {
            var frontBlock = this.chunk[block.frontPos.elements[0]][block.frontPos.elements[1]][block.frontPos.elements[2]];
            if (!frontBlock.is_Visible) {
                addBackFace = true;
            }
        }
        else {
            addBackFace = true;
        }

        if (z-1 >= 0) {
            var backBlock = this.chunk[block.backPos.elements[0]][block.backPos.elements[1]][block.backPos.elements[2]];
            if (!backBlock.is_Visible) {
                addFrontFace = true;
            }
        }
        else {
            addFrontFace = true;
        }

        if (addRightFace) {
            //verts
            pushElements(this.vertices, block.vert4.elements);
            pushElements(this.vertices, block.vert0.elements);
            pushElements(this.vertices, block.vert6.elements);
            pushElements(this.vertices, block.vert6.elements);
            pushElements(this.vertices, block.vert0.elements);
            pushElements(this.vertices, block.vert2.elements);
            //UVs
            pushElements(this.uvs, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E]);
            pushElements(this.uvs, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E]);
        }

        if (addLeftFace) {
            pushElements(this.vertices, block.vert3.elements);
            pushElements(this.vertices, block.vert1.elements);
            pushElements(this.vertices, block.vert7.elements);
            pushElements(this.vertices, block.vert7.elements);
            pushElements(this.vertices, block.vert1.elements);
            pushElements(this.vertices, block.vert5.elements);

            pushElements(this.uvs, [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E]);
            pushElements(this.uvs, [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S]);
        }

        if (addBottomFace) {
            pushElements(this.vertices, block.vert4.elements);
            pushElements(this.vertices, block.vert5.elements);
            pushElements(this.vertices, block.vert0.elements);
            pushElements(this.vertices, block.vert0.elements);
            pushElements(this.vertices, block.vert5.elements);
            pushElements(this.vertices, block.vert1.elements);
            pushElements(this.uvs, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E]);
            pushElements(this.uvs, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E]);
        }

        if (addTopFace) {
            pushElements(this.vertices, block.vert3.elements);
            pushElements(this.vertices, block.vert7.elements);
            pushElements(this.vertices, block.vert2.elements);
            pushElements(this.vertices, block.vert2.elements);
            pushElements(this.vertices, block.vert7.elements);
            pushElements(this.vertices, block.vert6.elements);

            pushElements(this.uvs, [UV_X_E,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_S]);
            pushElements(this.uvs, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_E]);
        }

        if (addFrontFace) {
            pushElements(this.vertices, block.vert0.elements);
            pushElements(this.vertices, block.vert1.elements);
            pushElements(this.vertices, block.vert2.elements);
            pushElements(this.vertices, block.vert2.elements);
            pushElements(this.vertices, block.vert1.elements);
            pushElements(this.vertices, block.vert3.elements);
            //console.log("F:", faces);
            
            pushElements(this.uvs, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E]);
            pushElements(this.uvs, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E]);
        }

        if (addBackFace) {
            pushElements(this.vertices, block.vert7.elements);
            pushElements(this.vertices, block.vert5.elements);
            pushElements(this.vertices, block.vert6.elements);
            pushElements(this.vertices, block.vert6.elements);
            pushElements(this.vertices, block.vert5.elements);
            pushElements(this.vertices, block.vert4.elements);
            //console.log("F:", faces);
        
            pushElements(this.uvs, [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E]);
            pushElements(this.uvs, [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S]);
        }
    }

    getNearbyChunks = function() { //return a list of all chunks to be rendered (surrounding this one), if they don't exist, create them
        let chunksToRender = [];
        for (let offsetX = -1; offsetX <= chunk_load_dist; offsetX++) {
            for (let offsetY = -1; offsetY <= chunk_load_dist; offsetY++) {
                let chunk;
                let t = posToChunkMap.get(tunrPosToString(this.x + offsetX,this.y + offsetY));
                if (t == undefined) {
                    chunk = new Chunk(this.x + offsetX,this.y + offsetY);
                    posToChunkMap.set(tunrPosToString(this.x + offsetX, this.y+offsetY), chunk);
                }
                
                else {
                    chunk = t;
                }
                chunksToRender.push(chunk);
            }
        }

        return chunksToRender;
    }

    renderChunk() {
        if (this.vertexBuffer == null) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
              console.log("Failed to create buffer object");
              return -1;
            }
            console.log("Created vertex buffer");
        }

        if (this.float32ArV == null) {
            this.float32ArV = new Float32Array(this.vertices);
        }

        if (this.float32ArUV == null) {
            this.float32ArUV = new Float32Array(this.uvs);
        }
        gl.uniform1i(u_whichTexture, 0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.float32ArV, gl.DYNAMIC_DRAW);
        //console.log(this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        if (this.uvBuffer == null) {
            this.uvBuffer = gl.createBuffer();
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.float32ArUV, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
        //console.log(this.vertices.length);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }

    mine(x,y,z) {
        let b = this.chunk[x][z][y];
        if (b.is_Visible) {
            chunk[x][z][y] = undefined;
            //console.log(b.id);
            this.findVisible();
            return;
        }
    }

    place(x,y,z, camera, id) {
        let pos = new Vector3([x,y,z]);
        //console.log("POS:",pos.elements);
        let d = new Vector3().set(camera.at).sub(camera.eye);
        d.normalize();
        pos.sub(d);
        let potentialBlock = pos.sub(d);
        //console.log(potentialBlock.elements);
        let potentialX = Math.floor(potentialBlock.elements[0]);
        let potentialY = Math.floor(potentialBlock.elements[1]);
        let potentialZ = Math.floor(potentialBlock.elements[2]);
        if (Chunk.withinBounds(potentialX, potentialY, potentialZ)) {
            //console.log("within!");
            let b = this.chunk[potentialX][potentialY][potentialZ];
            if (!b.is_Visible) {
                b.set_ID(id);
                this.findVisible();
            }
        }
    }

    findHighestBlock(x,z) {
        let surfaceLevel = Chunk.dimensionY - 1;
        let B = this.chunk[x][surfaceLevel][z];
        while (!B.is_Visible) {
            surfaceLevel--;
            if (surfaceLevel < 0) {
                return 0;
            }
            B = this.chunk[x][surfaceLevel][z];
        }

        return surfaceLevel;
    }
    
}

function tunrPosToString(x,y) {
    return "".concat(x).concat(",").concat(y);
}

function pushElements(ar, arToPush) {
    for (let i = 0; i < arToPush.length; i++) {
        ar.push(arToPush[i]);
    }
}