
export type BresPos = {x: number, y: number};
export type BresReceive = (x: number, y: number) => void;

// returns undefined if fn is provided
// returns an array with points if fn isn't provided
export function bresenham(
  x0: number, 
  y0: number, 
  x1: number, 
  y1: number, 
  fn?: BresReceive) : BresPos[] {

  let arr: BresPos[];
  
  if(!fn) {
    arr = [];
    fn = function(x, y) { arr.push({ x: x, y: y }); };
  }

  const dx = x1 - x0;
  const dy = y1 - y0;
  let magnitude = Math.sqrt( Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2) );
  // console.log(`Bres: start {${x0}, ${y0}}, end: {${x1}, ${y1}}, magnitude: ${magnitude}`);
  bresenhamRange(x0, y0, dx / magnitude, dy / magnitude, magnitude, fn);

  return arr;
};

export function bresenhamRange(
  x0: number, y0: number, 
  dx: number, dy: number,
  range: number,
  fn: BresReceive) 
  : void {
  // console.log(`BresRange:  start {${x0}, ${y0}}, dir: {${dx}, ${dy}}, range: ${range}`);
  const HACK_STEP_CONSTANT = 100;
  const x1 = (dx * range) + x0;
  const y1 = (dy * range) + y0;
  let adx = Math.abs(dx) * HACK_STEP_CONSTANT;
  let ady = Math.abs(dy) * HACK_STEP_CONSTANT;
  let eps = 0;
  let sx = dx > 0 ? 1 : -1;
  let sy = dy > 0 ? 1 : -1;
  if(adx > ady) {
    for(
      let x = x0, y = y0; 
      sx < 0 ? x >= x1 : x <= x1; 
      x += sx) {
      fn(x, y);
      eps += ady;
      if((eps<<1) >= adx) {
        y += sy;
        eps -= adx;
      }
    }
  } else {
    for(let x = x0, y = y0; sy < 0 ? y >= y1 : y <= y1; y += sy) {
      fn(x, y);
      eps += adx;
      if((eps<<1) >= ady) {
        x += sx;
        eps -= ady;
      }
    }
  }
}