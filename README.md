# miniVue
vue2.x 抽取的源码在rollup-pack文件夹
从 01 - 05 demo 记录了 vue 源码中的一些核心概念

# 实现核心 vue2 源码模型

数据驱动

# vue 与模板

1. 编写页面 模板
2. 直接再 HTML 标签中写标签
3. 使用 template
4. 使用单文件(`<template />`)
5. 创建 Vue 的实例
6. 在 Vue 的构造函数中提供：data, methods, computed, watcher, props, ...
7. 将 Vue 挂载到页面中（mount）

# 数据驱动模型

Vue 的执行流程

1. 获得模板：模板中有"坑"
2. 利用 Vue 构造函数中所提供的数据来"填坑"，得到可以在页面中显示的"标签"了
3. 将标签替换页面中原来有坑的标签

Vue 利用提供的数据 和页面中模板 生成了一个新的 HTML 标签（node 元素），
替换到了页面中 放置模板的位置

# 简单的模板渲染

# 虚拟 DOM

目标:

1. 怎么将真正的 DOM 转化为虚拟 DOM
2. 怎么将虚拟 DOM 转化成真正的 DOM

思路与深拷贝类似

# 函数柯里化

概念：

1. 柯里化： 一个函数原本有多个参数，只传入一个参数，生成一个新函数，由新函数接受身下的参数来运行得到结构
2. 偏函数： 一个函数原本有多个参数，只传入一部分参数，生成一个新函数，由新函数接受身下的参数来运行得到结构
3. 高阶函数： 一个函数是一个函数，该函数对参数这个函数进行加工，得到一个函数，这个加工过的函数就是高阶函数

为什么使用柯里化？ 为了提升性能，使用柯里化，可以函数一部分能力。

使用两个案例来说明：

1. 判断元素：
   Vue 本质上是使用 HTML 的字符串作为模板的，将字符串的模板转换为 AST，再转换为 VNode

- .vue 组件读取 (template, style, script...) 在源码 src/sfc/parser.js
- 模板 -> AST (最消耗性能，词法解析->字符串正则解析->ast)
- AST -> VNode (主要通过 render function)
- VNode -> DOM (update new,old -> patch)

例子： let s = "1 + 2 \* （3 + 4）"
写一个程序，解析这个表达式，得到结果（一般化）
一般会将这个表达式转换为"波兰式"，然后使用栈结构来运算

在 Vue 中每一个标签可以是真正的 HTML 标签，也可以是自定义组件， 问怎么区分

在 Vue 源码中其实将所有可用的 HTML 标签已经存起来了.

假设这里只考虑几个标签：

```js
let tag = "div,p,a,ul,li".split(",")
```

需要一个函数，判断一个标签名是否为内置的标签

```js
function isHTMLTag(tagName) {
	tagName = tagName.toLowerCase()
	return tag.includes(tagName)
}
```

模板是任意编写的，可以写的很简单， 也可以写的很复杂， indexOf 内部也是要函数的
如果由 6 种内置标签， 而模板有 10 种标签需要判断，那么就需要执行 60 次循环

2. 虚拟 DOM 的 render 方法

思考： vue 项目 模板转换为抽象语法树需要执行几次？？？

01 中写的代码，每次渲染的时候，模板就会被解析一次（注意，这里简化了解析方法）

render 的作用是将 虚拟 DOM 转换为真正的 DOM 加到页面中

- 虚拟 DOM 可以降级理解为 AST
- 一个项目运行的时候， 模板是不会变的， 就表示 AST 是不会变的

可以将代码进行优化，将虚拟 DOM 缓存起来，生成一个函数， 函数只需要传入数据，就可以得到真正的 DOM

# 响应式原理

- 在使用 Vue 的时候,赋值属性获得属性就是直接使用的 Vue 实例
- 在设计属性值的时候,页面的数据更新

```js
Object.defineProperty(obj, 'key', {
	writeable
	configurable
	enumerable
	get: () => any;
	set: () => void;
})
```

技巧: 如果一个函数已经定义了,但是需要扩展其功能,一般的处理办法:

1. 使用一个临时的函数名存储函数
2. 重新定义原来的函数
3. 定义扩展的功能
4. 调用临时的那个函数

扩张数组的 push 和 pop 等方法

- 修改要进行响应式的数组的原理(**proto**)

# 发布订阅模式

- 代理方式 (app.name, app_data.name)
- 事件模型(node:event 模板)
- vue 中 Observer 与 Watcher 和 Dep

代理方法, 就是要将 app.\_data 中的成员给映射到 app 上

由于需要在更新数据的时候,更新页面的内容
所有 app.\_data 访问的成员 与 app 访问的成员应该是同一个成员

由于 app.\_data 已经是响应式对象了,所以只需要让 app 访问的成员去访问 app.\_data 的对应的成员就可以了.

例如:

```js
app.name 转换为app._data.name
app.xxx转换为app._data.xxx
```

引入了一个函数 proxy(target,src,prop) 将 target 的操作映射到 src.prop 上

提供一个 Oberver 的方法,在方法中对属性进行处理
可以将这个方法封装到 initData 方法中

## 解释 proxy

