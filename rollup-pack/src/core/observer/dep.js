import { remove } from "../util/index"

// vue源码中有很多这样的标识，是给对象唯一标识
// 目的
// 1. 去重
// 2. 某些地方可以根据这个标识进行排列执行顺序
let uid = 0

export default class Dep {
	static target // 全局当前活动的watcher
	id // dep的唯一标识
	subs // 关联的 watcher list

	constructor() {
		this.id = uid++
		this.subs = []
	}

	addSub(sub) {
		this.sub.push(sub)
	}

	removeSub(sub) {
		remove(this.subs, sub)
	}

	depend() {
		if (Dep.target) {
			// 把当前实例存到 活动的watcher
			// 场景： 哪个watcher在执行render的时候，它就是活动的watcher
			Dep.target.addDep(this)
		}
	}

	// 这块就是属性更新之后的派发更新
	// 每一个属性 都会包含一个dep实例
	// 这个dep实例会记录下 参与计算或渲染的watcher
	notify() {
		// stabilize the subscriber list first
		const subs = this.subs.slice()

		// 将watcher list做下排序，为了执行的时候和创建的时候顺序一致
		// 可以确保执行的正确性
		subs.sort((a, b) => a.id - b.id)

		// 然后挨个执行dep所关联的watcher的update
		for (let i = 0, l = subs.length; i < l; i++) {
			subs[i].update()
		}
	}
}

// 做依赖收集的很重要的一个变量
// Dep.target是当前活动的watcher
// dep在depend的时候，收集到这个活动的watcher
Dep.target = null

// 活动的watcher 执行栈
const targetStack = []
export function pushTarget(target) {
	targetStack.push(target)
	Dep.target = target
}

export function popTarget() {
	targetStack.pop()
	Dep.target = targetStack[targetStack.length - 1]
}
