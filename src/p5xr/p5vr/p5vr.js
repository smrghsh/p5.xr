import { quat } from 'gl-matrix';
import p5xr from '../core/p5xr';

/**
 * p5vr class holds all state and methods that are specific to VR
 * @class
 *
 * @constructor
 *
 */

export default class p5vr extends p5xr {
  constructor() {
    super();
    this.isVR = true;
    this.isImmersive = false;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.LOOK_SPEED = 0.0025;
    // Keep track of touch-related state so that users can touch and drag on
    // the canvas to adjust the viewer pose in an inline session.
    this.primaryTouch = undefined;
    this.prevTouchX = undefined;
    this.prevTouchY = undefined;
    navigator.xr.requestSession('inline').then(this.startSketch.bind(this));
  }

  initVR() {
    this.createButton()
  }

  /**
   * This is where the actual p5 canvas is first created, and
   * the GL rendering context is accessed by p5vr.
   * The current XRSession also gets a frame of reference and
   * base rendering layer. <br>
   * @param {XRSession}
   */
  startSketch(session) {
    this.xrSession = session;
    this.canvas = p5.instance.canvas;
    this.canvas.style.visibility = 'visible';

    this.xrSession.addEventListener('end', this.onSessionEnded.bind(this));
    if (typeof window.setup === 'function') {
      window.setup();
      p5.instance._millisStart = window.performance.now();
    }
    const refSpaceRequest = this.isImmersive ? 'local' : 'viewer';
      this.xrSession.requestReferenceSpace(refSpaceRequest)
        .then((refSpace) => {
          this.xrRefSpace = refSpace;
          // Inform the session that we're ready to begin drawing.
          this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
          if (!this.isImmersive) {
            this.xrSession.updateRenderState({
              baseLayer: new XRWebGLLayer(this.xrSession, this.gl),
              inlineVerticalFieldOfView: 90 * (Math.PI / 180),
            });
            this.addInlineViewListeners(this.canvas);
          }
        });
    this.onRequestSession();
  }
  /**
   * Helper function to reset XR and GL, should be called between 
   * ending an XR session and starting a new XR session
   * 
   */
  resetXR(){
    this.xrDevice = null;
    this.xrSession = null;
    this.xrRefSpace = null;
    this.xrViewerSpace = null;
    this.xrHitTestSource = null;
    this.gl = null;
    this.frame = null;
  }

  /**
   * `navigator.xr.requestSession('immersive-vr')` must be called within a user gesture event.
   * @param {XRDevice}
   */
  onXRButtonClicked() {
    if (this.hasImmersive) {
      console.log('Requesting session with mode: immersive-vr');
      this.isImmersive = true;
      this.resetXR();
      navigator.xr.requestSession('immersive-vr').then(this.startSketch.bind(this));
    } else {
      this.xrButton.hide();
      //TODO: Request Fullscreen
    }
  }

  onRequestSession() {
    p5.instance._renderer._curCamera.cameraType = 'custom';
    const refSpaceRequest = this.isImmersive ? 'local' : 'viewer';
    
    this.gl = this.canvas.getContext('webgl');
    this.gl.makeXRCompatible().then(() => {
      // Get a frame of reference, which is required for querying poses.
      // 'local' places the initial pose relative to initial location of viewer
      // 'viewer' is only for inline experiences and only allows rotation
      this.xrSession.requestReferenceSpace(refSpaceRequest)
      .then((refSpace) => {
        this.xrRefSpace = refSpace;
      });
      
      // Use the p5's WebGL context to create a XRWebGLLayer and set it as the
      // sessions baseLayer. This allows any content rendered to the layer to
      // be displayed on the XRDevice;
      this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
    }).catch((e) => {
      console.log(e);
    })

    // Request initial animation frame
    this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
  }

  setupBaseLayer() {
    // Use the p5's WebGL context to create a XRWebGLLayer and set it as the
    // sessions baseLayer. This allows any content rendered to the layer to
    // be displayed on the XRDevice;
    this.baseLayer = new XRWebGLLayer(this.xrSession, this.gl);
    this.xrSession.updateRenderState({ baseLayer: this.baseLayer });
  }


  /**
   * clears the background based on the current clear color (`curClearColor`)
   */
  clearVR() {
    if (this.curClearColor === null) {
      return;
    }
    p5.instance.background(this.curClearColor);

    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
  }

  // XRReferenceSpace offset is immutable, so return a new reference space
  // that has an updated orientation.
  getAdjustedRefSpace(refSpace) {
    // Represent the rotational component of the reference space as a
    // quaternion.
    // TODO: Add rotation ability to xrViewer
    const invOrientation = quat.create();
    quat.rotateX(invOrientation, invOrientation, -this.lookPitch);
    quat.rotateY(invOrientation, invOrientation, -this.lookYaw);
    const xform = new XRRigidTransform(
      { x: 0, y: 0, z: 0 },
      {
        x: invOrientation[0], y: invOrientation[1], z: invOrientation[2], w: invOrientation[3],
      },
    );
    return refSpace.getOffsetReferenceSpace(xform);
  }

  rotateView(dx, dy) {
    this.lookYaw += dx * this.LOOK_SPEED;
    this.lookPitch += dy * this.LOOK_SPEED;
    if (this.lookPitch < -Math.PI * 0.5) this.lookPitch = -Math.PI * 0.5;
    if (this.lookPitch > Math.PI * 0.5) this.lookPitch = Math.PI * 0.5;
  }

  // Make the canvas listen for mouse and touch events so that we can
  // adjust the viewer pose accordingly in inline sessions.
  addInlineViewListeners(canvas) {
    this.canvas.addEventListener('mousemove', (event) => {
      // Only rotate when the right button is pressed
      if (event.buttons && 2) {
        this.rotateView(event.movementX, event.movementY);
      }
    });

    // Keep track of all active touches, but only use the first touch to
    // adjust the viewer pose.
    this.canvas.addEventListener('touchstart', (event) => {
      if (this.primaryTouch === undefined) {
        const touch = event.changedTouches[0];
        this.primaryTouch = touch.identifier;
        this.prevTouchX = touch.pageX;
        this.prevTouchY = touch.pageY;
      }
    });

    // Update the set of active touches now that one or more touches
    // finished. If the primary touch just finished, update the viewer pose
    // based on the final touch movement.
    canvas.addEventListener('touchend', (event) => {
      for (const touch of event.changedTouches) {
        if (this.primaryTouch === touch.identifier) {
          this.primaryTouch = undefined;
          this.rotateView(touch.pageX - this.prevTouchX, touch.pageY - this.prevTouchY);
        }
      }
    });

    // Update the set of active touches now that one or more touches was
    // cancelled. Don't update the viewer pose when the primary touch was
    // cancelled.
    canvas.addEventListener('touchcancel', (event) => {
      for (const touch of event.changedTouches) {
        if (this.primaryTouch === touch.identifier) {
          this.primaryTouch = undefined;
        }
      }
    });

    // Only use the delta between the most recent and previous events for
    // the primary touch. Ignore the other touches.
    canvas.addEventListener('touchmove', (event) => {
      for (const touch of event.changedTouches) {
        if (this.primaryTouch === touch.identifier) {
          this.rotateView(touch.pageX - this.prevTouchX, touch.pageY - this.prevTouchY);
          this.prevTouchX = touch.pageX;
          this.prevTouchY = touch.pageY;
        }
      }
    });
  }
}
