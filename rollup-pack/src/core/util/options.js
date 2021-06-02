// import config from '../config'
// const strats = config.optionMergeStrategies
const strats = Object.create(null)
/**
 *将两个选项对象合并为一个新对象。
 *用于实例化和继承的核心实用程序。
 */
export function mergeOptions(parent, child, vm) {
	if (typeof child === "function") {
		child = child.options
	}

	// 这块标准化Props，Inject， Directives，这块我注释掉
	// normalizeProps(child, vm)
	// normalizeInject(child, vm)
	// normalizeDirectives(child)

	//在子选项上应用扩展和混合，
	//但前提是它是一个原始选项对象，而不是
	//另一个 mergeOptions 调用的结果。
	//只有合并选项具有 _base 属性。
	if (!child._base) {
		// 如果有 extends 就深入合并
		if (child.extends) {
			parent = mergeOptions(parent, child.extends, vm)
		}
		// 如果有 mixins 就深入合并
		if (child.mixins) {
			for (let i = 0, l = child.mixins.length; i < l; i++) {
				parent = mergeOptions(parent, child.mixins[i], vm)
			}
		}
	}

	// child的属性优先级比parent高
	// 如有同名，使用child的属性
	const options = {}
	let key
	for (key in parent) {
		mergeField(key)
	}
	for (key in child) {
		if (!hasOwn(parent, key)) {
			mergeField(key)
		}
	}
	function mergeField(key) {
		// 通过Object.create 合并
		const strat = strats[key] || defaultStrat
		options[key] = strat(parent[key], child[key], vm, key)
	}
	return options
}
