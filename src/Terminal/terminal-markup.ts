import { Terminal } from "./terminal"


/*
Terminal Markup

e.g. "|b;i>This is an example|"
which means: enable bold, enable italics, write "This is an example", reset styling

Indicators
- Section: |
- End of instructions: >

use backslash to escape indicators. E.g. \| or \>
*/

export const SECTION_INDICATOR = '|'
export const INSTRUCTION_INDICATOR = '>'
export const EXPRESSION_SEPERATOR = ';'
export const CONFIG_START = '['
export const CONFIG_END = ']'
export const ESCAPE_INDICATOR = "~"

export type Instruction = (t: Terminal) => void
export type UnconfiguredInstruction = (config?: string) => Instruction

export interface InstructionContext {
    enact: Instruction
    instructionType: InstructionType
}

export interface Section {
    instructions: InstructionContext[]
    content: string
}

export enum InstructionType {
    BoldOn,
    ItalicOn,
    UnderlineOn,
    ForegroundColor,
    BackgroundColor,
    Inverse
}

export const colors: Map<string, number[]> = new Map([
    ['white', [255, 255, 255]],
    ['black', [0, 0, 0]],
    ['red', [255, 0, 0]],
    ['green', [0, 255, 0]],
    ['blue', [0, 0, 255]]
])

function parseColor(fromString: string) : number[] {
    if (fromString.includes(',')) {
        const color = fromString.split(',').map(i => parseInt(i))
        if (color && color.length === 3) {
            return color
        }
    } else {
        const color = colors.get(fromString)
        if (color) {
            return color
        }
    }
    throw new Error(`Markup error: cannot parse color ${fromString}`)
}

export const TerminalInstructionConnector = new Map<
    InstructionType, UnconfiguredInstruction
>([
    [InstructionType.BoldOn, () => (t: Terminal) => {
        t.style.set.bold.on()
    }],
    [InstructionType.ItalicOn, () => (t: Terminal) => {
        t.style.set.italic.on()
    }],
    [InstructionType.UnderlineOn, () => (t: Terminal) => {
        t.style.set.underline.on()
    }],
    [InstructionType.ForegroundColor, (config: string) => (t: Terminal) => {
        const color = parseColor(config)
        t.color.foreground.set.rgb(color[0], color[1], color[2])
    }],
    [InstructionType.BackgroundColor, (config: string) => (t: Terminal) => {
        const color = parseColor(config)
        t.color.background.set.rgb(color[0], color[1], color[2])
    }],
    [InstructionType.Inverse, () => (t: Terminal) => {
        t.style.set.inverse.on()
    }]
])

export const ExpressionToInstruction = new Map<string, InstructionType>([
    ['b', InstructionType.BoldOn],
    ['bold', InstructionType.BoldOn],
    ['i', InstructionType.ItalicOn],
    ['italic', InstructionType.ItalicOn],
    ['u', InstructionType.UnderlineOn],
    ['underline', InstructionType.UnderlineOn],
    ['fg', InstructionType.ForegroundColor],
    ['foreground', InstructionType.ForegroundColor],
    ['bg', InstructionType.BackgroundColor],
    ['background', InstructionType.BackgroundColor],
    ['inverse', InstructionType.Inverse]
])

export function interpretExpression(expression: string) : InstructionContext {
    let [keyword, config] = expression.split(CONFIG_START)

    if (config) {
        // lop off the config end
        config = config.slice(0, -1)
    }
    
    const instructionType = ExpressionToInstruction.get(keyword)
    if (instructionType === undefined) {
        throw new Error(`Markup parsing error: '${keyword}' is not a valid expression`)
    }
    const unconfiguredInstruction = TerminalInstructionConnector.get(instructionType)
    if (!unconfiguredInstruction) {
        throw new Error(
            `Internal markup error: '${keyword}' of instruction type ${instructionType} does not have a matching instruction`
        )
    }

    return {
        instructionType,
        enact: unconfiguredInstruction(config)
    }
}

export function getInstructionsForExpressions(expressions: string) : InstructionContext[] {
    let instructions = []

    for (let expression of expressions.split(EXPRESSION_SEPERATOR)) {
        if (expression !== '') instructions.push(interpretExpression(expression))
    }

    return instructions
}
 
export function createSection(str: string) : Section {
    let instructions = []
    let content = []

    let inInstructionMode = true
    let previousChar = null
    for (let char of str) {
        if (char === INSTRUCTION_INDICATOR && inInstructionMode) {
            if (previousChar && previousChar === ESCAPE_INDICATOR) {
                instructions =  instructions.slice(0, -1)
                content = instructions
                instructions = []
                content.push(char)
            }
            inInstructionMode = false
        } else {
            if (inInstructionMode) {
                instructions.push(char)
            } else {
                content.push(char)
            }
        }
        previousChar = char
    }
    
    if (inInstructionMode && instructions.length > 0) {
        // this means there is not instructions, just content
        content = instructions
        instructions = []
    }

    return {
        instructions: getInstructionsForExpressions(instructions.join('')),
        content: content.join('')
    }
}

export function getSections(markup: string) : Section[] {
    if (markup === '') return []

    let sections = []
    let currentSection = []
    for (let char of markup) {
        if (char === SECTION_INDICATOR) {
            if (currentSection.length > 0) {
                sections.push(
                    createSection(currentSection.join(''))
                )
            }
            currentSection = []
        } else {
            currentSection.push(char)
        }
    }
    if (currentSection.length > 0) {
        sections.push(
            createSection(currentSection.join(''))
        )
    }

    return sections
}

export function parseMarkup(markup: string) : Section[] {
    return getSections(markup)
}
