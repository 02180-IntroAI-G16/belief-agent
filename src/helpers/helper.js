const stripParens = (str) => str.replace(/^\((.*)\)$/, "$1").trim();

const getAtomicProps = (expression) => {
  return expression.match(/¬?[A-Z]/g) || [];
};

export const areConflicting = (belief1, belief2) => {
  belief1 = stripParens(belief1);
  belief2 = stripParens(belief2);

  // Direct conflict: A vs ¬A
  if (belief1 === `¬${belief2}` || belief2 === `¬${belief1}`) return true;

  // Get atomic beliefs from both
  const atoms1 = getAtomicProps(belief1);
  const atoms2 = getAtomicProps(belief2);

  for (let atom of atoms1) {
    if (atoms2.includes(`¬${atom}`)) return true;
    if (atom.startsWith("¬") && atoms2.includes(atom.slice(1))) return true;
  }

  return false;
};

export const findConflictingBeliefs = (beliefs, newBelief) => {
  return beliefs.filter((existing) => areConflicting(existing, newBelief));
};

export const reviseBeliefBase = (beliefBase, newBelief) => {
  let updatedBeliefs = [...beliefBase];
  let steps = [];

  // Step 1: Check for duplicates
  if (updatedBeliefs.includes(newBelief)) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Belief {newBelief} already exists. No revision needed.
      </h6>
    );
    return { updatedBeliefs, steps };
  }

  // Step 2: Check for conflicts
  const conflicts = findConflictingBeliefs(updatedBeliefs, newBelief);

  if (conflicts.length > 0) {
    steps.push(
      <h6 className="bg-red-200 p-2 rounded text-md">
        Found conflicts with: {conflicts.join(", ")}
      </h6>
    );
    updatedBeliefs = updatedBeliefs.filter((b) => !conflicts.includes(b));
    steps.push(
      <h6 className="bg-sky-200 p-2 rounded text-md">
        Removed conflicting beliefs: {conflicts.join(", ")}
      </h6>
    );
  }

  // Step 3: Add new belief
  updatedBeliefs.push(newBelief);
  steps.push(
    <h6 className="bg-green-200 p-2 rounded text-md">
      Added new belief: {newBelief}
    </h6>
  );

  return { updatedBeliefs, steps };
};
