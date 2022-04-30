import { ESCAPE_CODE } from "."
import { Coor } from "../Coordinate"
import { Cursor } from "./cursor"

export function percent(percent: number) : number {
  return percent / 100
  
}

export function round(num: number, round: 'default' | 'up' | 'down'  = 'default') {
  switch (round) {
    case 'default': {
      return Math.round(num)
    }
    case 'up': {
      return Math.ceil(num)
    }
    case 'down': {
      return Math.floor(num)
    }
  }
}

export function dropDecimalPlacesPast(places: number, forNumber: number) {
  const x = parseInt('1' + '0'.repeat(places))
  return round(forNumber * x, 'down') / x
}

export class Terminal {  
  cursor: Cursor = new Cursor(this.write)

  colors: Map<string, number[]> = new Map([
    ['white', [255, 255, 255]],
    ['black', [0, 0, 0]],
    ['red', [255, 0, 0]],
    ['green', [0, 255, 0]],
    ['blue', [0, 0, 255]]
  ])
  
  write(content: string, escaped = false, wrap = true) {
    let contentToWrite = content
    if (!wrap) {
      contentToWrite = content.split('').slice(0, content.length - (this.cursor.location.current().x + content.length - this.width())).join('')
    }
    if (!escaped) this.cursor.location.current().x += contentToWrite.length
    process.stdout.write(contentToWrite)
  }

  performInstruction(instruction: string) {
    if (instruction === 'b' || instruction === 'bold') {
      this.style.set.bold.on()
      return
    }
    if (instruction === 'i' || instruction === 'italic') {
      this.style.set.italic.on()
      return
    }
    if (instruction === 'u' || instruction === 'underline') {
      this.style.set.underline.on()
      return
    }
    if (instruction === 'inverse') {
      this.style.set.inverse.on()
      return
    }
    if (instruction.startsWith('fg') || instruction.startsWith('foreground')) {
      const color = /(?<=\[)(.*?)(?=\])/mg.exec(instruction)[0]
      let code: number[] = []
      if (this.colors.has(color)) {
        code = this.colors.get(color)
      } else {
        code = color.split(',').map(i => parseInt(i))
      }
      this.color.foreground.set.rgb(code[0], code[1], code[2])
      return
    }
    if (instruction.startsWith('bg') || instruction.startsWith('background')) {
      const color = /(?<=\[)(.*?)(?=\])/mg.exec(instruction)[0]
      let code: number[] = []
      if (this.colors.has(color)) {
        code = this.colors.get(color)
      } else {
        code = color.split(',').map(i => parseInt(i))
      }
      this.color.background.set.rgb(code[0], code[1], code[2])
      return
    }
    if (instruction === 'strikethrough') {
      this.style.set.strikethrough.on()
      return
    }
  }

  writeWithMarkup(content: string) {
    const sections = content.split(/(?<!\\)\|/mg)

    for (let section of sections) {
      const [instructions, str] = section.split('>')

      if (!str) { // meaning instructions contains the content
        this.write(instructions, false)
        continue
      }

      for (let instruction of instructions.split(';')) {
        this.performInstruction(instruction)
      }

      this.write(str, false)
      this.style.resetAll()
      this.color.reset()
    }
  }

  
  constructor() {
    this.style.resetAll()
    this.color.reset()
  }


  default = {
    fgColor: () => this.color.foreground.set.rgb(255, 255, 255),
    bgColor: () => this.color.background.set.rgb(0, 0, 0)
  }
  

  setRawMode(to: boolean) {
    process.stdin.setRawMode(to)
  }

  width = () => {
    return process.stdout.columns || 0
  }

  height = () => {
      return process.stdout.rows || 0
  }

  hideCursor() {
    this.write(
      ESCAPE_CODE + EscapeCodes.MakeCursorInvisible,
      true
    )
  }

  showCursor() {
    this.write(
      ESCAPE_CODE + EscapeCodes.MakeCursorVisible,
      true
    )
  }

  clearScreen() {
    this.write(
      ESCAPE_CODE + EscapeCodes.EraseEntireScreen,
      true
    )
    this.cursor.location.set(0, 0)
  }
 
  private isBold: boolean
  private isDim: boolean
  private isItalic: boolean
  private isUnderline: boolean
  private isBlinking: boolean
  private isInverse: boolean
  private isHidden: boolean
  private isStrikethrough: boolean

  private writeStyle(style: string) {
    this.write(
      `${ESCAPE_CODE}${style}m`,
      true
    )
  }
  
