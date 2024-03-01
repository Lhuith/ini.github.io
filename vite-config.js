import { defineConfig } from "vite";

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  console.log(mode);
  if (command === "serve" || command === "build") {
    console.log("executing image json generation");
    require("child_process").exec(
      "bash ./src/resources/imageMetaGenerator > ./src/resources/image.json"
    );
    return {
      // dev specific config
    };
  } else {
    // command === 'build'
    return {
      // build specific config
    };
  }
});
