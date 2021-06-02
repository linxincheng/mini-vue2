function createFunction(code, errors) {
	try {
		return new Function(code)
	} catch (err) {
		errors.push({ err, code })
		return noop
	}
}

export function createCompileToFunctionFn(compiler) {
	const cache = Object.create(null)

	return function compileToFunctions(template, options, vm) {
		options = extend({}, options)

		// 编译的时候缓存
		const key = options.delimiters
			? String(options.delimiters) + template
			: template
		if (cache[key]) {
			return cache[key]
		}

		// compile
		const compiled = compile(template, options)

		// turn code into functions
		// 生成render funciton
		const res = {}
		const fnGenErrors = []
		res.render = createFunction(compiled.render, fnGenErrors)
		res.staticRenderFns = compiled.staticRenderFns.map((code) => {
			return createFunction(code, fnGenErrors)
		})

		return (cache[key] = res)
	}
}
