import CreateGlue from "./glue";
import { version } from "../package.json";

if (typeof window !== "undefined") {
    (window as any).GlueCore = CreateGlue;
}
// add default library for ES6 modules
(CreateGlue as any).default = CreateGlue;
(CreateGlue as any).version = version;

export default CreateGlue;
