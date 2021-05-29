let watchid = 0;
/** Watcher 观察者,用于发射更新的行为 */
class Watcher {
	/**
	 *
	 * @param {Object} vm JGVue 实例
	 * @param {String | Function} expOrFn 如果时渲染watcher,传入的就是渲染函数,如果是 计算watcher 传入的就是路径表达式, 暂时只考虑expOrFn为函数的情况
	 */
	constructor(vm, expOrFn) {
		this.vm = vm;
		this.getter = expOrFn;
		this.id = watchid ++;

		this.deps = []; //依赖项
		this.depIds = []; //是一个Set类型，用于保证依赖项的唯一性 （暂时先简化）

		this.get();
		// 一开始需要渲染： 真实vue中： this.lazy ？undefined ： this.get（）
	}

	/** 计算， 触发getter */
	get() {
		pushTarget(this);
		this.getter.call(this.vm, this.vm);
		popTarget();
	}

	/**
	 * 执行，并判断是懒加载，还是同步加载，还是异步加载
	 * 现在只考虑 异步执行 （简化的是 同步执行）
	 */
	run() {
		this.get();
		// 在真正的vue中是调用queueWatcher, 来触发nextTick 进行异步的执行
	}

	/** 对外公开的函数，用于在属性发生变化触发的接口 */
	update() {
		this.run();
	}

	/** 清空依赖队列 */
	cleanupDep() {

	}

	// 将当前的 dep 与 当前的 watcher 关联
	addDep(dep) {
		this.deps.push(dep);
	}
}