  style = {
    resetAll: () => {
      this.writeStyle(StyleCode.ResetAll)
      this.isBold = false
      this.isDim = false
      this.isItalic = false
      this.isUnderline = false
      this.isBlinking = false
      this.isInverse = false
      this.isHidden = false
      this.isStrikethrough = false
    },
    set: {
      bold: {
        on: () => {
          if (!this.isBold) {
            this.writeStyle(StyleCode.Bold)
            this.isBold = true
          }
        },
        off: () => {
          if (this.isBold) {
            this.writeStyle(StyleCode.ResetBold),
            this.isBold = false
          }
        }
      },
      dim: {
        on: () => {
          if (!this.isDim) {
            this.writeStyle(StyleCode.Dim)
            this.isDim = true
          }
        },
        off: () => {
          if (this.isDim) {
            this.writeStyle(StyleCode.ResetDim)
            this.isDim = false
          }
        }
      },
      italic: {
        on: () => {
          if (!this.isItalic) {
            this.writeStyle(StyleCode.Italic)
            this.isItalic = true
          }
        },
        off: () => {
          if (this.isItalic) {
            this.writeStyle(StyleCode.ResetItalic)
            this.isItalic = false
          }
        }
      },
      underline: {
        on: () => {
          if (!this.isUnderline) {
            this.writeStyle(StyleCode.Underline)
            this.isUnderline = true
          }
        },
        off: () => {
          if (this.isUnderline) {
            this.writeStyle(StyleCode.ResetUnderline)
            this.isUnderline = false
          }
        }
      },
      blinking: { // doesn't appear to work in iTerm
        on: () => {
          if (!this.isBlinking) {
            this.writeStyle(StyleCode.Blinking)
            this.isBlinking = true
          }
        },
        off: () => {
          if (this.isBlinking) {
            this.writeStyle(StyleCode.ResetBlinking)
            this.isBlinking = false
          }
        }
      },
      inverse: {
        on: () => {
          if (!this.isInverse) {
            this.writeStyle(StyleCode.Inverse)
            this.isInverse = true
          }
        },
        off: () => {
          if (this.isInverse) {
            this.writeStyle(StyleCode.ResetInverse)
            this.isInverse = false
          }
        }
      },
      hidden: { // doesn't appear to work in iTerm
        on: () => {
          if (!this.isHidden) {
            this.writeStyle(StyleCode.Hidden)
            this.isHidden = true
          }
        },
        off: () => {
          if (this.isHidden) {
            this.writeStyle(StyleCode.ResetHidden)
            this.isHidden = false
          }
        }
      },
      strikethrough: {
        on: () => {
          if (!this.isStrikethrough) {
            this.writeStyle(StyleCode.Strikethrough)
            this.isStrikethrough = true
          }
        },
        off: () => {
          if (this.isStrikethrough) {
            this.writeStyle(StyleCode.ResetStrikethrough)
            this.isStrikethrough = false
          }
        }
      }
    }
  }

  private currentForegroundColor = ''
  private currentBackgroundColor = ''

  color = {
    reset: () => {
      this.default.bgColor()
      this.default.fgColor()
    },
    foreground: {
      set: {
        rgb: (r: number, g: number, b: number) => {
          const c = `\u001b[38;2;${r};${g};${b}m`
          if (c !== this.currentForegroundColor) {
            this.write(c, true)
            this.currentForegroundColor = c
          }
        }
      }
    },
    background: {
      set: {
        rgb: (r: number, g: number, b: number) => {
          const c = `\u001b[48;2;${r};${g};${b}m`
          if (c !== this.currentBackgroundColor) {
            this.write(c, true)
            this.currentBackgroundColor = c
          }
        }
      }
    }
  }

}

enum StyleCode {
  ResetAll = '0',
  Bold = '1',
  ResetBold = '22',
  Dim = '2',
  ResetDim = '22',
  Italic = '3',
  ResetItalic = '23',
  Underline = '4',
  ResetUnderline = '24',
  Blinking = '5',
  ResetBlinking = '25',
  Inverse = '7',
  ResetInverse = '27',
  Hidden = '8',
  ResetHidden = '28',
  Strikethrough = '9',
  ResetStrikethrough = '29'
}


export enum EscapeCodes {
  EraseFromCursorToEndOfScreen = '0J',
  EraseFromCursorToBeginningOfScreen = '1J',
  EraseEntireScreen = '2J',
  EraseFromCursorToEndOfLine = '0K',
  EraseFromCursorToStartOfLine = '1K',
  EraseEntireLine = '2K',

  // Private Modes:
  MakeCursorInvisible = '?25l',
  MakeCursorVisible = '?25h',
  RestoreScreen = '?47l',
  SaveScreen = '?47h'
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}