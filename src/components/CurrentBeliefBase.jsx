import React from "react";
import { BiTrash } from "react-icons/bi";

const CurrentBeliefBase = ({ beliefBase = [], onDeleteBeliefBase }) => {
  return (
    <div className="bg-slate-50 rounded-[10px] p-4 w-full md:w-1/2 h-full">
      <div className="bg-gray-600 text-gray-50 rounded p-2 font-semibold w-fit">
        Current Belief Base
      </div>

      <div className="mt-2 flex flex-col overflow-y-auto max-h-[500px]">
        {beliefBase.length ? (
          beliefBase.map((belief, index) => {
            return (
              <div
                key={index}
                className="flex items-center border-b border-slate-400 px-2 min-h-10 font-bold"
              >
                <h6 className="flex-grow">{belief}</h6>
                <BiTrash
                  className="text-red-500 cursor-pointer"
                  onClick={() => onDeleteBeliefBase(index)}
                />
              </div>
            );
          })
        ) : (
          <h6 className="text-center">No belief to show!</h6>
        )}
      </div>
    </div>
  );
};

export default CurrentBeliefBase;
