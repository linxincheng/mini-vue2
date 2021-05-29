let ARRAY_METHOD = [
	"push",
	"pop",
	"shift",
	"unshift",
	"reverse",
	"sort",
	"splice",
]

let array_methods = Object.create(Array.prototype)
ARRAY_METHOD.forEach((method) => {
	array_methods[method] = function () {
		console.log("拦截了", method, "方法")

		// 将数据进行响应式化
		for (let i = 0; i < arguments.length; i++) {
			observe(arguments[i]) // 这里有个问题,引入watcher再改
		}

		let res = Array.prototype[method].apply(this, arguments)

		return res
	}
})

// 出了递归嗨可以使用队列(深度优先转化为广度优先)
// 简化后的版本
function defineReactive(target, key, value, enumerable) {
	// if (typeof value === "object" && value != null && !Array(value)) {
	if (typeof value === "object" && value != null) {
		observe(value)
	}

	let dep = new Dep();

	Object.defineProperty(target, key, {
		configurable: true,
		enumerable: !!enumerable,
		get() {
			// 依赖收集
			dep.depend();
			return value
		},
		set(newVal) {
			console.log("set", key, newVal)
			// 将重新赋值的数据变成响应式的,因此如果传入的是对象类型,那么久需要使用oberve 将其转换为响应式
			if (typeof newVal === "object" && newVal != null) {
				observe(newVal) // 由于这个方法现在暂时只是过渡的( 不安全 )
			}

			value = newVal
			// 派发更新，找到全局的watcher， 调用update
			dep.notify();
		},
	})
}

/** 将某一个对象的属性访问 映射到对象的某一个属性成员上 **/
function proxy(target, prop, key) {
	Object.defineProperty(target, key, {
		enumerable: true,
		configurable: true,
		get() {
			return target[prop][key]
		},
		set(newVal) {
			target[prop][key] = newVal
		},
	})
}

/**将对象 obj 变成响应式,vm 就是vue实例, 为了在调用时 处理上下文 */
function observe(obj, vm) {
	// 之前没有对obj本身进行操作,这一次就直接对obj继续判断
	if (Array.isArray(obj)) {
		// 对其每一个元素进行处理
		obj.__proto__ = array_methods
		for (let i = 0; i < obj.length; i++) {
			observe(obj[i], vm) // 递归处理每一个数组元素
			defineReactive.call(vm, obj, i, obj[i], true)
		}
	} else {
		// 对其成员进行处理
		let keys = Object.keys(obj)
		for (let i = 0; i < keys.length; i++) {
			let prop = keys[i] // 属性名
			defineReactive.call(vm, obj, prop, obj[prop], true)
		}
	}
}

JGVue.prototype.initData = function () {
	let keys = Object.keys(this._data)

	// 遍历this._data 的成员,将属性转换为响应式, 将直接属性代理到实例上
	observe(this._data, this)

	// 代理
	for (let i = 0; i < keys.length; i++) {
		// 将this._data[keys[i]] 映射到this[keys[i]] 上
		// 就是要 让this提供 keys[i] 这个属性
		// 在访问这个属性的时候相当于在访问this._data的这个属性
		proxy(this, "_data", keys[i])
	}
}
