import toCNF from "./toCNF";

export function isEntailed(beliefBase, formula) {
  const negatedFormula = negateBelief(formula);
  const baseClauses = [];

  beliefBase.forEach((belief) => {
    const clauses = cnfToClauses(belief);
    baseClauses.push(...clauses);
  });

  const negatedFormulaClauses = cnfToClauses(negatedFormula);
  const allClauses = [...baseClauses, ...negatedFormulaClauses];

  return !isConsistent(allClauses);
}

export const negateBelief = (belief) => {
  let negatedBelief = `¬(${belief})`;
  return toCNF(negatedBelief);
};

export const negateAtom = (atom) => {
  if (atom.startsWith("¬")) {
    return atom.slice(1);
  } else {
    return `¬${atom}`;
  }
};

export const isComplementary = (atom1, atom2) => {
  return atom1 === negateAtom(atom2);
};

export const resolveClauses = (clause1, clause2) => {
  for (let atom1 of clause1) {
    for (let atom2 of clause2) {
      if (isComplementary(atom1, atom2)) {
        const newBelief = [
          ...clause1.filter((a) => a !== atom1),
          ...clause2.filter((a) => a !== atom2),
        ];
        // Remove duplicates
        return [...new Set(newBelief)];
      }
    }
  }
  return null;
};

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
            (clause) =>
              clause.length === resolvent.length &&
              clause.every((lit) => resolvent.includes(lit))
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
  let newBeliefInCNF = toCNF(newBelief);

  if (beliefBase.find(({ belief }) => belief === newBelief)) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBeliefInCNF} already exists. No revision needed.
      </h6>
    );
    return { updatedBeliefs, steps };
  }

  const clauses = [];
  updatedBeliefs
    .map((b) => b.cnf)
    .forEach((belief) => {
      const beliefClauses = cnfToClauses(belief);
      clauses.push(...beliefClauses);
    });

  if (
    isEntailed(
      updatedBeliefs.map((b) => b.cnf),
      newBeliefInCNF
    )
  ) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBelief} is already entailed by the belief base.
      </h6>
    );
    return { updatedBeliefs, steps };
  }

  const newBeliefClauses = cnfToClauses(newBeliefInCNF);
  const allClauses = [...clauses, ...newBeliefClauses];

  if (isConsistent(allClauses)) {
    steps.push(
      <h6 className="bg-green-200 p-2 rounded text-md">
        No inconsistency detected, belief base updated successfully.
      </h6>
    );
    updatedBeliefs.push({ belief: newBelief, cnf: newBeliefInCNF });
  } else {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Adding {newBelief} causes inconsistency. Trying to resolve...
      </h6>
    );

    // Attempt to remove minimal sets of beliefs to restore consistency
    const sortedBeliefs = updatedBeliefs.sort(
      (a, b) =>
        logicalStrengthEntrenchment(a.cnf) - logicalStrengthEntrenchment(b.cnf)
    );

    let resolved = false;
    for (let k = 1; k <= sortedBeliefs.length && !resolved; k++) {
      for (let combo of combinations(sortedBeliefs, k)) {
        const tempBeliefs = updatedBeliefs.filter(
          (b) => !combo.find((c) => c.cnf === b.cnf)
        );
        const tempClauses = [];
        tempBeliefs.forEach((b) => tempClauses.push(...cnfToClauses(b.cnf)));
        const tempAllClauses = [
          ...tempClauses,
          ...cnfToClauses(newBeliefInCNF),
        ];
        if (isConsistent(tempAllClauses)) {
          // Report each removed belief
          combo.forEach(({ belief }) => {
            steps.push(
              <h6 className="bg-yellow-200 p-2 rounded text-md">
                Removed {belief} to restore consistency.
              </h6>
            );
          });
          updatedBeliefs = tempBeliefs;
          updatedBeliefs.push({ belief: newBelief, cnf: newBeliefInCNF });
          steps.push(
            <h6 className="bg-green-200 p-2 rounded text-md">
              Added {newBelief} to the belief base.
            </h6>
          );
          resolved = true;
          break;
        }
      }
    }
    if (!resolved) {
      steps.push(
        <h6 className="bg-red-200 p-2 rounded text-md">
          No resolution found. New belief not added.
        </h6>
      );
    }
  }
  return { updatedBeliefs, steps };
};

export function cnfToClauses(cnf) {
  const trimmed = cnf.trim();
  return trimmed.split(/\s*∧\s*/).map((conjunct) => {
    let clause = conjunct.trim();
    if (clause.startsWith("(") && clause.endsWith(")")) {
      clause = clause.slice(1, -1).trim();
    }
    return clause.split(/\s*∨\s*/).map((literal) => literal.trim());
  });
}

/**
 * Logical Strength Entrenchment:
 * Beliefs with fewer literals in their CNF clauses are more entrenched.
 * Returns 1 / maxClauseLength, so atomic formulas (length=1) yield 1.0,
 * disjunctions (length>1) yield smaller values.
 */
export function logicalStrengthEntrenchment(belief) {
  const clauses = cnfToClauses(belief);
  const maxLength = Math.max(...clauses.map((c) => c.length));
  return 1 / maxLength;
}

/**
 * Generate all combinations of exactly k elements from an array.
 */
function combinations(arr, k) {
  const result = [];
  function build(start, combo) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      build(i + 1, combo);
      combo.pop();
    }
  }
  build(0, []);
  return result;
}
