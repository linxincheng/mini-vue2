数据驱动

# vue 与模板

1. 编写页面 模板
2. 直接再 HTML 标签中写标签
3. 使用 template
4. 使用单文件(<template />)
5. 创建 Vue 的实例
6. 在 Vue 的构造函数中提供：data, methods, computed, watcher, props, ...
7. 将 Vue 挂载到页面中（mount）

# 数据驱动模型

Vue 的执行流程

1. 获得模板：模板中有"坑"
2. 利用 Vue 构造函数中所提供的数据来"填坑"，得到可以在页面中显示的"标签"了
3. 将标签替换页面中原来有坑的标签

Vue 利用我们提供的数据 和页面中模板 生成了一个新的 HTML 标签（node 元素），
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

- 模板 -> AST (最消耗性能，字符串解析)
- AST ->VNode
- VNode -> DOM

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

demo1 中写的代码，每次渲染的时候，模板就会被解析一次（注意，这里我们简化了解析方法）

render 的作用是将 虚拟 DOM 转换为真正的 DOM 加到页面中

- 虚拟 DOM 可以降级理解为 AST
- 一个项目运行的时候， 模板是不会变的， 就表示 AST 是不会变的

可以将代码进行优化，将虚拟 DOM 缓存起来，生成一个函数， 函数只需要传入数据，就可以得到真正的 DOM

# 响应式原理

- 在使用 Vue 的时候,赋值属性获得属性就是直接使用的 Vue 实例
- 我们在设计属性值的时候,页面的数据更新

```js
Object.defineProperty(obj, 'key', {
	writeable
	configurable
	enumerable
	get: () => any;
	set: () => void;
})
```

技巧: 如果一个函数已经定义了,但是我们需要扩展其功能,我们一般的处理办法:

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