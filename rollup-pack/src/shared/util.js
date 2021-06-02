export function noop(a, b, c) {} // 什么都不做，用来占位置的空函数

export function remove(arr, item) {
	if (arr.length) {
		const index = arr.indexOf(item)
		if (index > -1) {
			return arr.splice(index, 1)
		}
	}
}

// 将类数组对象转换为真正的数组
export function toArray(list, start) {
	start = start || 0
	let i = list.length - start
	const ret = new Array(i)
	while (i--) {
		ret[i] = list[i + start]
	}
	return ret
}
