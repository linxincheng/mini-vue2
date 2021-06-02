import { parsePath } from "../util/index"
import { traverse } from "./traverse"

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
}
