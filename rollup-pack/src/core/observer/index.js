import { arrayMethods } from "./array"

export class Observer {
	value // 循环引用：对象.__ob__，ob.value
	dep // 属性的Dep, 属性依赖的问题
	// 计数的
	vmCount

	constructor(value) {
		this.value = value
		this.dep = new Dep()
		this.vmCount = 0
		def(value, "__ob__", this) // 技巧：Object.defineProperty 逻辑上等价于 value.__ob__ = this；

		// 响应式化的逻辑
		if (Array.isArray(value)) {
			// 如何进行浏览器的能力检查

			// 判断浏览器是否兼容 __prop__
			if (hasProto) {
				// protoAugment(value, arrayMethods)
				target.__proto__ = arrayMethods
			} else {
				copyAugment(value, arrayMethods, arrayKeys)
			}
			this.observeArray(value) // 遍历数组的元素，进行递归observe
		} else {
			this.walk(value) // 遍历对象的属性，递归observe
		}
	}

	/**
	 *
	 * 遍历 对象 做 def
	 */
	walk(obj) {
		const keys = Object.keys(obj)
		for (let i = 0; i < keys.length; i++) {
			defineReactive(obj, keys[i])
		}
	}

	/**
	 * Observe a list of Array items.
	 *
	 * 遍历数组做 def
	 */
	observeArray(items) {
		for (let i = 0, l = items.length; i < l; i++) {
			observe(items[i])
		}
	}
}

/**
 * 将传入的数据value变成响应式对象
 *
 * 算法描述
 *
 *  - 先看 对象是否含有__ob__,并且是Observer的实例（Vue中响应式对象的标记）
 * 有，忽略
 * 没有，调用new Obserrver, 进行响应式话
 */
export function observe(value, asRoot) {
	// 如果不满足响应式条件就跳出
	if (!isObject(value) || value instanceof VNode) {
		return
	}
	let ob
	if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
		ob = value.__ob__ // 已经是observer
	} else if (
		shouldObserve &&
		!isServerRendering() &&
		(Array.isArray(value) || isPlainObject(value)) && // 是不是对象或者数组
		Object.isExtensible(value) &&
		!value._isVue
	) {
		ob = new Observer(value)
	}
	if (asRootData && ob) {
		ob.vmCount++
	}
	return ob
}

// 对属性进行做响应式
export function defineReactive(obj, key, value, customSetter, shallow) {
	const dep = new Dep()

	// 获得对象的属性描述， 就是定义Object.defineProperty需要传入对象 ({enumerable, writable, ...})
	const property = Object.getOwnPropertyDescriptor(obj, key)
	if (property && property.configurable === false) {
		return
	}

	// cater for pre-defined getter/setters
	const getter = property && property.get
	const setter = property && property.set
	if ((!getter || setter) && arguments.length === 2) {
		val = obj[key]
	}

	let childOb = observe(val)

	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter() {
			const value = getter ? getter.call(obj) : val // 保证了如果已经定义的get 方法可以被继承下来，不会被丢失

			if (Dep.target) {
				// 判断全局是否有watcher
				dep.depend() // 关联的当前属性

				// 收集子属性
				if (childOb) {
					childOb.dep.depend()
					if (Array.isArray(value)) {
						dependArray(value)
					}
				}
			}
			return value
		},
		set: function reactiveSetter(newVal) {
			const value = getter ? getter.call(obj) : val
			// 如果数据没有发生变化，就不会发生派发更新
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return
			}
			/* eslint-enable no-self-compare */
			// if (customSetter) {
			// 	customSetter()
			// }

			// #7981: for accessor properties without setter
			// if (getter && !setter) return
			// if (setter) {
			// 	setter.call(obj, newVal) // 保证了如果已经定义了set方法可以被继承下来，不会丢失
			// } else {
			// 	val = newVal
			// }
			childOb = !shallow && observe(newVal) // 对新值就行响应式化
			dep.notify() // 派发更新
		},
	})
}

export function set(target, key, val) {}

export function del(target, key) {}

/**
 * 对数组进行依赖收集
 */
function dependArray(value) {
	for (let e, i = 0, l = value.length; i < l; i++) {
		e = value[i]
		e && e.__ob__ && e.__ob__.dep.depend()
		if (Array.isArray(e)) {
			dependArray(e)
		}
	}
}
