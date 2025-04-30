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
    : `(¬${left.startsWith("¬") ? `(${left})` : left}∨${right})∧(¬${
        right.startsWith("¬") ? `(${right})` : right
      }∨${left})`;
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
    console.log({ resolvedBiconditional, biconditionalSegment, tempExpr });
  }

  return tempExpr;
}

// Helper to tokenize the expression
function tokenize(input) {
  return input.match(/¬|∧|∨|\(|\)|[A-Z]+/g);
}

// create Abstract symtax tree
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

// Convert AST back to string representation
function exprToString(ast) {
  if (ast.type === "var") return ast.value;
  if (ast.type === "not") return `¬${exprToString(ast.children[0])}`;
  const op = ast.type === "and" ? "∧" : "∨";
  return `(${exprToString(ast.children[0])}${op}${exprToString(
    ast.children[1]
  )})`;
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

// Helper to distribute OR over AND
function distributeOrOverAnd(expr) {
  const tokens = tokenize(expr);
  let ast = parseToAST(tokens);

  ast = distributeOrOverAndInAST(ast);

  return exprToString(ast);
}

function distributeOrOverAndInAST(ast) {
  // Base cases
  if (ast.type === "var") return ast;
  if (ast.type === "not") {
    return {
      type: "not",
      children: [distributeOrOverAndInAST(ast.children[0])],
    };
  }

  // First recursively distribute in children
  const left = distributeOrOverAndInAST(ast.children[0]);
  const right = distributeOrOverAndInAST(ast.children[1]);

  if (ast.type === "or") {
    // Case 1: (A ∧ B) ∨ C → (A ∨ C) ∧ (B ∨ C)
    if (left.type === "and") {
      return {
        type: "and",
        children: [
          { type: "or", children: [left.children[0], right] },
          { type: "or", children: [left.children[1], right] },
        ],
      };
    }
    // Case 2: A ∨ (B ∧ C) → (A ∨ B) ∧ (A ∨ C)
    else if (right.type === "and") {
      return {
        type: "and",
        children: [
          { type: "or", children: [left, right.children[0]] },
          { type: "or", children: [left, right.children[1]] },
        ],
      };
    }
    // Case 3: (A ∧ B) ∨ (C ∧ D) → (A ∨ C) ∧ (A ∨ D) ∧ (B ∨ C) ∧ (B ∨ D)
    else if (left.type === "and" && right.type === "and") {
      const leftDistributions = left.children.map((lChild) => ({
        type: "and",
        children: right.children.map((rChild) => ({
          type: "or",
          children: [lChild, rChild],
        })),
      }));

      // Flatten the structure
      return {
        type: "and",
        children: leftDistributions.flatMap((x) => x.children),
      };
    }
  }

  // For AND nodes or non-distributable OR nodes
  return { type: ast.type, children: [left, right] };
}

function removeUnnecessaryBrackets(expr) {
  const tokens = tokenize(expr);
  const ast = parseToAST(tokens);

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
