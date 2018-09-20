module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-trailing-spaces": 2,
        "eol-last": 2,
        "space-in-parens": [
            "error",
            "never"
        ],
        "no-multiple-empty-lines": 1,
        "prefer-const": "error",
        "space-infix-ops": "error",
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "overrides": [
        {
            "files": ["*.spec.js"],
            "env": {
              "jest": true
            }
        }
    ]
};
