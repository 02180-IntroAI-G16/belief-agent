import React from "react";

const BeliefMessages = ({ beliefMessages }) => {
  return (
    <div className="bg-slate-50 rounded-[10px] p-4 flex-grow">
      <div className="bg-gray-600 text-gray-50 rounded p-2 font-semibold w-fit">
        Queried answers to the belief set
      </div>
      <div className="mt-2 flex flex-col gap-2">{beliefMessages}</div>
    </div>
  );
};

export default BeliefMessages;
