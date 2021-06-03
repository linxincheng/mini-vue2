const arrayProto = Array.prototype
// arrayMethods 就是继承自 Array.prototype的数组
// 只需要让响应式数组继承自 arrayMethods
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
	"push",
	"pop",
	"shift",
	"unshift",
	"splice",
	"sort",
	"reverse",
]

methodsToPatch.forEach(function (method) {
	// cache original method
	const original = arrayProto[method]
	def(arrayMethods, method, function mutator(...args) {
		// 先调用
		const result = original.apply(this, args)
		// let inserted;
		// switch (method) {
		//   case "push":
		//   case "unshift":
		//     inserted = args;
		//     break;
		//   case "splice":
		//     inserted = args.slice(2);
		//     break;
		// }
		// if (inserted) ob.observeArray(inserted);
		// 派发更新
		const ob = this.__ob__
		ob.dep.notify()
		return result
	})
})
