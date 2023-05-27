
// DrawRectangle.js
function main() {
 // Retrieve <canvas> element <- (1)
 var canvas = getCanvas();
 // Get the rendering context for 2DCG <- (2)
 var ctx = canvas.getContext('2d');
 // Draw a blue rectangle <- (3)
 ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a blue color
 ctx.fillRect(0, 0, 400, 400); // Fill a rectangle with the color
 ctx.translate(canvas.width/2, canvas.height/2);



} 

function handleDrawEvent() {
  clearCanvas();
  //console.log("DrawEvent");


  var x1 = x1Cord.value;
  var y1 = y1Cord.value;
  
  var x2 = x2Cord.value;
  var y2 = y2Cord.value;

  var v1 = new Vector3([x1,y1 * -1,0]);
  var v2 = new Vector3([x2,y2 * -1,0]);
  //console.log(v1)
  //console.log(v2);
  var mode = selectOp.selectedIndex;
  drawVector(v1, "red");
  drawVector(v2, "blue");
  switch(mode) {
    case 0: //Add
      var v3 = new Vector3([0,0,0]);
      v3.set(v1);
      v3 = v3.add(v2);
      drawVector(v3, "green");
      break;
    case 1: //Sub
      var v3 = new Vector3([0,0,0]);
      v3.set(v1);
      v3 = v3.sub(v2);
      drawVector(v3, "green");
      break;
    case 2: //Mul
      var v3 = new Vector3([0,0,0]);
      v3.set(v1);

      var v4 = new Vector3([0,0,0]);
      v4.set(v2);

      v3 = v3.mul(scalar.value);
      v4 = v4.mul(scalar.value);

      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    case 3: //Div
      var v3 = new Vector3([0,0,0]);
      v3.set(v1);

      var v4 = new Vector3([0,0,0]);
      v4.set(v2);

      v3 = v3.div(scalar.value);
      v4 = v4.div(scalar.value);

      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    case 4: //Mag
      let m1 = v1.magnitude();
      let m2 = v2.magnitude();
      console.log("Magnitude 1: ", m1);
      console.log("Magntiude 2: ", m2);
      break;
    case 5: //normalize
      var v3 = new Vector3([0,0,0]);
      v3.set(v1);
      v3.normalize();

      var v4 = new Vector3([0,0,0]);
      v4.set(v2);
      v4.normalize();

      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    case 6: //Angle between
      var dot = Vector3.dot(v1, v2);
      //console.log(dot);
      var divisor = v1.magnitude() * v2.magnitude();
      //console.log(divisor);
      var angleBetween = (dot / (divisor));
      //console.log(angleBetween);
      angleBetween = Math.acos(angleBetween);
      //console.log(angleBetween);
      console.log(radsToDegrees(angleBetween));
      break;
    case 7: //area
      var v3 = Vector3.cross(v1, v2);
      console.log("Area: ", v3.magnitude() / 2);
  }
  
  
}

function clearCanvas() {
  //console.log("Clearing");
  var canvas = getCanvas();
  var ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a blue color
  ctx.fillRect(-400, -400, 800, 800); // Fill a rectangle with the color
  ctx.restore();
}
function drawVector(v, color) {
  var canvas = getCanvas();
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.strokeStyle = color;
  var elements = v.elements;
  ctx.lineTo(elements[0]*20,elements[1]*20);
  ctx.stroke();
}


function getCanvas() {
  var canvas = document.getElementById('example');
  if (!canvas) {
   console.log('Failed to retrieve the <canvas> element');
   return;
 }

 return canvas;
}

function radsToDegrees(rads) {
  return ((rads * 180) / Math.PI);
}