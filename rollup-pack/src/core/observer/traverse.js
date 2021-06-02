const seenObjects = new Set()

export function traverse(val) {
	_traverse(val, seenObjects)
	seenObjects.clear()
}

// 进行深度依赖收集
function _traverse(val, seen) {
	let i, keys
	const isA = Array.isArray(val)

	// 如果数据不是响应式的就不需要递归
	// if (
	// (!isA && !isObject(val)) ||
	// Object.isFrozen(val) ||
	// val instanceof VNode
	// ) {
	// 	return
	// }

	// __ob__ 表示这个对象是响应式对象， ob 就是 observer
	if (val.__ob__) {
		const depId = val.__ob__.dep.id

		// 保证了循环引用不会递归遍历
		if (seen.has(depId)) {
			return
		}
		seen.add(depId)
	}
	if (isA) {
		i = val.length
		while (i--) _traverse(val[i], seen) // 对每一个数组项进行访问
	} else {
		keys = Object.keys(val)
		i = keys.length
		while (i--) _traverse(val[keys[i]], seen) // 对每一个对象的属性进行访问
	}
}
