import { createCompilerCreator } from "./create-compiler"

//  返回 Ast
export const createCompiler = createCompilerCreator(function baseCompile(
	template,
	options
) {
	// 生成 ast
	const ast = parse(template.trim(), options)
	if (options.optimize !== false) {
		/**
		 * 优化
		 * 标记非静态
		 * 标记静态根
		 */
		optimize(ast, options)
	}

	// 生成 render 函数
	const code = generate(ast, options)
	return {
		ast,
		render: code.render,
		staticRenderFns: code.staticRenderFns,
	}
})
