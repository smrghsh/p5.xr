function setup() {
  createARCanvas();
  
  noStroke();
}

function onSelect(event) {
  let xrRefSpace = p5xr.instance.xrFrameOfRef;

  let targetRayPose = event.frame.getPose(event.inputSource.targetRaySpace, xrRefSpace);

  console.log(targetRayPose.transform.orientation);

  let targetRay = new XRRay(targetRayPose.transform.position, targetRayPose.transform.orientation);

  let hits = [];
  event.frame.session.requestHitTest(targetRay, xrRefSpace).then((results) => {
    console.log(results);
    if(results.length > 0) {
      renderBox(results);
    }
  });
}

function renderBox(hits) {
  if(hits.length !== 0) {
    console.log('here');
    console.log(hits);
    // p5.instance._renderer.uMVMatrix = hits[0].hitMatrix;
    const hitMat = hits[0].hitMatrix.slice();
    cachedTransform.set(
      hitMat[0],
      hitMat[1],
      hitMat[2],
      hitMat[3],
      hitMat[4],
      hitMat[5],
      hitMat[6],
      hitMat[7],
      hitMat[8],
      hitMat[9],
      hitMat[10],
      hitMat[11],
      hitMat[12],
      hitMat[13],
      hitMat[14],
      hitMat[15]
    );
    transformIsCached = true;
  }
}

let transformIsCached = false;
const cachedTransform = new p5.Matrix();

function applyCachedTransform() {
  p5.instance._renderer.uMVMatrix.set(
    cachedTransform.mat4[0],
    cachedTransform.mat4[1],
    cachedTransform.mat4[2],
    cachedTransform.mat4[3],
    cachedTransform.mat4[4],
    cachedTransform.mat4[5],
    cachedTransform.mat4[6],
    cachedTransform.mat4[7],
    cachedTransform.mat4[8],
    cachedTransform.mat4[9],
    cachedTransform.mat4[10],
    cachedTransform.mat4[11],
    cachedTransform.mat4[12],
    cachedTransform.mat4[13],
    cachedTransform.mat4[14],
    cachedTransform.mat4[15]
  );
  
}

function draw() {

  if(transformIsCached) {
    applyCachedTransform();
  } else {
    translate(0,0,-5);
  }
  
  box(1);
}

