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
	let that = this
	// if (typeof value === "object" && value != null && !Array(value)) {
	if (typeof value === "object" && value != null) {
		observe(value)
	}

	Object.defineProperty(target, key, {
		configurable: true,
		enumerable: !!enumerable,
		get() {
			console.log("get", key)
			return value
		},
		set(newVal) {
			console.log("set", key, newVal)
			// 将重新赋值的数据变成响应式的,因此如果传入的是对象类型,那么久需要使用oberve 将其转换为响应式
			if (typeof newVal === "object" && newVal != null) {
				observe(newVal) // 由于这个方法现在暂时只是过渡的( 不安全 )
			}

			value = newVal

			// 模板刷新(现在是临时的)
			// vue实例??? watcher就不会有这个问题
			typeof that.mountComponent === "function" && that.mountComponent()
			// 临时: 数组现在没有参与页面的渲染
			// 所以在数组上进行响应式的处理,不需要页面的刷新
			// 那么 即使这里无法调用也没有关系
		},
	})
}

// 将对象转换为响应式的
function reactify(obj, vm) {
	let keys = Object.keys(obj) // 没有对obj本身进行响应式处理,是对obj的成员进行响应式处理

	for (let i = 0; i < keys.length; i++) {
		let key = keys[i] // 属性名
		let value = obj[key]

		// 判断这个属性是不是引用类型,判断是不是数组
		// 如果引用类型就需要递归
		// 如果不是引用类型.需要使用defineReactive将其变成响应式
		// 如果是数组呢? 就需要循环数组,然后将数组里面的元素进行响应式化

		if (Array.isArray(value)) {
			value.__proto__ = array_methods // 数组就响应式了

			for (let j = 0; j < value.length; j++) {
				reactify(value[j], vm) // 递归
			}
		} else {
			defineReactive.call(vm, obj, keys[i], obj[keys[i]], true)
		}

		// 在这里添加代理(问题是这里写的代码是会递归的)
		// 如果是在这里将属性映射到Vue实例上, 那么就表示Vue实例可以使用属性 key
	}
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
