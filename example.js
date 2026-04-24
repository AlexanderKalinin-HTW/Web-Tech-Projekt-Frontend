function oddNumbersOnly(arr) {
// n % 2 is truthy, which is good enough in JS (more about this soon)
// We could also explictly say n % 2 === 1
    return arr.filter(n => n % 2);
}
export default { oddNumbersOnly };
