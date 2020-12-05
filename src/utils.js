/**
 * Returns current size of browser window
 * @return {{width: number, height: number}}
 */
export function getCanvasSize() {
    return {
        height: window.innerHeight,
        width: window.innerWidth
    }
}