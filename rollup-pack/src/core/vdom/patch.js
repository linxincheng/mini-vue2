const hooks = ["create", "activate", "update", "remove", "destroy"]

export const createPatchFunction = function (backend) {
	let i, j
	const cbs = {}

	// 拿到所有添加的hook
	const { modules, nodeOps } = backend

	for (i = 0; i < hooks.length; ++i) {
		cbs[hooks[i]] = []
		for (j = 0; j < modules.length; ++j) {
			if (isDef(modules[j][hooks[i]])) {
				cbs[hooks[i]].push(modules[j][hooks[i]])
			}
		}
	}

	function patchVnode(
		oldVnode,
		vnode,
		insertedVnodeQueue,
		ownerArray,
		index,
		removeOnly
	) {
		// 如果是同一个对象一致退出, static元素
		if (oldVnode === vnode) {
			return
		}

		if (isDef(vnode.elm) && isDef(ownerArray)) {
			// 克隆重用的 vnode
			vnode = ownerArray[index] = cloneVNode(vnode)
		}

		const elm = (vnode.elm = oldVnode.elm)

		if (isTrue(oldVnode.isAsyncPlaceholder)) {
			if (isDef(vnode.asyncFactory.resolved)) {
				hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
			} else {
				vnode.isAsyncPlaceholder = true
			}
			return
		}

		//为静态树重用元素。
		//请注意，我们仅在克隆 vnode 时执行此操作 -
		//如果新节点没有被克隆，则意味着渲染函数已经被
		//由 hot-reload-api 重置，我们需要进行适当的重新渲染。
		if (
			isTrue(vnode.isStatic) &&
			isTrue(oldVnode.isStatic) &&
			vnode.key === oldVnode.key &&
			(isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
		) {
			vnode.componentInstance = oldVnode.componentInstance
			return
		}

		let i
		const data = vnode.data
		if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
			i(oldVnode, vnode)
		}

		const oldCh = oldVnode.children
		const ch = vnode.children
		if (isDef(data) && isPatchable(vnode)) {
			for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
			if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode)
		}
		// 新节点没有内容
		if (isUndef(vnode.text)) {
			// 有值
			if (isDef(oldCh) && isDef(ch)) {
				// 新老孩子都存在
				if (oldCh !== ch)
					// 新老孩子不一样，更新孩子
					updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
			} else if (isDef(ch)) {
				// 新孩子存在，老孩子不存在
				// 就增加dom
				if (process.env.NODE_ENV !== "production") {
					checkDuplicateKeys(ch)
				}
				if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, "")
				addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue) // createElm
			} else if (isDef(oldCh)) {
				// 新孩存在，老孩子存在
				// 就删除dom
				removeVnodes(oldCh, 0, oldCh.length - 1)
			} else if (isDef(oldVnode.text)) {
				// 新孩子和老孩子都不存在， 不过老节点有内容就设置为""
				nodeOps.setTextContent(elm, "")
			}
		} else if (oldVnode.text !== vnode.text) {
			// 新老节点的内容不一样
			// 更新内容
			// 其实挺合理的
			nodeOps.setTextContent(elm, vnode.text)
		}
		// 新节点的属性存在
		if (isDef(data)) {
			if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode)
		}
	}

	function updateChildren(
		parentElm,
		oldCh,
		newCh,
		insertedVnodeQueue,
		removeOnly
	) {
		let oldStartIdx = 0
		let newStartIdx = 0
		let oldEndIdx = oldCh.length - 1
		let oldStartVnode = oldCh[0]
		let oldEndVnode = oldCh[oldEndIdx]
		let newEndIdx = newCh.length - 1
		let newStartVnode = newCh[0]
		let newEndVnode = newCh[newEndIdx]
		let oldKeyToIdx, idxInOld, vnodeToMove, refElm

		// removeOnly is a special flag used only by <transition-group>
		// to ensure removed elements stay in correct relative positions
		// during leaving transitions
		const canMove = !removeOnly

		if (process.env.NODE_ENV !== "production") {
			checkDuplicateKeys(newCh)
		}

		// 双指针
		while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
			if (isUndef(oldStartVnode)) {
				// 老的开头不存在
				// 老的 开始指针后移
				oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
			} else if (isUndef(oldEndVnode)) {
				// 老的结束不存在
				// 老的指针结束指针前移动
				oldEndVnode = oldCh[--oldEndIdx]
			} else if (sameVnode(oldStartVnode, newStartVnode)) {
				// 双端比较 ↓
				// 老的开始节点和新的开始节点是不是相同的（key，tag）
				patchVnode(
					oldStartVnode,
					newStartVnode,
					insertedVnodeQueue,
					newCh,
					newStartIdx
				)
				oldStartVnode = oldCh[++oldStartIdx]
				newStartVnode = newCh[++newStartIdx]
			} else if (sameVnode(oldEndVnode, newEndVnode)) {
				// 老的结束和新的结束是不是相同的
				patchVnode(
					oldEndVnode,
					newEndVnode,
					insertedVnodeQueue,
					newCh,
					newEndIdx
				)
				oldEndVnode = oldCh[--oldEndIdx]
				newEndVnode = newCh[--newEndIdx]
			} else if (sameVnode(oldStartVnode, newEndVnode)) {
				// 老的开始和新的结束是不是相同的
				// Vnode moved right
				patchVnode(
					oldStartVnode,
					newEndVnode,
					insertedVnodeQueue,
					newCh,
					newEndIdx
				)
				canMove &&
					nodeOps.insertBefore(
						parentElm,
						oldStartVnode.elm,
						nodeOps.nextSibling(oldEndVnode.elm)
					)
				oldStartVnode = oldCh[++oldStartIdx]
				newEndVnode = newCh[--newEndIdx]
			} else if (sameVnode(oldEndVnode, newStartVnode)) {
				// 老的结束和新的开始是不是相同的
				// Vnode moved left
				patchVnode(
					oldEndVnode,
					newStartVnode,
					insertedVnodeQueue,
					newCh,
					newStartIdx
				)
				canMove &&
					nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
				oldEndVnode = oldCh[--oldEndIdx]
				newStartVnode = newCh[++newStartIdx]
			} else {
				if (isUndef(oldKeyToIdx))
					oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)

				// 拿新节点的key 是否对象oldch中的key
				idxInOld = isDef(newStartVnode.key)
					? oldKeyToIdx[newStartVnode.key]
					: findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
				if (isUndef(idxInOld)) {
					// 没对应上
					// 直接插入dom
					createElm(
						newStartVnode,
						insertedVnodeQueue,
						parentElm,
						oldStartVnode.elm,
						false,
						newCh,
						newStartIdx
					)
				} else {
					// 对应上了key的节点
					vnodeToMove = oldCh[idxInOld]
					// tag是不是相等
					if (sameVnode(vnodeToMove, newStartVnode)) {
						// 相等的话就更新
						patchVnode(
							vnodeToMove,
							newStartVnode,
							insertedVnodeQueue,
							newCh,
							newStartIdx
						)
						oldCh[idxInOld] = undefined
						canMove &&
							nodeOps.insertBefore(
								parentElm,
								vnodeToMove.elm,
								oldStartVnode.elm
							)
					} else {
						// tag不相等
						// same key but different element. treat as new element
						createElm(
							newStartVnode,
							insertedVnodeQueue,
							parentElm,
							oldStartVnode.elm,
							false,
							newCh,
							newStartIdx
						)
					}
				}
				newStartVnode = newCh[++newStartIdx]
			}
		}
		if (oldStartIdx > oldEndIdx) {
			// 老的开始大于老的结束
			// 说明还有一些新的节点没有遍历到
			// 新增节点
			refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
			addVnodes(
				parentElm,
				refElm,
				newCh,
				newStartIdx,
				newEndIdx,
				insertedVnodeQueue
			)
		} else if (newStartIdx > newEndIdx) {
			// 新的开始大于新的结束
			// 说明还有一些老的节点没有遍历到
			// 删除节点
			removeVnodes(oldCh, oldStartIdx, oldEndIdx)
		}
	}

	// 二次提交的逻辑
	// 每次数据更新的时候 -> 新的虚拟DOM -> diff旧的虚拟DOM （真实的DOM） -> 更新旧的虚拟DOM -> 同步真的DOM
	// 分而治之，每一个虚拟DOM 都和页面中的DOM 一一对应
	// 我们只需要将VNode 与DOMNode 建一个更新的关系
	// 递归触发每一个虚拟DOM的update,来更新对应的真的DOM 的数据
	return function patch(oldVnode, vnode, hydrating, removeOnly) {
		// 新的没有，老的有， 就执行销毁
		if (isUndef(vnode)) {
			if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
			return
		}

		let isInitialPatch = false
		const insertedVnodeQueue = []

		if (isUndef(oldVnode)) {
			// 如果老的根没有，空挂载
			// 空挂载（可能作为组件），创建新的根元素
			isInitialPatch = true
			createElm(vnode, insertedVnodeQueue)
		} else {
			// 只有第一次渲染才是真实节点
			const isRealElement = isDef(oldVnode.nodeType)

			// 新老节点是一样的，这是之后更新的逻辑
			if (!isRealElement && sameVnode(oldVnode, vnode)) {
				// patch现有的根节点
				patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
			} else {
				if (isRealElement) {
					// 创建一个空节点
					oldVnode = emptyNodeAt(oldVnode)
				}

				// 替换现有元素
				const oldElm = oldVnode.elm
				const parentElm = nodeOps.parentNode(oldElm)

				// 创建一个新节点
				createElm(
					vnode,
					insertedVnodeQueue,
					oldElm._leaveCb ? null : parentElm,
					nodeOps.nextSibling(oldElm)
				)

				// 递归更新父占位符节点元素
				if (isDef(vnode.parent)) {
					let ancestor = vnode.parent
					const patchable = isPatchable(vnode)
					while (ancestor) {
						for (let i = 0; i < cbs.destroy.length; ++i) {
							cbs.destroy[i](ancestor)
						}
						ancestor.elm = vnode.elm
						if (patchable) {
							// 递归调用 create 钩子
							for (let i = 0; i < cbs.create.length; ++i) {
								cbs.create[i](emptyNode, ancestor)
							}
							// #6513
							// invoke insert hooks that may have been merged by create hooks.
							// e.g. for directives that uses the "inserted" hook.
							const insert = ancestor.data.hook.insert
							if (insert.merged) {
								// 从索引 1 开始以避免重新调用组件安装的钩子
								for (let i = 1; i < insert.fns.length; i++) {
									insert.fns[i]()
								}
							}
						} else {
							registerRef(ancestor)
						}
						ancestor = ancestor.parent
					}
				}

				// 销毁旧节点
				if (isDef(parentElm)) {
					removeVnodes([oldVnode], 0, 0)
				} else if (isDef(oldVnode.tag)) {
					invokeDestroyHook(oldVnode)
				}
			}
		}

		invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
		return vnode.elm
	}
}
