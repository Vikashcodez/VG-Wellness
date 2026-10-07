/**
 * Generic Goal Progress Calculator
 * Supports DECREASE, INCREASE, MAINTAIN, ACHIEVE
 */
export function calculateGoalProgress(starting, current, target, direction = "DECREASE") {
  const startNum = parseFloat(starting) || 0;
  const currNum = parseFloat(current) || 0;
  const targetNum = parseFloat(target) || 0;

  let progressPct = 0;
  let remaining = 0;
  let totalChange = 0;
  let isAchieved = false;

  const dir = (direction || "DECREASE").toUpperCase();

  if (dir === "DECREASE") {
    totalChange = startNum - currNum;
    const totalRequired = startNum - targetNum;
    if (totalRequired !== 0) {
      progressPct = (startNum - currNum) / totalRequired * 100;
    }
    remaining = Math.max(0, currNum - targetNum);
    isAchieved = currNum <= targetNum;
  } else if (dir === "INCREASE") {
    totalChange = currNum - startNum;
    const totalRequired = targetNum - startNum;
    if (totalRequired !== 0) {
      progressPct = (currNum - startNum) / totalRequired * 100;
    }
    remaining = Math.max(0, targetNum - currNum);
    isAchieved = currNum >= targetNum;
  } else if (dir === "MAINTAIN") {
    const diff = Math.abs(currNum - targetNum);
    const tolerance = targetNum * 0.05 || 1; // within 5%
    progressPct = diff <= tolerance ? 100 : Math.max(0, 100 - (diff / tolerance) * 50);
    remaining = diff;
    isAchieved = diff <= tolerance;
  } else {
    // ACHIEVE (e.g. boolean or threshold)
    progressPct = currNum >= targetNum ? 100 : Math.max(0, (currNum / (targetNum || 1)) * 100);
    remaining = Math.max(0, targetNum - currNum);
    isAchieved = currNum >= targetNum;
  }

  // Bounds: min 0%, cap at 100% for display
  const boundedProgress = Math.min(100, Math.max(0, Math.round(progressPct * 10) / 10));

  let status = "ACTIVE";
  if (isAchieved) {
    status = "ACHIEVED";
  } else if (boundedProgress >= 50) {
    status = "ON_TRACK";
  } else {
    status = "IN_PROGRESS";
  }

  return {
    starting: startNum,
    current: currNum,
    target: targetNum,
    direction: dir,
    progressPercentage: boundedProgress,
    rawProgressPercentage: Math.round(progressPct * 10) / 10,
    remaining: Math.round(remaining * 100) / 100,
    totalChange: Math.round(totalChange * 100) / 100,
    isAchieved,
    status
  };
}
