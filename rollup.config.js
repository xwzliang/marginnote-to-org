import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy2";
import tsPlugin from "rollup-plugin-typescript2";
import zip from "rollup-plugin-zip";
import ttypescript from "ttypescript";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`;

const isProd = process.env.BUILD === "production";

const configs = [
  {
    input: "src/main.ts",
    output: {
      dir: "dist/",
      format: "iife",
      exports: "none",
      sourcemap: "hidden",
      banner,
    },
    plugins: [
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
      copy({
        assets: ["mnaddon.json", ["assets/title.png", "title.png"]],
      }),
      zip({
        file: "marginnote-to-org.mnaddon",
      }),
    ],
  },
];

const libCfg = {
  input: "src/index.ts",
  output: {
    dir: "lib",
    sourcemap: true,
    format: "cjs",
  },
  external: ["obsidian"],
  plugins: [
    tsPlugin({
      tsconfig: "tsconfig-lib.json",
      typescript: ttypescript,
    }),
    nodeResolve({ browser: true }),
    commonjs(),
  ],
};

if (isProd) configs.push(libCfg);

export default configs;
