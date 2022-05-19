import { parseMarkup, getSections, SECTION_INDICATOR, InstructionType, createSection } from './terminal-markup'
import { Terminal } from './terminal'

jest.mock('./terminal')

describe('getSections', () => {
    test('returns no sections if input is blank', () => {
        const markup = ''

        const sections = getSections(markup)

        expect(sections.length).toBe(0)
    })
    test('returns one section without instructions', () => {
        const markup = '|>Test|'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
        expect(sections[0].instructions.length).toBe(0)
    })
    test('returns one section with instructions', () => {
        const markup = '|b;i;u>Test|'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
        expect(sections[0].instructions.length).toBe(3)
    })
    test('returns one section while missing initial section indicator', () => {
        const markup = 'b>Test|'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
    })
    test('returns one section while missing ending section indicator', () => {
        const markup = '|b>Test'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
    })
    test('returns one section while missing all section indicators', () => {
        const markup = 'b>Test'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
    })
    test('returns one section with just some text', () => {
        const markup = 'Test'

        const sections = getSections(markup)

        expect(sections.length).toBe(1)
        expect(sections[0].content).toBe('Test')
    })
    test('returns two sections', () => {
        const markup = '|b>Test|Blah'

        const sections = getSections(markup)

        expect(sections.length).toBe(2)

        expect(sections[0].content).toBe('Test')

        expect(sections[1].content).toBe('Blah')
    })
    test('returns three sections', () => {
        const markup = '|b>Test|Blah|b>hurray!'

        const sections = getSections(markup)

        expect(sections.length).toBe(3)

        expect(sections[0].content).toBe('Test')

        expect(sections[1].content).toBe('Blah')

        expect(sections[2].content).toBe('hurray!')
    })
    test('returns 500 sections', () => {
    const markup = '|b;u;i>Test'.repeat(500)

        const sections = getSections(markup)

        expect(sections.length).toBe(500)

        for (let section of sections) {
            expect(section.content).toBe('Test')
            expect(section.instructions.length).toBe(3)
        }
    })
    test('returns no sections if input is only section indicators', () => {
        const markup = SECTION_INDICATOR.repeat(10)

        const sections = getSections(markup)

        expect(sections.length).toBe(0)
    })
})

describe('createSection', () => {
    test('gets instructions and content', () => {
        const markup = 'b>Hello'

        const section = createSection(markup)

        expect(section.content).toBe('Hello')
        expect(section.instructions.length).toBe(1)
        expect(section.instructions[0].instructionType).toBe(InstructionType.BoldOn)
    })
    test('handles escaped instruction indicator', () => {
        const markup = 'b~>Hello'

        const section = createSection(markup)

        expect(section.content).toBe('b>Hello')
        expect(section.instructions.length).toBe(0)
    })
})

describe('parseMarkup', () => {
    test('gets sections with correct content and instructions', () => {
        const markup = 'b>This| is |b>a| test. |u;i>Hopefully| it will work just fine.'

        const sections = parseMarkup(markup)

        expect(sections.length).toBe(6)

        expect(sections[0].content).toBe('This')
        expect(sections[0].instructions.length).toBe(1)
        expect(sections[0].instructions[0].instructionType).toBe(InstructionType.BoldOn)

        expect(sections[1].content).toBe(' is ')
        expect(sections[1].instructions.length).toBe(0)

        expect(sections[2].content).toBe('a')
        expect(sections[2].instructions.length).toBe(1)
        expect(sections[2].instructions[0].instructionType).toBe(InstructionType.BoldOn)

        expect(sections[3].content).toBe(' test. ')
        expect(sections[3].instructions.length).toBe(0)

        expect(sections[4].content).toBe('Hopefully')
        expect(sections[4].instructions.length).toBe(2)
        expect(sections[4].instructions[0].instructionType).toBe(InstructionType.UnderlineOn)
        expect(sections[4].instructions[1].instructionType).toBe(InstructionType.ItalicOn)

        expect(sections[5].content).toBe(' it will work just fine.')
        expect(sections[5].instructions.length).toBe(0)

        expect(sections.map(s => s.content).join('')).toBe('This is a test. Hopefully it will work just fine.')
    })
})