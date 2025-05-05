# Belief Revision Agent

A simple React-based belief revision agent demonstrating the expansion, revision, and contraction of a belief base using propositional logic and AGM theory.

## Features

- Add beliefs using propositional logic (`¬`, `∨`, `∧`, `→`, `↔`)
- Converts beliefs to Conjunctive Normal Form (CNF)
- Stores belief base in `localStorage`
- Step-by-step revision visualization

---

## ⚠️ Input Guidelines

- Enter valid formulas without **any spaces**  
  ✅ `A→B`  
  ❌ `A → B`
- Input validation is minimal — please double-check your formulas

---

## 🚀 Getting Started

### 1. Install Node.js and npm

If you don’t have Node.js installed:

- Go to [https://nodejs.org](https://nodejs.org)
- Download the **LTS version**
- Install it — this will also install `npm` (Node Package Manager)

You can verify the installation using:

```bash
node -v
npm -v
```

### Run the App

```bash
npm install
npm start
```
