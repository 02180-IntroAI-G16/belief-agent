// Returns true iff `beliefBase` logically entails `formula`
export function entails(beliefBase, formula) {
  // Build a new base: all beliefs + the negation of the target formula
  const testBase = [...beliefBase, `¬(${formula})`];
  // If that augmented base is inconsistent, then entailment holds
  return !isConsistent(testBase);
}

// === Evaluate Logical Formula ===
export function evaluateFormula(formula, assignment) {
  formula = formula.trim();

  // Atomic proposition
  if (/^[A-Z]$/.test(formula)) {
    return assignment[formula];
  }

  // Negation
  if (formula.startsWith("¬")) {
    return !evaluateFormula(formula.slice(1), assignment);
  }

  // Remove outer parentheses
  if (formula.startsWith("(") && formula.endsWith(")")) {
    formula = formula.slice(1, -1);
  }

  const operators = ["↔", "→", "∨", "∧"];

  for (let op of operators) {
    let depth = 0;
    for (let i = 0; i < formula.length; i++) {
      if (formula[i] === "(") depth++;
      if (formula[i] === ")") depth--;
      if (depth === 0 && formula[i] === op) {
        const left = formula.slice(0, i);
        const right = formula.slice(i + 1);
        switch (op) {
          case "∧":
            return (
              evaluateFormula(left, assignment) &&
              evaluateFormula(right, assignment)
            );
          case "∨":
            return (
              evaluateFormula(left, assignment) ||
              evaluateFormula(right, assignment)
            );
          case "→":
            return (
              !evaluateFormula(left, assignment) ||
              evaluateFormula(right, assignment)
            );
          case "↔":
            return (
              evaluateFormula(left, assignment) ===
              evaluateFormula(right, assignment)
            );
          default:
            return false;
        }
      }
    }
  }

  return false;
}

// === Get Unique Atoms from Belief Base ===
export function getUniqueAtoms(beliefs) {
  const atoms = new Set();
  beliefs.forEach((f) => {
    const matches = f.match(/[A-Z]/g);
    if (matches) matches.forEach((m) => atoms.add(m));
  });
  return Array.from(atoms);
}

// === Generate All Possible Truth Assignments ===
export function generateTruthAssignments(atoms) {
  const results = [];
  const total = 1 << atoms.length;
  for (let i = 0; i < total; i++) {
    const assignment = {};
    atoms.forEach((atom, index) => {
      assignment[atom] = !!(i & (1 << index));
    });
    results.push(assignment);
  }
  return results;
}

// === Check Belief Base Consistency ===
export function isConsistent(beliefBase) {
  const atoms = getUniqueAtoms(beliefBase);

  const truthAssignments = generateTruthAssignments(atoms);

  for (let assignment of truthAssignments) {
    let allTrue = true;
    for (let formula of beliefBase) {
      if (!evaluateFormula(formula, assignment)) {
        allTrue = false;
        break;
      }
    }
    if (allTrue) return true;
  }

  return false;
}

// === Contract Belief Base ===
export const contractBeliefBase = (beliefBase, beliefToRemove) => {
  return beliefBase.filter((b) => b !== beliefToRemove);
};

// === Expand Belief Base (Prevent Duplicate) ===
export const expandBeliefBase = (beliefBase, newBelief) => {
  if (beliefBase.includes(newBelief)) {
    return beliefBase;
  }
  return [...beliefBase, newBelief];
};

// === AGM Revision Using Levi Identity: revise(p) = contract(¬p) + p ===
export const reviseBeliefBase = (beliefBase, newBelief) => {
  let updatedBeliefs = [...beliefBase];
  let steps = [];

  // Step 1: Check if the belief already exists in the belief base
  if (updatedBeliefs.includes(newBelief)) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBelief} already exists. No revision needed.
      </h6>
    );
    return { updatedBeliefs, steps };
  }

  // Step 2: Expand the belief base by adding the new belief (check if it's already added)
  updatedBeliefs = expandBeliefBase(updatedBeliefs, newBelief);

  steps.push(
    <h6 className="bg-green-200 p-2 rounded text-md">
      Expanded belief base with new belief: {newBelief}
    </h6>
  );

  // Step 3: Check if adding the new belief causes inconsistency
  if (entails(updatedBeliefs)) {
    steps.push(
      <h6 className="bg-green-300 p-2 rounded text-md">
        No inconsistency, belief base updated successfully.
      </h6>
    );
    return { updatedBeliefs, steps };
  } else {
    // Step 4: If inconsistent, try contracting by removing conflicting beliefs
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Adding {newBelief} causes inconsistency. Trying to resolve...
      </h6>
    );

    let found = false;
    // Try to remove minimal beliefs to resolve inconsistency
    for (let i = 0; i < updatedBeliefs.length; i++) {
      const beliefToRemove = updatedBeliefs[i];
      const contractedBase = contractBeliefBase(updatedBeliefs, beliefToRemove);

      if (isConsistent(contractedBase)) {
        // Successfully resolved inconsistency
        updatedBeliefs = [...contractedBase];
        steps.push(
          <h6 className="bg-sky-200 p-2 rounded text-md">
            Removed conflicting belief: {beliefToRemove}
          </h6>
        );
        steps.push(
          <h6 className="bg-green-200 p-2 rounded text-md">
            Added new belief: {newBelief}
          </h6>
        );
        found = true;
        break;
      }
    }

    if (!found) {
      steps.push(
        <h6 className="bg-yellow-200 p-2 rounded text-md">
          Could not resolve inconsistency. New belief not added.
        </h6>
      );
    }
  }

  return { updatedBeliefs, steps };
};
