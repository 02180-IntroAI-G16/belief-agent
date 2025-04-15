import { useEffect, useState } from "react";
import BeliefInput from "./BeliefInput";
import CurrentBeliefBase from "./CurrentBeliefBase";
import RevisonSteps from "./RevisonSteps";
import { reviseBeliefBase } from "../helpers/helper";

export default function BeliefAgent() {
  const [beliefBase, setBeliefBase] = useState(() => {
    const stored = localStorage.getItem("beliefBase");
    return stored ? JSON.parse(stored) : [];
  }); 
  const [revisionSteps, setRevisionSteps] = useState([]);

  useEffect(() => {
    localStorage.setItem("beliefBase", JSON.stringify(beliefBase));
  }, [beliefBase]);

  const addBelief = (newBelief) => {
    const { updatedBeliefs, steps = [] } = reviseBeliefBase(
      beliefBase,
      newBelief
    );
    setBeliefBase(updatedBeliefs);
    setRevisionSteps(steps);
  };

  const deleteBelief = (index) => {
    const updated = [...beliefBase];
    const removed = updated.splice(index, 1);
    setBeliefBase(updated);
    // setRevisionSteps([{ action: "delete", belief: removed[0] }]);
  };

  return (
    <div className="h-screen w-full p-4 sm:p-6 md:p-8 flex flex-col sm:flex-col md:flex-row gap-2">
      <div className="flex flex-col w-full md:w-1/2 gap-2">
        <BeliefInput handleAddNewBelief={addBelief} />
        <RevisonSteps revisionSteps={revisionSteps} />
      </div>

      <CurrentBeliefBase
        beliefBase={beliefBase}
        onDeleteBeliefBase={deleteBelief}
      />
    </div>
  );
}
