import { Chain } from "./chain"
import { Idea } from "./idea"

export class IdeaAlreadyExistsError extends Error {
    constructor() {
        super('Idea already exists!')
    }
}

export class Bucket {
    ideaMap: Map<string, Idea> = new Map()
    ideaChain: Chain<Idea> = new Chain()

    constructor(
        public name: string
    ) {}


    addIdea(idea: Idea) {
        if (this.ideaMap.has(idea.id)) {
            throw new IdeaAlreadyExistsError()
        }
        if (!this.ideaChain.getStartingLink()) {
            this.ideaChain.setStartingLink(idea)
        } else {
            this.ideaChain.getEndingLink().append(idea)
        }
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