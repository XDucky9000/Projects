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
    static dimensionY = 32;
    static dimensionZ = 16;
	static persistance = 0.5;
	static octaves = 5;
	static seaLevel = 0.6;
	static lacunarity = 2.5;
    static exp = 2.0
    static fudgeFactor = 1.0;
    static scale = 250;
    static seaLevel = 8;
    constructor(x, y) {
        this.matrix = new Matrix4();
        this.matrix.translate((x * 16),0,(y * 16));
        this.x = x;
        this.y = y;
        this.chunk = null;
        this.vertices = [];
        this.uvs = [];
        this.vertexBuffer = null;
        this.float32ArV = new Float32Array(65535);
        this.float32ArUV = new Float32Array(65535);
        this.float32ArN = new Float32Array(65535);
        this.uvBuffer = null;
        this.normalBuffer = null;
        this.indexBuffer = null;
        this.numVerts = 0;
        this.numUVs = 0;
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
            for (var z = 0; z < Chunk.dimensionZ; z += 1) {
                noise.seed(heightSeed);
                this.chunk[x][z] = [];
                let height = this.getHeight(x,z);
                for (let y = 0; y < (Chunk.dimensionY); y += 1) {
                    if (x == 0 && z == 0) {
                        this.chunk[x][z][y] = new Block(255, x,y,z);
                        continue;
                    }

                    if (y > height) {
                        //console.log(x,z,y, "above height!");
                        this.chunk[x][z][y] = null;
                        continue;
                    }
                    let sampleX = (x + (this.x * 16)) / Chunk.scale;
                    let sampleZ = (z + (this.y * 16)) / Chunk.scale;
                    let sampleY = (y) / Chunk.scale;
                    let curAmp = 1.0;
                    let frequency = 1.0;
                    let density = 0.0
                    for (let i = 0; i < Chunk.octaves; i++) {
                        let simplexVal = noise.simplex3(sampleX * frequency, sampleY * frequency, sampleZ * frequency);
                        simplexVal = (simplexVal) * curAmp;
                        
                        density += simplexVal;
                        
                        curAmp *= Chunk.persistance;
                        frequency *= Chunk.lacunarity;
                    }
                    let id = -1;
                    let distanceFromHeight = Math.abs(y - Chunk.dimensionY); //higher values HURT density
                    density += 1;
                    density /= 2;   
                    if (density < 0) {
                        density = Math.max(density, 0.01);
                    }
                    density *= distanceFromHeight;


                    if (density >  0.0) {
                        id = y;
                    }

            
                    this.chunk[x][z][y] = new Block(id, x,y,z);
                    //this.carveCaves(x,y,z, height);
                }
            }
        }
        this.findVisible();
        
        return this.chunk;
    }
    findVisible() {
        this.float32ArV = new Float32Array(BUFFER_SIZE);
        this.float32ArUV = new Float32Array(BUFFER_SIZE);
        this.float32ArN = new Float32Array(BUFFER_SIZE);
        this.numVerts = 0;
        this.numUVs = 0;
        for (var x = 0; x < Chunk.dimensionX; x++) {
            for (var z = 0; z < Chunk.dimensionZ; z++) {
                for (var y = 0; y < Chunk.dimensionY; y++) {
                    if (this.chunk[x][z][y] != null) {
                        this.getVisibileFaces(x,z,y);
                    }
                }
            }
        }
        if (this.vertexBuffer == null) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
              console.log("Failed to create buffer object");
              return -1;
            }
        }

        if (this.uvBuffer == null) {
            this.uvBuffer = gl.createBuffer();
        }

        if (this.normalBuffer == null) {
            this.normalBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.float32ArV, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.float32ArUV, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.float32ArN, gl.STATIC_DRAW);
    }

    getVisibileFaces(x,z,y) {
        //console.log(x,z,y);
        let block = this.chunk[x][z][y];
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

        var leftBlock = this.getBlock(x+1,z,y);
        var rightBlock = this.getBlock(x-1,z,y);
        var topBlock = this.getBlock(x,z,y+1);
        var bottomBlock = this.getBlock(x,z,y-1);
        var backBlock = this.getBlock(x,z+1,y);
        var frontBlock = this.getBlock(x,z-1,y);
        if (rightBlock != null) { //if the right block is within bounds
            if (!rightBlock.is_Visible) { //if the block is NOT visible (air)
                addRightFace = true;
            }
        }
        else{ //if the right block is not in bounds, add our verts
            addRightFace = true;
        }

        if (leftBlock != null) {
            if (!leftBlock.is_Visible) {
                addLeftFace = true;
            }
        }
        else {
            addLeftFace = true;
        }

        if (topBlock != null){ 
            if (!topBlock.is_Visible) {
                addTopFace = true;
            }
        }
        else {
            addTopFace = true;
        }

        if (bottomBlock != null) {
            if (!bottomBlock.is_Visible) {
                addBottomFace = true;
            }
            
        }
        else {
            addBottomFace = true;
        }

        if (frontBlock != null) {
            if (!frontBlock.is_Visible) {
                addFrontFace = true;
            }
        }
        else {
            addFrontFace = true;
        }

        if (backBlock != null) {
            if (!backBlock.is_Visible) {
                addBackFace = true;
            }
        }
        else {
            addBackFace = true;
        }

        if (addRightFace) {
            //verts
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert4, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert0, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert6, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert6, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert0, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[2].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert2, this.numVerts);

            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E], this.numUVs);
        }

        if (addLeftFace) {
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert3, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert1, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert7, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert7, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert1, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[3].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert5, this.numVerts);


            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S], this.numUVs);

        }

        if (addBottomFace) {
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert4, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert5, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert0, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert0, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert5, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[4].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert1, this.numVerts);

            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E], this.numUVs);
        }

        if (addTopFace) {
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert3, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert7, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert2, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert2, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert7, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[5].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert6, this.numVerts);

            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_E,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_S], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_E, UV_X_S,UV_Y_E], this.numUVs);
        }

        if (addFrontFace) {
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert0, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert1, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert2, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert2, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert1, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[0].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert3, this.numVerts);

            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_S, UV_X_E,UV_Y_S, UV_X_S,UV_Y_E], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_E, UV_X_E,UV_Y_S, UV_X_E,UV_Y_E], this.numUVs);
        }

        if (addBackFace) {
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert7, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert5, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert6, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert6, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert5, this.numVerts);
            pushElements_Float_32(this.float32ArN, normalBufferCube[1].elements, this.numVerts);
            this.numVerts = pushElements_Float_32(this.float32ArV, block.vert4, this.numVerts);

            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_S,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_E], this.numUVs);
            this.numUVs = pushElements_Float_32(this.float32ArUV, [UV_X_E,UV_Y_E, UV_X_S,UV_Y_S, UV_X_E,UV_Y_S], this.numUVs);
        }
        
    }

    getNearbyChunks = function() { //return a list of all chunks to be rendered (surrounding this one), if they don't exist, create them
        let newChunksGenerated = false;
        let chunksToRender = [];
        for (let offsetX = -1 * chunk_load_dist; offsetX <= chunk_load_dist; offsetX++) {
            for (let offsetY = -1 * chunk_load_dist; offsetY <= chunk_load_dist; offsetY++) {
                let chunk;
                let t = posToChunkMap.get(turnPosToString(this.x + offsetX,this.y + offsetY));
                if (t == null) {
                    chunk = new Chunk(this.x + offsetX,this.y + offsetY);
                    posToChunkMap.set(turnPosToString(this.x+offsetX, this.y+offsetY), chunk);
                    newChunksGenerated = true;
                }
                
                else {
                    chunk = t;
                }
                chunksToRender.push(chunk);
            }
        }

        if (newChunksGenerated) {
            this.findVisible();
        }


        return chunksToRender;
    }

    renderChunk() {

        gl.uniform1i(u_whichTexture, 0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        //console.log(this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
        //console.log(this.vertices.length);
        gl.drawArrays(gl.TRIANGLES, 0, this.numVerts / 3);
    }

    mine(x,y,z) { //xyz
        console.log("Mining ", x,z,y);
        let b = this.chunk[x][z][y]; //XZY
        console.log(b);
        if (b != null) {
            this.chunk[x][z][y] = null;
            //console.log(b.id);
            //this.findVisible();
            this.updateNearbyChunks(1);
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
        console.log(potentialBlock.elements);
        let potentialX = Math.floor(potentialBlock.elements[0]);
        let potentialY = Math.floor(potentialBlock.elements[1]);
        let potentialZ = Math.floor(potentialBlock.elements[2]);
        if (Chunk.withinBounds(potentialX, potentialY, potentialZ)) {
            //console.log("within!");
            let b = this.chunk[potentialX][potentialZ][potentialY];
            console.log(b);
            if (b == null) {
                this.chunk[potentialX][potentialZ][potentialY] = new Block(1, potentialX, potentialY, potentialZ);
                console.log("New block at ", x,z,y);
                console.log(this.chunk);
                //this.findVisible();
                this.updateNearbyChunks(1);
            }
        }
    }

    findHighestBlock(x,z) {
        let surfaceLevel = Chunk.dimensionY - 1;
        let B = this.chunk[x][z][surfaceLevel];
        while (B == null) {
            surfaceLevel--;
            if (surfaceLevel < 0) {
                return 0;
            }
            B = this.chunk[x][z][surfaceLevel];
        }

        return surfaceLevel;
    }

    getBlock(x,z,y) {
        let chunk = this;
        if (x >= Chunk.dimensionX) { //neighbor block is in next chunk
            let rightChunk = posToChunkMap.get(turnPosToString(this.x + 1, this.y ));
            if (rightChunk == undefined) {
                return null;
            }

            else {
                x = 0;
                chunk = rightChunk;
            }
        }

        else if (x < 0) {
            let leftChunk = posToChunkMap.get(turnPosToString(this.x - 1, this.y));

            if (leftChunk == undefined) {
                return null;
            }

            else {
                x = Chunk.dimensionX - 1;
                chunk = leftChunk;
            }
        }

        if (y >= Chunk.dimensionY) { //3D CHUNKING NOT IMPLIMENTED!!!
            return null;
        }

        else if (y < 0) {
           return null;
        }

        if (z >= Chunk.dimensionZ) { //neighbor block is in next chunk
            let frontChunk = posToChunkMap.get(turnPosToString(this.x, this.y + 1 ));
            if (frontChunk == undefined) {
                return null;
            }

            else {
                z = 0;
                chunk = frontChunk;
            }
        }

        else if (z < 0) {
            let backChunk = posToChunkMap.get(turnPosToString(this.x, this.y - 1));

            if (backChunk == undefined) {
                return null;
            }

            else {
                z = Chunk.dimensionZ - 1;
                chunk = backChunk;
            }
        }
        return chunk.chunk[x][z][y];
        
    }

    getHeight = function(x,z) {
        let height = 0.0;
        let curAmp = 1.0;
        let frequency = 1.0;
        for (let i = 0; i < Chunk.octaves; i++) {
            let sampleX = (x + (this.x * 16)) / Chunk.scale;
            let sampleZ = (z + (this.y * 16)) / Chunk.scale;
            let simplexVal = noise.simplex2(sampleX * frequency, sampleZ * frequency);
            simplexVal = (simplexVal) * curAmp;
            
            height += simplexVal;
            
            curAmp *= Chunk.persistance;
            frequency *= Chunk.lacunarity;
        }
        height += 1;
        height /= 2;
        height = Math.pow(height * Chunk.fudgeFactor, Chunk.exp);
        height = Math.max(height, 0.1);
        return height * Chunk.dimensionY;
    }

    carveCaves = function(x,y,z, height) {
        noise.seed(caveSeed);
        if (this.chunk[x][z][y].is_Visible && y > 3) {
            let sampleX = (x + (this.x * 16)) / Chunk.scale;
            let sampleZ = (z + (this.y * 16)) / Chunk.scale;
            let sampleY = (y) / Chunk.scale;
            let curAmp = 1.0;
            let frequency = 1.0;
            let density = 0.0
            for (let i = 0; i < Chunk.octaves; i++) {
                let simplexVal = noise.simplex3(sampleX * frequency, sampleY * frequency, sampleZ * frequency);
                simplexVal = (simplexVal) * curAmp;
                    
                density += simplexVal;
                    
                curAmp *= Chunk.persistance;
                frequency *= Chunk.lacunarity;
            }
            density *= 10;
            let idealHeight = height / 2; //Maximize caves at this point
            let distFromIdealHeight = MathFunctions.invlerp(0, idealHeight, Math.abs(y - idealHeight));
            //console.log(y, idealHeight, distFromIdealHeight);
            //distFromIdealHeight = Math.pow(distFromIdealHeight, 2);
            density *= (5 * distFromIdealHeight);

            //console.log(density);

            density += 1;
            density /= 2;
            //console.log(density);
            if (density < 0.25) {
                this.chunk[x][z][y] = null;
            }
        }
        //}

    }

    updateNearbyChunks(chunksToRender) {
        for (let x = -chunksToRender; x <= chunksToRender; x++) {
            for (let y = -chunksToRender; y <= chunksToRender; y++) {
                console.log("Updating ", this.x + x, this.y + y);
                posToChunkMap.get(turnPosToString(this.x + x, this.y + y)).findVisible();
            }
        }
    }


    
}

function turnPosToString(x,y) {
    return "".concat(x).concat(",").concat(y);
}

function pushElements(ar, arToPush) {
    for (let i = 0; i < arToPush.length; i++) {
        ar.push(arToPush[i]);
    }
}

function pushElements_Float_32(ar, arToPush, startIndex) {
    //console.log(startIndex);
    let newVal = startIndex;
    //console.log(ar);
    //console.log(arToPush);
    for (let i = 0; i < arToPush.length; i++) {
        ar[startIndex + i] = arToPush[i];
        newVal++;
    }

    return newVal;
}
