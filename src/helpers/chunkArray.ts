export const chunkArray = <T>(arr: Array<T>, chunkSize: number): Array<Array<T>> => {
    return new Array(Math.ceil(arr.length/chunkSize)).fill(1).map((_, i) => arr.slice(i*chunkSize, i*chunkSize + chunkSize));
}