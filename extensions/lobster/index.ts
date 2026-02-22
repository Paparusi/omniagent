import type {
  AnyAgentTool,
  OmniAgentPluginApi,
  OmniAgentPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: OmniAgentPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as OmniAgentPluginToolFactory,
    { optional: true },
  );
}
