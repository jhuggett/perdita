import { Link } from "./link"

export class Chain<T extends Link> {
    private startingLink: T | null = null
    getStartingLink() {
        if (!this.startingLink) return null
        if (this.startingLink.previous) {
            this.startingLink = this.startingLink.lookBehind() as T
        }
        return this.startingLink     
    }

    private endLink: T | null = null
    getEndingLink() {
        if (!this.endLink) {
            if (!this.startingLink) return null
            this.endLink = this.startingLink
        }
        if (this.endLink.next) {
            this.endLink = this.endLink.lookAhead() as T
        }
        return this.endLink
    }

    setStartingLink(link: T) {
        this.startingLink = link    
    }
}
