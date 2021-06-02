export function createComponent(Ctor, data, context, children, tag) {
	const vnode = new VNode(
		`vue-component-${Ctor.cid}${name ? `-${name}` : ""}`,
		data,
		undefined,
		undefined,
		undefined,
		context,
		{ Ctor, propsData, listeners, tag, children },
		asyncFactory
	)
	return vnode
}
