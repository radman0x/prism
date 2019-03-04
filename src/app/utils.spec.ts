import { xyPositionsAround, xyWithinBounds, Coord } from './utils';

type LocalCoord = [number, number];

describe('Coord', () => {
  it('can be created from whole number strings', () => {
    expect( () => Coord.fromString('{123, 456, 789}')).not.toThrow();
    const created = Coord.fromString('{123, 456, 789}');
    expect(created.x).toEqual(123);
    expect(created.y).toEqual(456);
    expect(created.z).toEqual(789);
  });

  it('Can roundtrip toString through fromString', () => {
    const input = new Coord(123, 456, 789);
    const asStr = input.toString();
    const roundtrip = Coord.fromString(asStr);
    expect(roundtrip.x).toEqual(123);
    expect(roundtrip.y).toEqual(456);
    expect(roundtrip.z).toEqual(789);
  });

  it('Can roundtrip toString through fromString with fractional values', () => {
    const input = new Coord(123.1, 456.2, 789.3);
    const asStr = input.toString();
    const roundtrip = Coord.fromString(asStr);
    expect(roundtrip.x).toEqual(123.1);
    expect(roundtrip.y).toEqual(456.2);
    expect(roundtrip.z).toEqual(789.3);
  });
});


// describe('ValueDict', () => {
//   let vd: ValueDict<LocalCoord, string>;
  
//   beforeEach(() => {
//     const coordToString   = (coord: LocalCoord)   => JSON.stringify(coord);
//     const coordFromString = (coordString: string) => <[number, number]> JSON.parse(coordString);
//     vd = new ValueDict<LocalCoord, string>(coordToString, coordFromString);
//   });

//   describe('Basic Operations', () => {
//     it('Sets a value', () => {
//       vd.set([7, 8], 'test');
//       expect(vd.has([7, 8])).toBeTruthy();
//     });

//     it('Gets a value', () => {
//       vd.set([7, 8], 'test');
//       const val = vd.get([7, 8]);
//       expect(val).toEqual('test');
//     });

//     it('Gets a non-existent value', () => {
//       const val = vd.get([7, 8]);
//       expect(val).toEqual(undefined);

//       expect(() => vd.get([7, 8], true)).toThrow();
//     });

//   });

//   describe('Basic operations with string keys', () => {

//       it('Gets a value', () => {
//         vd.set([7, 8], 'test');
//         const val = vd.get('7,8');
//         expect(val).toEqual('test');
//       });
  
//       it('Gets a non-existent value', () => {
//         const val = vd.get('7,8');
//         expect(val).toEqual(undefined);
  
//         expect(() => vd.get('7,8', true)).toThrow();
//       });
//   });

//   describe('Iteration', () => {
//     it('Iterates over empty object', () => {
//       for (let [k, v] of vd) { }
//     });
//     it('Iterates over object with one entry', () => {
//       vd.set([7, 8], 'blah');
//       for (let [k, v] of vd) {
//         expect(k).toEqual('7,8');
//         expect(v).toEqual('blah');
//       }
//     });
//   });

//   describe('Retrieving key objects from string keys', () => {
//     vd.set([7, 8], '77');
//     const key = vd.toKeyObj(JSON.stringify([7,8]));
//     expect(key[0]).toEqual(7);
//     expect(key[1]).toEqual(7);
//   });
// });

describe('XY bounds checking', () => {
  it('checks if bound extremes count as inside', () => {
    expect( xyWithinBounds(
      new Coord(0, 0, 0), 
      {width: 1, height: 1}, 
      new Coord(1, 1, 0), new Coord(0, 0, 0), new Coord(0, 1, 0), new Coord(1, 0, 0) ) 
    ).toBeTruthy();

  });

  it('checks when positions are negative', () => {
    expect( xyWithinBounds(
      new Coord(-10, -10, 0), 
      {width: 5, height: 5}, 
      new Coord(-7, -7, 0), new Coord(-5, -5, 0), new Coord(-9, -6, 0) ) 
    ).toBeTruthy();

    expect( xyWithinBounds(
      new Coord(-10, -10, 0), 
      {width: 5, height: 5}, 
      new Coord(-11, -7, 0), new Coord(-4, -5, 0), new Coord(-9, -1, 0) ) 
    ).toBeFalsy();
  });

  it('checks when dimensions given are negative', () => {
    expect( xyWithinBounds(
      new Coord(10, 10, 0), 
      {width: -5, height: -5}, 
      new Coord(6, 6, 0)) //, new Coord(10, 10, 0), new Coord(5, 5, 0), new Coord(7, 8, 0) ) 
    ).toBeTruthy();

    expect( xyWithinBounds(
      new Coord(10, 10, 0), 
      {width: -5, height: -5}, 
      new Coord(11, 11, 0), new Coord(11, 7, 0), new Coord(4, 7, 0) ) 
    ).toBeFalsy();
  });

});

describe('XY Positions around point', () => {
  it('Retrieves postive points', () => {
    const expectedPoints = [
      [4, 4, 0], 
      [5, 4, 0],
      [6, 4, 0],
      [4, 5, 0], 
      // no 5, 5, 0
      [6, 5, 0],
      [4, 6, 0], 
      [5, 6, 0],
      [6, 6, 0]
    ];
    const points = xyPositionsAround(new Coord(5, 5, 0));
    expect(points.length === expectedPoints.length);
    for (const expected of expectedPoints) {
      
      const exists = points.find( ({x, y, z}: Coord) => {
        return expected[0] === x && expected[1] === y && expected[2] === z;
      });
      expect(exists).toBeTruthy();
    }
  });

  it('Retrieves negative points', () => {
    const expectedPoints = [
      [-4, -4, 0], 
      [-5, -4, 0],
      [-6, -4, 0],
      [-4, -5, 0], 
      // no 5, 5, 0
      [-6, -5, 0],
      [-4, -6, 0], 
      [-5, -6, 0],
      [-6, -6, 0]
    ];
    const points = xyPositionsAround(new Coord(-5, -5, 0));
    expect(points.length === expectedPoints.length);
    for (const expected of expectedPoints) {

      const exists = points.find( ({x, y, z}: Coord) => {
        return expected[0] === x && expected[1] === y && expected[2] === z;
      });
      expect(exists).toBeTruthy();
    }
  });

});