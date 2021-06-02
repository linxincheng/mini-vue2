import { parsePath } from "../util/index"
import { traverse } from "./traverse"
import Dep, { pushTarget, popTarget } from "./dep"
import { queueWatcher } from "./scheduler.js"

let uid = 0
export default class Watcher {
	vm // 实例
	expression // 渲染函数 或者关联表达式
	cb // user watch的callback
	id
	lazy // 计算属性和watch 来控制不要让watcher 立即执行
	user // 是不是user watch
	deep // 是否深度监听

	// 在 Vue 中使用了二次提交的概念
	// 每次在数据渲染或计算的时候 就会访问响应式的数据，就会进行依赖收集
	// 就将关联的Watcher 与 dep 相关联
	// 在数据发生变化的时候，根据dep 找到关联的watcher，依次调用 update
	// 执行完成后清空 watcher
	deps
	newDeps
	depIds
	newDepIds

	before // 用于before生命周期

	getter // 就是渲染函数（模板或组件的渲染） 或计算属性（watch）

	value // 如果是渲染函数，value无效，如果是计算属性，缓存的值

	constructor(vm, expOrFn, cb, options, isRenderWatcher) {
		this.vm = vm
		if (isRenderWatcher) {
			vm._watcher = this
		}

		// options
		if (options) {
			this.user = !!options.user
			this.lazy = !!options.lazy
			this.before = options.before
			this.deep = options.deep
		} else {
			this.user = this.lazy = false
		}

		this.cb = cb
		this.id = ++uid // uid for batching
		this.active = true
		this.deps = []
		this.newDeps = []
		this.depIds = new Set()
		this.newDepIds = new Set()

		this.expression = expOrFn.toString()

		if (typeof expOrFn === "function") {
			// 就是render函数
			this.getter = expOrFn
		} else {
			this.getter = parsePath(expOrFn)
		}

		// 如果是lazy就什么也不做，否则就立即调用getter函数求值（expOfFn）
		this.value = this.lazy ? undefined : this.get()
	}

	get() {
		pushTarget(this)

		value = this.getter.call(vm, vm)

		// 去访问每一个属性，收集依赖
		if (this.deep) {
			traverse(value)
		}

		popTarget()
		this.cleanupDeps() // “清空（归档）” 关联的dep 属性
	}

	addDep(dep) {
		const id = dep.id
		if (!this.newDepIds.has(id)) {
			this.newDepIds.add(id)
			this.newDeps.push(dep) // 让 watcher 关联 dep

			if (!this.depIds.has(id)) {
				dep.addSub(this) // 让 dep 关联到 watcher
			}
		}
	}

	// 更新 dep相关的四个属性， 删除旧的， 新的变旧的
	cleanupDeps() {
		let i = this.deps.length
		while (i--) {
			const dep = this.deps[i]

			// 在二次提交中 归档 就是让旧的deps 和新的 newDeps 一致
			if (!this.newDepIds.has(dep.id)) {
				dep.removeSub(this)
			}
		}
		let tmp = this.depIds
		this.depIds = this.newDepIds
		this.newDepIds = tmp
		this.newDepIds.clear()
		tmp = this.deps
		this.deps = this.newDeps // 同步
		this.newDeps = tmp
		this.newDeps.length = 0
	}

	// 说明 watcher 的数据（eg: 属性修改）有变化
	update() {
		/* istanbul ignore else */
		if (this.lazy) {
			// 主要针对计算属性，一般用于求值计算
			this.dirty = true
		} else if (this.sync) {
			// 同步，主要用于ssr， 同步就表示立即计算
			this.run()
		} else {
			// 加入到一个队列里
			// 一般的浏览器中的异步运行， 本质上就是异步执行 run
			// 类比 setTimeout(() => this.run, 0)
			queueWatcher(this)
		}
	}

	depend() {
		let i = this.deps.length
		while (i--) {
			this.deps[i].depend()
		}
	}

	/**
	 * 调用get求值或渲染，如果求值，新旧值不一样，就触发cb
	 */
	run() {
		if (this.active) {
			const value = this.get() // 要么渲染，要么求值
			if (
				value !== this.value ||
				// Deep watchers and watchers on Object/Arrays should fire even
				// when the value is the same, because the value may
				// have mutated.
				isObject(value) ||
				this.deep
			) {
				// set new value
				const oldValue = this.value
				this.value = value
				// if (this.user) {
				//   const info = `callback for watcher "${this.expression}"`;
				//   invokeWithErrorHandling(
				//     this.cb,
				//     this.vm,
				//     [value, oldValue],
				//     this.vm,
				//     info
				//   );
				// } else {

				// 就在这儿
				this.cb.call(this.vm, value, oldValue)

				// }
			}
		}
	}

	/**
	 * 移除数据，相当于remove
	 * 一般用于销毁组件的时候调用
	 */
	teardown() {
		if (this.active) {
			if (!this.vm._isBeingDestroyed) {
				remove(this.vm._watchers, this)
			}
			let i = this.deps.length
			while (i--) {
				this.deps[i].removeSub(this)
			}
			this.active = false
		}
	}
}
