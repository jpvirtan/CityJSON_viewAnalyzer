//
//this file contains background functions
//

var ALLCOLOURS = {
    "Building": 0x73726f,
    "BuildingPart": 0x8f8b7e,
    "BuildingInstallation": 0x615e54,
    "Bridge": 0x757575,
    "BridgePart": 0x4a4a4a,
    "BridgeInstallation": 0x696969,
    "BridgeConstructionElement": 0x7a7a7a,
    "CityObjectGroup": 0x5a5f61,
    "CityFurniture": 0x7b8285,
    "GenericCityObject": 0xa5adb0,
    "LandUse": 0x85837b,
    "PlantCover": 0x687d5e,
    "Railway": 0x594b3f,
    "Road": 0x595654,
    "SolitaryVegetationObject": 0x5e8c4c,
    "TINRelief": 0x7a8774,
    "TransportSquare": 0x5c5955,
    "Tunnel": 0x454340,
    "TunnelPart": 0x66635f,
    "TunnelInstallation": 0x6b655c,
    "WaterBody": 0x8bacb5
};

//not used can be deleted prob
function sortVert(pList, type) {

  // Array of points;
  const points = [];
  for (var i = 0; i < pList.length; i = i + 3) {
    points.push({
      x: pList[i],
      y: pList[i + 1],
      z: pList[i + 2]
    })
  }

  // Find min max to get center
  // Sort from top to bottom
  points.sort((a, b) => a.y - b.y);

  // Get center y
  const cy = (points[0].y + points[points.length - 1].y) / 2;

  // Sort from right to left
  points.sort((a, b) => b.x - a.x);

  // Get center x
  const cx = (points[0].x + points[points.length - 1].x) / 2;

  // Center point
  const center = {
    x: cx,
    y: cy
  };

  // Starting angle used to reference other angles
  var startAng;
  points.forEach(point => {
    var ang = Math.atan2(point.y - center.y, point.x - center.x);
    if (!startAng) {
      startAng = ang
    } else {
      if (ang < startAng) { // ensure that all points are clockwise of the start point
        ang += Math.PI * 2;
      }
    }
    point.angle = ang; // add the angle to the point
  });

  if (type == "cw") {

    // Sort clockwise;
    points.sort((a, b) => a.angle - b.angle);
  } else if (type == "ccw") {

    // first sort clockwise
    points.sort((a, b) => a.angle - b.angle);

    // then reverse the order
    points = points.reverse();

    // move the last point back to the start
    points.unshift(points.pop());

  }
  pList = []

  for (i = 0; i < points.length; i++){
    pList.push(points[i].x)
    pList.push(points[i].y)
    pList.push(points[i].z)
  }

  return(pList)

}

//-- calculate normal of a set of points
function get_normal_newell(indices) {

	// find normal with Newell's method
	var n = [0.0, 0.0, 0.0];

	for (var i = 0; i < indices.length; i++) {
	  var nex = i + 1;
	  if ( nex == indices.length) {
	    nex = 0;
	  };
	  n[0] = n[0] + ( (indices[i].y - indices[nex].y) * (indices[i].z + indices[nex].z) );
	  n[1] = n[1] + ( (indices[i].z - indices[nex].z) * (indices[i].x + indices[nex].x) );
	  n[2] = n[2] + ( (indices[i].x - indices[nex].x) * (indices[i].y + indices[nex].y) );
		};
	var b = new THREE.Vector3(n[0], n[1], n[2]);
  return(b.normalize())
};

function to_2d(p, n) {
  p = new THREE.Vector3(p.x, p.y, p.z)
	var x3 = new THREE.Vector3(1.1, 1.1, 1.1);
	if ( x3.distanceTo(n) < 0.01 ) {
		x3.add(new THREE.Vector3(1.0, 2.0, 3.0));
	}
	var tmp = x3.dot(n);
	var tmp2 = n.clone();
	tmp2.multiplyScalar(tmp);
	x3.sub(tmp2);
	x3.normalize();
	var y3 = n.clone();
	y3.cross(x3);
	let x = p.dot(x3);
	let y = p.dot(y3);
	var re = {x: x, y: y};
	return re;
}

function getStats(vertices){

  var minX = Number.MAX_VALUE;
  var minY = Number.MAX_VALUE;
  var minZ = Number.MAX_VALUE;

  var sumX = 0;
  var sumY = 0;
  var sumZ = 0
  var counter = 0

  for (var i in vertices){
    sumX = sumX + vertices[i][0]
    if (vertices[i][0] < minX){
      minX = vertices[i][0]
    }

    sumY = sumY + vertices[i][1]
    if (vertices[i][1] < minY){
      minY = vertices[i][1]
    }

    if (vertices[i][2] < minZ){
      minZ = vertices[i][2]
    }

    sumZ = sumZ + vertices[i][2]
    counter = counter + 1
  }

  var avgX = sumX/counter
  var avgY = sumY/counter
  var avgZ = sumZ/counter

  return ([minX, minY, minZ, avgX, avgY, avgZ])

}
