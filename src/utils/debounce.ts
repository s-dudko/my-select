export const debounce = (cb: Function, delay: number) => {
    let timerID: number | undefined = undefined;

    return function (...args: any) {
        clearTimeout(timerID);
  
        timerID = setTimeout(() => {
            cb(...args);
        }, delay);
    }
}
