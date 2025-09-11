// returns the mean of an array of numbers
function mean(s) {
    return s.reduce((a, b) => a + b, 0) / s.length;
}

// returns the min of an array of numbers
function min(s) {
    return Math.min(...s);
}

// returns the max of an array of numbers
function max(s) {
    return Math.max(...s);
}

export { mean, min, max };