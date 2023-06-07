class MathFunctions {
    static lerp(x,y,a) {
        return x * (1 - a) + y * a;
    }
    
    static clamp(a, min = 0, max = 1) {
        return Math.min(max, Math.max(min, a));
    
    }

    static invlerp(x,y,a) {
        return MathFunctions.clamp((a - x) / (y - x));
    }

    static range(x1, y1, x2, y2, a) {
        return MathFunctions.lerp(x2, y2, MathFunctions.invlerp(x1, y1, a));
    }

}

function mergeArrays(arrsToMerge) {
    mergedArray = [];
    for (var x = 0; x < arrsToMerge.length; x++) {
      let innerAr = arrsToMerge[x];
      for (var y = 0; y < innerAr.length; y++) {
        mergedArray.push(innerAr[y]);
      }
    }
    //console.log("Completed: ", mergedArray);
    return mergedArray;
  }
  
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function radsToDegrees(rads) {
    return ((rads * 180) / Math.PI);
  }