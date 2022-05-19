import { Coor } from "./Coordinate"
import { range } from "./Coordinate/misc"
import { input, keypress, Keys, round, target, Terminal } from "./Terminal"
import { Cursor } from "./Terminal/cursor"

/*
─
└
┐
┘
┌
│
*/

const boxDrawingCharacters = [
  {
    topLeft: '',
    topRight: '',
    bottomLeft: '',
    bottomRight: '',
    horizontal: '',
    vertical: '',
    titleLeft: '',
    titleRight: ''
  },
  {
    topLeft: '',
    topRight: '',
    bottomLeft: '',
    bottomRight: '',
    horizontal: '',
    vertical: '',
    titleLeft: '',
    titleRight: ''
  }
]

interface BoxCreationDetails {
  dimensions: {
    width: number
    height: number
  }
  offset: {
    x: number
    y: number
  }
}

export function getFullscreenBoxConfig(terminal: Terminal) {
  return {
    terminal,
    start: new Coor(0, 0),
    end: () => new Coor(
      terminal.width() - 1,
      terminal.height() - 1
    )
  }
}

export interface BoxCreationConfig {
  terminal: Terminal,
  start: (() => Coor) | Coor,
  end: (() => Coor) | Coor
}

export class OutOfBoundsError extends Error {}

export class ReturnExceedsHeightError extends OutOfBoundsError {}

export class Box {

    terminal: Terminal
    protected __start: (() => Coor) | Coor
    protected __end: (() => Coor) | Coor

    get start() {
      if (this.__start instanceof Coor) {
        return this.__start
      } else {
        return this.__start()
      }
    }

    get end() {
      if (this.__end instanceof Coor) {
        this.__end
      } else {
        return this.__end()
      }
    }

    get paddedStart() {
      return this.start.add(new Coor(this.padding.left, this.padding.top))
    }

    get paddedEnd() {
      return this.end.add(new Coor(-this.padding.right, -this.padding.bottom))
    }

    get paddedHorizontalCenter() {
      return round(this.paddedWidth / 2, 'down')
    }

    get paddedVerticalCenter() {
      return round(this.paddedHeight / 2, 'down')
    }

    static fullScreen(terminal: Terminal) {
      return new Box(getFullscreenBoxConfig(terminal))
    } 

    getNewConfig(detail: BoxCreationDetails) {
      return {
        terminal: this.terminal,
        start: () => {
          return new Coor(
            round(this.paddedStart.x + this.paddedWidth * detail.offset.x, 'down'),
            round(this.paddedStart.y + this.paddedHeight * detail.offset.y, 'down')
          )
        },
        end: () => {
          return new Coor(
            round(this.paddedStart.x + this.paddedWidth * detail.offset.x + this.paddedWidth * detail.dimensions.width, 'down'),
            round(this.paddedStart.y + this.paddedHeight * detail.offset.y+ this.paddedHeight * detail.dimensions.height, 'down')
          )
        }
      }
    }

    box(details: BoxCreationDetails[]) {
      let boxes: Box[] = []

      for (let detail of details) {
        boxes.push(new Box(this.getNewConfig(detail)))
      }

      return boxes
    }
  
    wrap: boolean = false


    title: string | null = null
  
    get width() {
      return this.end.x - this.start.x
    }

    get height() {
      return this.end.y - this.start.y
    }

    get paddedWidth() {
      return this.paddedEnd.x - this.paddedStart.x
    }

    get paddedHeight() {
      return this.paddedEnd.y - this.paddedStart.y
    }

