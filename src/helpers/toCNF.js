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

function resolveImplication(expression, symbol) {
  const [left, right] = expression.split(symbol);

  return symbol === "→"
    ? `¬${left.startsWith("¬") ? `(${left})` : left}∨${right}`
    : `((¬${left.startsWith("¬") ? `(${left})` : left}∨${right})∧(¬${
        right.startsWith("¬") ? `(${right})` : right
      }∨${left}))`;
}

export default function toCNF(expression) {
  function eliminateImplicationsAndBiconditionals(expr) {
    let tempExpr = expr;

    if (!tempExpr.includes("→") && !tempExpr.includes("↔")) {
      return tempExpr;
    }

    while (tempExpr.includes("→")) {
      let implicationIndex = tempExpr.indexOf("→");
      const implicationSegment = extractImplicationAtIndex(
        tempExpr,
        implicationIndex,
        "→"
      );
      let resolvedImplication = resolveImplication(implicationSegment, "→");
      tempExpr = tempExpr.replace(implicationSegment, resolvedImplication);
    }

    while (tempExpr.includes("↔")) {
      let biconditionalIndex = tempExpr.indexOf("↔");
      const biconditionalSegment = extractImplicationAtIndex(
        tempExpr,
        biconditionalIndex,
        "↔"
      );
      let resolvedBiconditional = resolveImplication(biconditionalSegment, "↔");
      tempExpr = tempExpr.replace(biconditionalSegment, resolvedBiconditional);
    }

    return tempExpr;
  }

  // Helper to move NOT inward using De Morgan's Laws

  function needsNOTResolvement(expr) {
    return expr.match(/¬\(\s*¬\s*([A-Z])\s*\)/g);
  }

  function moveNotInward(expr) {
    let tempExpr = expr;

    while (needsNOTResolvement(tempExpr)) {
      console.log({ tempExpr });
    }

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
