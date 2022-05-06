#!/usr/bin/env node

import { Box, getFullscreenBoxConfig } from "./box"
import { input, keypress, Keys, target, Terminal } from "./Terminal"
import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs"
import { join } from 'path'

export const MAIN_FOLDER_NAME = '.perdita'

export class IdeaAlreadyExistsError extends Error {
    constructor() {
        super('Idea already exists!')
    }
}

class Bucket {
    ideas: Idea[] = []
    ideaMap: Map<string, Idea> = new Map()


    start: Idea | null
    end: Idea | null

    constructor(
        public name: string
    ) {}


    addIdea(idea: Idea) {
        if (this.ideaMap.has(idea.id)) {
            throw new IdeaAlreadyExistsError()
        }
        idea.rank = this.ideas.length
        this.ideas.push(idea)
        this.ideaMap.set(idea.id, idea)
    }
    

    persist = () => {

    }

    static load = (data: string) => {
        // parse data
        // make bucket filled with data
        // return bucket

        return new Bucket('')
    } 
}

class Link {
    next: Link | null
    previous: Link | null


    append(link: Link) {
        if (this.next) {
            this.next.previous = link
        }
        link.previous = this
        link.next = this.next
        this.next = link
    }

    prepend(link: Link) {
        if (this.previous) {
            this.previous.next = link
        }
        link.previous = this.previous
        link.next = this
        this.previous = link
    }

    remove() {
        if (this.previous && this.next) {
            this.previous.next = this.next
            this.next.previous = this.previous
        } else if (this.previous) {
            this.previous.next = null
        } else if (this.next) {
            this.next.previous = null
        }
    }
}

class Idea extends Link {
    constructor(
        public name: string,
        public rank: number | null = null
    ) {
        super()
    }

    get id() {
        return this.name
    }


    previous: Idea | null
    next: Idea | null

    moveUp() {
        if (this.previous) {
            const previousPrevious = this.previous
            const previousNext = this.next

            this.previous = previousPrevious.previous
            this.next = previousPrevious

            previousPrevious.previous = this
            previousPrevious.next = previousPrevious

            previousNext.previous = previousPrevious

            this.rank--
        } else {
            throw new Error(`Can't go higher!`)
        }
    }

    moveDown() {

    }
}


class NoBucketsExistError extends Error {
    constructor() {
        super("No buckets exist!")
    }
}

class DuplicateBucketNameError extends Error {
    constructor() {
        super("Bucket name is already in use!")
    }
}

class BucketManager {
    buckets: Bucket[] = []
    private bucketMap: Map<string, Bucket> = new Map()
    private bucketsFolderName = "buckets"

    constructor(
        private pathToBucketsData: string
    ) {}


    loadBucketsFromFileSystem() {
        const pathToBucketFolder = join(this.pathToBucketsData, this.bucketsFolderName)

        const files = readdirSync(pathToBucketFolder)

        if (files.length < 1) {
            throw new NoBucketsExistError()
        }

        for (let filename of files) {
            const path = join(pathToBucketFolder, filename)
            const fileContents = readFileSync(path, 'utf-8')
            const bucket = Bucket.load(fileContents)
            this.addBucket(bucket)
        }
    }

    getBucket(name: string) {
        return this.bucketMap.get(name)
    }

    hasBucket(name: string) {
        return this.bucketMap.has(name)
    }

    addBucket(bucket: Bucket) {
        // check for dup name
        if (this.hasBucket(bucket.name)) {
            throw new DuplicateBucketNameError()
        }

        // otherwise add the bucket
        this.buckets.push(bucket)
        this.bucketMap.set(bucket.name, bucket)
    }

    getDefaultBucket() {
        return this.buckets[0]
    }
}

const interactionLoop = async (main: Box, pathToPerdita: string) => {
    const bucketManager = new BucketManager(pathToPerdita)

    try {
        bucketManager.loadBucketsFromFileSystem()
    } catch (error) {
        if (error instanceof NoBucketsExistError || (error.message as string).includes('ENOENT')) {
            bucketManager.addBucket(
                new Bucket("Braindump")
            )
        } else {
            throw error
        }
    }

    let currentBucket = bucketManager.getDefaultBucket()

    await interactWithBucket(main, currentBucket)
}

