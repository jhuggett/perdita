import { Direction, range } from "./misc"


export class Size {
  constructor(
    public width: number,
    public height: number
  ) {}

  asCoor() {
    return new Coor(this.width, this.height)
  }
}

export class Coor {
  constructor(public x: number, public y: number) {}


  sameAs(coor: Coor) : boolean {
    if (this.x == coor.x && this.y == coor.y) {
        return true
    }
    return false
  }


  getAdjacentCoors(coor: Coor = this) : Array<Coor> {
    return [
        new Coor(coor.x + 1, coor.y),
        new Coor(coor.x - 1, coor.y),
        new Coor(coor.x, coor.y + 1),
        new Coor(coor.x, coor.y - 1)
    ]
  }


  //static TargetCoorDirections
  

  getDisplacedCoor(direction: Direction, coor: Coor = this) : Coor {
    switch (direction) {
        case Direction.north: {
            return new Coor(coor.x, coor.y - 1)
        }
        case Direction.south: {
            return new Coor(coor.x, coor.y + 1)
        }
        case Direction.east: {
            return new Coor(coor.x + 1, coor.y)
        }
        case Direction.west: {
            return new Coor(coor.x - 1, coor.y)
        } 
    }
  }

  getDirection(otherCoor: Coor) : Direction[] {
    let directions = []

    if (otherCoor.x > this.x) {
      directions.push({
        direction: Direction.east,
        by: otherCoor.x - this.x
      })
    } else if (otherCoor.x < this.x) {
      directions.push({
        direction: Direction.west,
        by: this.x - otherCoor.x
      })
    }

    if (otherCoor.y > this.y) {
      directions.push({
        direction: Direction.south,
        by: otherCoor.y - this.y
      })
    } else if (otherCoor.y < this.y) {
      directions.push({
        direction: Direction.north,
        by: this.y - otherCoor.y
      })
    }

    directions.sort((a, b) => a.by > b.by ? 1 : -1)

    return directions.map(direction => direction.direction)
  }

  add(coor: Coor) : Coor {
    return new Coor(
      this.x + coor.x,
      this.y + coor.y
    )
  }

  north() : Coor {
    return this.getDisplacedCoor(Direction.north)
  }

  east() : Coor {
    return this.getDisplacedCoor(Direction.east)
  }

  south() : Coor {
    return this.getDisplacedCoor(Direction.south)
  }

  west() : Coor {
    return this.getDisplacedCoor(Direction.west)
  }

  ring(distance: number, point: Coor = this) : Array<Coor> {
    const xRange = range(point.x - distance, point.x + distance)
    const yRange = range(point.y - distance, point.y + distance)
    return [
        ...xRange.map( x => new Coor(x, point.y - 1)),
        ...xRange.map( x => new Coor(x, point.y + 1)),
        ...yRange.map( y => new Coor(point.x - 1, y)),
        ...yRange.map( y => new Coor(point.x + 1, y))
    ] 
  }

  scan(distance: number, point: Coor = this) : Array<Coor> {
    const xRange = range(point.x - distance, point.x + distance)
    const yRange = range(point.y - distance, point.y + distance)
    
    let points = []

    for (let x of xRange) {
      for (let y of yRange) {
        points.push(new Coor(x, y))
      }
    }

    return points
  }

  asArray() {
    return [this.x, this.y]
  }

  toString() {
    return `${this.x}|${this.y}`
  }

  static fromString(str: string) : Coor {
    const split = str.split('|')
    return new Coor(
      +split[0],
      +split[1]
    )
  }

  static fromArray(arr: number[]) : Coor {
    return new Coor(
      arr[0],
      arr[1]
    )
  }
}