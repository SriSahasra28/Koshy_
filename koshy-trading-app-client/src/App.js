import "./App.css";
import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import SetPassword from "./components/SetPassword";
import HomePage from "./components/HomePage";
import ResetPassword from "./components/ResetPassword";

import "./styles.scss";

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import GroupPage from "./pages/GroupPage";
import GroupView from "./pages/GroupView";
import GroupsTree from "./components/groupsTree/GroupsTree";
import GroupsTreeSideBar from "./components/groupsTree/mobile/GroupsTreeSideBar";

import Scan from "./components/Scan";
import CustomIndicator from "./components/CustomIndicator";
import Condition from "./components/Condition";
import Filter from "./components/Filter";
import Files from "./components/Files";
import Backtest from "./components/Backtest";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/login" Component={LoginPage} />
          <Route path="/reset-password" Component={ResetPassword} />
          <Route path="/change-password" Component={SetPassword} />
          <Route path="/" Component={HomePage} />
          <Route path="/groups" Component={GroupPage} />
          <Route path="/groups/:group_id" Component={GroupView} />
          <Route path="/groups/tree" Component={GroupsTree} />
          <Route path="/ci" Component={CustomIndicator} />
          <Route path="/scan" Component={Scan} />
          <Route path="/filter" Component={Filter} />
          <Route path="/cn" Component={Condition} />
          <Route path="/files" Component={Files} />
          <Route path="/backtest" Component={Backtest} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
