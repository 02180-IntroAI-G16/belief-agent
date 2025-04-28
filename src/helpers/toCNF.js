function extractImplicationAtIndex(expression, index, symbol = "→") {
  // Find the start of the left side (go backward until we hit a boundary like '(', '∧', '∨', or space)
  let leftStart = index - 1;
  let nestedLeftSideCount = 0;
  let nestedRightSideCount = 0;

  while (
    (leftStart >= 0 && !["∧", "∨", "("].includes(expression[leftStart])) ||
    nestedLeftSideCount !== 0
  ) {
    if (expression[leftStart] === ")") nestedLeftSideCount++;
    if (expression[leftStart] === "(") nestedLeftSideCount--;
    leftStart--;
  }
  leftStart++;

  // Find the end of the right side (go forward until we hit a boundary like '(', '∧', '∨', or space)
  let rightEnd = index + 1;
  while (
    (rightEnd < expression.length &&
      !["∧", "∨", ")"].includes(expression[rightEnd])) ||
    nestedRightSideCount !== 0
  ) {
    if (expression[rightEnd] === "(") nestedRightSideCount++;
    if (expression[rightEnd] === ")") nestedRightSideCount--;
    rightEnd++;
  }

  const leftSide = expression.slice(leftStart, index).trim();
  const rightSide = expression.slice(index + 1, rightEnd).trim();

  return `${leftSide}${symbol}${rightSide}`;
}

export default function toCNF(expression) {
  function processImplication(expression, symbol) {
    const [left, right] = expression.split(symbol);
    return symbol === "→"
      ? `¬${left}∨${right}`
      : `((¬${left}∨${right})∧(¬${right}∨${left}))`;
  }

  function eliminateImplicationsAndBiconditionals(expr) {
    let exppp = expr;

    if (!exppp.includes("→") && !exppp.includes("↔")) {
      return exppp;
    }

    // Process all implications (→)
    while (exppp.includes("→")) {
      let index = exppp.indexOf("→");

      const implication = extractImplicationAtIndex(exppp, index, "→");
      let updatedExpr = processImplication(implication, "→");

      exppp = exppp.replace(implication, updatedExpr);
    }

    // Process all biconditionals (↔)
    while (exppp.includes("↔")) {
      let index = exppp.indexOf("↔");

      const biconditional = extractImplicationAtIndex(exppp, index, "↔");
      let updatedExpr = processImplication(biconditional, "↔");

      exppp = exppp.replace(biconditional, updatedExpr);
    }

    return exppp;
  }

  // Helper to move NOT inward using De Morgan's Laws
  function moveNotInward(expr) {
    let prev;
    do {
      prev = expr;
      expr = expr.replace(/¬\(([^()]+)∧([^()]+)\)/g, "(¬$1∨¬$2)");
      expr = expr.replace(/¬\(([^()]+)∨([^()]+)\)/g, "(¬$1∧¬$2)");
      expr = expr.replace(/¬¬([^()]+)/g, "$1");
    } while (expr !== prev);
    return expr;
  }

  // Helper to distribute OR over AND
  function distributeOrOverAnd(expr) {
    const orAnd = /\(([^()]+)\)∨\(([^()]+)\)/;
    let match;
    while ((match = expr.match(orAnd))) {
      const [_, left, right] = match;
      const leftParts = left.split("∧");
      const rightParts = right.split("∧");
      if (leftParts.length > 1) {
        expr = expr.replace(
          match[0],
          `(${leftParts.map((l) => `(${l}∨(${right}))`).join("∧")})`
        );
      } else if (rightParts.length > 1) {
        expr = expr.replace(
          match[0],
          `(${rightParts.map((r) => `(${r}∨(${left}))`).join("∧")})`
        );
      } else {
        expr = expr.replace(match[0], `(${left}∨${right})`);
      }
    }
    return expr;
  }

  // Step 1: Eliminate implications
  expression = eliminateImplicationsAndBiconditionals(expression);

  // Step 2: Move NOTs inward
  expression = moveNotInward(expression);

  // Step 3: Distribute OR over AND
  expression = distributeOrOverAnd(expression);

  return expression;
}
