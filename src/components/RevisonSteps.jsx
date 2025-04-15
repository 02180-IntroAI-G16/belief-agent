import React from "react";

const RevisonSteps = ({ revisionSteps }) => {
  return (
    <div className="bg-slate-50 rounded-[10px] p-4 flex-grow">
      <div className="bg-gray-600 text-gray-50 rounded p-2 font-semibold w-fit">
        Revison steps
      </div>
      <div className="mt-2 flex flex-col gap-2">{revisionSteps}</div>
    </div>
  );
};

export default RevisonSteps;
