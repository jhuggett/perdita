import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { Bucket } from "./bucket"


export class NoBucketsExistError extends Error {
    constructor() {
        super("No buckets exist!")
    }
}

export class DuplicateBucketNameError extends Error {
    constructor() {
        super("Bucket name is already in use!")
    }
}

export class BucketManager {
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