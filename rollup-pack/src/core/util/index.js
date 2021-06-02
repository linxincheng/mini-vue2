export * from "shared/util"
export { defineReactive } from "../observer/index"

export const cached = function (fn) {
	const cache = Object.create(null)
	return function cachedFn(str) {
		const hit = cache[str]
		return hit || (cache[str] = fn(str))
	}
}
