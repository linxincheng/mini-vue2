export function noop(a, b, c) {} // 什么都不做，用来占位置的空函数

export function remove(arr, item) {
	if (arr.length) {
		const index = arr.indexOf(item)
		if (index > -1) {
			return arr.splice(index, 1)
		}
	}
}
