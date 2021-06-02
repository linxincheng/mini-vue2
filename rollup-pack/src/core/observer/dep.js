import { remove } from "../util/index"

let uid = 0

export default class Dep {
	static target // 全局当前活动的watcher
	id
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
			Dep.target.addDep(this)
		}
	}

	// 每一个属性 都会包含一个dep实例
	// 这个dep实例会记录下 参与计算或渲染的watcher
	notify() {
		// stabilize the subscriber list first
		const subs = this.subs.slice()

		// 做下排序
		subs.sort((a, b) => a.id - b.id)

		for (let i = 0, l = subs.length; i < l; i++) {
			subs[i].update()
		}
	}
}

// Dep.target是当前活动的watcher
// 以下是 增删逻辑
// 为了做
Dep.target = null
const targetStack = []

export function pushTarget(target) {
	targetStack.push(target)
	Dep.target = target
}

export function popTarget() {
	targetStack.pop()
	Dep.target = targetStack[targetStack.length - 1]
}
