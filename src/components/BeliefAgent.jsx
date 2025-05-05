import { useEffect, useState } from "react";
import BeliefInput from "./BeliefInput";
import CurrentBeliefBase from "./CurrentBeliefBase";
import RevisonSteps from "./RevisonSteps";
import { calculateBeliefBase, believes } from "../helpers/helper";
import BeliefQuery from "./BeliefQuery";
import BeliefMessages from "./BeliefMessages";

export default function BeliefAgent() {
  const [beliefBase, setBeliefBase] = useState(() => {
    const stored = localStorage.getItem("beliefBase");
    return stored ? JSON.parse(stored) : [];
  });
  const [revisionSteps, setRevisionSteps] = useState([]);
  const [beliefMessages, setBeliefMessages] = useState([]);

  useEffect(() => {
    localStorage.setItem("beliefBase", JSON.stringify(beliefBase));
  }, [beliefBase]);

  const addBelief = (newBelief) => {
    const { updatedBeliefs, steps = [] } = calculateBeliefBase(
      beliefBase,
      newBelief
    );

    setBeliefBase(updatedBeliefs);
    setRevisionSteps(steps);
    setBeliefMessages([]);
  };

  const queryBelief = (belief) => {
    const steps = [] = believes(
      beliefBase,
      belief
    );
    setBeliefMessages(steps);
  }


  const deleteBelief = (index) => {
    const updated = [...beliefBase];
    const removed = updated.splice(index, 1);
    setBeliefBase(updated);
    if (removed.length) {
      setRevisionSteps([
        <h6 className="bg-yellow-200 p-2 rounded text-md">
          '{removed[0]?.belief}' removed from belief base.
        </h6>,
      ]);
    }
  };

  return (
    <div className="h-screen w-full p-4 sm:p-6 md:p-8 flex flex-col sm:flex-col md:flex-row gap-2">
      <div className="flex flex-col w-full md:w-1/2 gap-2">
        <BeliefInput handleAddNewBelief={addBelief} />
        <BeliefQuery handleQueryBelief={queryBelief} />
        <BeliefMessages beliefMessages={beliefMessages} />
        <RevisonSteps revisionSteps={revisionSteps} />
      </div>

      <CurrentBeliefBase
        beliefBase={beliefBase}
        onDeleteBeliefBase={deleteBelief}
      />
    </div>
  );
}
