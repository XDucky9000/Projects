class Block {
    //Block construcor()
    //Input: id, x,,y,z (ID of block to add, x,y,z position of the block to add WITHIN THE CHUNK)
    //Output: N/A
    //Function: Sets block ID, then PRECOMPUTES neighbors and vertex position using vertexBufferCube
    constructor(id, x,y,z) {
        this.id = id;
        this.is_Visible = false;
        if (id != -1) {
            this.is_Visible = true;
        }

        //Precompute neighboring position
        this.leftPos = [x+1,z,y];
        this.rightPos = [x-1,z,y];
        this.topPos = [x,z,y+1];
        this.bottomPos = [x,z,y-1];
        this.backPos = [x,z+1,y];
        this.frontPos = [x,z-1,y];

        this.vert0 = [vertexBufferCube[0].elements[0] + x, vertexBufferCube[0].elements[1] + y, vertexBufferCube[0].elements[2] + z]; //take vertexBufferCube and TRANSLATE IT by x,y,z
        this.vert1 = [vertexBufferCube[1].elements[0] + x, vertexBufferCube[1].elements[1] + y, vertexBufferCube[1].elements[2] + z];
        this.vert2 = [vertexBufferCube[2].elements[0] + x, vertexBufferCube[2].elements[1] + y, vertexBufferCube[2].elements[2] + z];
        this.vert3 = [vertexBufferCube[3].elements[0] + x, vertexBufferCube[3].elements[1] + y, vertexBufferCube[3].elements[2] + z];
        this.vert4 = [vertexBufferCube[4].elements[0] + x, vertexBufferCube[4].elements[1] + y, vertexBufferCube[4].elements[2] + z];
        this.vert5 = [vertexBufferCube[5].elements[0] + x, vertexBufferCube[5].elements[1] + y, vertexBufferCube[5].elements[2] + z];
        this.vert6 = [vertexBufferCube[6].elements[0] + x, vertexBufferCube[6].elements[1] + y, vertexBufferCube[6].elements[2] + z];
        this.vert7 = [vertexBufferCube[7].elements[0] + x, vertexBufferCube[7].elements[1] + y, vertexBufferCube[7].elements[2] + z];
    }

    is_Visible() {
        return this.is_Visible;
    }

    get_ID() {
        return this.id;
    }

    set_ID = function(id) {
        if (id == -1) {
            this.is_Visible = false;
        }

        else {
            this.is_Visible = true;
        }

        this.id = id;
    };
}
