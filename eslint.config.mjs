import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  
  // 1. 全局忽略的文件
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    rules: {
      // 允许使用 any 类型 
      "@typescript-eslint/no-explicit-any": "off",

      // 定义了变量没用？只警告，不报错
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],

      // 允许在 JSX 中直接写单引号
      "react/no-unescaped-entities": "off",

      // 允许使用 @ts-ignore
      "@typescript-eslint/ban-ts-comment": "off",

      // 关闭对 img 标签的强制限制 
      "@next/next/no-img-element": "off",

      // useEffect 依赖没写全只警告
      "react-hooks/exhaustive-deps": "warn",
      
      // 没写 const 而是用了 let不报错
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;