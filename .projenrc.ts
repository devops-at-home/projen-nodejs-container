import { typescript } from 'projen';
const project = new typescript.TypeScriptAppProject({
    authorName: 'Cameron Tranthim-Fryer',
    defaultReleaseBranch: 'main',
    license: 'MIT',
    name: 'projen-nodejs-container',
    prettier: true,
    prettierOptions: {
        settings: {
            printWidth: 100,
            tabWidth: 4,
            singleQuote: true,
        },
    },
    projenrcTs: true,
    repository: 'https://github.com/devops-at-home/projen-nodejs-container',
    githubOptions: {
        mergify: false,
    },
    typescriptVersion: '5.0.4',

    // deps: [],                /* Runtime dependencies of this module. */
    // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
    // devDeps: [],             /* Build dependencies for this module. */
    // packageName: undefined,  /* The "name" in package.json. */
});

project.jest!.addTestMatch('**/?(*.)@(spec|test).[tj]s?(x)');

project.synth();
