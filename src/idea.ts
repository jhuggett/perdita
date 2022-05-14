import { Link } from "./link"

export class Idea extends Link {
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