import React, { useRef, useState } from "react";

const propositionalSymbols = [
  { symbol: "¬", name: "Negation" },
  { symbol: "∧", name: "Conjunction" },
  { symbol: "∨", name: "Disjunction" },
  { symbol: "→", name: "Implication" },
  { symbol: "↔", name: "Biconditional" },
  { symbol: "⊤", name: "Tautology" },
  { symbol: "⊥", name: "Contradiction" },
  { symbol: "⊢", name: "Entailment" },
  { symbol: "⊨", name: "Semantic Entailment" },
];

const validSymbols = [
  ...propositionalSymbols.map((s) => s.symbol),
  ...["(", ")"],
].join("");

const validRegex = new RegExp(
  `^[A-Z${validSymbols.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s]*$`
);

const BeliefInput = ({ handleAddNewBelief }) => {
  const inputRef = useRef(null);
  const [newBelief, setNewBelief] = useState("");

  const addSymbol = ({ symbol }) => {
    if (!newBelief.endsWith(symbol)) {
      setNewBelief((prev) => prev + symbol);
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (validRegex.test(value)) {
      setNewBelief(value);
    }
  };

  return (
    <div className="bg-slate-50 rounded-[10px] p-4">
      <div className="bg-gray-600 text-gray-50 rounded p-2 font-semibold w-fit">
        New Belief
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={newBelief}
          placeholder="Enter new belief..."
          onChange={handleInputChange}
          className="bg-slate-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5"
        />
        <button
          className="focus:outline-none text-white bg-green-700 hover:bg-green-800 rounded-lg text-sm px-5 py-2.5 w-full sm:w-24"
          onClick={() => {
            if (newBelief.trim() !== "") {
              handleAddNewBelief(newBelief.trim());
              setNewBelief("");
            }
          }}
        >
          Add
        </button>
      </div>
      <div className="mt-2 flex gap-2 flex-wrap items-center">
        {propositionalSymbols.map((s) => (
          <div
            key={s.name}
            className="rounded w-8 h-8 flex justify-center items-center cursor-pointer border-2 border-slate-400 hover:bg-slate-200"
            onClick={() => addSymbol(s)}
          >
            <h6 className="mb-0">{s.symbol}</h6>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BeliefInput;
