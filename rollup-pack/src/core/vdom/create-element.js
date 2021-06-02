import VNode from "./vnode"
import { createComponent } from "./create-component"

// 返回一个创建vnode的render函数
export function createElement(
	context,
	tag,
	data,
	children,
	normalizationType,
	alwaysNormalize
) {
	// return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement(
	context,
	tag,
	data,
	children,
	normalizationType
) {
	// children是否排平
	if (normalizationType === ALWAYS_NORMALIZE) {
		children = normalizeChildren(children)
	} else if (normalizationType === SIMPLE_NORMALIZE) {
		children = simpleNormalizeChildren(children)
	}

	// 如果是组件执行 createComponent
	if (typeof tag === "string") {
		vnode = new VNode(tag, data, children, undefined, undefined, context)
	} else {
		vnode = createComponent(Ctor, data, context, children, tag)
	}

	return vnode
}
