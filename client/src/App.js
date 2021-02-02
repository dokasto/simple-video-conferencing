import "./App.css";
import { RecoilRoot } from "recoil";
import React from "react";
import Main from "./Main";

function App() {
  return (
    <RecoilRoot>
      <Main />
    </RecoilRoot>
  );
}

export default App;
