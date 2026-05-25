import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".netlify/**",
    "node_modules/**",
  ]),
  {
    rules: {
      // Carga de datos en useEffect es un patrón válido en esta app
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
