export function isEntailed(beliefBase, formula) {
  const negatedFormula = negateBelief(formula);
  const baseClauses = [];
  
  beliefBase.forEach(belief => {
    const clauses = beliefToClauses(belief);
    baseClauses.push(...clauses);
  });

  const negatedFormulaClauses = beliefToClauses(negatedFormula);
  const allClauses = [...baseClauses, ...negatedFormulaClauses];

  return !isConsistent(allClauses);
}


export const negateBelief = (belief) => {
  if (belief.startsWith("¬")) {
    return belief.slice(1);
  } else {
    return `¬${belief}`;
  }
};

export const isComplementary = (atom1, atom2) => {
  return atom1 === negateBelief(atom2);
}

export const resolveClauses = (clause1, clause2) => {
  for (let atom1 of clause1) {
    for (let atom2 of clause2) {
      if (isComplementary(atom1, atom2)) {
        const newBelief = [
          ...clause1.filter(a => a !== atom1),
          ...clause2.filter(a => a !== atom2),
        ];
        // Remove duplicates
        return [...new Set(newBelief)];
      }
    }
  }
  return null;
}

function isConsistent(allClauses) {
  let changed = true;
  while (changed) {
    changed = false;

    for (let i = 0; i < allClauses.length; i++) {
      for (let j = i + 1; j < allClauses.length; j++) {
        const resolvent = resolveClauses(allClauses[i], allClauses[j]);
        if (resolvent) {
          if (resolvent.length === 0) {
            return false; // contradiction found
          }

          // Check if this resolvent is new
          const alreadyExists = allClauses.some(
            clause => clause.length === resolvent.length &&
                      clause.every(lit => resolvent.includes(lit))
          );
          if (!alreadyExists) {
            allClauses.push(resolvent);
            changed = true;
          }
        }
      }
    }
  }

  return true; // no contradiction
}

export const calculateBeliefBase = (beliefBase, newBelief) => {
  let steps = [];
  let updatedBeliefs = [...beliefBase];

  if (beliefBase.includes(newBelief)) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBelief} already exists. No revision needed.
      </h6>
    );
    return { updatedBeliefs, steps };
  }

  const clauses = [];
  beliefBase.forEach(belief => {
    const beliefClauses = beliefToClauses(belief);
    clauses.push(...beliefClauses);
  });

  if (isEntailed(beliefBase, newBelief)) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBelief} is already entailed by the belief base.
      </h6>
    );
    return { updatedBeliefs, steps };
  }
  const newBeliefClauses = beliefToClauses(newBelief);
  const allClauses = [...clauses, ...newBeliefClauses];

  if (isConsistent(allClauses)) {
    steps.push(
      <h6 className="bg-green-200 p-2 rounded text-md">
        No inconsistency detected, belief base updated successfully.
      </h6>
    );
    updatedBeliefs.push(newBelief);
  } else {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Adding {newBelief} causes inconsistency. Trying to resolve...
      </h6>
    );

    // Remove least entrenched beliefs first (lower score)
    let beliefsToTry = [...updatedBeliefs].sort(
      (a, b) => logicalStrengthEntrenchment(a) - logicalStrengthEntrenchment(b)
    );

    for (let belief of beliefsToTry) {
      //  Create a new belief base without that belief
      const tempBeliefs = updatedBeliefs.filter(b => b !== belief);

      const tempClauses = [];
      tempBeliefs.forEach(b => {
        tempClauses.push(...beliefToClauses(b));
      });
      const tempAllClauses = [...tempClauses, ...beliefToClauses(newBelief)];

      if (isConsistent(tempAllClauses)) {
        steps.push(
          <h6 className="bg-yellow-200 p-2 rounded text-md">
            Removed {belief} to restore consistency.
          </h6>
        );
        updatedBeliefs = tempBeliefs;
        break; 
      }
    }

    // Add the new belief after removing inconsistent belief
    updatedBeliefs.push(newBelief);
    steps.push(
      <h6 className="bg-green-200 p-2 rounded text-md">
        Added {newBelief} to the belief base.
      </h6>
    );
  }

  return { updatedBeliefs, steps };
};

// Converts a simple belief into CNF-like clauses
export function beliefToClauses(belief) {
  belief = belief.trim();

  // Atomic belief (single atom)
  if (/^[A-Z]$/.test(belief)) {
    return [[belief]];
  }

  // Negated atomic
  if (/^¬[A-Z]$/.test(belief)) {
    return [[belief]];
  }

  // Parentheses removal
  if (belief.startsWith("(") && belief.endsWith(")")) {
    belief = belief.slice(1, -1);
  }

  // Handle AND
  if (belief.includes("∧")) {
    return belief.split("∧").map(b => [b.trim()]);
  }

  // Handle OR
  if (belief.includes("∨")) {
    return [belief.split("∨").map(b => b.trim())];
  }
}

/**
 * Logical Strength Entrenchment:
 * Beliefs with fewer literals in their CNF clauses are more entrenched.
 * Returns 1 / maxClauseLength, so atomic formulas (length=1) yield 1.0,
 * disjunctions (length>1) yield smaller values.
 */
export function logicalStrengthEntrenchment(belief) {
  const clauses = beliefToClauses(belief);
  const maxLength = Math.max(...clauses.map(c => c.length));
  return 1 / maxLength;
}