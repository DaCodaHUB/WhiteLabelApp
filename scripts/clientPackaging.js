const fs = require('fs');
const Module = require('module');
const ts = require('typescript');

const tsExtension = '.ts';
const originalExtensionHandler = Module._extensions[tsExtension];
Module._extensions[tsExtension] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const {outputText} = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });
  module._compile(outputText, filename);
};

module.exports = require('./clientPackaging.ts');

if (originalExtensionHandler) {
  Module._extensions[tsExtension] = originalExtensionHandler;
}
