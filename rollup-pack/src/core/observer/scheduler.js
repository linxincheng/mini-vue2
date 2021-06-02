// watcher 队列
const queue = []

let has = {}

// 开关标记
// 异步的触发没有开始，类比setTimeout还没有执行
let waiting = false
// 开始渲染，清空队列，执行队列中的watcher的run方法
let flushing = false

// 触发更新
function flushSchedulerQueue() {
	flushing = true
	let watcher, id

	// 对watcher进行排序
	queue.sort((a, b) => a.id - b.id)

	for (index = 0; index < queue.length; index++) {
		watcher = queue[index]
		if (watcher.before) {
			watcher.before()
		}
		id = watcher.id
		has[id] = null
		watcher.run()
	}
}

export function queueWatcher(watcher) {
	const id = watcher.id

	// 检查下是否在队列里
	if (has[id] == null) {
		has[id] = true
		if (!flushing) {
			queue.push(watcher)
		} else {
			// if already flushing, splice the watcher based on its id
			// if already past its id, it will be run next immediately.
			let i = queue.length - 1
			while (i > index && queue[i].id > watcher.id) {
				i--
			}
			queue.splice(i + 1, 0, watcher)
		}
		// queue the flush
		if (!waiting) {
			waiting = true

			if (!config.async) {
				// 同步情况下
				flushSchedulerQueue()
				return
			}
			// 让任务队列中的watcher 在下 ‘一个事件循环’中触发
			// 不阻塞当前的处理逻辑
			process.nextTick(flushSchedulerQueue)
		}
	}
}
