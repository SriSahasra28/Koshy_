import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { GroupApis } from "../../api/groups.apis";

const GroupsTreeCopy = () => {
  const [data, setData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  const [state, setState] = useState({
    isLoading: false,
    groupsTree: [],
  });

  const getGroupsTree = async () => {
    setState({ ...state, isLoading: true });
    const response = await GroupApis.getGroupsTree();

    if (!response?.success) {
      setState({ ...state, isLoading: false, groupsTree: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    setState({
      ...state,
      isLoading: false,
      groupsTree: response.data,
    });
  };

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prevState) => ({
      ...prevState,
      [nodeKey]: !prevState[nodeKey],
    }));
  };

  const renderOptions = (options) => {
    const handleOptionClick = (optionName) => {
      console.log(optionName);
    };

    return options?.map((option, index) => (
      <li
        key={index}
        className="list-group-item"
        onClick={() => handleOptionClick(option)}
      >
        {option}
      </li>
    ));
  };

  const renderStocks = (stocks, groupName) => {
    return stocks?.map((stock, index) => (
      <li key={index} className="list-group-item">
        <div
          className="cursor-pointer"
          onClick={() => toggleNode(`${groupName}-${stock.stockName}`)}
        >
          {stock.stockName}
        </div>
        {expandedNodes[`${groupName}-${stock.stockName}`] && (
          <ul className="list-group">{renderOptions(stock.options)}</ul>
        )}
      </li>
    ));
  };

  const renderGroups = () => {
    return state?.groupsTree?.map((group, index) => {
      debugger;
      return (
        <li key={index} className="list-group-item">
          <div
            className="cursor-pointer"
            onClick={() => toggleNode(group?.groupName)}
          >
            {group.groupName}
          </div>
          {expandedNodes[group.groupName] && (
            <ul className="list-group">
              {renderStocks(group.stocks, group.groupName)}
            </ul>
          )}
        </li>
      );
    });
  };

  useEffect(() => {
    getGroupsTree();
  }, []);

  return (
    <div>
      <ul className="list-group">{renderGroups()}</ul>
    </div>
  );
};

export default GroupsTreeCopy;
