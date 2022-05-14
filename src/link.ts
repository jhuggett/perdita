

export class Link {
    next: Link | null
    previous: Link | null

    swap(link: Link) {
        const a = this
        const b = link

        const aNext = a.next
        const aPrevious = a.previous

        const bNext = b.next
        const bPrevious = b.previous

        if (aNext === b) {
            a.next = bNext
            a.previous = b
            b.previous = aPrevious
            b.next = a

            if (aPrevious) {
                aPrevious.next = b
            }
            if (bNext) {
                bNext.previous = a
            }
        } else if (aPrevious === b) {
            a.previous = bPrevious
            a.next = b
            b.next = aNext
            b.previous = a

            if (aNext) {
                aNext.previous = b
            }
            if (bPrevious) {
                bPrevious.next = a
            }
        } else {
            a.next = bNext
            a.previous = bPrevious
            b.next = aNext
            b.previous = aPrevious

            if (aPrevious) {
                aPrevious.next = b
            }
            if (aNext) {
                aNext.previous = b
            }
            if (bPrevious) {
                bPrevious.next = a
            }
            if (bNext) {
                bNext.previous = a
            }
        }
    }

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

    getLinksAfter(limit: number | null = null) {
        let links: Link[] = []
        let current: Link = this
        while ((limit === null || links.length < limit) && current.next) {
            links.push(current.next)
            current = current.next
        }
        return links
    }

    getLinksBefore(limit: number | null = null) {
        let links: Link[] = []
        let current: Link = this
        while ((limit === null || links.length < limit) && current.previous) {
            links.push(current.previous)
            current = current.previous
        }
        return links
    }

    lookAhead(steps: number | null = null) {
        let stepsTaken = 0
        let current: Link = this
        while ((steps === null || stepsTaken < steps) && current.next) {
            current = current.next
            stepsTaken++
        }
        return current
    }

    lookBehind(steps: number | null = null) {
        let stepsTaken = 0
        let current: Link = this
        while ((steps === null || stepsTaken < steps) && current.previous) {
            current = current.previous
            stepsTaken++
        }
        return current
    }
}