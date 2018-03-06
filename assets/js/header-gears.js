class Gear {
  constructor(n, parentGear, parentAngle, dom) {
    this.n = n;
    this.parentGear = parentGear;
    this.parentAngle = parentAngle;
    this.dom = dom;
  }
}

function polar2Cartasian(angle, radius) {
  //angle = angle * Math.PI / 180;
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius
  ];
}

//if parentAngle is NULL, gear is on parent axis
function addGear(selector, n, parentGear, parentAngle, klass) {
  const zahnKerbeAngle = 2*Math.PI/n;
  const zahnAngle = zahnKerbeAngle / 2;
  const radiusFuss = 90;
  const radiusKopf = 100;
  let d = 'M'+radiusKopf+',0 ';
  for(let offsetZahn = 0, offsetKerbe = zahnAngle; offsetZahn < 2*Math.PI; offsetZahn += 2*zahnAngle, offsetKerbe += 2*zahnAngle) {
    //Zahn
    const to = polar2Cartasian(offsetZahn, radiusKopf);
    d += 'A'+radiusKopf+','+radiusKopf+' 0 0 1 '+to[0]+','+to[1]+' ';
    const toDown = polar2Cartasian(offsetZahn, radiusFuss);
    d += 'L'+toDown[0]+','+toDown[1]+' ';
    //Kerbe
    const toRight = polar2Cartasian(offsetKerbe, radiusFuss);
    d += 'A'+radiusFuss+','+radiusFuss+' 0 0 1 '+toRight[0]+','+toRight[1]+' ';
    const toUp = polar2Cartasian(offsetKerbe, radiusKopf);
    d += 'L'+toUp[0]+','+toUp[1]+' ';
  }
  const toLast = polar2Cartasian(0, radiusKopf);
  d += 'A'+radiusKopf+','+radiusKopf+' 0 0 1 '+toLast[0]+','+toLast[1]+' ';
  d += 'Z';
  const group = d3.select(selector).append('g');
  group.attr('transform', 'translate('+radiusKopf+' '+radiusKopf+')');
  const gearPath = group.append('path').attr('class', klass).attr('d', d);
  return new Gear(n, parentGear, parentAngle, gearPath);
}
