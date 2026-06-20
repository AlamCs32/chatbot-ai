import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    { ignores: [".yarn/"] },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ["**/*.{js,mjs,cjs,ts}"],

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },

        rules: {
            "no-console": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];