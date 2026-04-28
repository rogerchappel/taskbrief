export const packageName = "taskbrief";
export const packageVersion = "0.1.0";

export type TaskbriefRuntimeInfo = {
  name: string;
  version: string;
};

export function getRuntimeInfo(): TaskbriefRuntimeInfo {
  return {
    name: packageName,
    version: packageVersion
  };
}
