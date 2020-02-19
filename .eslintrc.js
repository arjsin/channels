module.exports = {
    "env": {
        "es6": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
    ],
    "rules": {
        "@typescript-eslint/indent": ["error", "tab"],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/quotes": [
            "error",
            "double"
        ],
        "max-len": [
            "warn",
            {
                "code": 120
            }
        ],
    }
};
