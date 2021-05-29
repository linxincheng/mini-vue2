JGVue.prototype.mount = function () {
	// 需要提供一个render方法: 生成虚拟 DOM
	this.render = this.createRenderFn() // 带有缓存

	this.mountComponent()
}

JGVue.prototype.mountComponent = function () {
	// 执行 mountComponent() 函数
	let mount = () => {
		this.update(this.render())
	}
	// 这个 Watcher 就是全局的Watcher， 在任何一个位置都可以访问它（简化的写法）
	Dep.target = new Watcher(this, mount);
}

// 这里是生成render函数，目的是缓存抽象语法树（我们使用虚拟DOM来模拟）
JGVue.prototype.createRenderFn = function () {
	let ast = getVNode(this._template)
	// Vue： 将AST + data => VNode
	// 带有坑的VNode + data => 含有数据的VNode
	return function render() {
		// 将带坑的VNode转化为带数据的VNode
		let _tmp = combine(ast, this._data)
		return _tmp
	}
}

// 将虚拟DOM渲染到页面中： diff算法就在这里
JGVue.prototype.update = function (vnode) {
	// 简化, 直接生成HTML DOM replaceChild 到页面中
	// 父元素.replaceChild(新元素, 旧元素)
	let realDOM = parseVNode(vnode)

	this._parent.replaceChild(realDOM, document.querySelector("#root"))
	// 这个算法是不负责任的
	// 每次会将页面中的DOM全部替换的
}
