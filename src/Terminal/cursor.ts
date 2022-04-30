import { Coor } from "../Coordinate"

export class Cursor {
  private cursorLocations: Coor[] = [new Coor(0, 0)]
  private cursorLocationsCurrentIndex: number = 0
  cursorLocationsLengthLimit = 25

  constructor(
    private write: (str: string, isEscaped: boolean) => void
  ) {}
    
  moveCursorToCurrentLocation() {
    const location = this.cursorLocations[this.cursorLocationsCurrentIndex]
    this.write(`\u001b[${location.y};${location.x}H`, true)
  }

  move = { // TODO: add by, allowing postive/negative x and y input
    by: (x: number, y: number) => {
      const { location } = this
      location.set(
        location.x() + x,
        location.y() + y
      )
    },
    up: (times: number = 1) => {
      const { location } = this
      location.set(
        location.x(),
        location.y() - times
      )
    },
    right: (times: number = 1) => {
      const { location } = this
      location.set(
        location.x() + times,
        location.y()
      )
    },
    down: (times: number = 1) => {
      const { location } = this
      location.set(
        location.x(),
        location.y() + times
      )
    },
    left: (times: number = 1) => {
      const { location } = this
      location.set(
        location.x() - times,
        location.y()
      )
    },
  }

  location = {
    current: () => {
      const current = this.cursorLocations[this.cursorLocationsCurrentIndex]
      if (!current) throw new Error("No current cursor location exists")
      return current
    },
    x: () => {
      return this.location.current().x
    },
    y: () => {
      return this.location.current().y
    },
    set: (x: number, y: number) => { // add 1 to each because 1,1 is the top left corner
      this.cursorLocations = [new Coor(x + 1, y + 1), ...this.cursorLocations.slice(0, this.cursorLocationsLengthLimit)]
      this.cursorLocationsCurrentIndex = 0
      this.moveCursorToCurrentLocation()
    },
    history: {
      forward: () => {
        if (this.cursorLocationsCurrentIndex > 0) {
          this.cursorLocationsCurrentIndex--
          this.moveCursorToCurrentLocation()
        }
      },
      backward: () => {
        if (this.cursorLocationsCurrentIndex < this.cursorLocations.length) {
          this.cursorLocationsCurrentIndex++
          this.moveCursorToCurrentLocation()
        }
      }
    }
  }
}