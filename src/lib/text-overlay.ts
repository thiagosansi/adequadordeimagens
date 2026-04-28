export const GRID_SIZE = 5 // 5x5 = 25 cells (Meta's original overlay tool)
export const TEXT_WARNING_THRESHOLD = 20 // percent

/**
 * Returns the percentage of the image area covered by text,
 * based on the number of marked cells in the 5x5 grid.
 */
export function calculateTextPercentage(checkedCells: Set<number>): number {
  const totalCells = GRID_SIZE * GRID_SIZE
  return Math.round((checkedCells.size / totalCells) * 100)
}

/**
 * Returns 'pass' when text coverage is within the Meta guideline,
 * 'fail' when it exceeds the threshold.
 */
export function getTextOverlayStatus(percentage: number): 'pass' | 'fail' {
  return percentage <= TEXT_WARNING_THRESHOLD ? 'pass' : 'fail'
}