```js
app._data.name
app.name
// 访问app.xxx就是在访问app._data.xxx
```

# 发布订阅模式

目标: 解耦,让各个模块之间没有紧密的联系

现在的处理是 属性在更新的 时候 调用 mountComponent 方法.

问题: mountComponent 更新的是什么 ???(现在) 全部的页面 -> 当前虚拟 DOM 对应的页面 DOM

在 vue 中, 整个的更新是按照组件为单位进行 判断, 已节点为单位 进行更新

- 如果代码中没有自定义组件,那么在比较算法的时候,会将全部的模板 对应的 虚拟 DOM 进行比较.
- 如果代码中含有自定义组件,那么在比较算法的时候,就会判断更新的是哪一些组件中的属性,只会判读更新数据的组件,其他组件不会更新.

复杂的页面是由很多组件构成的. 每一个属性要更新的都要调用 更新方法 ?

<!-- 目标,如果修改了什么属性,就尽可能只更新这些属性对应的页面 DOM -->

1. event 是一个全局对象
2. event.on('事件名称', 处理函数), 订阅事件
   - 事件可以连续订阅
   - 可以移除: event.off();
3. event.emit('事件名称', 参数)
4. event.once('事件名称', 处理函数)

原因:

1. 描述发布订阅模式
2. 后续也会用到事件

发布订阅模式 ( 形式不局限于函数,形式可以是对象等 )

1. 中间的 全局的容器, 用来 存储 可以被触发的东西(函数, 对象)
2. 需要一个方法, 可以往容器中 传入东西(函数, 对象)
3. 需要一个方法, 可以将容器中的东西取出来 使用 (函数调用, 对象的调用)

Vue 模型

页面中的变更(diff)是以组件为单位

- 如果页面中只有一个组件(Vue 实例), 不会有性能损失
- 但是如果页面中有多个组件(多 watcher 的一种情况), 第一次会有多个组件的 watcher 存入到全局的 watcher 中.
  - 如果修改了局部的数据(例如其中一个组件的数据)
  - 表示只会对该组件进行 diff 算法,也就是说只会重新生成该组件的 抽象语法树
  - 只会访问该组件的 watcher
  - 也就表示再次往全局存储的只有该组件的 watcher
  - 页面更新的时候也就只需要更新一部分

# observe 函数

缺陷:

- 无法处理数组
- 响应式无法在中间集成 Watcher 处理
- 实现的 reactify 需要和实例绑定在一起

# 引入 Watcher

实现:
分成两步:

1. 只考虑修改后刷新( 响应式 )
2. 再考虑依赖收集( 优化 )

在 Vue 中提供一个构造函数 Watcher
Watcher 会有一些方法:

- get() 用来进行计算或执行处理函数
- update() 公共的外部方法, 该方法会触发内部的 run 方法
- run() 运行, 用来判断内部是使用异步运行还是同步运行等, 这个方法最终会调用内部的 get 方法
- cleanupDep() 简单理解为清除队列

页面渲染时上面哪一个方法执行的

watcher 实例有一个属性 vm,表示的就是当前的 vue 实例

# 引入 Dep 对象

该对象进行依赖收集（depend） 的功能和派发更新（notify）的功能
在 nodify 中调用 watcher 的 update 方法

# Watcher 与 Dep

渲染 Watcher 放在全局作用域上的问题

- vue 项目中包含很多的组件，各个组件是自制的
  - watcher 可能会有多个
  - 每一个 watcher 用于描述一个渲染行为或者计算行为
  - 子组件发生数据更新，页面更新需要重新渲染（真正的 vue 是局部渲染）
  - vue 中推荐的是 计算属性 替代复杂的插值表达式
    - 计算属性是伴随其使用的属性的变化而变化的
    - `name: () => this.first + this.lastName`
      - 计算属性依赖于属性 firstName 和属性 lastName
      - 只要被依赖的属性发生变化，就会促使计算属性 重新计算 （Watcher）
- 依赖收集 与 派发更新是如何运行的

# Observer 对象

# vue 源码解读

## 各个文件夹的作用

1. compiler 编译用的
   - vue 使用 字符串 作为模版
   - 在编译文件夹中存放在 模版字符串的 解析的算法，抽象语法数，优化等
2. core 核心，vue 构造函数，以及生命周期等方法的部分
3. platforms 平台
   - 针对 运行的环境 ，有不同的实现
   - 也是 vue 的入口
4. server 服务端， 主要是将 vue 用在服务端的处理代码
5. sfc, 单文件组件（略）
6. shared 公共工具，方法

# 主要内容

1. vue 源码
   1. Observer
   2. watcher 和 computed
   3. 简单撸下 patch

![](assets/observe.jpg)

oberver 各个文件的作用

- arrary.js 创建含有重写数组方法的数组， 让所有的响应式数据继承自 该数组
- dep Dep 类
- index.js Observer 类， observer 的工厂函数
- scheduler.js vue 中任务调度的工具， watcher 执行的核心
- traverse.js 递归遍历响应式数据，目的是触发依赖收集
- watcher.js Watcher 类

README 文档先偷个懒,会延迟于代码更新
