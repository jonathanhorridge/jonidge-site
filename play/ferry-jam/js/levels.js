/* Ferry Jam levels + chapters. Works in the browser and in Node. */
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else { root.LEVELS = data.LEVELS; root.COLORS = data.COLORS; root.CHAPTERS = data.CHAPTERS; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var COLORS = {
    red:    { fill: '#E5484D', shade: '#C2272D', ink: '#fff',    name: 'Red' },
    blue:   { fill: '#3B82F6', shade: '#1D4ED8', ink: '#fff',    name: 'Blue' },
    yellow: { fill: '#F4C431', shade: '#D19A00', ink: '#3A2A00', name: 'Yellow' },
    green:  { fill: '#22A36B', shade: '#158552', ink: '#fff',    name: 'Green' },
    orange: { fill: '#F97316', shade: '#C2410C', ink: '#fff',    name: 'Orange' }
  };
  var CHAPTERS = [
  {
    id: 1,
    name: "First Harbor",
    start: 1,
    end: 10,
    blurb: "Learn the road, the ramp, and the matching ferry."
  },
  {
    id: 2,
    name: "Rush Hour",
    start: 11,
    end: 20,
    blurb: "Tighter lots and busier queues."
  },
  {
    id: 3,
    name: "Keys & Gates",
    start: 21,
    end: 30,
    blurb: "Unlock cars and open road barriers."
  },
  {
    id: 4,
    name: "Special Ferries",
    start: 31,
    end: 40,
    blurb: "Small-car ramps and ferries that will not wait forever."
  }
];
  var LEVELS = [
  {
    id: 1,
    name: "First Departure",
    rows: 4,
    cols: 4,
    berths: 1,
    holdSlots: 1,
    parMoves: 2,
    blurb: "Tap a car. If the way is clear, it drives onto a matching ferry.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "r2",
        color: "red",
        len: 1,
        r: 2,
        c: 1,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "red",
        capacity: 2
      }
    ],
    chapter: 1
  },
  {
    id: 2,
    name: "Two Boats",
    rows: 4,
    cols: 4,
    berths: 2,
    holdSlots: 1,
    parMoves: 2,
    blurb: "Each ferry only takes its own color.",
    cars: [
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 0,
        c: 0,
        dir: "E"
      },
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 3,
    name: "The Block",
    rows: 5,
    cols: 5,
    berths: 2,
    holdSlots: 1,
    parMoves: 3,
    blurb: "A car can only leave if nothing stands in front of it.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 1,
        c: 2,
        dir: "S"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 4,
        c: 2,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 4,
    name: "Hold Please",
    rows: 5,
    cols: 5,
    berths: 1,
    holdSlots: 1,
    parMoves: 4,
    blurb: "Wrong color? Park it in the waiting bay — but there is only one stall.",
    cars: [
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 0,
        c: 0,
        dir: "E"
      },
      {
        id: "b2",
        color: "blue",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "E"
      },
      {
        id: "r2",
        color: "red",
        len: 1,
        r: 3,
        c: 1,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "red",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 2
      }
    ],
    chapter: 1
  },
  {
    id: 5,
    name: "Long Truck",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    parMoves: 4,
    blurb: "Trucks take two spaces. This blue one is blocking the red car.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 2,
        r: 1,
        c: 3,
        dir: "E"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 3,
        c: 1,
        dir: "E"
      },
      {
        id: "g1",
        color: "green",
        len: 1,
        r: 4,
        c: 3,
        dir: "S"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 6,
    name: "Chain Reaction",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    parMoves: 4,
    blurb: "Unwind the chain: the truck first, then the car it was blocking, then the next.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 2,
        c: 2,
        dir: "S"
      },
      {
        id: "y1",
        color: "yellow",
        len: 2,
        r: 4,
        c: 2,
        dir: "E"
      },
      {
        id: "g1",
        color: "green",
        len: 1,
        r: 5,
        c: 0,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 7,
    name: "Harbor Queue",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    parMoves: 5,
    blurb: "Watch which ferries are at the berths before you send a car down.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 1,
        c: 3,
        dir: "S"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 3,
        c: 0,
        dir: "E"
      },
      {
        id: "g1",
        color: "green",
        len: 2,
        r: 3,
        c: 3,
        dir: "E"
      },
      {
        id: "o1",
        color: "orange",
        len: 1,
        r: 4,
        c: 3,
        dir: "S"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    ferries: [
      {
        color: "orange",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 8,
    name: "Tight Hold",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    parMoves: 5,
    blurb: "One waiting bay. Don’t park two wrong colors before the orange ferry leaves.",
    cars: [
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 0,
        c: 0,
        dir: "E"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "r1",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "E"
      },
      {
        id: "g1",
        color: "green",
        len: 1,
        r: 2,
        c: 2,
        dir: "S"
      },
      {
        id: "o1",
        color: "orange",
        len: 1,
        r: 4,
        c: 2,
        dir: "E"
      }
    ],
    obstacles: [],
    ferries: [
      {
        color: "orange",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      }
    ],
    chapter: 1
  },
  {
    id: 9,
    name: "Four Colors",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    parMoves: 6,
    blurb: "Two yellows, two reds, and a messy intersection in the middle.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 2,
        r: 1,
        c: 1,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 1,
        r: 1,
        c: 3,
        dir: "S"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 3,
        c: 0,
        dir: "E"
      },
      {
        id: "g1",
        color: "green",
        len: 2,
        r: 3,
        c: 3,
        dir: "E"
      },
      {
        id: "r2",
        color: "red",
        len: 1,
        r: 4,
        c: 1,
        dir: "E"
      },
      {
        id: "y2",
        color: "yellow",
        len: 1,
        r: 5,
        c: 3,
        dir: "S"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    ferries: [
      {
        color: "green",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    chapter: 1
  },
  {
    id: 10,
    name: "Harbor Master",
    rows: 7,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    parMoves: 8,
    blurb: "The whole harbor is packed. Only matching cars should leave while the first ferries are in.",
    cars: [
      {
        id: "r1",
        color: "red",
        len: 2,
        r: 1,
        c: 1,
        dir: "E"
      },
      {
        id: "b1",
        color: "blue",
        len: 2,
        r: 1,
        c: 4,
        dir: "E"
      },
      {
        id: "y1",
        color: "yellow",
        len: 1,
        r: 2,
        c: 1,
        dir: "S"
      },
      {
        id: "g1",
        color: "green",
        len: 2,
        r: 3,
        c: 1,
        dir: "E"
      },
      {
        id: "o1",
        color: "orange",
        len: 1,
        r: 3,
        c: 3,
        dir: "S"
      },
      {
        id: "r2",
        color: "red",
        len: 1,
        r: 5,
        c: 1,
        dir: "E"
      },
      {
        id: "y2",
        color: "yellow",
        len: 1,
        r: 5,
        c: 4,
        dir: "E"
      },
      {
        id: "g2",
        color: "green",
        len: 1,
        r: 6,
        c: 0,
        dir: "E"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "orange",
        capacity: 1
      },
      {
        color: "green",
        capacity: 2
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    chapter: 1
  },
  {
    id: 11,
    name: "Morning Queue",
    rows: 5,
    cols: 5,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 2,
        r: 4,
        c: 2,
        dir: "E"
      },
      {
        id: "c1",
        color: "red",
        len: 2,
        r: 2,
        c: 4,
        dir: "E"
      },
      {
        id: "c2",
        color: "red",
        len: 1,
        r: 0,
        c: 4,
        dir: "E"
      },
      {
        id: "c3",
        color: "red",
        len: 1,
        r: 4,
        c: 0,
        dir: "E"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "red",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 4,
    generated: true,
    seed: "ferryjam-ch-11-v3"
  },
  {
    id: 12,
    name: "Two Ramps",
    rows: 5,
    cols: 5,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 2,
        r: 2,
        c: 4,
        dir: "E"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 0,
        c: 0,
        dir: "W"
      },
      {
        id: "c2",
        color: "yellow",
        len: 2,
        r: 4,
        c: 1,
        dir: "S"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "c6",
        color: "yellow",
        len: 2,
        r: 1,
        c: 3,
        dir: "S"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 5,
    generated: true,
    seed: "ferryjam-ch-12-v3"
  },
  {
    id: 13,
    name: "Tight Turn",
    rows: 5,
    cols: 5,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 1,
        r: 4,
        c: 4,
        dir: "S"
      },
      {
        id: "c2",
        color: "yellow",
        len: 2,
        r: 1,
        c: 1,
        dir: "N"
      },
      {
        id: "c3",
        color: "red",
        len: 1,
        r: 2,
        c: 2,
        dir: "W"
      },
      {
        id: "c4",
        color: "blue",
        len: 1,
        r: 0,
        c: 4,
        dir: "N"
      },
      {
        id: "c5",
        color: "yellow",
        len: 2,
        r: 2,
        c: 3,
        dir: "N"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 5,
    generated: true,
    seed: "ferryjam-ch-13-v3"
  },
  {
    id: 14,
    name: "Color Rush",
    rows: 5,
    cols: 5,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 2,
        r: 3,
        c: 2,
        dir: "E"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 0,
        c: 0,
        dir: "N"
      },
      {
        id: "c2",
        color: "red",
        len: 2,
        r: 2,
        c: 0,
        dir: "W"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 3,
        c: 4,
        dir: "E"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 4
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 4,
    generated: true,
    seed: "ferryjam-ch-14-v3"
  },
  {
    id: 15,
    name: "Packed Row",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 2,
        r: 4,
        c: 2,
        dir: "N"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 2,
        c: 4,
        dir: "W"
      },
      {
        id: "c2",
        color: "yellow",
        len: 1,
        r: 1,
        c: 5,
        dir: "S"
      },
      {
        id: "c3",
        color: "yellow",
        len: 1,
        r: 5,
        c: 3,
        dir: "W"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 4,
        c: 0,
        dir: "W"
      },
      {
        id: "c5",
        color: "red",
        len: 1,
        r: 0,
        c: 4,
        dir: "E"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-15-v3"
  },
  {
    id: 16,
    name: "Cross Traffic",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 5,
        c: 4,
        dir: "W"
      },
      {
        id: "c2",
        color: "yellow",
        len: 2,
        r: 4,
        c: 3,
        dir: "E"
      },
      {
        id: "c3",
        color: "red",
        len: 1,
        r: 3,
        c: 5,
        dir: "E"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 3,
        c: 0,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 3,
        c: 3,
        dir: "S"
      },
      {
        id: "c6",
        color: "green",
        len: 1,
        r: 1,
        c: 1,
        dir: "N"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-16-v3"
  },
  {
    id: 17,
    name: "Hold Tight",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 3,
        c: 2,
        dir: "E"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 4,
        c: 4,
        dir: "S"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 5,
        c: 3,
        dir: "N"
      },
      {
        id: "c3",
        color: "red",
        len: 1,
        r: 2,
        c: 4,
        dir: "S"
      },
      {
        id: "c6",
        color: "red",
        len: 1,
        r: 0,
        c: 4,
        dir: "N"
      },
      {
        id: "c8",
        color: "blue",
        len: 1,
        r: 4,
        c: 5,
        dir: "E"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-17-v3"
  },
  {
    id: 18,
    name: "Four Hue Harbor",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "red",
        len: 1,
        r: 5,
        c: 1,
        dir: "E"
      },
      {
        id: "c1",
        color: "green",
        len: 1,
        r: 4,
        c: 3,
        dir: "E"
      },
      {
        id: "c2",
        color: "red",
        len: 1,
        r: 1,
        c: 5,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 2,
        c: 3,
        dir: "N"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 3,
        c: 4,
        dir: "N"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 5,
    generated: true,
    seed: "ferryjam-ch-18-v3"
  },
  {
    id: 19,
    name: "The Squeeze",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 3,
        c: 5,
        dir: "S"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 5,
        c: 5,
        dir: "W"
      },
      {
        id: "c2",
        color: "green",
        len: 2,
        r: 3,
        c: 4,
        dir: "S"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 0,
        c: 1,
        dir: "S"
      },
      {
        id: "c5",
        color: "green",
        len: 1,
        r: 5,
        c: 3,
        dir: "N"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "green",
        capacity: 2
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 5,
    generated: true,
    seed: "ferryjam-ch-19-v3"
  },
  {
    id: 20,
    name: "Dock Crush",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 2,
        r: 1,
        c: 5,
        dir: "S"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 3,
        c: 1,
        dir: "S"
      },
      {
        id: "c3",
        color: "red",
        len: 1,
        r: 0,
        c: 2,
        dir: "N"
      },
      {
        id: "c4",
        color: "yellow",
        len: 2,
        r: 2,
        c: 3,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 0,
        c: 4,
        dir: "E"
      },
      {
        id: "c7",
        color: "yellow",
        len: 1,
        r: 1,
        c: 0,
        dir: "W"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Tighter lots and busier queues.",
    chapter: 2,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-20-v3"
  },
  {
    id: 21,
    name: "The Key Van",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 2,
        r: 5,
        c: 5,
        dir: "E",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "c2",
        color: "yellow",
        len: 1,
        r: 1,
        c: 5,
        dir: "S"
      },
      {
        id: "c4",
        color: "blue",
        len: 1,
        r: 3,
        c: 2,
        dir: "W"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 0,
        c: 3,
        dir: "N"
      },
      {
        id: "c6",
        color: "blue",
        len: 2,
        r: 4,
        c: 1,
        dir: "S"
      },
      {
        id: "c8",
        color: "red",
        len: 1,
        r: 1,
        c: 3,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [
      {
        id: "G1",
        r: 2,
        c: 3
      }
    ],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-21-v3"
  },
  {
    id: 22,
    name: "Locked In",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 5,
        c: 3,
        dir: "E",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "blue",
        len: 1,
        r: 4,
        c: 0,
        dir: "E"
      },
      {
        id: "c2",
        color: "yellow",
        len: 2,
        r: 0,
        c: 2,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 2,
        r: 2,
        c: 1,
        dir: "W"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 5,
        c: 2,
        dir: "E"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 1,
        c: 0,
        dir: "W",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-22-v3"
  },
  {
    id: 23,
    name: "Open the Gate",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 2,
        c: 3,
        dir: "N",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 3,
        c: 2,
        dir: "W"
      },
      {
        id: "c2",
        color: "yellow",
        len: 1,
        r: 1,
        c: 5,
        dir: "E"
      },
      {
        id: "c3",
        color: "red",
        len: 2,
        r: 4,
        c: 5,
        dir: "S"
      },
      {
        id: "c4",
        color: "blue",
        len: 2,
        r: 1,
        c: 3,
        dir: "W"
      },
      {
        id: "c5",
        color: "yellow",
        len: 2,
        r: 2,
        c: 1,
        dir: "E"
      },
      {
        id: "c6",
        color: "red",
        len: 1,
        r: 4,
        c: 2,
        dir: "E",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      }
    ],
    barriers: [
      {
        id: "G1",
        r: 4,
        c: 3
      }
    ],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-23-v3"
  },
  {
    id: 24,
    name: "Key & Block",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 2,
        r: 5,
        c: 3,
        dir: "S",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "blue",
        len: 2,
        r: 4,
        c: 0,
        dir: "W"
      },
      {
        id: "c2",
        color: "blue",
        len: 1,
        r: 3,
        c: 0,
        dir: "S"
      },
      {
        id: "c3",
        color: "red",
        len: 2,
        r: 3,
        c: 2,
        dir: "E"
      },
      {
        id: "c4",
        color: "blue",
        len: 1,
        r: 5,
        c: 5,
        dir: "W"
      },
      {
        id: "c7",
        color: "red",
        len: 1,
        r: 1,
        c: 3,
        dir: "E"
      },
      {
        id: "c9",
        color: "red",
        len: 1,
        r: 4,
        c: 5,
        dir: "N",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-24-v3"
  },
  {
    id: 25,
    name: "Barrier Bay",
    rows: 6,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 1,
        c: 0,
        dir: "N",
        opens: "G1"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 0,
        c: 4,
        dir: "N"
      },
      {
        id: "c2",
        color: "yellow",
        len: 2,
        r: 2,
        c: 4,
        dir: "S"
      },
      {
        id: "c3",
        color: "yellow",
        len: 2,
        r: 3,
        c: 3,
        dir: "N"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 3,
        c: 2,
        dir: "N"
      },
      {
        id: "c6",
        color: "blue",
        len: 1,
        r: 3,
        c: 1,
        dir: "N"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 2,
        c: 1
      }
    ],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "yellow",
        capacity: 2
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-25-v3"
  },
  {
    id: 26,
    name: "Double Lock",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 1,
        c: 0,
        dir: "W",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "red",
        len: 2,
        r: 1,
        c: 1,
        dir: "N"
      },
      {
        id: "c2",
        color: "red",
        len: 1,
        r: 1,
        c: 5,
        dir: "N"
      },
      {
        id: "c4",
        color: "yellow",
        len: 2,
        r: 3,
        c: 5,
        dir: "S"
      },
      {
        id: "c6",
        color: "yellow",
        len: 1,
        r: 5,
        c: 3,
        dir: "E"
      },
      {
        id: "c9",
        color: "red",
        len: 1,
        r: 3,
        c: 1,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 4,
        c: 1
      }
    ],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "red",
        capacity: 2
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-26-v3"
  },
  {
    id: 27,
    name: "Gatekeeper",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "red",
        len: 1,
        r: 1,
        c: 1,
        dir: "E"
      },
      {
        id: "c1",
        color: "red",
        len: 2,
        r: 1,
        c: 2,
        dir: "S"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 2,
        c: 2,
        dir: "S"
      },
      {
        id: "c4",
        color: "blue",
        len: 1,
        r: 3,
        c: 0,
        dir: "W"
      },
      {
        id: "c5",
        color: "yellow",
        len: 2,
        r: 3,
        c: 5,
        dir: "N"
      },
      {
        id: "c6",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "W"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "red",
        capacity: 2
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-27-v3"
  },
  {
    id: 28,
    name: "Hidden Key",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 1,
        r: 5,
        c: 2,
        dir: "W",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 2,
        c: 3,
        dir: "E"
      },
      {
        id: "c2",
        color: "yellow",
        len: 1,
        r: 3,
        c: 1,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 4,
        c: 0,
        dir: "S"
      },
      {
        id: "c5",
        color: "yellow",
        len: 2,
        r: 0,
        c: 5,
        dir: "N"
      },
      {
        id: "c6",
        color: "red",
        len: 1,
        r: 4,
        c: 5,
        dir: "N"
      },
      {
        id: "c8",
        color: "blue",
        len: 1,
        r: 2,
        c: 4,
        dir: "E",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 2,
        c: 5
      }
    ],
    ferries: [
      {
        color: "red",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "blue",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1,
        maxLen: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-28-v3"
  },
  {
    id: 29,
    name: "Chain Gate",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 2,
        c: 1,
        dir: "E",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "yellow",
        len: 2,
        r: 4,
        c: 3,
        dir: "W"
      },
      {
        id: "c2",
        color: "blue",
        len: 1,
        r: 5,
        c: 4,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 1,
        c: 2,
        dir: "N"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 2,
        c: 4,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 5,
        c: 1,
        dir: "E",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 5,
        c: 2
      }
    ],
    ferries: [
      {
        color: "blue",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-29-v3"
  },
  {
    id: 30,
    name: "Master Key",
    rows: 6,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 2,
        c: 5,
        dir: "E",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 0,
        c: 1,
        dir: "S"
      },
      {
        id: "c2",
        color: "blue",
        len: 2,
        r: 1,
        c: 4,
        dir: "W"
      },
      {
        id: "c3",
        color: "yellow",
        len: 1,
        r: 5,
        c: 5,
        dir: "E"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 4,
        c: 4,
        dir: "N"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 2,
        c: 0,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 3,
        c: 0
      }
    ],
    ferries: [
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Unlock cars and open road barriers.",
    chapter: 3,
    parMoves: 6,
    generated: true,
    seed: "ferryjam-ch-30-v3"
  },
  {
    id: 31,
    name: "Compact Only",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 4,
        c: 1,
        dir: "W",
        opens: "G1"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 0,
        c: 2,
        dir: "E"
      },
      {
        id: "c2",
        color: "blue",
        len: 1,
        r: 3,
        c: 4,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 0,
        c: 3,
        dir: "N"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 3,
        c: 5,
        dir: "E"
      },
      {
        id: "c5",
        color: "blue",
        len: 2,
        r: 0,
        c: 5,
        dir: "N"
      },
      {
        id: "c6",
        color: "blue",
        len: 1,
        r: 6,
        c: 2,
        dir: "E"
      },
      {
        id: "c7",
        color: "green",
        len: 1,
        r: 2,
        c: 4,
        dir: "N"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      }
    ],
    barriers: [
      {
        id: "G1",
        r: 1,
        c: 4
      }
    ],
    ferries: [
      {
        color: "green",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "green",
        capacity: 1,
        maxLen: 1,
        timeLimit: 6
      },
      {
        color: "yellow",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 8,
    generated: true,
    seed: "ferryjam-ch-31-v3"
  },
  {
    id: 32,
    name: "No Trucks",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 5,
        c: 3,
        dir: "E",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "green",
        len: 1,
        r: 4,
        c: 0,
        dir: "S"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 4,
        c: 2,
        dir: "N"
      },
      {
        id: "c3",
        color: "green",
        len: 1,
        r: 0,
        c: 0,
        dir: "N"
      },
      {
        id: "c4",
        color: "green",
        len: 1,
        r: 2,
        c: 0,
        dir: "E"
      },
      {
        id: "c5",
        color: "green",
        len: 2,
        r: 2,
        c: 2,
        dir: "N"
      },
      {
        id: "c8",
        color: "blue",
        len: 1,
        r: 1,
        c: 5,
        dir: "E",
        locked: "L1"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "green",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "green",
        capacity: 2
      },
      {
        color: "green",
        capacity: 2
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-32-v3"
  },
  {
    id: 33,
    name: "Ticking Ferry",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 1,
        c: 3,
        dir: "S"
      },
      {
        id: "c1",
        color: "green",
        len: 1,
        r: 4,
        c: 2,
        dir: "E"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 2,
        c: 0,
        dir: "W"
      },
      {
        id: "c3",
        color: "blue",
        len: 2,
        r: 0,
        c: 3,
        dir: "E"
      },
      {
        id: "c6",
        color: "red",
        len: 1,
        r: 3,
        c: 2,
        dir: "N"
      },
      {
        id: "c7",
        color: "red",
        len: 1,
        r: 0,
        c: 1,
        dir: "E"
      },
      {
        id: "c9",
        color: "red",
        len: 1,
        r: 3,
        c: 5,
        dir: "E"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "green",
        capacity: 2
      },
      {
        color: "red",
        capacity: 2,
        timeLimit: 6
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-33-v3"
  },
  {
    id: 34,
    name: "Hurry Aboard",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "red",
        len: 1,
        r: 6,
        c: 0,
        dir: "S",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 5,
        c: 5,
        dir: "E"
      },
      {
        id: "c2",
        color: "blue",
        len: 2,
        r: 1,
        c: 0,
        dir: "N"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 4,
        c: 0,
        dir: "E"
      },
      {
        id: "c4",
        color: "blue",
        len: 1,
        r: 2,
        c: 5,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 2,
        r: 1,
        c: 2,
        dir: "S"
      },
      {
        id: "c9",
        color: "blue",
        len: 2,
        r: 4,
        c: 3,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 2,
        timeLimit: 6
      },
      {
        color: "red",
        capacity: 2
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-34-v3"
  },
  {
    id: 35,
    name: "Small Dock",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "blue",
        len: 1,
        r: 4,
        c: 5,
        dir: "S"
      },
      {
        id: "c1",
        color: "green",
        len: 1,
        r: 2,
        c: 2,
        dir: "N"
      },
      {
        id: "c2",
        color: "blue",
        len: 1,
        r: 4,
        c: 3,
        dir: "E"
      },
      {
        id: "c3",
        color: "yellow",
        len: 1,
        r: 3,
        c: 0,
        dir: "E"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 1,
        c: 4,
        dir: "N"
      },
      {
        id: "c5",
        color: "green",
        len: 1,
        r: 1,
        c: 0,
        dir: "E"
      },
      {
        id: "c6",
        color: "blue",
        len: 1,
        r: 2,
        c: 5,
        dir: "N"
      },
      {
        id: "c7",
        color: "green",
        len: 1,
        r: 0,
        c: 3,
        dir: "E"
      }
    ],
    obstacles: [],
    barriers: [],
    ferries: [
      {
        color: "green",
        capacity: 2
      },
      {
        color: "yellow",
        capacity: 1,
        timeLimit: 6
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 2
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 8,
    generated: true,
    seed: "ferryjam-ch-35-v3"
  },
  {
    id: 36,
    name: "Timer Trouble",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "red",
        len: 1,
        r: 5,
        c: 1,
        dir: "W",
        opens: "G1"
      },
      {
        id: "c1",
        color: "red",
        len: 1,
        r: 0,
        c: 0,
        dir: "N"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 3,
        c: 0,
        dir: "W"
      },
      {
        id: "c3",
        color: "red",
        len: 2,
        r: 6,
        c: 4,
        dir: "S"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 1,
        c: 2,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 3,
        c: 5,
        dir: "E"
      },
      {
        id: "c6",
        color: "yellow",
        len: 2,
        r: 4,
        c: 2,
        dir: "N"
      }
    ],
    obstacles: [],
    barriers: [
      {
        id: "G1",
        r: 3,
        c: 2
      }
    ],
    ferries: [
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "red",
        capacity: 2,
        timeLimit: 6
      },
      {
        color: "yellow",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "green",
        capacity: 1,
        maxLen: 1
      },
      {
        color: "red",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-36-v3"
  },
  {
    id: 37,
    name: "Mini Lane",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 1,
        r: 0,
        c: 3,
        dir: "S"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 5,
        c: 4,
        dir: "W"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 6,
        c: 4,
        dir: "W"
      },
      {
        id: "c3",
        color: "yellow",
        len: 1,
        r: 5,
        c: 2,
        dir: "S"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 2,
        c: 4,
        dir: "S"
      },
      {
        id: "c6",
        color: "green",
        len: 1,
        r: 1,
        c: 2,
        dir: "S"
      },
      {
        id: "c7",
        color: "red",
        len: 1,
        r: 4,
        c: 2,
        dir: "W"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-37-v3"
  },
  {
    id: 38,
    name: "Beat the Horn",
    rows: 7,
    cols: 6,
    berths: 1,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "yellow",
        len: 1,
        r: 0,
        c: 0,
        dir: "W",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "yellow",
        len: 1,
        r: 2,
        c: 5,
        dir: "E"
      },
      {
        id: "c2",
        color: "green",
        len: 1,
        r: 5,
        c: 4,
        dir: "N"
      },
      {
        id: "c3",
        color: "green",
        len: 2,
        r: 4,
        c: 0,
        dir: "W"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 2,
        c: 0,
        dir: "S"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 6,
        c: 2,
        dir: "W"
      },
      {
        id: "c6",
        color: "yellow",
        len: 1,
        r: 1,
        c: 0,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1,
        timeLimit: 4
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-38-v3"
  },
  {
    id: 39,
    name: "Special Order",
    rows: 7,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "red",
        len: 1,
        r: 4,
        c: 1,
        dir: "N",
        isKey: true,
        unlocks: "L1",
        opens: "G1"
      },
      {
        id: "c2",
        color: "red",
        len: 1,
        r: 5,
        c: 2,
        dir: "E"
      },
      {
        id: "c3",
        color: "green",
        len: 1,
        r: 2,
        c: 5,
        dir: "W"
      },
      {
        id: "c4",
        color: "yellow",
        len: 1,
        r: 1,
        c: 4,
        dir: "E"
      },
      {
        id: "c5",
        color: "blue",
        len: 1,
        r: 1,
        c: 2,
        dir: "S"
      },
      {
        id: "c6",
        color: "blue",
        len: 1,
        r: 6,
        c: 0,
        dir: "E"
      },
      {
        id: "c7",
        color: "yellow",
        len: 1,
        r: 3,
        c: 3,
        dir: "S"
      },
      {
        id: "c9",
        color: "green",
        len: 1,
        r: 1,
        c: 3,
        dir: "S",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [
      {
        id: "G1",
        r: 2,
        c: 3
      }
    ],
    ferries: [
      {
        color: "green",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1,
        timeLimit: 5
      },
      {
        color: "yellow",
        capacity: 2
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 8,
    generated: true,
    seed: "ferryjam-ch-39-v3"
  },
  {
    id: 40,
    name: "Harbor Finals",
    rows: 7,
    cols: 6,
    berths: 2,
    holdSlots: 1,
    cars: [
      {
        id: "c0",
        color: "green",
        len: 1,
        r: 3,
        c: 1,
        dir: "N",
        isKey: true,
        unlocks: "L1"
      },
      {
        id: "c1",
        color: "green",
        len: 1,
        r: 4,
        c: 0,
        dir: "W"
      },
      {
        id: "c2",
        color: "yellow",
        len: 1,
        r: 6,
        c: 2,
        dir: "W"
      },
      {
        id: "c3",
        color: "blue",
        len: 1,
        r: 2,
        c: 4,
        dir: "W"
      },
      {
        id: "c4",
        color: "red",
        len: 1,
        r: 5,
        c: 2,
        dir: "E"
      },
      {
        id: "c5",
        color: "yellow",
        len: 1,
        r: 5,
        c: 0,
        dir: "W"
      },
      {
        id: "c6",
        color: "green",
        len: 1,
        r: 5,
        c: 5,
        dir: "E",
        locked: "L1"
      }
    ],
    obstacles: [
      {
        r: 0,
        c: 0
      },
      {
        r: 0,
        c: 5
      }
    ],
    barriers: [],
    ferries: [
      {
        color: "green",
        capacity: 1
      },
      {
        color: "green",
        capacity: 1,
        timeLimit: 5
      },
      {
        color: "green",
        capacity: 1
      },
      {
        color: "blue",
        capacity: 1
      },
      {
        color: "red",
        capacity: 1
      },
      {
        color: "yellow",
        capacity: 2
      }
    ],
    blurb: "Small-car ramps and ferries that will not wait forever.",
    chapter: 4,
    parMoves: 7,
    generated: true,
    seed: "ferryjam-ch-40-v3"
  }
];
  return { LEVELS: LEVELS, COLORS: COLORS, CHAPTERS: CHAPTERS };
});
