import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
    // Ignore patterns
    {
        ignores: ["**/.next/**", "**/out/**", "**/dist/**", "**/node_modules/**", "**/.env*.local"],
    },
    // Main configuration
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "react": react,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                React: "readonly",
                JSX: "readonly",
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // TypeScript rules
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/explicit-module-boundary-types": "warn",
            "@typescript-eslint/no-inferrable-types": "off",
            
            // React rules
            "react/react-in-jsx-scope": "off", // Next.js doesn't require React import
            "react/prop-types": "off", // Using TypeScript for prop validation
            
            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            
            // Console rules
            "no-console": ["error", {
                allow: ["warn", "error"],
            }],
        },
    },
];