    private padding = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      adjustAll: (byAmount: number) => {
        this.padding.top += byAmount
        this.padding.right += byAmount
        this.padding.bottom += byAmount
        this.padding.left += byAmount
      }
    }

    private border = {
      width: 0,
    }

    set borderWidth(val: number) {
      this.padding.adjustAll(-this.border.width)
      this.border.width = val
      this.padding.adjustAll(this.border.width)
    }

  
    constructor(
      config: BoxCreationConfig
    ) {
      this.terminal = config.terminal
      this.__start = config.start
      this.__end = config.end
    }
  
    drawBorder() {
      const start = this.start
      const end = this.end

      const width = this.width

      this.moveCursor.to.start('unpadded')
      this.write('┌' + '─'.repeat(width - 2) + '┐')
      for (let y = start.y + 1; y < end.y; y++) {
        this.terminal.cursor.location.set(start.x, y)
        this.write('│')
        this.terminal.cursor.location.set(end.x - 1, y)
        this.write('│') 
      }
      this.moveCursor.to.bottomLeft('unpadded')
      this.write('└' + '─'.repeat(width - 2) + '┘')

      if (this.title) {
        const text = `┤${this.title}├`
        this.terminal.cursor.location.set(start.x + round(width / 2, 'down') - round(text.length / 2), start.y)
        this.write(text)
      }
    }

    writeOnNewline(content: string) {
      this.return()
      this.write(content)
    }

    write(content: string, isEscaped: boolean = false) {
        if (isEscaped) {
            this.terminal.write(content, isEscaped)
        } else {
          this.terminal.writeWithMarkup(content)
        }
        this.lastKnownCursorLocation = new Coor(
          this.terminal.cursor.location.current().x,
          this.terminal.cursor.location.current().y
        )
        return this
    }


  
    clear() {
      const width = this.paddedWidth
      const start = this.paddedStart
      const end = this.paddedEnd
      for (let y = start.y; y <= end.y; y++ ) {
        this.moveCursor.to.location(start.x, y)
        this.write(' '.repeat(width))
      }
      this.moveCursor.to.start()
      return this
    }
  
    return() {
      this.moveCursor.to.location(
        this.paddedStart.x,
        this.terminal.cursor.location.current().y + 1
      )
      return this
    }

    focus() {
      if (this.lastKnownCursorLocation) {
        this.moveCursor.to.location(this.lastKnownCursorLocation)
      }
    }

    private lastKnownCursorLocation: Coor

    private __setCursorLocation(x: number, y: number) {
      this.terminal.cursor.location.set(x, y)
      this.lastKnownCursorLocation = new Coor(x, y)
    }

    clearLine() {
      this.moveCursor.allTheWay.left()
      this.write(' '.repeat(this.paddedWidth))
      this.moveCursor.allTheWay.left()
    }

    userInput = {
      requestConfirmation: async (message: string = 'Please Confirm') => {
        this.write(
          `${message} (|fg[green]>y|/|fg[red]>n|)`
        )
        try {
          return await input({
            targets: [
              target(Keys.y, true),
              target(Keys.n, false)
            ]
          })
        } catch (error) {
          return false
        }
      },
      pressAnyKeyToContinue: async (message: string = '|i>Press any key to continue...|') => {
        this.write(
          `${message}`
        )
        await keypress()
      }
    }

    moveCursor = {
      allTheWay: {
        left: () => {
          this.moveCursor.to.location(
            this.paddedStart.x,
            this.lastKnownCursorLocation.y - 1
          )
        }
      },
      to: {
        relativeLocation: (x: Coor | number, y?: number) => {
          const start = this.start
          if (x instanceof Coor) {
            this.moveCursor.to.location(x.x + start.x, x.y + start.y)
          } else {
            this.moveCursor.to.location(x + start.x, y + start.y)
          }
        },
        relativePaddedLocation: (x: Coor | number, y?: number) => {
          const start = this.paddedStart
          if (x instanceof Coor) {
            this.moveCursor.to.location(x.x + start.x, x.y + start.y)
          } else {
            this.moveCursor.to.location(x + start.x, y + start.y)
          }
        },
        location: (x: Coor | number, y?: number) => {
          if (x instanceof Coor) {
            this.__setCursorLocation(x.x, x.y)
          } else {
            this.__setCursorLocation(x, y)
          }
        },
        paddedLocation: (x: Coor | number, y?: number) => {
          const leftPadding = this.padding.left
          const topPadding = this.padding.top
          if (x instanceof Coor) {
            this.__setCursorLocation(x.x + leftPadding, x.y  + topPadding)
          } else {
            this.__setCursorLocation(x + leftPadding, y  + topPadding)
          }
        },
        start: (style: 'padded' | 'unpadded' = 'padded') => {
          switch (style) {
            case 'padded': {
              this.moveCursor.to.location(this.paddedStart)
              break
            }
            case 'unpadded': {
              this.moveCursor.to.location(this.start)
              break
            }
          }
        },
        end: (style: 'padded' | 'unpadded' = 'padded') => {
          switch (style) {
            case 'padded': {
              this.moveCursor.to.location(this.paddedEnd)
              break
            }
            case 'unpadded': {
              this.moveCursor.to.location(this.end)
              break
            }
          }
        },
        bottomLeft: (style: 'padded' | 'unpadded' = 'padded') => {
          switch (style) {
            case 'padded': {
              this.moveCursor.to.location(
                this.paddedStart.x,
                this.paddedEnd.y
              )
              break
            }
            case 'unpadded': {
              this.moveCursor.to.location(
                this.start.x,
                this.end.y
              )
              break
            }
          }
        },
        topRight: (style: 'padded' | 'unpadded' = 'padded') => {
          switch (style) {
            case 'padded': {
              this.moveCursor.to.location(
                this.paddedEnd.x,
                this.paddedStart.y
              )
              break
            }
            case 'unpadded': {
              this.moveCursor.to.location(
                this.end.x,
                this.start.y
              )
              break
            }
          }
        },
      }
    }
  }
