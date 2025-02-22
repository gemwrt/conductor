import { useState, useEffect } from "react";
import { Tabs, Tab, ReactJson, Dropdown, Banner } from "../../components";
import { TabPanel, TabContext } from "@material-ui/lab";

import TaskSummary from "./TaskSummary";
import TaskLogs from "./TaskLogs";

import { makeStyles } from "@material-ui/styles";
import _ from "lodash";
import TaskPollData from "./TaskPollData";

const useStyles = makeStyles({
  banner: {
    margin: 15,
  },
  dfSelect: {
    padding: 15,
    backgroundColor: "#efefef",
  },
  tabPanel: {
    padding: 0,
    flex: 1,
    overflowY: "auto",
  },
});

export default function RightPanel({ selectedTask, dag, onTaskChange }) {
  const [tabIndex, setTabIndex] = useState("summary");

  const classes = useStyles();

  useEffect(() => {
    setTabIndex("summary"); // Reset to Status Tab on ref change
  }, [selectedTask]);

  if (!selectedTask) {
    return null;
  }

  const dfOptions = selectedTask ? dag.dfChildInfo(selectedTask.ref) : null;
  const { ref, taskId } = selectedTask;

  let taskResult,
    retryOptions = null;
  const node = dag.graph.node(ref);
  if (node.taskResults.length > 1) {
    retryOptions = node.taskResults;
  }

  if (taskId) {
    taskResult = node.taskResults.find((task) => task.taskId === taskId);
  } else {
    taskResult = _.last(node.taskResults);
  }

  return (
    <TabContext value={tabIndex}>
      {dfOptions && (
        <div className={classes.dfSelect}>
          <Dropdown
            onChange={(e, v) => {
              onTaskChange({ ref: v.ref });
            }}
            options={dfOptions}
            disableClearable
            value={dfOptions.find((opt) => opt.ref === selectedTask.ref)}
            getOptionLabel={(x) => `${dropdownIcon(x.status)} ${x.ref}`}
            style={{ marginBottom: 20, width: 500 }}
          />
        </div>
      )}

      {retryOptions && (
        <div className={classes.dfSelect}>
          <Dropdown
            label="Retried Task - Select an instance"
            disableClearable
            onChange={(e, v) => {
              onTaskChange({
                ref: taskResult.referenceTaskName,
                taskId: v.taskId,
              });
            }}
            options={retryOptions}
            value={retryOptions.find((opt) => opt.taskId === taskResult.taskId)}
            getOptionLabel={(t) =>
              `${dropdownIcon(t.status)} Attempt ${t.retryCount} - ${t.taskId}`
            }
            style={{ marginBottom: 20, width: 500 }}
          />
        </div>
      )}

      <Tabs value={tabIndex} contextual onChange={(e, v) => setTabIndex(v)}>
        {[
          <Tab label="Summary" value="summary" key="summary" />,
          <Tab
            label="Input"
            disabled={!taskResult.status}
            value="input"
            key="input"
          />,
          <Tab
            label="Output"
            disabled={!taskResult.status}
            value="output"
            key="output"
          />,
          <Tab
            label="Logs"
            disabled={!taskResult.status}
            value="logs"
            key="logs"
          />,
          <Tab
            label="JSON"
            disabled={!taskResult.status}
            value="json"
            key="json"
          />,
          <Tab label="Definition" value="definition" key="definition" />,
          ...(_.get(taskResult, "workflowTask.type") === "SIMPLE"
            ? [
                <Tab
                  label="Poll Data"
                  disabled={!taskResult.status}
                  value="pollData"
                  key="pollData"
                />,
              ]
            : []),
        ]}
      </Tabs>
      <>
        <TabPanel className={classes.tabPanel} value="summary">
          <TaskSummary taskResult={taskResult} />
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="input">
          <ReactJson src={taskResult.inputData} label="Task Input" />
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="output">
          <>
            {taskResult.externalOutputPayloadStoragePath && (
              <Banner className={classes.banner}>
                This task has externalized output. Please reference{" "}
                <code>externalOutputPayloadStoragePath</code> for the storage
                location.
              </Banner>
            )}
            <ReactJson src={taskResult.outputData} label="Task Output" />
          </>
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="pollData">
          <TaskPollData task={taskResult} />
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="logs">
          <TaskLogs task={taskResult} />
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="json">
          <ReactJson
            src={taskResult}
            label="Unabridged Task Execution Result"
          />
        </TabPanel>
        <TabPanel className={classes.tabPanel} value="definition">
          <ReactJson
            src={taskResult.workflowTask}
            label="Task Definition at Runtime"
          />
        </TabPanel>
      </>
    </TabContext>
  );
}

function dropdownIcon(status) {
  let icon;
  switch (status) {
    case "COMPLETED":
      icon = "\u2705";
      break; // Green-checkmark
    case "COMPLETED_WITH_ERRORS":
      icon = "\u2757";
      break; // Exclamation
    case "CANCELED":
      icon = "\uD83D\uDED1";
      break; // stopsign
    case "IN_PROGRESS":
    case "SCHEDULED":
      icon = "\u231B";
      break; // hourglass
    default:
      icon = "\u274C"; // red-X
  }
  return icon + "\u2003";
}
