import { createCompileToFunctionFn } from "./to-function"

export const createCompilerCreator = function (baseCompile) {
	return function createCompiler(baseOptions) {
		function compile(template, options) {
			const finalOptions = Object.create(baseOptions)

			if (options) {
				// 略
			}

			const compiled = baseCompile(template.trim(), finalOptions)
			return compiled
		}

		return {
			compile,
			compileToFunctions: createCompileToFunctionFn(compile),
		}
	}
}
