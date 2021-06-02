export * from "shared/util"
export { defineReactive } from "../observer/index"

export const cached = function (fn) {
	const cache = Object.create(null)
	return function cachedFn(str) {
		const hit = cache[str]
		return hit || (cache[str] = fn(str))
	}
}

export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)
// 简化版本 export const unicodeRegExp = /a-zA-Z/;
export function parsePath(path) {
	// 用于匹配xxx.xxx.xx 正则表达式
	// 'xxx.xxx.xxx' return xxx.xxx.xxx
	if (bailRE.test(path)) {
		return
	}
	const segments = path.split(".")
	return function (obj) {
		for (let i = 0; i < segments.length; i++) {
			if (!obj) return
			obj = obj[segments[i]]
		}
		return obj
	}
}
