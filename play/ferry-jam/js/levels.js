/* Ferry Jam — 10 handcrafted levels. Works in the browser and in Node. */
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else { root.LEVELS = data.LEVELS; root.COLORS = data.COLORS; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLORS = {
    red:    { fill: '#E5484D', shade: '#C2272D', ink: '#fff',    name: 'Red' },
    blue:   { fill: '#3B82F6', shade: '#1D4ED8', ink: '#fff',    name: 'Blue' },
    yellow: { fill: '#F4C431', shade: '#D19A00', ink: '#3A2A00', name: 'Yellow' },
    green:  { fill: '#22A36B', shade: '#158552', ink: '#fff',    name: 'Green' },
    orange: { fill: '#F97316', shade: '#C2410C', ink: '#fff',    name: 'Orange' }
  };

  /*
    Car: { id, color, len, r, c, dir }  — (r,c) is the FRONT cell.
    dir: 'N' | 'E' | 'S' | 'W'
    A length-2 truck also occupies the cell behind the front.
    Maps in comments: front marked with > v < ^ ; doubled letters = truck; # obstacle.
  */
  var LEVELS = [
    {
      id: 1, name: 'First Departure',
      rows: 4, cols: 4, berths: 1, holdSlots: 1, parMoves: 2,
      blurb: 'Tap a car. If the way is clear, it drives onto a matching ferry.',
      /* . . . .
         R> . . .
         . R> . .
         . . . .  */
      cars: [
        { id: 'r1', color: 'red', len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'r2', color: 'red', len: 1, r: 2, c: 1, dir: 'E' }
      ],
      obstacles: [],
      ferries: [{ color: 'red', capacity: 2 }]
    },
    {
      id: 2, name: 'Two Boats',
      rows: 4, cols: 4, berths: 2, holdSlots: 1, parMoves: 2,
      blurb: 'Each ferry only takes its own color.',
      /* B> . . .
         . . . .
         R> . . .
         . . . .  */
      cars: [
        { id: 'b1', color: 'blue', len: 1, r: 0, c: 0, dir: 'E' },
        { id: 'r1', color: 'red',  len: 1, r: 2, c: 0, dir: 'E' }
      ],
      obstacles: [],
      ferries: [
        { color: 'red', capacity: 1 },
        { color: 'blue', capacity: 1 }
      ]
    },
    {
      id: 3, name: 'The Block',
      rows: 5, cols: 5, berths: 2, holdSlots: 1, parMoves: 3,
      blurb: 'A car can only leave if nothing stands in front of it.',
      /* .  .  .  .  .
         R> .  Bv .  .
         .  .  .  .  .
         .  .  .  .  .
         .  .  Y> .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 1, r: 1, c: 2, dir: 'S' },
        { id: 'y1', color: 'yellow', len: 1, r: 4, c: 2, dir: 'E' }
      ],
      obstacles: [],
      ferries: [
        { color: 'blue', capacity: 1 },
        { color: 'red', capacity: 1 },
        { color: 'yellow', capacity: 1 }
      ]
    },
    {
      id: 4, name: 'Hold Please',
      rows: 5, cols: 5, berths: 1, holdSlots: 1, parMoves: 4,
      blurb: 'Wrong color? Park it in the holding dock — but there is only one stall.',
      /* B> . . . .
         B> . . . .
         R> . . . .
         .  R> . . .
         .  .  . . .  */
      cars: [
        { id: 'b1', color: 'blue', len: 1, r: 0, c: 0, dir: 'E' },
        { id: 'b2', color: 'blue', len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'r1', color: 'red',  len: 1, r: 2, c: 0, dir: 'E' },
        { id: 'r2', color: 'red',  len: 1, r: 3, c: 1, dir: 'E' }
      ],
      obstacles: [],
      ferries: [
        { color: 'red', capacity: 2 },
        { color: 'blue', capacity: 2 }
      ]
    },
    {
      id: 5, name: 'Long Truck',
      rows: 6, cols: 6, berths: 2, holdSlots: 1, parMoves: 4,
      blurb: 'Trucks take two spaces. This blue one is blocking the red car.',
      /* .  .  .  .  .  .
         R> .  B  B> .  .
         .  .  .  .  .  .
         .  Y> .  .  .  .
         .  .  .  Gv .  .
         .  .  .  .  .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 2, r: 1, c: 3, dir: 'E' },
        { id: 'y1', color: 'yellow', len: 1, r: 3, c: 1, dir: 'E' },
        { id: 'g1', color: 'green',  len: 1, r: 4, c: 3, dir: 'S' }
      ],
      obstacles: [],
      ferries: [
        { color: 'blue', capacity: 1 },
        { color: 'red', capacity: 1 },
        { color: 'yellow', capacity: 1 },
        { color: 'green', capacity: 1 }
      ]
    },
    {
      id: 6, name: 'Chain Reaction',
      rows: 6, cols: 6, berths: 2, holdSlots: 1, parMoves: 4,
      blurb: 'Unwind the chain: the truck first, then the car it was blocking, then the next.',
      /* .  .  .  .  .  .
         .  .  .  .  .  .
         R> .  Bv .  .  .
         .  .  .  .  .  .
         .  Y  Y> .  .  .
         G> .  .  .  .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 1, r: 2, c: 0, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 1, r: 2, c: 2, dir: 'S' },
        { id: 'y1', color: 'yellow', len: 2, r: 4, c: 2, dir: 'E' },
        { id: 'g1', color: 'green',  len: 1, r: 5, c: 0, dir: 'E' }
      ],
      obstacles: [],
      ferries: [
        { color: 'yellow', capacity: 1 },
        { color: 'blue', capacity: 1 },
        { color: 'red', capacity: 1 },
        { color: 'green', capacity: 1 }
      ]
    },
    {
      id: 7, name: 'Harbor Queue',
      rows: 6, cols: 6, berths: 2, holdSlots: 1, parMoves: 5,
      blurb: 'Watch which ferries are at the berths before you send a car down.',
      /* #  .  .  .  .  #
         R> .  .  Bv .  .
         .  .  .  .  .  .
         Y> .  G  G> .  .
         .  .  .  Ov .  .
         .  .  .  .  .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 1, r: 1, c: 3, dir: 'S' },
        { id: 'y1', color: 'yellow', len: 1, r: 3, c: 0, dir: 'E' },
        { id: 'g1', color: 'green',  len: 2, r: 3, c: 3, dir: 'E' },
        { id: 'o1', color: 'orange', len: 1, r: 4, c: 3, dir: 'S' }
      ],
      obstacles: [{ r: 0, c: 0 }, { r: 0, c: 5 }],
      ferries: [
        { color: 'orange', capacity: 1 },
        { color: 'green', capacity: 1 },
        { color: 'yellow', capacity: 1 },
        { color: 'blue', capacity: 1 },
        { color: 'red', capacity: 1 }
      ]
    },
    {
      id: 8, name: 'Tight Hold',
      rows: 6, cols: 6, berths: 1, holdSlots: 1, parMoves: 5,
      blurb: 'One holding stall. Don’t park two wrong colors before the orange ferry leaves.',
      /* B> .  .  .  .  .
         Y> .  .  .  .  .
         R> .  Gv .  .  .
         .  .  .  .  .  .
         .  .  O> .  .  .
         .  .  .  .  .  .  */
      cars: [
        { id: 'b1', color: 'blue',   len: 1, r: 0, c: 0, dir: 'E' },
        { id: 'y1', color: 'yellow', len: 1, r: 1, c: 0, dir: 'E' },
        { id: 'r1', color: 'red',    len: 1, r: 2, c: 0, dir: 'E' },
        { id: 'g1', color: 'green',  len: 1, r: 2, c: 2, dir: 'S' },
        { id: 'o1', color: 'orange', len: 1, r: 4, c: 2, dir: 'E' }
      ],
      obstacles: [],
      ferries: [
        { color: 'orange', capacity: 1 },
        { color: 'green', capacity: 1 },
        { color: 'red', capacity: 1 },
        { color: 'blue', capacity: 1 },
        { color: 'yellow', capacity: 1 }
      ]
    },
    {
      id: 9, name: 'Four Colors',
      rows: 6, cols: 6, berths: 2, holdSlots: 1, parMoves: 6,
      blurb: 'Two yellows, two reds, and a messy intersection in the middle.',
      /* #  .  .  .  .  #
         R  R> .  Bv .  .
         .  .  .  .  .  .
         Y> .  G  G> .  .
         .  R> .  .  .  .
         .  .  .  Yv .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 2, r: 1, c: 1, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 1, r: 1, c: 3, dir: 'S' },
        { id: 'y1', color: 'yellow', len: 1, r: 3, c: 0, dir: 'E' },
        { id: 'g1', color: 'green',  len: 2, r: 3, c: 3, dir: 'E' },
        { id: 'r2', color: 'red',    len: 1, r: 4, c: 1, dir: 'E' },
        { id: 'y2', color: 'yellow', len: 1, r: 5, c: 3, dir: 'S' }
      ],
      obstacles: [{ r: 0, c: 0 }, { r: 0, c: 5 }],
      ferries: [
        { color: 'green', capacity: 1 },
        { color: 'yellow', capacity: 2 },
        { color: 'blue', capacity: 1 },
        { color: 'red', capacity: 2 }
      ]
    },
    {
      id: 10, name: 'Harbor Master',
      rows: 7, cols: 6, berths: 2, holdSlots: 1, parMoves: 8,
      blurb: 'The whole harbor is packed. Only matching cars should leave while the first ferries are in.',
      /* #  .  .  .  .  #
         R  R> .  B  B> .
         .  Yv .  .  .  .
         G  G> .  Ov .  .
         .  .  .  .  .  .
         .  R> .  .  Y> .
         G> .  .  .  .  .  */
      cars: [
        { id: 'r1', color: 'red',    len: 2, r: 1, c: 1, dir: 'E' },
        { id: 'b1', color: 'blue',   len: 2, r: 1, c: 4, dir: 'E' },
        { id: 'y1', color: 'yellow', len: 1, r: 2, c: 1, dir: 'S' },
        { id: 'g1', color: 'green',  len: 2, r: 3, c: 1, dir: 'E' },
        { id: 'o1', color: 'orange', len: 1, r: 3, c: 3, dir: 'S' },
        { id: 'r2', color: 'red',    len: 1, r: 5, c: 1, dir: 'E' },
        { id: 'y2', color: 'yellow', len: 1, r: 5, c: 4, dir: 'E' },
        { id: 'g2', color: 'green',  len: 1, r: 6, c: 0, dir: 'E' }
      ],
      obstacles: [{ r: 0, c: 0 }, { r: 0, c: 5 }],
      ferries: [
        { color: 'blue', capacity: 1 },
        { color: 'orange', capacity: 1 },
        { color: 'green', capacity: 2 },
        { color: 'yellow', capacity: 2 },
        { color: 'red', capacity: 2 }
      ]
    }
  ];

  return { LEVELS: LEVELS, COLORS: COLORS };
});
