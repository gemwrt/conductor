import { format, formatDuration, intervalToDuration } from "date-fns";
import _ from "lodash";

export function timestampRenderer(date) {
  if (_.isNil(date)) return null;

  const parsed = new Date(date);
  if (parsed.getTime() === 0) return null; // 0 epoch (UTC 1970-1-1)

  return format(parsed, "yyyy-MM-dd HH:mm:ss"); // could be string or number.
}

export function durationRenderer(durationMs) {
  const duration = intervalToDuration({ start: 0, end: durationMs });
  if (durationMs > 5000) {
    return formatDuration(duration);
  } else {
    return `${durationMs}ms`;
  }

  //return !isNaN(durationMs) && (durationMs > 0? formatDuration({seconds: durationMs/1000}): '0.0 seconds');
}

export function taskHasResult(task) {
  const keys = Object.keys(task);
  return !(keys.length === 1 && keys[0] === "workflowTask");
}

export function astToQuery(node) {
  // leaf node
  if (node.operator !== undefined) {
    return node.field + node.operator + node.value;
  } else if (node.combinator !== undefined) {
    const clauses = node.rules
      .filter((rule) => !(rule.rules && rule.rules.length === 0)) // Ignore empty groups
      .map((rule) => astToQuery(rule));
    const wrapper = clauses.length > 1;

    let combinator = node.combinator.toUpperCase();

    return `${wrapper ? "(" : ""}${clauses.join(` ${combinator} `)}${
      wrapper ? ")" : ""
    }`;
  } else {
    return "";
  }
}

export function isFailedTask(status) {
  return (
    status === "FAILED" ||
    status === "FAILED_WITH_TERMINAL_ERROR" ||
    status === "TIMED_OUT" ||
    status === "CANCELED"
  );
}

export function defaultCompare(x, y) {
  if (x === undefined && y === undefined) return 0;

  if (x === undefined) return 1;

  if (y === undefined) return -1;

  if (x < y) return -1;

  if (x > y) return 1;

  return 0;
}

export function immutableReplaceAt(array, index, value) {
  const ret = array.slice(0);
  ret[index] = value;
  return ret;
}

export function isEmptyIterable(iterable) {
  // eslint-disable-next-line no-unused-vars, no-unreachable-loop
  for (const _ of iterable) {
    return false;
  }
  return true;
}
