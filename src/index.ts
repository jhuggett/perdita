#!/usr/bin/env node

import { Box, getFullscreenBoxConfig } from "./box"
import { input, keypress, Keys, round, target, Terminal } from "./Terminal"
import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs"
import { join } from 'path'
import { Bucket } from "./bucket"
import { BucketManager, NoBucketsExistError } from "./bucket-manager"
import { Idea } from "./idea"

export const MAIN_FOLDER_NAME = '.perdita'


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
    const linesPerSide = round(linesAvailible - 1 / 2, 'down')
    
    let horizontalMovement = 0
    const limitRight = 1
    const limitLeft = 0

    const debug = false

    let currentIdea: Idea | null = bucket.ideaChain.getStartingLink()


    // switch (player.previousTile.coor.getDirection(player.tile.coor)[0]) {
    //     case Direction.east: {
    //       return '►'
    //     }
    //     case Direction.south: {
    //       return '▼'
    //     }
    //     case Direction.west: {
    //       return '◄'
    //     }
    //     case Direction.north: {
    //       return '▲'
    //     }
    //   }

    const render = () => {
        main.clear()
        .write(`underline;foreground[green]>${bucket.name}:`)
        .return()
        .return()
        if (!currentIdea) {
            main.write(`None of your ideas have been captured yet.`)
            main.writeOnNewline('Best get writing! Press |fg[green];b>+| to add an idea')
        } else {
            const ideaBefore = currentIdea.getLinksBefore(linesPerSide) as Idea[]
            const ideasAfter = currentIdea.getLinksAfter(linesPerSide) as Idea[]

            const ideasToRender = [
                ...ideaBefore.reverse(),
                currentIdea,
                ...ideasAfter
            ]

            for (let idea of ideasToRender) {
                const debugData = ` ::: p: ${idea.previous?.name ?? '-'}, n: ${idea.next?.name ?? '-'}`

                if (idea.id === currentIdea.id) {
                    switch (horizontalMovement) {
                        case 1: {
                            main.write(`b>◄ ${idea.name} ►`)
                            break
                        }
                        default: {
                            main.write(`b>◄► ${idea.name}`)
                        }
                    }
                } else {
                    main.write(`   ${idea.name}`)
                }
                main.return()
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
                        const idea = await newIdeaInteraction(main, (idea) => {
                            if (bucket.ideaMap.has(idea)) {
                                return 'Idea already exists!'
                            }
                            if (!idea.replace(/\s/g, '').length) { // only whitespaces
                                return `Well that's not much of an idea.`
                            }

                            return null
                        })
                        if (idea) {
                            // add idea to bucket
                            // scrolls to the new idea
                            try {
                                bucket.addIdea(idea)
                                currentIdea = bucket.ideaChain.getEndingLink()
                            } catch (error) {
                                throw error 
                            }
                        }
                    }),
                    target(Keys.Escape, async () => {
                        shouldContinue = false
                    }),
                    target(Keys.ArrowDown, async () => {
                        if (currentIdea) {
                            const prev = currentIdea
                            if (!currentIdea.next) {
                                currentIdea = bucket.ideaChain.getStartingLink()
                                if (horizontalMovement === 1 && prev !== currentIdea) {
                                    prev.remove()
                                    currentIdea.prepend(prev)
                                    currentIdea = prev
                                }
                            } else {
                                currentIdea = currentIdea.next
                                if (horizontalMovement === 1) {
                                    prev.swap(currentIdea)
                                    currentIdea = prev
                                }
                            }
                        }
                    }),
                    target(Keys.ArrowUp, async () => {
                        if (currentIdea) {
                            const prev = currentIdea
                            if (!currentIdea.previous) {
                                currentIdea = bucket.ideaChain.getEndingLink()
                                if (horizontalMovement === 1 && prev !== currentIdea) {
                                    prev.remove()
                                    currentIdea.append(prev)
                                    currentIdea = prev
                                }
                            } else {
                                currentIdea = currentIdea.previous
                                if (horizontalMovement === 1) {
                                    prev.swap(currentIdea)
                                    currentIdea = prev
                                }
                            }
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
                        }
                    })
                    
                ]
            })
        
            await response()
        } catch (error) {
            
        } 
    }
}

const newIdeaInteraction = async (box: Box, validate: (idea: string) => string | null) : Promise<Idea | void> => {
    let name = ''
    let shouldContinue = true
    let done = false

    while (shouldContinue) {
        box.clear()
        if (done) {
            const validation = validate(name)
            if (validation) {
                box.write(`fg[red]>${validation}`)
                .return()
                done = false
            } else {
                break
            }
        }
        box.write(
            `|b;i>Enter your idea (ESC to cancel):| ${name}`
        )
        box.terminal.showCursor()

        ;(await input<() => void>({
            targets: [
                target(Keys.Enter, () => done = true),
                target(Keys.Escape, () => {
                    shouldContinue = false
                    done = false
                }),
                target(Keys.Backspace, () => name = name.slice(0, -1)),  
                target(Keys.Delete, () => name = name.slice(0, -1)),
                target(Keys.ArrowUp, () => undefined),
                target(Keys.ArrowRight, () => undefined),
                target(Keys.ArrowDown, () => undefined),
                target(Keys.ArrowLeft, () => undefined),
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