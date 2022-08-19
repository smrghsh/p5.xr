import { mat3, vec3, quat } from 'gl-matrix';
// https://github.com/toji/gl-matrix/issues/329
// cred: stefnotch

//TODO: export p5 vector
/**
 * Returns an euler angle representation of a quaternion
 * @param  {vec3} out Euler angles, pitch-yaw-roll
 * @param  {quat} mat Quaternion
 * @return {vec3} out
 */
 export function getEuler(out, quat) {
    let x = quat[0],
      y = quat[1],
      z = quat[2],
      w = quat[3],
      x2 = x * x,
      y2 = y * y,
      z2 = z * z,
      w2 = w * w;
    let unit = x2 + y2 + z2 + w2;
    let test = x * w - y * z;
    if (test > 0.499995 * unit) { //TODO: Use glmatrix.EPSILON
      // singularity at the north pole
      out[0] = Math.PI / 2;
      out[1] = 2 * Math.atan2(y, x);
      out[2] = 0;
    } else if (test < -0.499995 * unit) { //TODO: Use glmatrix.EPSILON
      // singularity at the south pole
      out[0] = -Math.PI / 2;
      out[1] = 2 * Math.atan2(y, x);
      out[2] = 0;
    } else {
      out[0] = Math.asin(2 * (x * z - w * y));
      out[1] = Math.atan2(2 * (x * w + y * z), 1 - 2 * (z2 + w2));
      out[2] = Math.atan2(2 * (x * y + z * w), 1 - 2 * (y2 + z2));
    }
    // TODO: Return them as degrees and not as radians
    return out;
  }