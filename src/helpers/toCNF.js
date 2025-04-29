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

// Helper to tokenize the expression
function tokenize(input) {
  return input.match(/¬|∧|∨|\(|\)|[A-Z]+/g);
}

function parseToAST(tokens) {
  let pos = 0;

  function parseExpr() {
    let left = parseTerm();
    while (
      pos < tokens.length &&
      (tokens[pos] === "∧" || tokens[pos] === "∨")
    ) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = { type: op === "∧" ? "and" : "or", children: [left, right] };
    }
    return left;
  }

  function parseTerm() {
    if (tokens[pos] === "¬") {
      pos++;
      return { type: "not", children: [parseTerm()] };
    }
    if (tokens[pos] === "(") {
      pos++;
      const expr = parseExpr();
      if (tokens[pos] !== ")") throw new Error("Missing closing parenthesis");
      pos++;
      return expr;
    }
    return { type: "var", value: tokens[pos++] };
  }

  return parseExpr();
}

// Move NOTs inward using De Morgan's Laws
function moveNotInward(ast) {
  if (ast.type === "not") {
    const inner = moveNotInward(ast.children[0]);

    // Apply rule ¬(¬A) → A
    if (inner.type === "not") {
      return moveNotInward(inner.children[0]);
    }

    // Apply De Morgan's Law for AND and OR
    if (inner.type === "and") {
      return {
        type: "or",
        children: inner.children.map((c) =>
          moveNotInward({ type: "not", children: [c] })
        ),
      }; // ¬(A∧B) → (¬A ∨ ¬B)
    }
    if (inner.type === "or") {
      return {
        type: "and",
        children: inner.children.map((c) =>
          moveNotInward({ type: "not", children: [c] })
        ),
      }; // ¬(A∨B) → (¬A ∧ ¬B)
    }

    return { type: "not", children: [inner] }; // Keep ¬ for other cases
  }

  if (ast.type === "and" || ast.type === "or") {
    return { type: ast.type, children: ast.children.map(moveNotInward) };
  }

  return ast;
}

// Convert AST back to string representation
function exprToString(ast) {
  if (ast.type === "var") return ast.value;
  if (ast.type === "not") return `¬${exprToString(ast.children[0])}`;
  const op = ast.type === "and" ? "∧" : "∨";
  return `(${exprToString(ast.children[0])}${op}${exprToString(
    ast.children[1]
  )})`;
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

function removeUnnecessaryBrackets(expr) {
  const tokens = tokenize(expr);
  const ast = parseToAST(tokens);

  // Then, convert back to string with minimal brackets
  return astToStringWithMinimalBrackets(ast);
}

// Helper: Convert AST back to string with minimal brackets
function astToStringWithMinimalBrackets(ast, parentPrecedence = 0) {
  const precedence = {
    or: 1,
    and: 2,
    not: 3,
    var: 4,
  };

  if (ast.type === "var") {
    return ast.value;
  }

  if (ast.type === "not") {
    const childStr = astToStringWithMinimalBrackets(
      ast.children[0],
      precedence["not"]
    );
    return `¬${childStr}`;
  }

  const currentPrecedence = precedence[ast.type];
  const leftStr = astToStringWithMinimalBrackets(
    ast.children[0],
    currentPrecedence
  );
  const rightStr = astToStringWithMinimalBrackets(
    ast.children[1],
    currentPrecedence
  );

  const op = ast.type === "and" ? "∧" : "∨";
  const exprStr = `${leftStr}${op}${rightStr}`;

  // Only add brackets if needed (lower precedence than parent)
  if (currentPrecedence < parentPrecedence) {
    return `(${exprStr})`;
  } else {
    return exprStr;
  }
}

export default function toCNF(expression) {
  // Step 1: Eliminate implications
  expression = eliminateImplicationsAndBiconditionals(expression);
  console.log({ expression1: expression });
  // Step 2: Move NOTs inward
  const tokens = tokenize(expression);
  const ast = parseToAST(tokens);
  expression = exprToString(moveNotInward(ast));
  console.log({ expression2: expression });

  // Step 3: Distribute OR over AND
  expression = distributeOrOverAnd(expression);
  console.log({ expression3: expression });

  return removeUnnecessaryBrackets(expression);
}