const interactWithBucket = async (main: Box, bucket: Bucket) => {
    const linesAvailible = main.paddedHeight
    
    let indexes = new Map([[0, 0]])
    let horizontalMovement = 0
    const limitRight = 1
    const limitLeft = 0

    const getCurrentIndex = () => indexes.get(horizontalMovement)
    const getCurrentIdea = () => bucket.ideas[getCurrentIndex()]


    const render = () => {
        main.focus()
        main.clear()
        if (bucket.ideas.length === 0) {
            main.write(`None of your ideas have been captured yet.`)
            main.writeOnNewline('Best get writing! Press |fg[green];b>+| to add an idea')
        } else {
            const currentIndex = getCurrentIndex()
            const currentIdea = getCurrentIdea()
            for (let [index, idea] of bucket.ideas.entries()) {
                
                if (index)

            }
        }
        
    }

    let shouldContinue = true

    while (shouldContinue) {
        render()

        try {
            const response = await input({
                targets: [
                    target(Keys.PlusSign, async () => {
                        const idea = await newIdeaInteraction(main)
                        if (idea) {
                            // add idea to bucket
                            // scrolls to the new idea
                            try {
                                bucket.addIdea(idea)
                                currentIndex = idea.rank
                                current = idea
                            } catch (error) {
                                throw error // need to handle duplicate names here
                            }
                        }
                    }),
                    target(Keys.Escape, async () => {
                        shouldContinue = false
                    }),
                    target(Keys.ArrowDown, async () => {
                        currentIndex = (currentIndex + 1) % bucket.ideas.length
                        if (horizontalMovement === 0) {
                            current = bucket.ideas[currentIndex]
                        }
                    }),
                    target(Keys.ArrowUp, async () => {
                        currentIndex = currentIndex - 1 < 0 ? bucket.ideas.length - 1 : currentIndex - 1
                        if (horizontalMovement === 0) {
                            current = bucket.ideas[currentIndex]
                        }
                    }),
                    target(Keys.ArrowRight, async () => {
                        if (horizontalMovement + 1 <= limitRight) {
                            horizontalMovement++
                        }
                    }),
                    target(Keys.ArrowLeft, async () => {
                        if (horizontalMovement - 1 >= limitLeft) {
                            horizontalMovement--
                            
                            if (horizontalMovement === 0) {
                                if (currentIndex != current.rank) {
                                    let resortedIdeas = []
                                    for (let [index, idea] of bucket.ideas.entries()) {
                                        if (currentIndex === index) {
                                            resortedIdeas.push()
                                        }
                                        if (idea.id !== current.id) {
                                            resortedIdeas.push(idea)
                                        }
                                    }
                                    resortedIdeas.forEach((val, i) => val.rank = i)
                                    bucket.ideas = resortedIdeas
                                }
                            }
                        }
                    })
                    
                ]
            })
        
            await response()
        } catch (error) {
            
        } 
    }
}

const newIdeaInteraction = async (box: Box) : Promise<Idea | void> => {
    let name = ''
    let shouldContinue = true
    let done = false

    while (shouldContinue && !done) {
        box.clearLine()
        box.write(
            `Write your idea here (press enter to finish, or escape to cancel): ${name}`
        )
        box.terminal.showCursor()

        ;(await input<() => void>({
            targets: [
                target(Keys.Enter, () => done = true),
                target(Keys.Escape, () => shouldContinue = false),
                target(Keys.Backspace, () => name = name.slice(0, -1)),   
            ],
            catchAll: (raw: Buffer) => () => {
                name += raw.toString()
            }
        }))()

        box.terminal.hideCursor()
    }
    if (done) {
        return new Idea(name)
    }
}


const setupFolder = async (box: Box, cwd: string, folderName: string, pathToPerdita: string) => {
    box.return()
    box.write(`|fg[red]>WARNING:| a |fg[210,100,240]>${folderName}| folder cannot be found.`)
    box.return()
    if (await box.userInput.requestConfirmation(`Make a new one here |fg[green]>${cwd}|?`)) {
        // create the folder
        mkdirSync(pathToPerdita)
        box.writeOnNewline('|fg[green]>Success|: Folder created')
        box.return()
        await box.userInput.pressAnyKeyToContinue()
    } else {
        box.writeOnNewline('Very well, have it your way...')
        process.exit()
    }
}

(async () => {
    const terminal = new Terminal() 
    terminal.hideCursor()
    terminal.clearScreen()

    const cwd = process.cwd()
    const pathToPerdita = join(cwd, MAIN_FOLDER_NAME)

    const main = new Box(getFullscreenBoxConfig(terminal))
    main.borderWidth = 2
    main.moveCursor.to.start()
    main.write(`|fg[210,100,240];b;u>Perdita|`)
    
    if (!existsSync(pathToPerdita)) {
         await setupFolder(main, cwd, MAIN_FOLDER_NAME, pathToPerdita)
    }

    await interactionLoop(main, pathToPerdita)
})()

process.on("exit", () => {
    const terminal = new Terminal()
    terminal.showCursor()
    terminal.setRawMode(false)
    terminal.clearScreen()
    terminal.style.resetAll()
  })