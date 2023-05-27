class Block {
    constructor(id, x,y,z) {
        this.position = new Vector3([x,y,z]);
        this.id = id;
        this.is_Visible = false;
        if (id != -1) {
            this.is_Visible = true;
        }

        this.rightPos = new Vector3([x+1,y,z]);
        this.leftPos = new Vector3([x-1,y,z]);
        this.topPos = new Vector3([x,y+1,z]);
        this.bottomPos = new Vector3([x,y-1,z]);
        this.frontPos = new Vector3([x,y,z+1]);
        this.backPos = new Vector3([x,y,z-1]);

        this.vert0 = new Vector3().set(vertexBufferCube[0]).add(this.position);
        this.vert1 = new Vector3().set(vertexBufferCube[1]).add(this.position);
        this.vert2 = new Vector3().set(vertexBufferCube[2]).add(this.position);
        this.vert3 = new Vector3().set(vertexBufferCube[3]).add(this.position);
        this.vert4 = new Vector3().set(vertexBufferCube[4]).add(this.position);
        this.vert5 = new Vector3().set(vertexBufferCube[5]).add(this.position);
        this.vert6 = new Vector3().set(vertexBufferCube[6]).add(this.position);
        this.vert7 = new Vector3().set(vertexBufferCube[7]).add(this.position);
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
