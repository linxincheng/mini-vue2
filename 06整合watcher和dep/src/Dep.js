let depid = 0;
class Dep {
    constructor() {
        this.id = depid ++;
        this.subs = []; // 存储的是与 当前Dep 关联的watcher
    }

    /* 增加一个watcher */
    addSub(sub) {
        this.subs.push(sub);
    }

    /** 移除 */
    removeSub(sub) {
        for(let i = this.subs.length - 1; i >= 0; i --) {
            if(sub === this.subs[i]) {
                this.subs.splice(i, 1);
            }
        }
    }

    /**将当前的Dep 与当前的watcher （暂时渲染watcher）关联 */
    depend() {
        // 将当前的dep与当前的watcher互相关联
        if(Dep.target) {
            this.addSub(Dep.target); // 将当前的watcher 关联到当前的dep上

            Dep.target.addDep(this); // 将当前的dep 与 当前的 watcher 关联起来
        }
    }

    /**触发与之关联的watcher的update 方法，起到更新的作用 */
    notify () {
        // 在真实的Vue中依次触发 this.subs 中的watcher 的 update 方法
        let watchers = this.subs.slice();
        watchers.forEach(watcher => {
            watcher.update();
        });
    }
}

// 全局的容器存储渲染 Watcher
Dep.target = null;
let targetStack = [];

/** 将当前操作的watcher 存储到 全局watcher中， 参数target就是当前watcher */
function pushTarget(target) {
    targetStack.unshift(Dep.target); // vue 源码中使用push
    Dep.target = target;
}

/** 将当前 watcher 踢出 */
function popTarget(target) {
    Dep.target = targetStack.shift(); // 踢到最后是undefined
}

/**
 * 在 Watcher 调用 get 方法的时候，调用 pushTarget(this)
 * 在 Watcher 调用 get 方法结束的时候，调用 popTarget()
 */
