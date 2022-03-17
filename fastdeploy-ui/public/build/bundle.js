
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules/carbon-components-svelte/src/Button/ButtonSkeleton.svelte generated by Svelte v3.46.4 */

    const file$q = "node_modules/carbon-components-svelte/src/Button/ButtonSkeleton.svelte";

    // (41:0) {:else}
    function create_else_block$7(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let div_levels = [/*$$restProps*/ ctx[3]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--skeleton", true);
    			toggle_class(div, "bx--btn", true);
    			toggle_class(div, "bx--btn--field", /*size*/ ctx[1] === 'field');
    			toggle_class(div, "bx--btn--sm", /*size*/ ctx[1] === 'small' || /*small*/ ctx[2]);
    			toggle_class(div, "bx--btn--lg", /*size*/ ctx[1] === 'lg');
    			toggle_class(div, "bx--btn--xl", /*size*/ ctx[1] === 'xl');
    			add_location(div, file$q, 41, 2, 950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(div, "mouseover", /*mouseover_handler_1*/ ctx[9], false, false, false),
    					listen_dev(div, "mouseenter", /*mouseenter_handler_1*/ ctx[10], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler_1*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));
    			toggle_class(div, "bx--skeleton", true);
    			toggle_class(div, "bx--btn", true);
    			toggle_class(div, "bx--btn--field", /*size*/ ctx[1] === 'field');
    			toggle_class(div, "bx--btn--sm", /*size*/ ctx[1] === 'small' || /*small*/ ctx[2]);
    			toggle_class(div, "bx--btn--lg", /*size*/ ctx[1] === 'lg');
    			toggle_class(div, "bx--btn--xl", /*size*/ ctx[1] === 'xl');
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(41:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:0) {#if href}
    function create_if_block$l(ctx) {
    	let a;
    	let t_value = "" + "";
    	let t;
    	let a_rel_value;
    	let mounted;
    	let dispose;

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{
    			rel: a_rel_value = /*$$restProps*/ ctx[3].target === '_blank'
    			? 'noopener noreferrer'
    			: undefined
    		},
    		{ role: "button" },
    		/*$$restProps*/ ctx[3]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			set_attributes(a, a_data);
    			toggle_class(a, "bx--skeleton", true);
    			toggle_class(a, "bx--btn", true);
    			toggle_class(a, "bx--btn--field", /*size*/ ctx[1] === 'field');
    			toggle_class(a, "bx--btn--sm", /*size*/ ctx[1] === 'small' || /*small*/ ctx[2]);
    			toggle_class(a, "bx--btn--lg", /*size*/ ctx[1] === 'lg');
    			toggle_class(a, "bx--btn--xl", /*size*/ ctx[1] === 'xl');
    			add_location(a, file$q, 22, 2, 477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(a, "mouseover", /*mouseover_handler*/ ctx[5], false, false, false),
    					listen_dev(a, "mouseenter", /*mouseenter_handler*/ ctx[6], false, false, false),
    					listen_dev(a, "mouseleave", /*mouseleave_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				dirty & /*href*/ 1 && { href: /*href*/ ctx[0] },
    				dirty & /*$$restProps*/ 8 && a_rel_value !== (a_rel_value = /*$$restProps*/ ctx[3].target === '_blank'
    				? 'noopener noreferrer'
    				: undefined) && { rel: a_rel_value },
    				{ role: "button" },
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]
    			]));

    			toggle_class(a, "bx--skeleton", true);
    			toggle_class(a, "bx--btn", true);
    			toggle_class(a, "bx--btn--field", /*size*/ ctx[1] === 'field');
    			toggle_class(a, "bx--btn--sm", /*size*/ ctx[1] === 'small' || /*small*/ ctx[2]);
    			toggle_class(a, "bx--btn--lg", /*size*/ ctx[1] === 'lg');
    			toggle_class(a, "bx--btn--xl", /*size*/ ctx[1] === 'xl');
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$l.name,
    		type: "if",
    		source: "(22:0) {#if href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[0]) return create_if_block$l;
    		return create_else_block$7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	const omit_props_names = ["href","size","small"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonSkeleton', slots, []);
    	let { href = undefined } = $$props;
    	let { size = "default" } = $$props;
    	let { small = false } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('href' in $$new_props) $$invalidate(0, href = $$new_props.href);
    		if ('size' in $$new_props) $$invalidate(1, size = $$new_props.size);
    		if ('small' in $$new_props) $$invalidate(2, small = $$new_props.small);
    	};

    	$$self.$capture_state = () => ({ href, size, small });

    	$$self.$inject_state = $$new_props => {
    		if ('href' in $$props) $$invalidate(0, href = $$new_props.href);
    		if ('size' in $$props) $$invalidate(1, size = $$new_props.size);
    		if ('small' in $$props) $$invalidate(2, small = $$new_props.small);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		href,
    		size,
    		small,
    		$$restProps,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		click_handler_1,
    		mouseover_handler_1,
    		mouseenter_handler_1,
    		mouseleave_handler_1
    	];
    }

    class ButtonSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, { href: 0, size: 1, small: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonSkeleton",
    			options,
    			id: create_fragment$u.name
    		});
    	}

    	get href() {
    		throw new Error("<ButtonSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<ButtonSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<ButtonSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ButtonSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<ButtonSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<ButtonSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ButtonSkeleton$1 = ButtonSkeleton;

    /* node_modules/carbon-components-svelte/src/Button/Button.svelte generated by Svelte v3.46.4 */
    const file$p = "node_modules/carbon-components-svelte/src/Button/Button.svelte";
    const get_default_slot_changes$4 = dirty => ({ props: dirty[0] & /*buttonProps*/ 512 });
    const get_default_slot_context$4 = ctx => ({ props: /*buttonProps*/ ctx[9] });

    // (169:0) {:else}
    function create_else_block$6(ctx) {
    	let button;
    	let t;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*hasIconOnly*/ ctx[0] && create_if_block_4$3(ctx);
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	var switch_value = /*icon*/ ctx[3];

    	function switch_props(ctx) {
    		return {
    			props: {
    				"aria-hidden": "true",
    				class: "bx--btn__icon",
    				"aria-label": /*iconDescription*/ ctx[4]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	let button_levels = [/*buttonProps*/ ctx[9]];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			set_attributes(button, button_data);
    			add_location(button, file$p, 169, 2, 4570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			if (switch_instance) {
    				mount_component(switch_instance, button, null);
    			}

    			if (button.autofocus) button.focus();
    			/*button_binding*/ ctx[33](button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler_2*/ ctx[24], false, false, false),
    					listen_dev(button, "mouseover", /*mouseover_handler_2*/ ctx[25], false, false, false),
    					listen_dev(button, "mouseenter", /*mouseenter_handler_2*/ ctx[26], false, false, false),
    					listen_dev(button, "mouseleave", /*mouseleave_handler_2*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*hasIconOnly*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$3(ctx);
    					if_block.c();
    					if_block.m(button, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 262144)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[18],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null),
    						null
    					);
    				}
    			}

    			const switch_instance_changes = {};
    			if (dirty[0] & /*iconDescription*/ 16) switch_instance_changes["aria-label"] = /*iconDescription*/ ctx[4];

    			if (switch_value !== (switch_value = /*icon*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, button, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [dirty[0] & /*buttonProps*/ 512 && /*buttonProps*/ ctx[9]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			if (switch_instance) destroy_component(switch_instance);
    			/*button_binding*/ ctx[33](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(169:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (149:28) 
    function create_if_block_2$6(ctx) {
    	let a;
    	let t;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*hasIconOnly*/ ctx[0] && create_if_block_3$4(ctx);
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	var switch_value = /*icon*/ ctx[3];

    	function switch_props(ctx) {
    		return {
    			props: {
    				"aria-hidden": "true",
    				class: "bx--btn__icon",
    				"aria-label": /*iconDescription*/ ctx[4]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	let a_levels = [/*buttonProps*/ ctx[9]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			set_attributes(a, a_data);
    			add_location(a, file$p, 150, 2, 4187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block) if_block.m(a, null);
    			append_dev(a, t);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			if (switch_instance) {
    				mount_component(switch_instance, a, null);
    			}

    			/*a_binding*/ ctx[32](a);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler_1*/ ctx[20], false, false, false),
    					listen_dev(a, "mouseover", /*mouseover_handler_1*/ ctx[21], false, false, false),
    					listen_dev(a, "mouseenter", /*mouseenter_handler_1*/ ctx[22], false, false, false),
    					listen_dev(a, "mouseleave", /*mouseleave_handler_1*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*hasIconOnly*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$4(ctx);
    					if_block.c();
    					if_block.m(a, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 262144)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[18],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null),
    						null
    					);
    				}
    			}

    			const switch_instance_changes = {};
    			if (dirty[0] & /*iconDescription*/ 16) switch_instance_changes["aria-label"] = /*iconDescription*/ ctx[4];

    			if (switch_value !== (switch_value = /*icon*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, a, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [dirty[0] & /*buttonProps*/ 512 && /*buttonProps*/ ctx[9]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			if (switch_instance) destroy_component(switch_instance);
    			/*a_binding*/ ctx[32](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(149:28) ",
    		ctx
    	});

    	return block;
    }

    // (147:13) 
    function create_if_block_1$7(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], get_default_slot_context$4);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope, buttonProps*/ 262656)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[18],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, get_default_slot_changes$4),
    						get_default_slot_context$4
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(147:13) ",
    		ctx
    	});

    	return block;
    }

    // (136:0) {#if skeleton}
    function create_if_block$k(ctx) {
    	let buttonskeleton;
    	let current;

    	const buttonskeleton_spread_levels = [
    		{ href: /*href*/ ctx[8] },
    		{ size: /*size*/ ctx[2] },
    		/*$$restProps*/ ctx[10],
    		{
    			style: /*hasIconOnly*/ ctx[0] && 'width: 3rem;'
    		}
    	];

    	let buttonskeleton_props = {};

    	for (let i = 0; i < buttonskeleton_spread_levels.length; i += 1) {
    		buttonskeleton_props = assign(buttonskeleton_props, buttonskeleton_spread_levels[i]);
    	}

    	buttonskeleton = new ButtonSkeleton$1({
    			props: buttonskeleton_props,
    			$$inline: true
    		});

    	buttonskeleton.$on("click", /*click_handler*/ ctx[28]);
    	buttonskeleton.$on("mouseover", /*mouseover_handler*/ ctx[29]);
    	buttonskeleton.$on("mouseenter", /*mouseenter_handler*/ ctx[30]);
    	buttonskeleton.$on("mouseleave", /*mouseleave_handler*/ ctx[31]);

    	const block = {
    		c: function create() {
    			create_component(buttonskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttonskeleton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttonskeleton_changes = (dirty[0] & /*href, size, $$restProps, hasIconOnly*/ 1285)
    			? get_spread_update(buttonskeleton_spread_levels, [
    					dirty[0] & /*href*/ 256 && { href: /*href*/ ctx[8] },
    					dirty[0] & /*size*/ 4 && { size: /*size*/ ctx[2] },
    					dirty[0] & /*$$restProps*/ 1024 && get_spread_object(/*$$restProps*/ ctx[10]),
    					dirty[0] & /*hasIconOnly*/ 1 && {
    						style: /*hasIconOnly*/ ctx[0] && 'width: 3rem;'
    					}
    				])
    			: {};

    			buttonskeleton.$set(buttonskeleton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttonskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$k.name,
    		type: "if",
    		source: "(136:0) {#if skeleton}",
    		ctx
    	});

    	return block;
    }

    // (178:4) {#if hasIconOnly}
    function create_if_block_4$3(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*iconDescription*/ ctx[4]);
    			toggle_class(span, "bx--assistive-text", true);
    			add_location(span, file$p, 178, 6, 4719);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iconDescription*/ 16) set_data_dev(t, /*iconDescription*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(178:4) {#if hasIconOnly}",
    		ctx
    	});

    	return block;
    }

    // (159:4) {#if hasIconOnly}
    function create_if_block_3$4(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*iconDescription*/ ctx[4]);
    			toggle_class(span, "bx--assistive-text", true);
    			add_location(span, file$p, 159, 6, 4331);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iconDescription*/ 16) set_data_dev(t, /*iconDescription*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(159:4) {#if hasIconOnly}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$k, create_if_block_1$7, create_if_block_2$6, create_else_block$6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*skeleton*/ ctx[6]) return 0;
    		if (/*as*/ ctx[5]) return 1;
    		if (/*href*/ ctx[8] && !/*disabled*/ ctx[7]) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let buttonProps;

    	const omit_props_names = [
    		"kind","size","expressive","isSelected","hasIconOnly","icon","iconDescription","tooltipAlignment","tooltipPosition","as","skeleton","disabled","href","tabindex","type","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	const $$slots = compute_slots(slots);
    	let { kind = "primary" } = $$props;
    	let { size = "default" } = $$props;
    	let { expressive = false } = $$props;
    	let { isSelected = false } = $$props;
    	let { hasIconOnly = false } = $$props;
    	let { icon = undefined } = $$props;
    	let { iconDescription = undefined } = $$props;
    	let { tooltipAlignment = "center" } = $$props;
    	let { tooltipPosition = "bottom" } = $$props;
    	let { as = false } = $$props;
    	let { skeleton = false } = $$props;
    	let { disabled = false } = $$props;
    	let { href = undefined } = $$props;
    	let { tabindex = "0" } = $$props;
    	let { type = "button" } = $$props;
    	let { ref = null } = $$props;
    	const ctx = getContext("ComposedModal");

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function a_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(10, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('kind' in $$new_props) $$invalidate(11, kind = $$new_props.kind);
    		if ('size' in $$new_props) $$invalidate(2, size = $$new_props.size);
    		if ('expressive' in $$new_props) $$invalidate(12, expressive = $$new_props.expressive);
    		if ('isSelected' in $$new_props) $$invalidate(13, isSelected = $$new_props.isSelected);
    		if ('hasIconOnly' in $$new_props) $$invalidate(0, hasIconOnly = $$new_props.hasIconOnly);
    		if ('icon' in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    		if ('iconDescription' in $$new_props) $$invalidate(4, iconDescription = $$new_props.iconDescription);
    		if ('tooltipAlignment' in $$new_props) $$invalidate(14, tooltipAlignment = $$new_props.tooltipAlignment);
    		if ('tooltipPosition' in $$new_props) $$invalidate(15, tooltipPosition = $$new_props.tooltipPosition);
    		if ('as' in $$new_props) $$invalidate(5, as = $$new_props.as);
    		if ('skeleton' in $$new_props) $$invalidate(6, skeleton = $$new_props.skeleton);
    		if ('disabled' in $$new_props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ('href' in $$new_props) $$invalidate(8, href = $$new_props.href);
    		if ('tabindex' in $$new_props) $$invalidate(16, tabindex = $$new_props.tabindex);
    		if ('type' in $$new_props) $$invalidate(17, type = $$new_props.type);
    		if ('ref' in $$new_props) $$invalidate(1, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		kind,
    		size,
    		expressive,
    		isSelected,
    		hasIconOnly,
    		icon,
    		iconDescription,
    		tooltipAlignment,
    		tooltipPosition,
    		as,
    		skeleton,
    		disabled,
    		href,
    		tabindex,
    		type,
    		ref,
    		getContext,
    		ButtonSkeleton: ButtonSkeleton$1,
    		ctx,
    		buttonProps
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('kind' in $$props) $$invalidate(11, kind = $$new_props.kind);
    		if ('size' in $$props) $$invalidate(2, size = $$new_props.size);
    		if ('expressive' in $$props) $$invalidate(12, expressive = $$new_props.expressive);
    		if ('isSelected' in $$props) $$invalidate(13, isSelected = $$new_props.isSelected);
    		if ('hasIconOnly' in $$props) $$invalidate(0, hasIconOnly = $$new_props.hasIconOnly);
    		if ('icon' in $$props) $$invalidate(3, icon = $$new_props.icon);
    		if ('iconDescription' in $$props) $$invalidate(4, iconDescription = $$new_props.iconDescription);
    		if ('tooltipAlignment' in $$props) $$invalidate(14, tooltipAlignment = $$new_props.tooltipAlignment);
    		if ('tooltipPosition' in $$props) $$invalidate(15, tooltipPosition = $$new_props.tooltipPosition);
    		if ('as' in $$props) $$invalidate(5, as = $$new_props.as);
    		if ('skeleton' in $$props) $$invalidate(6, skeleton = $$new_props.skeleton);
    		if ('disabled' in $$props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ('href' in $$props) $$invalidate(8, href = $$new_props.href);
    		if ('tabindex' in $$props) $$invalidate(16, tabindex = $$new_props.tabindex);
    		if ('type' in $$props) $$invalidate(17, type = $$new_props.type);
    		if ('ref' in $$props) $$invalidate(1, ref = $$new_props.ref);
    		if ('buttonProps' in $$props) $$invalidate(9, buttonProps = $$new_props.buttonProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*ref*/ 2) {
    			if (ctx && ref) {
    				ctx.declareRef(ref);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*icon*/ 8) {
    			$$invalidate(0, hasIconOnly = icon && !$$slots.default);
    		}

    		$$invalidate(9, buttonProps = {
    			type: href && !disabled ? undefined : type,
    			tabindex,
    			disabled: disabled === true ? true : undefined,
    			href,
    			"aria-pressed": hasIconOnly && kind === "ghost" && !href
    			? isSelected
    			: undefined,
    			...$$restProps,
    			class: [
    				"bx--btn",
    				expressive && "bx--btn--expressive",
    				(size === "small" && !expressive || size === "sm" && !expressive || size === "small" && !expressive) && "bx--btn--sm",
    				size === "field" && !expressive || size === "md" && !expressive && "bx--btn--md",
    				size === "field" && "bx--btn--field",
    				size === "small" && "bx--btn--sm",
    				size === "lg" && "bx--btn--lg",
    				size === "xl" && "bx--btn--xl",
    				kind && `bx--btn--${kind}`,
    				disabled && "bx--btn--disabled",
    				hasIconOnly && "bx--btn--icon-only",
    				hasIconOnly && "bx--tooltip__trigger",
    				hasIconOnly && "bx--tooltip--a11y",
    				hasIconOnly && tooltipPosition && `bx--btn--icon-only--${tooltipPosition}`,
    				hasIconOnly && tooltipAlignment && `bx--tooltip--align-${tooltipAlignment}`,
    				hasIconOnly && isSelected && kind === "ghost" && "bx--btn--selected",
    				$$restProps.class
    			].filter(Boolean).join(" ")
    		});
    	};

    	return [
    		hasIconOnly,
    		ref,
    		size,
    		icon,
    		iconDescription,
    		as,
    		skeleton,
    		disabled,
    		href,
    		buttonProps,
    		$$restProps,
    		kind,
    		expressive,
    		isSelected,
    		tooltipAlignment,
    		tooltipPosition,
    		tabindex,
    		type,
    		$$scope,
    		slots,
    		click_handler_1,
    		mouseover_handler_1,
    		mouseenter_handler_1,
    		mouseleave_handler_1,
    		click_handler_2,
    		mouseover_handler_2,
    		mouseenter_handler_2,
    		mouseleave_handler_2,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		a_binding,
    		button_binding
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$t,
    			create_fragment$t,
    			safe_not_equal,
    			{
    				kind: 11,
    				size: 2,
    				expressive: 12,
    				isSelected: 13,
    				hasIconOnly: 0,
    				icon: 3,
    				iconDescription: 4,
    				tooltipAlignment: 14,
    				tooltipPosition: 15,
    				as: 5,
    				skeleton: 6,
    				disabled: 7,
    				href: 8,
    				tabindex: 16,
    				type: 17,
    				ref: 1
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$t.name
    		});
    	}

    	get kind() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expressive() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expressive(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isSelected() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isSelected(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasIconOnly() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasIconOnly(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconDescription() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconDescription(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltipAlignment() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipAlignment(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltipPosition() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipPosition(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get as() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set as(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skeleton() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skeleton(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Button$1 = Button;

    /* node_modules/carbon-components-svelte/src/Button/ButtonSet.svelte generated by Svelte v3.46.4 */

    const file$o = "node_modules/carbon-components-svelte/src/Button/ButtonSet.svelte";

    function create_fragment$s(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let div_levels = [/*$$restProps*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--btn-set", true);
    			toggle_class(div, "bx--btn-set--stacked", /*stacked*/ ctx[0]);
    			add_location(div, file$o, 5, 0, 105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1]]));
    			toggle_class(div, "bx--btn-set", true);
    			toggle_class(div, "bx--btn-set--stacked", /*stacked*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	const omit_props_names = ["stacked"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonSet', slots, ['default']);
    	let { stacked = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('stacked' in $$new_props) $$invalidate(0, stacked = $$new_props.stacked);
    		if ('$$scope' in $$new_props) $$invalidate(2, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ stacked });

    	$$self.$inject_state = $$new_props => {
    		if ('stacked' in $$props) $$invalidate(0, stacked = $$new_props.stacked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stacked, $$restProps, $$scope, slots];
    }

    class ButtonSet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { stacked: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonSet",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get stacked() {
    		throw new Error("<ButtonSet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stacked(value) {
    		throw new Error("<ButtonSet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ButtonSet$1 = ButtonSet;

    /* node_modules/carbon-components-svelte/src/Checkbox/CheckboxSkeleton.svelte generated by Svelte v3.46.4 */

    const file$n = "node_modules/carbon-components-svelte/src/Checkbox/CheckboxSkeleton.svelte";

    function create_fragment$r(ctx) {
    	let div;
    	let span;
    	let mounted;
    	let dispose;
    	let div_levels = [/*$$restProps*/ ctx[0]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			toggle_class(span, "bx--checkbox-label-text", true);
    			toggle_class(span, "bx--skeleton", true);
    			add_location(span, file$n, 11, 2, 248);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--form-item", true);
    			toggle_class(div, "bx--checkbox-wrapper", true);
    			toggle_class(div, "bx--checkbox-label", true);
    			add_location(div, file$n, 1, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(div, "mouseover", /*mouseover_handler*/ ctx[2], false, false, false),
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[3], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 1 && /*$$restProps*/ ctx[0]]));
    			toggle_class(div, "bx--form-item", true);
    			toggle_class(div, "bx--checkbox-wrapper", true);
    			toggle_class(div, "bx--checkbox-label", true);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CheckboxSkeleton', slots, []);

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(0, $$restProps = compute_rest_props($$props, omit_props_names));
    	};

    	return [
    		$$restProps,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class CheckboxSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckboxSkeleton",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    var CheckboxSkeleton$1 = CheckboxSkeleton;

    /* node_modules/carbon-components-svelte/src/Checkbox/Checkbox.svelte generated by Svelte v3.46.4 */
    const file$m = "node_modules/carbon-components-svelte/src/Checkbox/Checkbox.svelte";
    const get_labelText_slot_changes$5 = dirty => ({});
    const get_labelText_slot_context$5 = ctx => ({});

    // (76:0) {:else}
    function create_else_block$5(ctx) {
    	let div;
    	let input;
    	let t;
    	let label;
    	let span;
    	let current;
    	let mounted;
    	let dispose;
    	const labelText_slot_template = /*#slots*/ ctx[17].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[16], get_labelText_slot_context$5);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block$e(ctx);
    	let div_levels = [/*$$restProps*/ ctx[15]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			label = element("label");
    			span = element("span");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			attr_dev(input, "type", "checkbox");
    			input.value = /*value*/ ctx[3];
    			input.checked = /*checked*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[8];
    			attr_dev(input, "id", /*id*/ ctx[13]);
    			input.indeterminate = /*indeterminate*/ ctx[4];
    			attr_dev(input, "name", /*name*/ ctx[11]);
    			input.required = /*required*/ ctx[6];
    			input.readOnly = /*readonly*/ ctx[7];
    			toggle_class(input, "bx--checkbox", true);
    			add_location(input, file$m, 85, 4, 1922);
    			toggle_class(span, "bx--checkbox-label-text", true);
    			toggle_class(span, "bx--visually-hidden", /*hideLabel*/ ctx[10]);
    			add_location(span, file$m, 110, 6, 2578);
    			attr_dev(label, "for", /*id*/ ctx[13]);
    			attr_dev(label, "title", /*title*/ ctx[12]);
    			toggle_class(label, "bx--checkbox-label", true);
    			add_location(label, file$m, 109, 4, 2503);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--form-item", true);
    			toggle_class(div, "bx--checkbox-wrapper", true);
    			add_location(div, file$m, 76, 2, 1749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[28](input);
    			append_dev(div, t);
    			append_dev(div, label);
    			append_dev(label, span);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(span, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*change_handler_1*/ ctx[29], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[22], false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[23], false, false, false),
    					listen_dev(div, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(div, "mouseover", /*mouseover_handler_1*/ ctx[19], false, false, false),
    					listen_dev(div, "mouseenter", /*mouseenter_handler_1*/ ctx[20], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler_1*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*value*/ 8) {
    				prop_dev(input, "value", /*value*/ ctx[3]);
    			}

    			if (!current || dirty & /*checked*/ 1) {
    				prop_dev(input, "checked", /*checked*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 256) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[8]);
    			}

    			if (!current || dirty & /*id*/ 8192) {
    				attr_dev(input, "id", /*id*/ ctx[13]);
    			}

    			if (!current || dirty & /*indeterminate*/ 16) {
    				prop_dev(input, "indeterminate", /*indeterminate*/ ctx[4]);
    			}

    			if (!current || dirty & /*name*/ 2048) {
    				attr_dev(input, "name", /*name*/ ctx[11]);
    			}

    			if (!current || dirty & /*required*/ 64) {
    				prop_dev(input, "required", /*required*/ ctx[6]);
    			}

    			if (!current || dirty & /*readonly*/ 128) {
    				prop_dev(input, "readOnly", /*readonly*/ ctx[7]);
    			}

    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[16],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[16], dirty, get_labelText_slot_changes$5),
    						get_labelText_slot_context$5
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty & /*labelText*/ 512)) {
    					labelText_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (dirty & /*hideLabel*/ 1024) {
    				toggle_class(span, "bx--visually-hidden", /*hideLabel*/ ctx[10]);
    			}

    			if (!current || dirty & /*id*/ 8192) {
    				attr_dev(label, "for", /*id*/ ctx[13]);
    			}

    			if (!current || dirty & /*title*/ 4096) {
    				attr_dev(label, "title", /*title*/ ctx[12]);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 32768 && /*$$restProps*/ ctx[15]]));
    			toggle_class(div, "bx--form-item", true);
    			toggle_class(div, "bx--checkbox-wrapper", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[28](null);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(76:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:0) {#if skeleton}
    function create_if_block$j(ctx) {
    	let checkboxskeleton;
    	let current;
    	const checkboxskeleton_spread_levels = [/*$$restProps*/ ctx[15]];
    	let checkboxskeleton_props = {};

    	for (let i = 0; i < checkboxskeleton_spread_levels.length; i += 1) {
    		checkboxskeleton_props = assign(checkboxskeleton_props, checkboxskeleton_spread_levels[i]);
    	}

    	checkboxskeleton = new CheckboxSkeleton$1({
    			props: checkboxskeleton_props,
    			$$inline: true
    		});

    	checkboxskeleton.$on("click", /*click_handler*/ ctx[24]);
    	checkboxskeleton.$on("mouseover", /*mouseover_handler*/ ctx[25]);
    	checkboxskeleton.$on("mouseenter", /*mouseenter_handler*/ ctx[26]);
    	checkboxskeleton.$on("mouseleave", /*mouseleave_handler*/ ctx[27]);

    	const block = {
    		c: function create() {
    			create_component(checkboxskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkboxskeleton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkboxskeleton_changes = (dirty & /*$$restProps*/ 32768)
    			? get_spread_update(checkboxskeleton_spread_levels, [get_spread_object(/*$$restProps*/ ctx[15])])
    			: {};

    			checkboxskeleton.$set(checkboxskeleton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkboxskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkboxskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkboxskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$j.name,
    		type: "if",
    		source: "(68:0) {#if skeleton}",
    		ctx
    	});

    	return block;
    }

    // (115:31)            
    function fallback_block$e(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[9]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelText*/ 512) set_data_dev(t, /*labelText*/ ctx[9]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$e.name,
    		type: "fallback",
    		source: "(115:31)            ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$j, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*skeleton*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let useGroup;

    	const omit_props_names = [
    		"value","checked","group","indeterminate","skeleton","required","readonly","disabled","labelText","hideLabel","name","title","id","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Checkbox', slots, ['labelText']);
    	let { value = "" } = $$props;
    	let { checked = false } = $$props;
    	let { group = undefined } = $$props;
    	let { indeterminate = false } = $$props;
    	let { skeleton = false } = $$props;
    	let { required = false } = $$props;
    	let { readonly = false } = $$props;
    	let { disabled = false } = $$props;
    	let { labelText = "" } = $$props;
    	let { hideLabel = false } = $$props;
    	let { name = "" } = $$props;
    	let { title = undefined } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { ref = null } = $$props;
    	const dispatch = createEventDispatcher();

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(2, ref);
    		});
    	}

    	const change_handler_1 = () => {
    		if (useGroup) {
    			$$invalidate(1, group = group.includes(value)
    			? group.filter(_value => _value !== value)
    			: [...group, value]);
    		} else {
    			$$invalidate(0, checked = !checked);
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(15, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('value' in $$new_props) $$invalidate(3, value = $$new_props.value);
    		if ('checked' in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ('group' in $$new_props) $$invalidate(1, group = $$new_props.group);
    		if ('indeterminate' in $$new_props) $$invalidate(4, indeterminate = $$new_props.indeterminate);
    		if ('skeleton' in $$new_props) $$invalidate(5, skeleton = $$new_props.skeleton);
    		if ('required' in $$new_props) $$invalidate(6, required = $$new_props.required);
    		if ('readonly' in $$new_props) $$invalidate(7, readonly = $$new_props.readonly);
    		if ('disabled' in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ('labelText' in $$new_props) $$invalidate(9, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$new_props) $$invalidate(10, hideLabel = $$new_props.hideLabel);
    		if ('name' in $$new_props) $$invalidate(11, name = $$new_props.name);
    		if ('title' in $$new_props) $$invalidate(12, title = $$new_props.title);
    		if ('id' in $$new_props) $$invalidate(13, id = $$new_props.id);
    		if ('ref' in $$new_props) $$invalidate(2, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		checked,
    		group,
    		indeterminate,
    		skeleton,
    		required,
    		readonly,
    		disabled,
    		labelText,
    		hideLabel,
    		name,
    		title,
    		id,
    		ref,
    		createEventDispatcher,
    		CheckboxSkeleton: CheckboxSkeleton$1,
    		dispatch,
    		useGroup
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('value' in $$props) $$invalidate(3, value = $$new_props.value);
    		if ('checked' in $$props) $$invalidate(0, checked = $$new_props.checked);
    		if ('group' in $$props) $$invalidate(1, group = $$new_props.group);
    		if ('indeterminate' in $$props) $$invalidate(4, indeterminate = $$new_props.indeterminate);
    		if ('skeleton' in $$props) $$invalidate(5, skeleton = $$new_props.skeleton);
    		if ('required' in $$props) $$invalidate(6, required = $$new_props.required);
    		if ('readonly' in $$props) $$invalidate(7, readonly = $$new_props.readonly);
    		if ('disabled' in $$props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ('labelText' in $$props) $$invalidate(9, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$props) $$invalidate(10, hideLabel = $$new_props.hideLabel);
    		if ('name' in $$props) $$invalidate(11, name = $$new_props.name);
    		if ('title' in $$props) $$invalidate(12, title = $$new_props.title);
    		if ('id' in $$props) $$invalidate(13, id = $$new_props.id);
    		if ('ref' in $$props) $$invalidate(2, ref = $$new_props.ref);
    		if ('useGroup' in $$props) $$invalidate(14, useGroup = $$new_props.useGroup);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*group*/ 2) {
    			$$invalidate(14, useGroup = Array.isArray(group));
    		}

    		if ($$self.$$.dirty & /*useGroup, group, value, checked*/ 16395) {
    			$$invalidate(0, checked = useGroup ? group.includes(value) : checked);
    		}

    		if ($$self.$$.dirty & /*checked*/ 1) {
    			dispatch("check", checked);
    		}
    	};

    	return [
    		checked,
    		group,
    		ref,
    		value,
    		indeterminate,
    		skeleton,
    		required,
    		readonly,
    		disabled,
    		labelText,
    		hideLabel,
    		name,
    		title,
    		id,
    		useGroup,
    		$$restProps,
    		$$scope,
    		slots,
    		click_handler_1,
    		mouseover_handler_1,
    		mouseenter_handler_1,
    		mouseleave_handler_1,
    		change_handler,
    		blur_handler,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		input_binding,
    		change_handler_1
    	];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {
    			value: 3,
    			checked: 0,
    			group: 1,
    			indeterminate: 4,
    			skeleton: 5,
    			required: 6,
    			readonly: 7,
    			disabled: 8,
    			labelText: 9,
    			hideLabel: 10,
    			name: 11,
    			title: 12,
    			id: 13,
    			ref: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$q.name
    		});
    	}

    	get value() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indeterminate() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indeterminate(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skeleton() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skeleton(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLabel() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Checkbox$1 = Checkbox;

    /* node_modules/carbon-components-svelte/src/Copy/Copy.svelte generated by Svelte v3.46.4 */
    const file$l = "node_modules/carbon-components-svelte/src/Copy/Copy.svelte";

    // (48:4) {#if animation}
    function create_if_block$i(ctx) {
    	let t_value = (/*feedback*/ ctx[1] || /*$$restProps*/ ctx[5]["aria-label"]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*feedback, $$restProps*/ 34 && t_value !== (t_value = (/*feedback*/ ctx[1] || /*$$restProps*/ ctx[5]["aria-label"]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$i.name,
    		type: "if",
    		source: "(48:4) {#if animation}",
    		ctx
    	});

    	return block;
    }

    // (47:8)      
    function fallback_block$d(ctx) {
    	let if_block_anchor;
    	let if_block = /*animation*/ ctx[3] && create_if_block$i(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*animation*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$i(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$d.name,
    		type: "fallback",
    		source: "(47:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let button;
    	let t0;
    	let span;
    	let t1;
    	let button_aria_label_value;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	const default_slot_or_fallback = default_slot || fallback_block$d(ctx);

    	let button_levels = [
    		{ type: "button" },
    		{ "aria-live": "polite" },
    		{
    			"aria-label": button_aria_label_value = /*animation*/ ctx[3] ? /*feedback*/ ctx[1] : undefined
    		},
    		/*$$restProps*/ ctx[5],
    		{
    			class: button_class_value = "" + (/*$$restProps*/ ctx[5].class + " " + (/*animation*/ ctx[3] && `bx--copy-btn--${/*animation*/ ctx[3]}`))
    		}
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(/*feedback*/ ctx[1]);
    			attr_dev(span, "aria-hidden", "true");
    			toggle_class(span, "bx--assistive-text", true);
    			toggle_class(span, "bx--copy-btn__feedback", true);
    			add_location(span, file$l, 49, 2, 1185);
    			set_attributes(button, button_data);
    			toggle_class(button, "bx--copy", true);
    			toggle_class(button, "bx--copy-btn--animating", /*animation*/ ctx[3]);
    			add_location(button, file$l, 22, 0, 475);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(button, null);
    			}

    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, t1);
    			if (button.autofocus) button.focus();
    			/*button_binding*/ ctx[10](button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(button, "animationend", /*animationend_handler*/ ctx[9], false, false, false),
    					listen_dev(button, "animationend", /*animationend_handler_1*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*feedback, $$restProps, animation*/ 42)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (!current || dirty & /*feedback*/ 2) set_data_dev(t1, /*feedback*/ ctx[1]);

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				{ type: "button" },
    				{ "aria-live": "polite" },
    				(!current || dirty & /*animation, feedback*/ 10 && button_aria_label_value !== (button_aria_label_value = /*animation*/ ctx[3] ? /*feedback*/ ctx[1] : undefined)) && { "aria-label": button_aria_label_value },
    				dirty & /*$$restProps*/ 32 && /*$$restProps*/ ctx[5],
    				(!current || dirty & /*$$restProps, animation*/ 40 && button_class_value !== (button_class_value = "" + (/*$$restProps*/ ctx[5].class + " " + (/*animation*/ ctx[3] && `bx--copy-btn--${/*animation*/ ctx[3]}`)))) && { class: button_class_value }
    			]));

    			toggle_class(button, "bx--copy", true);
    			toggle_class(button, "bx--copy-btn--animating", /*animation*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			/*button_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	const omit_props_names = ["feedback","feedbackTimeout","ref"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Copy', slots, ['default']);
    	let { feedback = "Copied!" } = $$props;
    	let { feedbackTimeout = 2000 } = $$props;
    	let { ref = null } = $$props;
    	let animation = undefined;
    	let timeout = undefined;

    	onMount(() => {
    		return () => {
    			clearTimeout(timeout);
    		};
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function animationend_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(0, ref);
    		});
    	}

    	const click_handler_1 = () => {
    		if (animation === 'fade-in') return;
    		$$invalidate(3, animation = 'fade-in');

    		$$invalidate(4, timeout = setTimeout(
    			() => {
    				$$invalidate(3, animation = 'fade-out');
    			},
    			feedbackTimeout
    		));
    	};

    	const animationend_handler_1 = ({ animationName }) => {
    		if (animationName === 'hide-feedback') {
    			$$invalidate(3, animation = undefined);
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('feedback' in $$new_props) $$invalidate(1, feedback = $$new_props.feedback);
    		if ('feedbackTimeout' in $$new_props) $$invalidate(2, feedbackTimeout = $$new_props.feedbackTimeout);
    		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		feedback,
    		feedbackTimeout,
    		ref,
    		onMount,
    		animation,
    		timeout
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('feedback' in $$props) $$invalidate(1, feedback = $$new_props.feedback);
    		if ('feedbackTimeout' in $$props) $$invalidate(2, feedbackTimeout = $$new_props.feedbackTimeout);
    		if ('ref' in $$props) $$invalidate(0, ref = $$new_props.ref);
    		if ('animation' in $$props) $$invalidate(3, animation = $$new_props.animation);
    		if ('timeout' in $$props) $$invalidate(4, timeout = $$new_props.timeout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ref,
    		feedback,
    		feedbackTimeout,
    		animation,
    		timeout,
    		$$restProps,
    		$$scope,
    		slots,
    		click_handler,
    		animationend_handler,
    		button_binding,
    		click_handler_1,
    		animationend_handler_1
    	];
    }

    class Copy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, { feedback: 1, feedbackTimeout: 2, ref: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Copy",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get feedback() {
    		throw new Error("<Copy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feedback(value) {
    		throw new Error("<Copy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get feedbackTimeout() {
    		throw new Error("<Copy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feedbackTimeout(value) {
    		throw new Error("<Copy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Copy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Copy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Copy$1 = Copy;

    /* node_modules/carbon-components-svelte/src/icons/Copy16.svelte generated by Svelte v3.46.4 */

    const file$k = "node_modules/carbon-components-svelte/src/icons/Copy16.svelte";

    // (47:4) {#if title}
    function create_if_block$h(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$k, 47, 6, 1223);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$h.name,
    		type: "if",
    		source: "(47:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (46:8)      
    function fallback_block$c(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$h(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$h(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$c.name,
    		type: "fallback",
    		source: "(46:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$c(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "Copy16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 32 32" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path0, "d", "M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z");
    			add_location(path0, file$k, 42, 2, 1026);
    			attr_dev(path1, "d", "M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z");
    			add_location(path1, file$k, 44, 10, 1142);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$k, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "Copy16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 32 32" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Copy16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class Copy16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Copy16",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get class() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Copy16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Copy16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Copy16$1 = Copy16;

    /* node_modules/carbon-components-svelte/src/CopyButton/CopyButton.svelte generated by Svelte v3.46.4 */

    // (32:0) <Copy   class="bx--copy-btn"   aria-label="{iconDescription}"   title="{iconDescription}"   {...$$restProps}   on:click   on:click="{() => {     if (text !== undefined) {       copy(text);       dispatch('copy');     }   }}"   on:animationend >
    function create_default_slot$3(ctx) {
    	let copy16;
    	let current;

    	copy16 = new Copy16$1({
    			props: { class: "bx--snippet__icon" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(copy16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(copy16, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copy16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copy16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(copy16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(32:0) <Copy   class=\\\"bx--copy-btn\\\"   aria-label=\\\"{iconDescription}\\\"   title=\\\"{iconDescription}\\\"   {...$$restProps}   on:click   on:click=\\\"{() => {     if (text !== undefined) {       copy(text);       dispatch('copy');     }   }}\\\"   on:animationend >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let copy_1;
    	let current;

    	const copy_1_spread_levels = [
    		{ class: "bx--copy-btn" },
    		{ "aria-label": /*iconDescription*/ ctx[0] },
    		{ title: /*iconDescription*/ ctx[0] },
    		/*$$restProps*/ ctx[4]
    	];

    	let copy_1_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < copy_1_spread_levels.length; i += 1) {
    		copy_1_props = assign(copy_1_props, copy_1_spread_levels[i]);
    	}

    	copy_1 = new Copy$1({ props: copy_1_props, $$inline: true });
    	copy_1.$on("click", /*click_handler*/ ctx[5]);
    	copy_1.$on("click", /*click_handler_1*/ ctx[6]);
    	copy_1.$on("animationend", /*animationend_handler*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(copy_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(copy_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const copy_1_changes = (dirty & /*iconDescription, $$restProps*/ 17)
    			? get_spread_update(copy_1_spread_levels, [
    					copy_1_spread_levels[0],
    					dirty & /*iconDescription*/ 1 && { "aria-label": /*iconDescription*/ ctx[0] },
    					dirty & /*iconDescription*/ 1 && { title: /*iconDescription*/ ctx[0] },
    					dirty & /*$$restProps*/ 16 && get_spread_object(/*$$restProps*/ ctx[4])
    				])
    			: {};

    			if (dirty & /*$$scope*/ 256) {
    				copy_1_changes.$$scope = { dirty, ctx };
    			}

    			copy_1.$set(copy_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copy_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copy_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(copy_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	const omit_props_names = ["iconDescription","text","copy"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CopyButton', slots, []);
    	let { iconDescription = "Copy to clipboard" } = $$props;
    	let { text = undefined } = $$props;

    	let { copy = async text => {
    		try {
    			await navigator.clipboard.writeText(text);
    		} catch(e) {
    			console.log(e);
    		}
    	} } = $$props;

    	const dispatch = createEventDispatcher();

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => {
    		if (text !== undefined) {
    			copy(text);
    			dispatch('copy');
    		}
    	};

    	function animationend_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(4, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('iconDescription' in $$new_props) $$invalidate(0, iconDescription = $$new_props.iconDescription);
    		if ('text' in $$new_props) $$invalidate(1, text = $$new_props.text);
    		if ('copy' in $$new_props) $$invalidate(2, copy = $$new_props.copy);
    	};

    	$$self.$capture_state = () => ({
    		iconDescription,
    		text,
    		copy,
    		Copy: Copy$1,
    		Copy16: Copy16$1,
    		createEventDispatcher,
    		dispatch
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('iconDescription' in $$props) $$invalidate(0, iconDescription = $$new_props.iconDescription);
    		if ('text' in $$props) $$invalidate(1, text = $$new_props.text);
    		if ('copy' in $$props) $$invalidate(2, copy = $$new_props.copy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		iconDescription,
    		text,
    		copy,
    		dispatch,
    		$$restProps,
    		click_handler,
    		click_handler_1,
    		animationend_handler
    	];
    }

    class CopyButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { iconDescription: 0, text: 1, copy: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CopyButton",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get iconDescription() {
    		throw new Error("<CopyButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconDescription(value) {
    		throw new Error("<CopyButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<CopyButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<CopyButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copy() {
    		throw new Error("<CopyButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copy(value) {
    		throw new Error("<CopyButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var CopyButton$1 = CopyButton;

    /* node_modules/carbon-components-svelte/src/icons/WarningFilled16.svelte generated by Svelte v3.46.4 */

    const file$j = "node_modules/carbon-components-svelte/src/icons/WarningFilled16.svelte";

    // (50:4) {#if title}
    function create_if_block$g(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$j, 50, 6, 1453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(50:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (49:8)      
    function fallback_block$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$g(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$g(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$b.name,
    		type: "fallback",
    		source: "(49:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$b(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "WarningFilled16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 16 16" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path0, "d", "M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2\tc-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z");
    			add_location(path0, file$j, 42, 2, 1035);
    			attr_dev(path1, "d", "M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8\tc0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z");
    			attr_dev(path1, "data-icon-path", "inner-path");
    			attr_dev(path1, "opacity", "0");
    			add_location(path1, file$j, 44, 10, 1232);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$j, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "WarningFilled16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 16 16" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WarningFilled16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class WarningFilled16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WarningFilled16",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get class() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<WarningFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<WarningFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var WarningFilled16$1 = WarningFilled16;

    /* node_modules/carbon-components-svelte/src/icons/WarningAltFilled16.svelte generated by Svelte v3.46.4 */

    const file$i = "node_modules/carbon-components-svelte/src/icons/WarningAltFilled16.svelte";

    // (52:4) {#if title}
    function create_if_block$f(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$i, 52, 6, 1546);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(52:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (51:8)      
    function fallback_block$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$f(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$f(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$a.name,
    		type: "fallback",
    		source: "(51:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$a(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "WarningAltFilled16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 32 32" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path0, "fill", "none");
    			attr_dev(path0, "d", "M16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Zm-1.125-5h2.25V12h-2.25Z");
    			attr_dev(path0, "data-icon-path", "inner-path");
    			add_location(path0, file$i, 42, 2, 1038);
    			attr_dev(path1, "d", "M16.002,6.1714h-.004L4.6487,27.9966,4.6506,28H27.3494l.0019-.0034ZM14.875,12h2.25v9h-2.25ZM16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Z");
    			add_location(path1, file$i, 45, 39, 1181);
    			attr_dev(path2, "d", "M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.002-.0033L16.002,6.1714h-.004L4.6487,27.9967Z");
    			add_location(path2, file$i, 47, 10, 1345);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$i, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "WarningAltFilled16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 32 32" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WarningAltFilled16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class WarningAltFilled16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WarningAltFilled16",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get class() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<WarningAltFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<WarningAltFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var WarningAltFilled16$1 = WarningAltFilled16;

    /* node_modules/carbon-components-svelte/src/icons/ChevronDown16.svelte generated by Svelte v3.46.4 */

    const file$h = "node_modules/carbon-components-svelte/src/icons/ChevronDown16.svelte";

    // (45:4) {#if title}
    function create_if_block$e(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$h, 45, 6, 1121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(45:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (44:8)      
    function fallback_block$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$e(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$e(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$9.name,
    		type: "fallback",
    		source: "(44:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let svg;
    	let path;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$9(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "ChevronDown16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 16 16" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path, "d", "M8 11L3 6 3.7 5.3 8 9.6 12.3 5.3 13 6z");
    			add_location(path, file$h, 42, 2, 1033);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$h, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "ChevronDown16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 16 16" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ChevronDown16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class ChevronDown16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChevronDown16",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get class() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<ChevronDown16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<ChevronDown16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ChevronDown16$1 = ChevronDown16;

    /* node_modules/carbon-components-svelte/src/icons/Close16.svelte generated by Svelte v3.46.4 */

    const file$g = "node_modules/carbon-components-svelte/src/icons/Close16.svelte";

    // (47:4) {#if title}
    function create_if_block$d(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$g, 47, 6, 1180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(47:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (46:8)      
    function fallback_block$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$d(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$d(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$8.name,
    		type: "fallback",
    		source: "(46:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let svg;
    	let path;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$8(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "Close16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 32 32" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path, "d", "M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z");
    			add_location(path, file$g, 42, 2, 1027);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$g, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "Close16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 32 32" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Close16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class Close16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Close16",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get class() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Close16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Close16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Close16$1 = Close16;

    /* node_modules/carbon-components-svelte/src/CodeSnippet/CodeSnippetSkeleton.svelte generated by Svelte v3.46.4 */

    const file$f = "node_modules/carbon-components-svelte/src/CodeSnippet/CodeSnippetSkeleton.svelte";

    // (24:31) 
    function create_if_block_1$6(ctx) {
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			add_location(span0, file$f, 23, 31, 550);
    			add_location(span1, file$f, 23, 45, 564);
    			add_location(span2, file$f, 23, 59, 578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(24:31) ",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#if type === "single"}
    function create_if_block$c(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$f, 22, 6, 505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(22:4) {#if type === \\\"single\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "single") return create_if_block$c;
    		if (/*type*/ ctx[0] === "multi") return create_if_block_1$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);
    	let div1_levels = [/*$$restProps*/ ctx[1]];
    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			toggle_class(div0, "bx--snippet-container", true);
    			add_location(div0, file$f, 20, 2, 428);
    			set_attributes(div1, div1_data);
    			toggle_class(div1, "bx--skeleton", true);
    			toggle_class(div1, "bx--snippet", true);
    			toggle_class(div1, "bx--snippet--single", /*type*/ ctx[0] === 'single');
    			toggle_class(div1, "bx--snippet--multi", /*type*/ ctx[0] === 'multi');
    			add_location(div1, file$f, 9, 0, 185);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(div1, "mouseover", /*mouseover_handler*/ ctx[3], false, false, false),
    					listen_dev(div1, "mouseenter", /*mouseenter_handler*/ ctx[4], false, false, false),
    					listen_dev(div1, "mouseleave", /*mouseleave_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			set_attributes(div1, div1_data = get_spread_update(div1_levels, [dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1]]));
    			toggle_class(div1, "bx--skeleton", true);
    			toggle_class(div1, "bx--snippet", true);
    			toggle_class(div1, "bx--snippet--single", /*type*/ ctx[0] === 'single');
    			toggle_class(div1, "bx--snippet--multi", /*type*/ ctx[0] === 'multi');
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	const omit_props_names = ["type"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CodeSnippetSkeleton', slots, []);
    	let { type = "single" } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('type' in $$new_props) $$invalidate(0, type = $$new_props.type);
    	};

    	$$self.$capture_state = () => ({ type });

    	$$self.$inject_state = $$new_props => {
    		if ('type' in $$props) $$invalidate(0, type = $$new_props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		$$restProps,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class CodeSnippetSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeSnippetSkeleton",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get type() {
    		throw new Error("<CodeSnippetSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<CodeSnippetSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var CodeSnippetSkeleton$1 = CodeSnippetSkeleton;

    /* node_modules/carbon-components-svelte/src/CodeSnippet/CodeSnippet.svelte generated by Svelte v3.46.4 */
    const file$e = "node_modules/carbon-components-svelte/src/CodeSnippet/CodeSnippet.svelte";

    // (170:0) {:else}
    function create_else_block_1(ctx) {
    	let div1;
    	let div0;
    	let pre;
    	let code_1;
    	let div0_role_value;
    	let div0_tabindex_value;
    	let div0_aria_label_value;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[23].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);
    	const default_slot_or_fallback = default_slot || fallback_block_2$1(ctx);
    	let if_block0 = !/*hideCopyButton*/ ctx[5] && create_if_block_4$2(ctx);
    	let if_block1 = /*showMoreLess*/ ctx[2] && create_if_block_3$3(ctx);
    	let div1_levels = [/*$$restProps*/ ctx[19]];
    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			pre = element("pre");
    			code_1 = element("code");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(code_1, file$e, 192, 29, 5434);
    			add_location(pre, file$e, 192, 6, 5411);
    			attr_dev(div0, "role", div0_role_value = /*type*/ ctx[3] === 'single' ? 'textbox' : undefined);

    			attr_dev(div0, "tabindex", div0_tabindex_value = /*type*/ ctx[3] === 'single' && !/*disabled*/ ctx[6]
    			? '0'
    			: undefined);

    			attr_dev(div0, "aria-label", div0_aria_label_value = /*$$restProps*/ ctx[19]['aria-label'] || /*copyLabel*/ ctx[11] || 'code-snippet');
    			set_style(div0, "width", "100%");
    			set_style(div0, "min-height", /*minHeight*/ ctx[16] + "px");
    			set_style(div0, "max-height", /*maxHeight*/ ctx[15]);
    			toggle_class(div0, "bx--snippet-container", true);
    			add_location(div0, file$e, 185, 4, 5070);
    			set_attributes(div1, div1_data);
    			toggle_class(div1, "bx--snippet", true);
    			toggle_class(div1, "bx--snippet--expand", /*expanded*/ ctx[0]);
    			toggle_class(div1, "bx--snippet--light", /*light*/ ctx[8]);
    			toggle_class(div1, "bx--snippet--no-copy", /*hideCopyButton*/ ctx[5]);
    			toggle_class(div1, "bx--snippet--wraptext", /*wrapText*/ ctx[7]);
    			toggle_class(div1, "bx--snippet--single", /*type*/ ctx[3] === 'single');
    			toggle_class(div1, "bx--snippet--inline", /*type*/ ctx[3] === 'inline');
    			toggle_class(div1, "bx--snippet--multi", /*type*/ ctx[3] === 'multi');
    			toggle_class(div1, "bx--snippet--disabled", /*type*/ ctx[3] !== 'inline' && /*disabled*/ ctx[6]);
    			add_location(div1, file$e, 170, 2, 4555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, pre);
    			append_dev(pre, code_1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(code_1, null);
    			}

    			/*pre_binding*/ ctx[35](pre);
    			append_dev(div1, t0);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mouseover", /*mouseover_handler_2*/ ctx[24], false, false, false),
    					listen_dev(div1, "mouseenter", /*mouseenter_handler_2*/ ctx[25], false, false, false),
    					listen_dev(div1, "mouseleave", /*mouseleave_handler_2*/ ctx[26], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[39],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[39])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[39], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*code*/ 16)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*type*/ 8 && div0_role_value !== (div0_role_value = /*type*/ ctx[3] === 'single' ? 'textbox' : undefined)) {
    				attr_dev(div0, "role", div0_role_value);
    			}

    			if (!current || dirty[0] & /*type, disabled*/ 72 && div0_tabindex_value !== (div0_tabindex_value = /*type*/ ctx[3] === 'single' && !/*disabled*/ ctx[6]
    			? '0'
    			: undefined)) {
    				attr_dev(div0, "tabindex", div0_tabindex_value);
    			}

    			if (!current || dirty[0] & /*$$restProps, copyLabel*/ 526336 && div0_aria_label_value !== (div0_aria_label_value = /*$$restProps*/ ctx[19]['aria-label'] || /*copyLabel*/ ctx[11] || 'code-snippet')) {
    				attr_dev(div0, "aria-label", div0_aria_label_value);
    			}

    			if (!current || dirty[0] & /*minHeight*/ 65536) {
    				set_style(div0, "min-height", /*minHeight*/ ctx[16] + "px");
    			}

    			if (!current || dirty[0] & /*maxHeight*/ 32768) {
    				set_style(div0, "max-height", /*maxHeight*/ ctx[15]);
    			}

    			if (!/*hideCopyButton*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*hideCopyButton*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*showMoreLess*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showMoreLess*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(div1, div1_data = get_spread_update(div1_levels, [dirty[0] & /*$$restProps*/ 524288 && /*$$restProps*/ ctx[19]]));
    			toggle_class(div1, "bx--snippet", true);
    			toggle_class(div1, "bx--snippet--expand", /*expanded*/ ctx[0]);
    			toggle_class(div1, "bx--snippet--light", /*light*/ ctx[8]);
    			toggle_class(div1, "bx--snippet--no-copy", /*hideCopyButton*/ ctx[5]);
    			toggle_class(div1, "bx--snippet--wraptext", /*wrapText*/ ctx[7]);
    			toggle_class(div1, "bx--snippet--single", /*type*/ ctx[3] === 'single');
    			toggle_class(div1, "bx--snippet--inline", /*type*/ ctx[3] === 'inline');
    			toggle_class(div1, "bx--snippet--multi", /*type*/ ctx[3] === 'multi');
    			toggle_class(div1, "bx--snippet--disabled", /*type*/ ctx[3] !== 'inline' && /*disabled*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			/*pre_binding*/ ctx[35](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(170:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:28) 
    function create_if_block_1$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*hideCopyButton*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(129:28) ",
    		ctx
    	});

    	return block;
    }

    // (120:0) {#if skeleton}
    function create_if_block$b(ctx) {
    	let codesnippetskeleton;
    	let current;
    	const codesnippetskeleton_spread_levels = [{ type: /*type*/ ctx[3] }, /*$$restProps*/ ctx[19]];
    	let codesnippetskeleton_props = {};

    	for (let i = 0; i < codesnippetskeleton_spread_levels.length; i += 1) {
    		codesnippetskeleton_props = assign(codesnippetskeleton_props, codesnippetskeleton_spread_levels[i]);
    	}

    	codesnippetskeleton = new CodeSnippetSkeleton$1({
    			props: codesnippetskeleton_props,
    			$$inline: true
    		});

    	codesnippetskeleton.$on("click", /*click_handler*/ ctx[27]);
    	codesnippetskeleton.$on("mouseover", /*mouseover_handler*/ ctx[28]);
    	codesnippetskeleton.$on("mouseenter", /*mouseenter_handler*/ ctx[29]);
    	codesnippetskeleton.$on("mouseleave", /*mouseleave_handler*/ ctx[30]);

    	const block = {
    		c: function create() {
    			create_component(codesnippetskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(codesnippetskeleton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codesnippetskeleton_changes = (dirty[0] & /*type, $$restProps*/ 524296)
    			? get_spread_update(codesnippetskeleton_spread_levels, [
    					dirty[0] & /*type*/ 8 && { type: /*type*/ ctx[3] },
    					dirty[0] & /*$$restProps*/ 524288 && get_spread_object(/*$$restProps*/ ctx[19])
    				])
    			: {};

    			codesnippetskeleton.$set(codesnippetskeleton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codesnippetskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codesnippetskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codesnippetskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(120:0) {#if skeleton}",
    		ctx
    	});

    	return block;
    }

    // (193:41) {code}
    function fallback_block_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*code*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*code*/ 16) set_data_dev(t, /*code*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2$1.name,
    		type: "fallback",
    		source: "(193:41) {code}",
    		ctx
    	});

    	return block;
    }

    // (195:4) {#if !hideCopyButton}
    function create_if_block_4$2(ctx) {
    	let copybutton;
    	let current;

    	copybutton = new CopyButton$1({
    			props: {
    				disabled: /*disabled*/ ctx[6],
    				feedback: /*feedback*/ ctx[12],
    				feedbackTimeout: /*feedbackTimeout*/ ctx[13],
    				iconDescription: /*copyButtonDescription*/ ctx[10]
    			},
    			$$inline: true
    		});

    	copybutton.$on("click", /*click_handler_2*/ ctx[36]);
    	copybutton.$on("click", /*copyCode*/ ctx[18]);
    	copybutton.$on("animationend", /*animationend_handler*/ ctx[37]);

    	const block = {
    		c: function create() {
    			create_component(copybutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(copybutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const copybutton_changes = {};
    			if (dirty[0] & /*disabled*/ 64) copybutton_changes.disabled = /*disabled*/ ctx[6];
    			if (dirty[0] & /*feedback*/ 4096) copybutton_changes.feedback = /*feedback*/ ctx[12];
    			if (dirty[0] & /*feedbackTimeout*/ 8192) copybutton_changes.feedbackTimeout = /*feedbackTimeout*/ ctx[13];
    			if (dirty[0] & /*copyButtonDescription*/ 1024) copybutton_changes.iconDescription = /*copyButtonDescription*/ ctx[10];
    			copybutton.$set(copybutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copybutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copybutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(copybutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(195:4) {#if !hideCopyButton}",
    		ctx
    	});

    	return block;
    }

    // (206:4) {#if showMoreLess}
    function create_if_block_3$3(ctx) {
    	let button;
    	let current;

    	button = new Button$1({
    			props: {
    				kind: "ghost",
    				size: "field",
    				class: "bx--snippet-btn--expand",
    				disabled: /*disabled*/ ctx[6],
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler_3*/ ctx[38]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};
    			if (dirty[0] & /*disabled*/ 64) button_changes.disabled = /*disabled*/ ctx[6];

    			if (dirty[0] & /*expandText*/ 131072 | dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(206:4) {#if showMoreLess}",
    		ctx
    	});

    	return block;
    }

    // (207:6) <Button         kind="ghost"         size="field"         class="bx--snippet-btn--expand"         disabled="{disabled}"         on:click="{() => {           expanded = !expanded;         }}"       >
    function create_default_slot_1$1(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let chevrondown16;
    	let current;

    	chevrondown16 = new ChevronDown16$1({
    			props: {
    				class: "bx--icon-chevron--down bx--snippet__icon",
    				"aria-label": /*expandText*/ ctx[17]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*expandText*/ ctx[17]);
    			t1 = space();
    			create_component(chevrondown16.$$.fragment);
    			toggle_class(span, "bx--snippet-btn--text", true);
    			add_location(span, file$e, 215, 8, 6008);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(chevrondown16, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*expandText*/ 131072) set_data_dev(t0, /*expandText*/ ctx[17]);
    			const chevrondown16_changes = {};
    			if (dirty[0] & /*expandText*/ 131072) chevrondown16_changes["aria-label"] = /*expandText*/ ctx[17];
    			chevrondown16.$set(chevrondown16_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chevrondown16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chevrondown16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			destroy_component(chevrondown16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(207:6) <Button         kind=\\\"ghost\\\"         size=\\\"field\\\"         class=\\\"bx--snippet-btn--expand\\\"         disabled=\\\"{disabled}\\\"         on:click=\\\"{() => {           expanded = !expanded;         }}\\\"       >",
    		ctx
    	});

    	return block;
    }

    // (146:2) {:else}
    function create_else_block$4(ctx) {
    	let copy_1;
    	let current;

    	const copy_1_spread_levels = [
    		{ "aria-label": /*copyLabel*/ ctx[11] },
    		{ "aria-describedby": /*id*/ ctx[14] },
    		{ feedback: /*feedback*/ ctx[12] },
    		{
    			feedbackTimeout: /*feedbackTimeout*/ ctx[13]
    		},
    		{
    			class: "bx--snippet " + (/*type*/ ctx[3] && `bx--snippet--${/*type*/ ctx[3]}`) + "\n          " + (/*type*/ ctx[3] === 'inline' && 'bx--btn--copy') + "\n          " + (/*expanded*/ ctx[0] && 'bx--snippet--expand') + "\n          " + (/*light*/ ctx[8] && 'bx--snippet--light') + "\n          " + (/*hideCopyButton*/ ctx[5] && 'bx--snippet--no-copy') + "\n          " + (/*wrapText*/ ctx[7] && 'bx--snippet--wraptext')
    		},
    		/*$$restProps*/ ctx[19]
    	];

    	let copy_1_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < copy_1_spread_levels.length; i += 1) {
    		copy_1_props = assign(copy_1_props, copy_1_spread_levels[i]);
    	}

    	copy_1 = new Copy$1({ props: copy_1_props, $$inline: true });
    	copy_1.$on("click", /*click_handler_1*/ ctx[31]);
    	copy_1.$on("click", /*copyCode*/ ctx[18]);
    	copy_1.$on("mouseover", /*mouseover_handler_1*/ ctx[32]);
    	copy_1.$on("mouseenter", /*mouseenter_handler_1*/ ctx[33]);
    	copy_1.$on("mouseleave", /*mouseleave_handler_1*/ ctx[34]);

    	const block = {
    		c: function create() {
    			create_component(copy_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(copy_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const copy_1_changes = (dirty[0] & /*copyLabel, id, feedback, feedbackTimeout, type, expanded, light, hideCopyButton, wrapText, $$restProps*/ 555433)
    			? get_spread_update(copy_1_spread_levels, [
    					dirty[0] & /*copyLabel*/ 2048 && { "aria-label": /*copyLabel*/ ctx[11] },
    					dirty[0] & /*id*/ 16384 && { "aria-describedby": /*id*/ ctx[14] },
    					dirty[0] & /*feedback*/ 4096 && { feedback: /*feedback*/ ctx[12] },
    					dirty[0] & /*feedbackTimeout*/ 8192 && {
    						feedbackTimeout: /*feedbackTimeout*/ ctx[13]
    					},
    					dirty[0] & /*type, expanded, light, hideCopyButton, wrapText*/ 425 && {
    						class: "bx--snippet " + (/*type*/ ctx[3] && `bx--snippet--${/*type*/ ctx[3]}`) + "\n          " + (/*type*/ ctx[3] === 'inline' && 'bx--btn--copy') + "\n          " + (/*expanded*/ ctx[0] && 'bx--snippet--expand') + "\n          " + (/*light*/ ctx[8] && 'bx--snippet--light') + "\n          " + (/*hideCopyButton*/ ctx[5] && 'bx--snippet--no-copy') + "\n          " + (/*wrapText*/ ctx[7] && 'bx--snippet--wraptext')
    					},
    					dirty[0] & /*$$restProps*/ 524288 && get_spread_object(/*$$restProps*/ ctx[19])
    				])
    			: {};

    			if (dirty[0] & /*id, code*/ 16400 | dirty[1] & /*$$scope*/ 256) {
    				copy_1_changes.$$scope = { dirty, ctx };
    			}

    			copy_1.$set(copy_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copy_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copy_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(copy_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(146:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:2) {#if hideCopyButton}
    function create_if_block_2$5(ctx) {
    	let span;
    	let code_1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[23].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);
    	const default_slot_or_fallback = default_slot || fallback_block$7(ctx);
    	let span_levels = [/*$$restProps*/ ctx[19]];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			code_1 = element("code");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(code_1, "id", /*id*/ ctx[14]);
    			add_location(code_1, file$e, 141, 6, 3810);
    			set_attributes(span, span_data);
    			toggle_class(span, "bx--snippet", true);
    			toggle_class(span, "bx--snippet--expand", /*expanded*/ ctx[0]);
    			toggle_class(span, "bx--snippet--light", /*light*/ ctx[8]);
    			toggle_class(span, "bx--snippet--no-copy", /*hideCopyButton*/ ctx[5]);
    			toggle_class(span, "bx--snippet--wraptext", /*wrapText*/ ctx[7]);
    			toggle_class(span, "bx--snippet--single", /*type*/ ctx[3] === 'single');
    			toggle_class(span, "bx--snippet--inline", /*type*/ ctx[3] === 'inline');
    			toggle_class(span, "bx--snippet--multi", /*type*/ ctx[3] === 'multi');
    			add_location(span, file$e, 130, 4, 3391);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, code_1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(code_1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[39],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[39])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[39], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*code*/ 16)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*id*/ 16384) {
    				attr_dev(code_1, "id", /*id*/ ctx[14]);
    			}

    			set_attributes(span, span_data = get_spread_update(span_levels, [dirty[0] & /*$$restProps*/ 524288 && /*$$restProps*/ ctx[19]]));
    			toggle_class(span, "bx--snippet", true);
    			toggle_class(span, "bx--snippet--expand", /*expanded*/ ctx[0]);
    			toggle_class(span, "bx--snippet--light", /*light*/ ctx[8]);
    			toggle_class(span, "bx--snippet--no-copy", /*hideCopyButton*/ ctx[5]);
    			toggle_class(span, "bx--snippet--wraptext", /*wrapText*/ ctx[7]);
    			toggle_class(span, "bx--snippet--single", /*type*/ ctx[3] === 'single');
    			toggle_class(span, "bx--snippet--inline", /*type*/ ctx[3] === 'inline');
    			toggle_class(span, "bx--snippet--multi", /*type*/ ctx[3] === 'multi');
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(130:2) {#if hideCopyButton}",
    		ctx
    	});

    	return block;
    }

    // (166:14) {code}
    function fallback_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*code*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*code*/ 16) set_data_dev(t, /*code*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1$1.name,
    		type: "fallback",
    		source: "(166:14) {code}",
    		ctx
    	});

    	return block;
    }

    // (147:4) <Copy       aria-label="{copyLabel}"       aria-describedby="{id}"       feedback="{feedback}"       feedbackTimeout="{feedbackTimeout}"       class="bx--snippet {type && `bx--snippet--${type}`}           {type === 'inline' && 'bx--btn--copy'}           {expanded && 'bx--snippet--expand'}           {light && 'bx--snippet--light'}           {hideCopyButton && 'bx--snippet--no-copy'}           {wrapText && 'bx--snippet--wraptext'}"       {...$$restProps}       on:click       on:click="{copyCode}"       on:mouseover       on:mouseenter       on:mouseleave     >
    function create_default_slot$2(ctx) {
    	let code_1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[23].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);
    	const default_slot_or_fallback = default_slot || fallback_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			code_1 = element("code");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(code_1, "id", /*id*/ ctx[14]);
    			add_location(code_1, file$e, 164, 6, 4466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code_1, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(code_1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[39],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[39])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[39], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*code*/ 16)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*id*/ 16384) {
    				attr_dev(code_1, "id", /*id*/ ctx[14]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(code_1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(147:4) <Copy       aria-label=\\\"{copyLabel}\\\"       aria-describedby=\\\"{id}\\\"       feedback=\\\"{feedback}\\\"       feedbackTimeout=\\\"{feedbackTimeout}\\\"       class=\\\"bx--snippet {type && `bx--snippet--${type}`}           {type === 'inline' && 'bx--btn--copy'}           {expanded && 'bx--snippet--expand'}           {light && 'bx--snippet--light'}           {hideCopyButton && 'bx--snippet--no-copy'}           {wrapText && 'bx--snippet--wraptext'}\\\"       {...$$restProps}       on:click       on:click=\\\"{copyCode}\\\"       on:mouseover       on:mouseenter       on:mouseleave     >",
    		ctx
    	});

    	return block;
    }

    // (143:14) {code}
    function fallback_block$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*code*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*code*/ 16) set_data_dev(t, /*code*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$7.name,
    		type: "fallback",
    		source: "(143:14) {code}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$b, create_if_block_1$5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*skeleton*/ ctx[9]) return 0;
    		if (/*type*/ ctx[3] === "inline") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let expandText;
    	let minHeight;
    	let maxHeight;

    	const omit_props_names = [
    		"type","code","copy","expanded","hideCopyButton","disabled","wrapText","light","skeleton","copyButtonDescription","copyLabel","feedback","feedbackTimeout","showLessText","showMoreText","showMoreLess","id","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CodeSnippet', slots, ['default']);
    	let { type = "single" } = $$props;
    	let { code = undefined } = $$props;

    	let { copy = async code => {
    		try {
    			await navigator.clipboard.writeText(code);
    		} catch(e) {
    			console.log(e);
    		}
    	} } = $$props;

    	let { expanded = false } = $$props;
    	let { hideCopyButton = false } = $$props;
    	let { disabled = false } = $$props;
    	let { wrapText = false } = $$props;
    	let { light = false } = $$props;
    	let { skeleton = false } = $$props;
    	let { copyButtonDescription = undefined } = $$props;
    	let { copyLabel = undefined } = $$props;
    	let { feedback = "Copied!" } = $$props;
    	let { feedbackTimeout = 2000 } = $$props;
    	let { showLessText = "Show less" } = $$props;
    	let { showMoreText = "Show more" } = $$props;
    	let { showMoreLess = false } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { ref = null } = $$props;
    	const dispatch = createEventDispatcher();

    	function setShowMoreLess() {
    		const { height } = ref.getBoundingClientRect();
    		if (height > 0) $$invalidate(2, showMoreLess = ref.getBoundingClientRect().height > 255);
    	}

    	function copyCode() {
    		copy(code);
    		dispatch("copy");
    	}

    	function mouseover_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pre_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	function click_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function animationend_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_3 = () => {
    		$$invalidate(0, expanded = !expanded);
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(19, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('type' in $$new_props) $$invalidate(3, type = $$new_props.type);
    		if ('code' in $$new_props) $$invalidate(4, code = $$new_props.code);
    		if ('copy' in $$new_props) $$invalidate(20, copy = $$new_props.copy);
    		if ('expanded' in $$new_props) $$invalidate(0, expanded = $$new_props.expanded);
    		if ('hideCopyButton' in $$new_props) $$invalidate(5, hideCopyButton = $$new_props.hideCopyButton);
    		if ('disabled' in $$new_props) $$invalidate(6, disabled = $$new_props.disabled);
    		if ('wrapText' in $$new_props) $$invalidate(7, wrapText = $$new_props.wrapText);
    		if ('light' in $$new_props) $$invalidate(8, light = $$new_props.light);
    		if ('skeleton' in $$new_props) $$invalidate(9, skeleton = $$new_props.skeleton);
    		if ('copyButtonDescription' in $$new_props) $$invalidate(10, copyButtonDescription = $$new_props.copyButtonDescription);
    		if ('copyLabel' in $$new_props) $$invalidate(11, copyLabel = $$new_props.copyLabel);
    		if ('feedback' in $$new_props) $$invalidate(12, feedback = $$new_props.feedback);
    		if ('feedbackTimeout' in $$new_props) $$invalidate(13, feedbackTimeout = $$new_props.feedbackTimeout);
    		if ('showLessText' in $$new_props) $$invalidate(21, showLessText = $$new_props.showLessText);
    		if ('showMoreText' in $$new_props) $$invalidate(22, showMoreText = $$new_props.showMoreText);
    		if ('showMoreLess' in $$new_props) $$invalidate(2, showMoreLess = $$new_props.showMoreLess);
    		if ('id' in $$new_props) $$invalidate(14, id = $$new_props.id);
    		if ('ref' in $$new_props) $$invalidate(1, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(39, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		code,
    		copy,
    		expanded,
    		hideCopyButton,
    		disabled,
    		wrapText,
    		light,
    		skeleton,
    		copyButtonDescription,
    		copyLabel,
    		feedback,
    		feedbackTimeout,
    		showLessText,
    		showMoreText,
    		showMoreLess,
    		id,
    		ref,
    		createEventDispatcher,
    		tick,
    		ChevronDown16: ChevronDown16$1,
    		Button: Button$1,
    		Copy: Copy$1,
    		CopyButton: CopyButton$1,
    		CodeSnippetSkeleton: CodeSnippetSkeleton$1,
    		dispatch,
    		setShowMoreLess,
    		copyCode,
    		maxHeight,
    		minHeight,
    		expandText
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('type' in $$props) $$invalidate(3, type = $$new_props.type);
    		if ('code' in $$props) $$invalidate(4, code = $$new_props.code);
    		if ('copy' in $$props) $$invalidate(20, copy = $$new_props.copy);
    		if ('expanded' in $$props) $$invalidate(0, expanded = $$new_props.expanded);
    		if ('hideCopyButton' in $$props) $$invalidate(5, hideCopyButton = $$new_props.hideCopyButton);
    		if ('disabled' in $$props) $$invalidate(6, disabled = $$new_props.disabled);
    		if ('wrapText' in $$props) $$invalidate(7, wrapText = $$new_props.wrapText);
    		if ('light' in $$props) $$invalidate(8, light = $$new_props.light);
    		if ('skeleton' in $$props) $$invalidate(9, skeleton = $$new_props.skeleton);
    		if ('copyButtonDescription' in $$props) $$invalidate(10, copyButtonDescription = $$new_props.copyButtonDescription);
    		if ('copyLabel' in $$props) $$invalidate(11, copyLabel = $$new_props.copyLabel);
    		if ('feedback' in $$props) $$invalidate(12, feedback = $$new_props.feedback);
    		if ('feedbackTimeout' in $$props) $$invalidate(13, feedbackTimeout = $$new_props.feedbackTimeout);
    		if ('showLessText' in $$props) $$invalidate(21, showLessText = $$new_props.showLessText);
    		if ('showMoreText' in $$props) $$invalidate(22, showMoreText = $$new_props.showMoreText);
    		if ('showMoreLess' in $$props) $$invalidate(2, showMoreLess = $$new_props.showMoreLess);
    		if ('id' in $$props) $$invalidate(14, id = $$new_props.id);
    		if ('ref' in $$props) $$invalidate(1, ref = $$new_props.ref);
    		if ('maxHeight' in $$props) $$invalidate(15, maxHeight = $$new_props.maxHeight);
    		if ('minHeight' in $$props) $$invalidate(16, minHeight = $$new_props.minHeight);
    		if ('expandText' in $$props) $$invalidate(17, expandText = $$new_props.expandText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*expanded, showLessText, showMoreText*/ 6291457) {
    			$$invalidate(17, expandText = expanded ? showLessText : showMoreText);
    		}

    		if ($$self.$$.dirty[0] & /*expanded*/ 1) {
    			$$invalidate(16, minHeight = expanded ? 16 * 15 : 48);
    		}

    		if ($$self.$$.dirty[0] & /*expanded*/ 1) {
    			$$invalidate(15, maxHeight = expanded ? "none" : 16 * 15 + "px");
    		}

    		if ($$self.$$.dirty[0] & /*type, ref, code*/ 26) {
    			if (type === "multi" && ref) {
    				if (code === undefined) setShowMoreLess();
    				if (code) tick().then(setShowMoreLess);
    			}
    		}
    	};

    	return [
    		expanded,
    		ref,
    		showMoreLess,
    		type,
    		code,
    		hideCopyButton,
    		disabled,
    		wrapText,
    		light,
    		skeleton,
    		copyButtonDescription,
    		copyLabel,
    		feedback,
    		feedbackTimeout,
    		id,
    		maxHeight,
    		minHeight,
    		expandText,
    		copyCode,
    		$$restProps,
    		copy,
    		showLessText,
    		showMoreText,
    		slots,
    		mouseover_handler_2,
    		mouseenter_handler_2,
    		mouseleave_handler_2,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		click_handler_1,
    		mouseover_handler_1,
    		mouseenter_handler_1,
    		mouseleave_handler_1,
    		pre_binding,
    		click_handler_2,
    		animationend_handler,
    		click_handler_3,
    		$$scope
    	];
    }

    class CodeSnippet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$h,
    			create_fragment$h,
    			safe_not_equal,
    			{
    				type: 3,
    				code: 4,
    				copy: 20,
    				expanded: 0,
    				hideCopyButton: 5,
    				disabled: 6,
    				wrapText: 7,
    				light: 8,
    				skeleton: 9,
    				copyButtonDescription: 10,
    				copyLabel: 11,
    				feedback: 12,
    				feedbackTimeout: 13,
    				showLessText: 21,
    				showMoreText: 22,
    				showMoreLess: 2,
    				id: 14,
    				ref: 1
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeSnippet",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get type() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get code() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copy() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copy(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideCopyButton() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideCopyButton(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapText() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapText(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skeleton() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skeleton(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copyButtonDescription() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copyButtonDescription(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copyLabel() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copyLabel(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get feedback() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feedback(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get feedbackTimeout() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feedbackTimeout(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLessText() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLessText(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showMoreText() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showMoreText(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showMoreLess() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showMoreLess(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<CodeSnippet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<CodeSnippet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var CodeSnippet$1 = CodeSnippet;

    /* node_modules/carbon-components-svelte/src/RadioButton/RadioButton.svelte generated by Svelte v3.46.4 */
    const file$d = "node_modules/carbon-components-svelte/src/RadioButton/RadioButton.svelte";
    const get_labelText_slot_changes$4 = dirty => ({});
    const get_labelText_slot_context$4 = ctx => ({});

    // (74:4) {#if labelText || $$slots.labelText}
    function create_if_block$a(ctx) {
    	let span;
    	let current;
    	const labelText_slot_template = /*#slots*/ ctx[16].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[15], get_labelText_slot_context$4);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block$6(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			toggle_class(span, "bx--visually-hidden", /*hideLabel*/ ctx[7]);
    			add_location(span, file$d, 74, 6, 1826);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[15], dirty, get_labelText_slot_changes$4),
    						get_labelText_slot_context$4
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty & /*labelText*/ 64)) {
    					labelText_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (dirty & /*hideLabel*/ 128) {
    				toggle_class(span, "bx--visually-hidden", /*hideLabel*/ ctx[7]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(74:4) {#if labelText || $$slots.labelText}",
    		ctx
    	});

    	return block;
    }

    // (76:31)            
    function fallback_block$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelText*/ 64) set_data_dev(t, /*labelText*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$6.name,
    		type: "fallback",
    		source: "(76:31)            ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = (/*labelText*/ ctx[6] || /*$$slots*/ ctx[13].labelText) && create_if_block$a(ctx);
    	let div_levels = [/*$$restProps*/ ctx[12]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			span = element("span");
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "id", /*id*/ ctx[8]);
    			attr_dev(input, "name", /*name*/ ctx[9]);
    			input.checked = /*checked*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[3];
    			input.required = /*required*/ ctx[4];
    			input.value = /*value*/ ctx[2];
    			toggle_class(input, "bx--radio-button", true);
    			add_location(input, file$d, 54, 2, 1344);
    			toggle_class(span, "bx--radio-button__appearance", true);
    			add_location(span, file$d, 72, 4, 1721);
    			attr_dev(label, "for", /*id*/ ctx[8]);
    			toggle_class(label, "bx--radio-button__label", true);
    			add_location(label, file$d, 71, 2, 1659);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--radio-button-wrapper", true);
    			toggle_class(div, "bx--radio-button-wrapper--label-left", /*labelPosition*/ ctx[5] === 'left');
    			add_location(div, file$d, 49, 0, 1200);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[18](input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, span);
    			append_dev(label, t1);
    			if (if_block) if_block.m(label, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*change_handler*/ ctx[17], false, false, false),
    					listen_dev(input, "change", /*change_handler_1*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 256) {
    				attr_dev(input, "id", /*id*/ ctx[8]);
    			}

    			if (!current || dirty & /*name*/ 512) {
    				attr_dev(input, "name", /*name*/ ctx[9]);
    			}

    			if (!current || dirty & /*checked*/ 1) {
    				prop_dev(input, "checked", /*checked*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 8) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[3]);
    			}

    			if (!current || dirty & /*required*/ 16) {
    				prop_dev(input, "required", /*required*/ ctx[4]);
    			}

    			if (!current || dirty & /*value*/ 4) {
    				prop_dev(input, "value", /*value*/ ctx[2]);
    			}

    			if (/*labelText*/ ctx[6] || /*$$slots*/ ctx[13].labelText) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*labelText, $$slots*/ 8256) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(label, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*id*/ 256) {
    				attr_dev(label, "for", /*id*/ ctx[8]);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12]]));
    			toggle_class(div, "bx--radio-button-wrapper", true);
    			toggle_class(div, "bx--radio-button-wrapper--label-left", /*labelPosition*/ ctx[5] === 'left');
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[18](null);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"value","checked","disabled","required","labelPosition","labelText","hideLabel","id","name","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $selectedValue;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RadioButton', slots, ['labelText']);
    	const $$slots = compute_slots(slots);
    	let { value = "" } = $$props;
    	let { checked = false } = $$props;
    	let { disabled = false } = $$props;
    	let { required = false } = $$props;
    	let { labelPosition = "right" } = $$props;
    	let { labelText = "" } = $$props;
    	let { hideLabel = false } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { name = "" } = $$props;
    	let { ref = null } = $$props;
    	const ctx = getContext("RadioButtonGroup");

    	const selectedValue = ctx
    	? ctx.selectedValue
    	: writable(checked ? value : undefined);

    	validate_store(selectedValue, 'selectedValue');
    	component_subscribe($$self, selectedValue, value => $$invalidate(14, $selectedValue = value));

    	if (ctx) {
    		ctx.add({ id, checked, disabled, value });
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	const change_handler_1 = () => {
    		if (ctx) {
    			ctx.update(value);
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(12, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('value' in $$new_props) $$invalidate(2, value = $$new_props.value);
    		if ('checked' in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ('disabled' in $$new_props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ('required' in $$new_props) $$invalidate(4, required = $$new_props.required);
    		if ('labelPosition' in $$new_props) $$invalidate(5, labelPosition = $$new_props.labelPosition);
    		if ('labelText' in $$new_props) $$invalidate(6, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$new_props) $$invalidate(7, hideLabel = $$new_props.hideLabel);
    		if ('id' in $$new_props) $$invalidate(8, id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate(9, name = $$new_props.name);
    		if ('ref' in $$new_props) $$invalidate(1, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		checked,
    		disabled,
    		required,
    		labelPosition,
    		labelText,
    		hideLabel,
    		id,
    		name,
    		ref,
    		getContext,
    		writable,
    		ctx,
    		selectedValue,
    		$selectedValue
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('value' in $$props) $$invalidate(2, value = $$new_props.value);
    		if ('checked' in $$props) $$invalidate(0, checked = $$new_props.checked);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ('required' in $$props) $$invalidate(4, required = $$new_props.required);
    		if ('labelPosition' in $$props) $$invalidate(5, labelPosition = $$new_props.labelPosition);
    		if ('labelText' in $$props) $$invalidate(6, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$props) $$invalidate(7, hideLabel = $$new_props.hideLabel);
    		if ('id' in $$props) $$invalidate(8, id = $$new_props.id);
    		if ('name' in $$props) $$invalidate(9, name = $$new_props.name);
    		if ('ref' in $$props) $$invalidate(1, ref = $$new_props.ref);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedValue, value*/ 16388) {
    			$$invalidate(0, checked = $selectedValue === value);
    		}
    	};

    	return [
    		checked,
    		ref,
    		value,
    		disabled,
    		required,
    		labelPosition,
    		labelText,
    		hideLabel,
    		id,
    		name,
    		ctx,
    		selectedValue,
    		$$restProps,
    		$$slots,
    		$selectedValue,
    		$$scope,
    		slots,
    		change_handler,
    		input_binding,
    		change_handler_1
    	];
    }

    class RadioButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			value: 2,
    			checked: 0,
    			disabled: 3,
    			required: 4,
    			labelPosition: 5,
    			labelText: 6,
    			hideLabel: 7,
    			id: 8,
    			name: 9,
    			ref: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RadioButton",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get value() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelPosition() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelPosition(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLabel() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var RadioButton$1 = RadioButton;

    /* node_modules/carbon-components-svelte/src/icons/CheckmarkFilled16.svelte generated by Svelte v3.46.4 */

    const file$c = "node_modules/carbon-components-svelte/src/icons/CheckmarkFilled16.svelte";

    // (50:4) {#if title}
    function create_if_block$9(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$c, 50, 6, 1324);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(50:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (49:8)      
    function fallback_block$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*title*/ ctx[2] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$5.name,
    		type: "fallback",
    		source: "(49:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const default_slot_or_fallback = default_slot || fallback_block$5(ctx);

    	let svg_levels = [
    		{ "data-carbon-icon": "CheckmarkFilled16" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 16 16" },
    		{ fill: "currentColor" },
    		{ width: "16" },
    		{ height: "16" },
    		{ class: /*className*/ ctx[0] },
    		{ preserveAspectRatio: "xMidYMid meet" },
    		{ style: /*style*/ ctx[3] },
    		{ id: /*id*/ ctx[1] },
    		/*attributes*/ ctx[4]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(path0, "d", "M8,1C4.1,1,1,4.1,1,8c0,3.9,3.1,7,7,7s7-3.1,7-7C15,4.1,11.9,1,8,1z M7,11L4.3,8.3l0.9-0.8L7,9.3l4-3.9l0.9,0.8L7,11z");
    			add_location(path0, file$c, 42, 2, 1037);
    			attr_dev(path1, "d", "M7,11L4.3,8.3l0.9-0.8L7,9.3l4-3.9l0.9,0.8L7,11z");
    			attr_dev(path1, "data-icon-path", "inner-path");
    			attr_dev(path1, "opacity", "0");
    			add_location(path1, file$c, 44, 10, 1175);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$c, 23, 0, 691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(svg, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(svg, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(svg, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false),
    					listen_dev(svg, "keyup", /*keyup_handler*/ ctx[16], false, false, false),
    					listen_dev(svg, "keydown", /*keydown_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*title*/ 4)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ "data-carbon-icon": "CheckmarkFilled16" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 16 16" },
    				{ fill: "currentColor" },
    				{ width: "16" },
    				{ height: "16" },
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] },
    				{ preserveAspectRatio: "xMidYMid meet" },
    				(!current || dirty & /*style*/ 8) && { style: /*style*/ ctx[3] },
    				(!current || dirty & /*id*/ 2) && { id: /*id*/ ctx[1] },
    				dirty & /*attributes*/ 16 && /*attributes*/ ctx[4]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let ariaLabelledBy;
    	let labelled;
    	let attributes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CheckmarkFilled16', slots, ['default']);
    	let { class: className = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { tabindex = undefined } = $$props;
    	let { focusable = false } = $$props;
    	let { title = undefined } = $$props;
    	let { style = undefined } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$new_props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$new_props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$new_props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		id,
    		tabindex,
    		focusable,
    		title,
    		style,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		attributes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('id' in $$props) $$invalidate(1, id = $$new_props.id);
    		if ('tabindex' in $$props) $$invalidate(5, tabindex = $$new_props.tabindex);
    		if ('focusable' in $$props) $$invalidate(6, focusable = $$new_props.focusable);
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    		if ('style' in $$props) $$invalidate(3, style = $$new_props.style);
    		if ('labelled' in $$props) $$invalidate(7, labelled = $$new_props.labelled);
    		if ('ariaLabelledBy' in $$props) $$invalidate(8, ariaLabelledBy = $$new_props.ariaLabelledBy);
    		if ('ariaLabel' in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
    		if ('attributes' in $$props) $$invalidate(4, attributes = $$new_props.attributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(9, ariaLabel = $$props["aria-label"]);
    		$$invalidate(8, ariaLabelledBy = $$props["aria-labelledby"]);

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, title*/ 772) {
    			$$invalidate(7, labelled = ariaLabel || ariaLabelledBy || title);
    		}

    		if ($$self.$$.dirty & /*ariaLabel, ariaLabelledBy, labelled, tabindex, focusable*/ 992) {
    			$$invalidate(4, attributes = {
    				"aria-label": ariaLabel,
    				"aria-labelledby": ariaLabelledBy,
    				"aria-hidden": labelled ? undefined : true,
    				role: labelled ? "img" : undefined,
    				focusable: tabindex === "0" ? true : focusable,
    				tabindex
    			});
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		id,
    		title,
    		style,
    		attributes,
    		tabindex,
    		focusable,
    		labelled,
    		ariaLabelledBy,
    		ariaLabel,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		keyup_handler,
    		keydown_handler
    	];
    }

    class CheckmarkFilled16 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			class: 0,
    			id: 1,
    			tabindex: 5,
    			focusable: 6,
    			title: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckmarkFilled16",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get class() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusable() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusable(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<CheckmarkFilled16>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<CheckmarkFilled16>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var CheckmarkFilled16$1 = CheckmarkFilled16;

    /* node_modules/carbon-components-svelte/src/Loading/Loading.svelte generated by Svelte v3.46.4 */

    const file$b = "node_modules/carbon-components-svelte/src/Loading/Loading.svelte";

    // (53:0) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let label;
    	let t0;
    	let t1;
    	let svg;
    	let title;
    	let t2;
    	let circle;
    	let div_aria_live_value;
    	let if_block = /*small*/ ctx[0] && create_if_block_2$4(ctx);

    	let div_levels = [
    		{ "aria-atomic": "true" },
    		{ "aria-labelledby": /*id*/ ctx[4] },
    		{
    			"aria-live": div_aria_live_value = /*active*/ ctx[1] ? 'assertive' : 'off'
    		},
    		/*$$restProps*/ ctx[6]
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(/*description*/ ctx[3]);
    			t1 = space();
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t2 = text(/*description*/ ctx[3]);
    			if (if_block) if_block.c();
    			circle = svg_element("circle");
    			attr_dev(label, "id", /*id*/ ctx[4]);
    			toggle_class(label, "bx--visually-hidden", true);
    			add_location(label, file$b, 63, 4, 1781);
    			add_location(title, file$b, 65, 6, 1925);
    			attr_dev(circle, "cx", "50%");
    			attr_dev(circle, "cy", "50%");
    			attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			toggle_class(circle, "bx--loading__stroke", true);
    			add_location(circle, file$b, 73, 6, 2133);
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			toggle_class(svg, "bx--loading__svg", true);
    			add_location(svg, file$b, 64, 4, 1859);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--loading", true);
    			toggle_class(div, "bx--loading--small", /*small*/ ctx[0]);
    			toggle_class(div, "bx--loading--stop", !/*active*/ ctx[1]);
    			add_location(div, file$b, 53, 2, 1479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(div, t1);
    			append_dev(div, svg);
    			append_dev(svg, title);
    			append_dev(title, t2);
    			if (if_block) if_block.m(svg, null);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 8) set_data_dev(t0, /*description*/ ctx[3]);

    			if (dirty & /*id*/ 16) {
    				attr_dev(label, "id", /*id*/ ctx[4]);
    			}

    			if (dirty & /*description*/ 8) set_data_dev(t2, /*description*/ ctx[3]);

    			if (/*small*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$4(ctx);
    					if_block.c();
    					if_block.m(svg, circle);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*spinnerRadius*/ 32) {
    				attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				{ "aria-atomic": "true" },
    				dirty & /*id*/ 16 && { "aria-labelledby": /*id*/ ctx[4] },
    				dirty & /*active*/ 2 && div_aria_live_value !== (div_aria_live_value = /*active*/ ctx[1] ? 'assertive' : 'off') && { "aria-live": div_aria_live_value },
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]
    			]));

    			toggle_class(div, "bx--loading", true);
    			toggle_class(div, "bx--loading--small", /*small*/ ctx[0]);
    			toggle_class(div, "bx--loading--stop", !/*active*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if withOverlay}
    function create_if_block$8(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let t0;
    	let t1;
    	let svg;
    	let title;
    	let t2;
    	let circle;
    	let div0_aria_live_value;
    	let if_block = /*small*/ ctx[0] && create_if_block_1$4(ctx);
    	let div1_levels = [/*$$restProps*/ ctx[6]];
    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			t0 = text(/*description*/ ctx[3]);
    			t1 = space();
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t2 = text(/*description*/ ctx[3]);
    			if (if_block) if_block.c();
    			circle = svg_element("circle");
    			attr_dev(label, "id", /*id*/ ctx[4]);
    			toggle_class(label, "bx--visually-hidden", true);
    			add_location(label, file$b, 34, 6, 933);
    			add_location(title, file$b, 36, 8, 1081);
    			attr_dev(circle, "cx", "50%");
    			attr_dev(circle, "cy", "50%");
    			attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			toggle_class(circle, "bx--loading__stroke", true);
    			add_location(circle, file$b, 44, 8, 1305);
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			toggle_class(svg, "bx--loading__svg", true);
    			add_location(svg, file$b, 35, 6, 1013);
    			attr_dev(div0, "aria-atomic", "true");
    			attr_dev(div0, "aria-labelledby", /*id*/ ctx[4]);
    			attr_dev(div0, "aria-live", div0_aria_live_value = /*active*/ ctx[1] ? 'assertive' : 'off');
    			toggle_class(div0, "bx--loading", true);
    			toggle_class(div0, "bx--loading--small", /*small*/ ctx[0]);
    			toggle_class(div0, "bx--loading--stop", !/*active*/ ctx[1]);
    			add_location(div0, file$b, 25, 4, 634);
    			set_attributes(div1, div1_data);
    			toggle_class(div1, "bx--loading-overlay", true);
    			toggle_class(div1, "bx--loading-overlay--stop", !/*active*/ ctx[1]);
    			add_location(div1, file$b, 20, 2, 513);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(div0, t1);
    			append_dev(div0, svg);
    			append_dev(svg, title);
    			append_dev(title, t2);
    			if (if_block) if_block.m(svg, null);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 8) set_data_dev(t0, /*description*/ ctx[3]);

    			if (dirty & /*id*/ 16) {
    				attr_dev(label, "id", /*id*/ ctx[4]);
    			}

    			if (dirty & /*description*/ 8) set_data_dev(t2, /*description*/ ctx[3]);

    			if (/*small*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					if_block.m(svg, circle);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*spinnerRadius*/ 32) {
    				attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			}

    			if (dirty & /*id*/ 16) {
    				attr_dev(div0, "aria-labelledby", /*id*/ ctx[4]);
    			}

    			if (dirty & /*active*/ 2 && div0_aria_live_value !== (div0_aria_live_value = /*active*/ ctx[1] ? 'assertive' : 'off')) {
    				attr_dev(div0, "aria-live", div0_aria_live_value);
    			}

    			if (dirty & /*small*/ 1) {
    				toggle_class(div0, "bx--loading--small", /*small*/ ctx[0]);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(div0, "bx--loading--stop", !/*active*/ ctx[1]);
    			}

    			set_attributes(div1, div1_data = get_spread_update(div1_levels, [dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]]));
    			toggle_class(div1, "bx--loading-overlay", true);
    			toggle_class(div1, "bx--loading-overlay--stop", !/*active*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(20:0) {#if withOverlay}",
    		ctx
    	});

    	return block;
    }

    // (67:6) {#if small}
    function create_if_block_2$4(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "50%");
    			attr_dev(circle, "cy", "50%");
    			attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			toggle_class(circle, "bx--loading__background", true);
    			add_location(circle, file$b, 67, 8, 1980);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*spinnerRadius*/ 32) {
    				attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(67:6) {#if small}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#if small}
    function create_if_block_1$4(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "50%");
    			attr_dev(circle, "cy", "50%");
    			attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			toggle_class(circle, "bx--loading__background", true);
    			add_location(circle, file$b, 38, 10, 1140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*spinnerRadius*/ 32) {
    				attr_dev(circle, "r", /*spinnerRadius*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(38:8) {#if small}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*withOverlay*/ ctx[2]) return create_if_block$8;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let spinnerRadius;
    	const omit_props_names = ["small","active","withOverlay","description","id"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Loading', slots, []);
    	let { small = false } = $$props;
    	let { active = true } = $$props;
    	let { withOverlay = true } = $$props;
    	let { description = "Active loading indicator" } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('small' in $$new_props) $$invalidate(0, small = $$new_props.small);
    		if ('active' in $$new_props) $$invalidate(1, active = $$new_props.active);
    		if ('withOverlay' in $$new_props) $$invalidate(2, withOverlay = $$new_props.withOverlay);
    		if ('description' in $$new_props) $$invalidate(3, description = $$new_props.description);
    		if ('id' in $$new_props) $$invalidate(4, id = $$new_props.id);
    	};

    	$$self.$capture_state = () => ({
    		small,
    		active,
    		withOverlay,
    		description,
    		id,
    		spinnerRadius
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('small' in $$props) $$invalidate(0, small = $$new_props.small);
    		if ('active' in $$props) $$invalidate(1, active = $$new_props.active);
    		if ('withOverlay' in $$props) $$invalidate(2, withOverlay = $$new_props.withOverlay);
    		if ('description' in $$props) $$invalidate(3, description = $$new_props.description);
    		if ('id' in $$props) $$invalidate(4, id = $$new_props.id);
    		if ('spinnerRadius' in $$props) $$invalidate(5, spinnerRadius = $$new_props.spinnerRadius);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*small*/ 1) {
    			$$invalidate(5, spinnerRadius = small ? "42" : "44");
    		}
    	};

    	return [small, active, withOverlay, description, id, spinnerRadius, $$restProps];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			small: 0,
    			active: 1,
    			withOverlay: 2,
    			description: 3,
    			id: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get small() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withOverlay() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withOverlay(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Loading$1 = Loading;

    /* node_modules/carbon-components-svelte/src/FileUploader/Filename.svelte generated by Svelte v3.46.4 */

    // (20:0) {#if status === "uploading"}
    function create_if_block_3$2(ctx) {
    	let loading;
    	let current;

    	const loading_spread_levels = [
    		{ description: /*iconDescription*/ ctx[1] },
    		/*$$restProps*/ ctx[3],
    		{ small: true },
    		{ withOverlay: false }
    	];

    	let loading_props = {};

    	for (let i = 0; i < loading_spread_levels.length; i += 1) {
    		loading_props = assign(loading_props, loading_spread_levels[i]);
    	}

    	loading = new Loading$1({ props: loading_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loading_changes = (dirty & /*iconDescription, $$restProps*/ 10)
    			? get_spread_update(loading_spread_levels, [
    					dirty & /*iconDescription*/ 2 && { description: /*iconDescription*/ ctx[1] },
    					dirty & /*$$restProps*/ 8 && get_spread_object(/*$$restProps*/ ctx[3]),
    					loading_spread_levels[2],
    					loading_spread_levels[3]
    				])
    			: {};

    			loading.$set(loading_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(20:0) {#if status === \\\"uploading\\\"}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if status === "edit"}
    function create_if_block_1$3(ctx) {
    	let t;
    	let close16;
    	let current;
    	let if_block = /*invalid*/ ctx[2] && create_if_block_2$3(ctx);

    	const close16_spread_levels = [
    		{ "aria-label": /*iconDescription*/ ctx[1] },
    		{ title: /*iconDescription*/ ctx[1] },
    		{ class: "bx--file-close" },
    		/*$$restProps*/ ctx[3]
    	];

    	let close16_props = {};

    	for (let i = 0; i < close16_spread_levels.length; i += 1) {
    		close16_props = assign(close16_props, close16_spread_levels[i]);
    	}

    	close16 = new Close16$1({ props: close16_props, $$inline: true });
    	close16.$on("click", /*click_handler*/ ctx[4]);
    	close16.$on("keydown", /*keydown_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(close16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(close16, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*invalid*/ ctx[2]) {
    				if (if_block) {
    					if (dirty & /*invalid*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const close16_changes = (dirty & /*iconDescription, $$restProps*/ 10)
    			? get_spread_update(close16_spread_levels, [
    					dirty & /*iconDescription*/ 2 && { "aria-label": /*iconDescription*/ ctx[1] },
    					dirty & /*iconDescription*/ 2 && { title: /*iconDescription*/ ctx[1] },
    					close16_spread_levels[2],
    					dirty & /*$$restProps*/ 8 && get_spread_object(/*$$restProps*/ ctx[3])
    				])
    			: {};

    			close16.$set(close16_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(close16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(close16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(close16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(29:0) {#if status === \\\"edit\\\"}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if invalid}
    function create_if_block_2$3(ctx) {
    	let warningfilled16;
    	let current;

    	warningfilled16 = new WarningFilled16$1({
    			props: { class: "bx--file-invalid" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(warningfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(warningfilled16, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(warningfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(warningfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(warningfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(30:2) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (43:0) {#if status === "complete"}
    function create_if_block$7(ctx) {
    	let checkmarkfilled16;
    	let current;

    	const checkmarkfilled16_spread_levels = [
    		{ "aria-label": /*iconDescription*/ ctx[1] },
    		{ title: /*iconDescription*/ ctx[1] },
    		{ class: "bx--file-complete" },
    		/*$$restProps*/ ctx[3]
    	];

    	let checkmarkfilled16_props = {};

    	for (let i = 0; i < checkmarkfilled16_spread_levels.length; i += 1) {
    		checkmarkfilled16_props = assign(checkmarkfilled16_props, checkmarkfilled16_spread_levels[i]);
    	}

    	checkmarkfilled16 = new CheckmarkFilled16$1({
    			props: checkmarkfilled16_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(checkmarkfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkmarkfilled16, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkmarkfilled16_changes = (dirty & /*iconDescription, $$restProps*/ 10)
    			? get_spread_update(checkmarkfilled16_spread_levels, [
    					dirty & /*iconDescription*/ 2 && { "aria-label": /*iconDescription*/ ctx[1] },
    					dirty & /*iconDescription*/ 2 && { title: /*iconDescription*/ ctx[1] },
    					checkmarkfilled16_spread_levels[2],
    					dirty & /*$$restProps*/ 8 && get_spread_object(/*$$restProps*/ ctx[3])
    				])
    			: {};

    			checkmarkfilled16.$set(checkmarkfilled16_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkmarkfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkmarkfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkmarkfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(43:0) {#if status === \\\"complete\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = /*status*/ ctx[0] === "uploading" && create_if_block_3$2(ctx);
    	let if_block1 = /*status*/ ctx[0] === "edit" && create_if_block_1$3(ctx);
    	let if_block2 = /*status*/ ctx[0] === "complete" && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*status*/ ctx[0] === "uploading") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*status*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*status*/ ctx[0] === "edit") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*status*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*status*/ ctx[0] === "complete") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*status*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	const omit_props_names = ["status","iconDescription","invalid"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Filename', slots, []);
    	let { status = "uploading" } = $$props;
    	let { iconDescription = "" } = $$props;
    	let { invalid = false } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('status' in $$new_props) $$invalidate(0, status = $$new_props.status);
    		if ('iconDescription' in $$new_props) $$invalidate(1, iconDescription = $$new_props.iconDescription);
    		if ('invalid' in $$new_props) $$invalidate(2, invalid = $$new_props.invalid);
    	};

    	$$self.$capture_state = () => ({
    		status,
    		iconDescription,
    		invalid,
    		Close16: Close16$1,
    		CheckmarkFilled16: CheckmarkFilled16$1,
    		WarningFilled16: WarningFilled16$1,
    		Loading: Loading$1
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('status' in $$props) $$invalidate(0, status = $$new_props.status);
    		if ('iconDescription' in $$props) $$invalidate(1, iconDescription = $$new_props.iconDescription);
    		if ('invalid' in $$props) $$invalidate(2, invalid = $$new_props.invalid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [status, iconDescription, invalid, $$restProps, click_handler, keydown_handler];
    }

    class Filename extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			status: 0,
    			iconDescription: 1,
    			invalid: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filename",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get status() {
    		throw new Error("<Filename>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<Filename>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconDescription() {
    		throw new Error("<Filename>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconDescription(value) {
    		throw new Error("<Filename>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Filename>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Filename>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Filename$1 = Filename;

    /* node_modules/carbon-components-svelte/src/FileUploader/FileUploaderButton.svelte generated by Svelte v3.46.4 */
    const file$a = "node_modules/carbon-components-svelte/src/FileUploader/FileUploaderButton.svelte";
    const get_labelText_slot_changes$3 = dirty => ({});
    const get_labelText_slot_context$3 = ctx => ({});

    // (79:27)        
    function fallback_block$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelText*/ 4) set_data_dev(t, /*labelText*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$4.name,
    		type: "fallback",
    		source: "(79:27)        ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let label;
    	let span;
    	let label_tabindex_value;
    	let label_class_value;
    	let t;
    	let input;
    	let current;
    	let mounted;
    	let dispose;
    	const labelText_slot_template = /*#slots*/ ctx[15].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[14], get_labelText_slot_context$3);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block$4(ctx);

    	let input_levels = [
    		{ type: "file" },
    		{ tabindex: "-1" },
    		{ accept: /*accept*/ ctx[3] },
    		{ disabled: /*disabled*/ ctx[5] },
    		{ id: /*id*/ ctx[10] },
    		{ multiple: /*multiple*/ ctx[4] },
    		{ name: /*name*/ ctx[11] },
    		/*$$restProps*/ ctx[13]
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			span = element("span");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			t = space();
    			input = element("input");
    			attr_dev(span, "role", /*role*/ ctx[8]);
    			add_location(span, file$a, 77, 2, 1696);
    			attr_dev(label, "aria-disabled", /*disabled*/ ctx[5]);
    			attr_dev(label, "for", /*id*/ ctx[10]);
    			attr_dev(label, "tabindex", label_tabindex_value = /*disabled*/ ctx[5] ? '-1' : /*tabindex*/ ctx[9]);
    			attr_dev(label, "class", label_class_value = /*kind*/ ctx[7] && `bx--btn--${/*kind*/ ctx[7]}`);
    			toggle_class(label, "bx--btn", true);
    			toggle_class(label, "bx--btn--sm", true);
    			toggle_class(label, "bx--btn--disabled", /*disabled*/ ctx[5]);
    			add_location(label, file$a, 62, 0, 1353);
    			set_attributes(input, input_data);
    			toggle_class(input, "bx--visually-hidden", true);
    			add_location(input, file$a, 83, 0, 1794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, span);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(span, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, input, anchor);
    			if (input.autofocus) input.focus();
    			/*input_binding*/ ctx[19](input);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(label, "keydown", /*keydown_handler*/ ctx[17], false, false, false),
    					listen_dev(label, "keydown", /*keydown_handler_1*/ ctx[18], false, false, false),
    					listen_dev(input, "change", stop_propagation(/*change_handler*/ ctx[20]), false, false, true),
    					listen_dev(input, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(input, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[14], dirty, get_labelText_slot_changes$3),
    						get_labelText_slot_context$3
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty & /*labelText*/ 4)) {
    					labelText_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (!current || dirty & /*role*/ 256) {
    				attr_dev(span, "role", /*role*/ ctx[8]);
    			}

    			if (!current || dirty & /*disabled*/ 32) {
    				attr_dev(label, "aria-disabled", /*disabled*/ ctx[5]);
    			}

    			if (!current || dirty & /*id*/ 1024) {
    				attr_dev(label, "for", /*id*/ ctx[10]);
    			}

    			if (!current || dirty & /*disabled, tabindex*/ 544 && label_tabindex_value !== (label_tabindex_value = /*disabled*/ ctx[5] ? '-1' : /*tabindex*/ ctx[9])) {
    				attr_dev(label, "tabindex", label_tabindex_value);
    			}

    			if (!current || dirty & /*kind*/ 128 && label_class_value !== (label_class_value = /*kind*/ ctx[7] && `bx--btn--${/*kind*/ ctx[7]}`)) {
    				attr_dev(label, "class", label_class_value);
    			}

    			if (dirty & /*kind*/ 128) {
    				toggle_class(label, "bx--btn", true);
    			}

    			if (dirty & /*kind*/ 128) {
    				toggle_class(label, "bx--btn--sm", true);
    			}

    			if (dirty & /*kind, disabled*/ 160) {
    				toggle_class(label, "bx--btn--disabled", /*disabled*/ ctx[5]);
    			}

    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				{ type: "file" },
    				{ tabindex: "-1" },
    				(!current || dirty & /*accept*/ 8) && { accept: /*accept*/ ctx[3] },
    				(!current || dirty & /*disabled*/ 32) && { disabled: /*disabled*/ ctx[5] },
    				(!current || dirty & /*id*/ 1024) && { id: /*id*/ ctx[10] },
    				(!current || dirty & /*multiple*/ 16) && { multiple: /*multiple*/ ctx[4] },
    				(!current || dirty & /*name*/ 2048) && { name: /*name*/ ctx[11] },
    				dirty & /*$$restProps*/ 8192 && /*$$restProps*/ ctx[13]
    			]));

    			toggle_class(input, "bx--visually-hidden", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[19](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const click_handler_1 = ({ target }) => {
    	target.value = null;
    };

    function instance$c($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"accept","files","multiple","disabled","disableLabelChanges","kind","labelText","role","tabindex","id","name","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FileUploaderButton', slots, ['labelText']);
    	let { accept = [] } = $$props;
    	let { files = [] } = $$props;
    	let { multiple = false } = $$props;
    	let { disabled = false } = $$props;
    	let { disableLabelChanges = false } = $$props;
    	let { kind = "primary" } = $$props;
    	let { labelText = "Add file" } = $$props;
    	let { role = "button" } = $$props;
    	let { tabindex = "0" } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { name = "" } = $$props;
    	let { ref = null } = $$props;
    	const dispatch = createEventDispatcher();
    	let initialLabelText = labelText;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const keydown_handler_1 = ({ key }) => {
    		if (key === ' ' || key === 'Enter') {
    			ref.click();
    		}
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			(($$invalidate(1, ref), $$invalidate(0, files)), $$invalidate(21, initialLabelText));
    		});
    	}

    	const change_handler = ({ target }) => {
    		$$invalidate(0, files = [...target.files]);

    		if (files && !disableLabelChanges) {
    			$$invalidate(2, labelText = files.length > 1
    			? `${files.length} files`
    			: files[0].name);
    		}

    		dispatch('change', files);
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(13, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('accept' in $$new_props) $$invalidate(3, accept = $$new_props.accept);
    		if ('files' in $$new_props) $$invalidate(0, files = $$new_props.files);
    		if ('multiple' in $$new_props) $$invalidate(4, multiple = $$new_props.multiple);
    		if ('disabled' in $$new_props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('disableLabelChanges' in $$new_props) $$invalidate(6, disableLabelChanges = $$new_props.disableLabelChanges);
    		if ('kind' in $$new_props) $$invalidate(7, kind = $$new_props.kind);
    		if ('labelText' in $$new_props) $$invalidate(2, labelText = $$new_props.labelText);
    		if ('role' in $$new_props) $$invalidate(8, role = $$new_props.role);
    		if ('tabindex' in $$new_props) $$invalidate(9, tabindex = $$new_props.tabindex);
    		if ('id' in $$new_props) $$invalidate(10, id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate(11, name = $$new_props.name);
    		if ('ref' in $$new_props) $$invalidate(1, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		accept,
    		files,
    		multiple,
    		disabled,
    		disableLabelChanges,
    		kind,
    		labelText,
    		role,
    		tabindex,
    		id,
    		name,
    		ref,
    		createEventDispatcher,
    		dispatch,
    		initialLabelText
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('accept' in $$props) $$invalidate(3, accept = $$new_props.accept);
    		if ('files' in $$props) $$invalidate(0, files = $$new_props.files);
    		if ('multiple' in $$props) $$invalidate(4, multiple = $$new_props.multiple);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('disableLabelChanges' in $$props) $$invalidate(6, disableLabelChanges = $$new_props.disableLabelChanges);
    		if ('kind' in $$props) $$invalidate(7, kind = $$new_props.kind);
    		if ('labelText' in $$props) $$invalidate(2, labelText = $$new_props.labelText);
    		if ('role' in $$props) $$invalidate(8, role = $$new_props.role);
    		if ('tabindex' in $$props) $$invalidate(9, tabindex = $$new_props.tabindex);
    		if ('id' in $$props) $$invalidate(10, id = $$new_props.id);
    		if ('name' in $$props) $$invalidate(11, name = $$new_props.name);
    		if ('ref' in $$props) $$invalidate(1, ref = $$new_props.ref);
    		if ('initialLabelText' in $$props) $$invalidate(21, initialLabelText = $$new_props.initialLabelText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ref, files*/ 3) {
    			if (ref && files.length === 0) {
    				$$invalidate(2, labelText = initialLabelText);
    				$$invalidate(1, ref.value = null, ref);
    			}
    		}
    	};

    	return [
    		files,
    		ref,
    		labelText,
    		accept,
    		multiple,
    		disabled,
    		disableLabelChanges,
    		kind,
    		role,
    		tabindex,
    		id,
    		name,
    		dispatch,
    		$$restProps,
    		$$scope,
    		slots,
    		click_handler,
    		keydown_handler,
    		keydown_handler_1,
    		input_binding,
    		change_handler
    	];
    }

    class FileUploaderButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			accept: 3,
    			files: 0,
    			multiple: 4,
    			disabled: 5,
    			disableLabelChanges: 6,
    			kind: 7,
    			labelText: 2,
    			role: 8,
    			tabindex: 9,
    			id: 10,
    			name: 11,
    			ref: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileUploaderButton",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get accept() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accept(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableLabelChanges() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableLabelChanges(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get kind() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<FileUploaderButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<FileUploaderButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var FileUploaderButton$1 = FileUploaderButton;

    /* node_modules/carbon-components-svelte/src/FileUploader/FileUploader.svelte generated by Svelte v3.46.4 */
    const file$9 = "node_modules/carbon-components-svelte/src/FileUploader/FileUploader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i].name;
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (131:4) {#each files as { name }
    function create_each_block$1(ctx) {
    	let span1;
    	let p;
    	let t0_value = /*name*/ ctx[10] + "";
    	let t0;
    	let t1;
    	let span0;
    	let filename;
    	let t2;
    	let current;

    	function keydown_handler_1(...args) {
    		return /*keydown_handler_1*/ ctx[20](/*i*/ ctx[27], ...args);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[22](/*i*/ ctx[27]);
    	}

    	filename = new Filename$1({
    			props: {
    				iconDescription: /*iconDescription*/ ctx[9],
    				status: /*status*/ ctx[1]
    			},
    			$$inline: true
    		});

    	filename.$on("keydown", /*keydown_handler*/ ctx[19]);
    	filename.$on("keydown", keydown_handler_1);
    	filename.$on("click", /*click_handler_1*/ ctx[21]);
    	filename.$on("click", click_handler_2);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			span0 = element("span");
    			create_component(filename.$$.fragment);
    			t2 = space();
    			toggle_class(p, "bx--file-filename", true);
    			add_location(p, file$9, 132, 8, 3109);
    			toggle_class(span0, "bx--file__state-container", true);
    			add_location(span0, file$9, 133, 8, 3164);
    			toggle_class(span1, "bx--file__selected-file", true);
    			add_location(span1, file$9, 131, 6, 3055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, p);
    			append_dev(p, t0);
    			append_dev(span1, t1);
    			append_dev(span1, span0);
    			mount_component(filename, span0, null);
    			append_dev(span1, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*files*/ 1) && t0_value !== (t0_value = /*name*/ ctx[10] + "")) set_data_dev(t0, t0_value);
    			const filename_changes = {};
    			if (dirty & /*iconDescription*/ 512) filename_changes.iconDescription = /*iconDescription*/ ctx[9];
    			if (dirty & /*status*/ 2) filename_changes.status = /*status*/ ctx[1];
    			filename.$set(filename_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(filename.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(filename.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			destroy_component(filename);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(131:4) {#each files as { name }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let fileuploaderbutton;
    	let t4;
    	let div0;
    	let current;
    	let mounted;
    	let dispose;

    	fileuploaderbutton = new FileUploaderButton$1({
    			props: {
    				disabled: /*disabled*/ ctx[2],
    				disableLabelChanges: true,
    				labelText: /*buttonLabel*/ ctx[8],
    				accept: /*accept*/ ctx[3],
    				name: /*name*/ ctx[10],
    				multiple: /*multiple*/ ctx[4],
    				kind: /*kind*/ ctx[7]
    			},
    			$$inline: true
    		});

    	fileuploaderbutton.$on("change", /*change_handler*/ ctx[17]);
    	fileuploaderbutton.$on("change", /*change_handler_1*/ ctx[18]);
    	let each_value = /*files*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let div1_levels = [/*$$restProps*/ ctx[11]];
    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			t0 = text(/*labelTitle*/ ctx[6]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*labelDescription*/ ctx[5]);
    			t3 = space();
    			create_component(fileuploaderbutton.$$.fragment);
    			t4 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			toggle_class(p0, "bx--file--label", true);
    			toggle_class(p0, "bx--label-description--disabled", /*disabled*/ ctx[2]);
    			add_location(p0, file$9, 104, 2, 2456);
    			toggle_class(p1, "bx--label-description", true);
    			toggle_class(p1, "bx--label-description--disabled", /*disabled*/ ctx[2]);
    			add_location(p1, file$9, 110, 2, 2579);
    			toggle_class(div0, "bx--file-container", true);
    			add_location(div0, file$9, 129, 2, 2976);
    			set_attributes(div1, div1_data);
    			toggle_class(div1, "bx--form-item", true);
    			add_location(div1, file$9, 96, 0, 2339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			append_dev(p0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, p1);
    			append_dev(p1, t2);
    			append_dev(div1, t3);
    			mount_component(fileuploaderbutton, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(div1, "mouseover", /*mouseover_handler*/ ctx[14], false, false, false),
    					listen_dev(div1, "mouseenter", /*mouseenter_handler*/ ctx[15], false, false, false),
    					listen_dev(div1, "mouseleave", /*mouseleave_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*labelTitle*/ 64) set_data_dev(t0, /*labelTitle*/ ctx[6]);

    			if (dirty & /*disabled*/ 4) {
    				toggle_class(p0, "bx--label-description--disabled", /*disabled*/ ctx[2]);
    			}

    			if (!current || dirty & /*labelDescription*/ 32) set_data_dev(t2, /*labelDescription*/ ctx[5]);

    			if (dirty & /*disabled*/ 4) {
    				toggle_class(p1, "bx--label-description--disabled", /*disabled*/ ctx[2]);
    			}

    			const fileuploaderbutton_changes = {};
    			if (dirty & /*disabled*/ 4) fileuploaderbutton_changes.disabled = /*disabled*/ ctx[2];
    			if (dirty & /*buttonLabel*/ 256) fileuploaderbutton_changes.labelText = /*buttonLabel*/ ctx[8];
    			if (dirty & /*accept*/ 8) fileuploaderbutton_changes.accept = /*accept*/ ctx[3];
    			if (dirty & /*name*/ 1024) fileuploaderbutton_changes.name = /*name*/ ctx[10];
    			if (dirty & /*multiple*/ 16) fileuploaderbutton_changes.multiple = /*multiple*/ ctx[4];
    			if (dirty & /*kind*/ 128) fileuploaderbutton_changes.kind = /*kind*/ ctx[7];
    			fileuploaderbutton.$set(fileuploaderbutton_changes);

    			if (dirty & /*iconDescription, status, files*/ 515) {
    				each_value = /*files*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			set_attributes(div1, div1_data = get_spread_update(div1_levels, [dirty & /*$$restProps*/ 2048 && /*$$restProps*/ ctx[11]]));
    			toggle_class(div1, "bx--form-item", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fileuploaderbutton.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fileuploaderbutton.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(fileuploaderbutton);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"status","disabled","accept","files","multiple","clearFiles","labelDescription","labelTitle","kind","buttonLabel","iconDescription","name"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FileUploader', slots, []);
    	let { status = "uploading" } = $$props;
    	let { disabled = false } = $$props;
    	let { accept = [] } = $$props;
    	let { files = [] } = $$props;
    	let { multiple = false } = $$props;

    	const clearFiles = () => {
    		$$invalidate(0, files = []);
    	};

    	let { labelDescription = "" } = $$props;
    	let { labelTitle = "" } = $$props;
    	let { kind = "primary" } = $$props;
    	let { buttonLabel = "" } = $$props;
    	let { iconDescription = "Provide icon description" } = $$props;
    	let { name = "" } = $$props;
    	const dispatch = createEventDispatcher();
    	let prevFiles = [];

    	/** @type {(file: File) => string} */
    	const getFileId = file => file.lastModified + file.name;

    	afterUpdate(() => {
    		const fileIds = files.map(getFileId);
    		const prevFileIds = prevFiles.map(getFileId);
    		const addedIds = fileIds.filter(_ => !prevFileIds.includes(_));
    		const removedIds = prevFileIds.filter(_ => !fileIds.includes(_));

    		if (addedIds.length > 0) {
    			dispatch("add", addedIds.map(id => files.find(file => id === getFileId(file))));
    		}

    		if (removedIds.length > 0) {
    			dispatch("remove", removedIds.map(id => prevFiles.find(file => id === getFileId(file))));
    		}

    		prevFiles = [...files];
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const change_handler_1 = e => {
    		$$invalidate(0, files = e.detail);
    	};

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const keydown_handler_1 = (i, { key }) => {
    		if (key === ' ' || key === 'Enter') {
    			$$invalidate(0, files = files.filter((_, index) => index !== i));
    		}
    	};

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_2 = i => {
    		$$invalidate(0, files = files.filter((_, index) => index !== i));
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('status' in $$new_props) $$invalidate(1, status = $$new_props.status);
    		if ('disabled' in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ('accept' in $$new_props) $$invalidate(3, accept = $$new_props.accept);
    		if ('files' in $$new_props) $$invalidate(0, files = $$new_props.files);
    		if ('multiple' in $$new_props) $$invalidate(4, multiple = $$new_props.multiple);
    		if ('labelDescription' in $$new_props) $$invalidate(5, labelDescription = $$new_props.labelDescription);
    		if ('labelTitle' in $$new_props) $$invalidate(6, labelTitle = $$new_props.labelTitle);
    		if ('kind' in $$new_props) $$invalidate(7, kind = $$new_props.kind);
    		if ('buttonLabel' in $$new_props) $$invalidate(8, buttonLabel = $$new_props.buttonLabel);
    		if ('iconDescription' in $$new_props) $$invalidate(9, iconDescription = $$new_props.iconDescription);
    		if ('name' in $$new_props) $$invalidate(10, name = $$new_props.name);
    	};

    	$$self.$capture_state = () => ({
    		status,
    		disabled,
    		accept,
    		files,
    		multiple,
    		clearFiles,
    		labelDescription,
    		labelTitle,
    		kind,
    		buttonLabel,
    		iconDescription,
    		name,
    		createEventDispatcher,
    		afterUpdate,
    		Filename: Filename$1,
    		FileUploaderButton: FileUploaderButton$1,
    		dispatch,
    		prevFiles,
    		getFileId
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('status' in $$props) $$invalidate(1, status = $$new_props.status);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ('accept' in $$props) $$invalidate(3, accept = $$new_props.accept);
    		if ('files' in $$props) $$invalidate(0, files = $$new_props.files);
    		if ('multiple' in $$props) $$invalidate(4, multiple = $$new_props.multiple);
    		if ('labelDescription' in $$props) $$invalidate(5, labelDescription = $$new_props.labelDescription);
    		if ('labelTitle' in $$props) $$invalidate(6, labelTitle = $$new_props.labelTitle);
    		if ('kind' in $$props) $$invalidate(7, kind = $$new_props.kind);
    		if ('buttonLabel' in $$props) $$invalidate(8, buttonLabel = $$new_props.buttonLabel);
    		if ('iconDescription' in $$props) $$invalidate(9, iconDescription = $$new_props.iconDescription);
    		if ('name' in $$props) $$invalidate(10, name = $$new_props.name);
    		if ('prevFiles' in $$props) prevFiles = $$new_props.prevFiles;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		files,
    		status,
    		disabled,
    		accept,
    		multiple,
    		labelDescription,
    		labelTitle,
    		kind,
    		buttonLabel,
    		iconDescription,
    		name,
    		$$restProps,
    		clearFiles,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		change_handler,
    		change_handler_1,
    		keydown_handler,
    		keydown_handler_1,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class FileUploader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			status: 1,
    			disabled: 2,
    			accept: 3,
    			files: 0,
    			multiple: 4,
    			clearFiles: 12,
    			labelDescription: 5,
    			labelTitle: 6,
    			kind: 7,
    			buttonLabel: 8,
    			iconDescription: 9,
    			name: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileUploader",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get status() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accept() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accept(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearFiles() {
    		return this.$$.ctx[12];
    	}

    	set clearFiles(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelDescription() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelDescription(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelTitle() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelTitle(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get kind() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get buttonLabel() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonLabel(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconDescription() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconDescription(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<FileUploader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<FileUploader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var FileUploader$1 = FileUploader;

    /* node_modules/carbon-components-svelte/src/Grid/Grid.svelte generated by Svelte v3.46.4 */

    const file$8 = "node_modules/carbon-components-svelte/src/Grid/Grid.svelte";
    const get_default_slot_changes$3 = dirty => ({ props: dirty & /*props*/ 2 });
    const get_default_slot_context$3 = ctx => ({ props: /*props*/ ctx[1] });

    // (54:0) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	let div_levels = [/*props*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$8, 54, 2, 1398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*props*/ 2 && /*props*/ ctx[1]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(54:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:0) {#if as}
    function create_if_block$6(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context$3);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, props*/ 514)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, get_default_slot_changes$3),
    						get_default_slot_context$3
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(52:0) {#if as}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*as*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let props;

    	const omit_props_names = [
    		"as","condensed","narrow","fullWidth","noGutter","noGutterLeft","noGutterRight","padding"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Grid', slots, ['default']);
    	let { as = false } = $$props;
    	let { condensed = false } = $$props;
    	let { narrow = false } = $$props;
    	let { fullWidth = false } = $$props;
    	let { noGutter = false } = $$props;
    	let { noGutterLeft = false } = $$props;
    	let { noGutterRight = false } = $$props;
    	let { padding = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('as' in $$new_props) $$invalidate(0, as = $$new_props.as);
    		if ('condensed' in $$new_props) $$invalidate(2, condensed = $$new_props.condensed);
    		if ('narrow' in $$new_props) $$invalidate(3, narrow = $$new_props.narrow);
    		if ('fullWidth' in $$new_props) $$invalidate(4, fullWidth = $$new_props.fullWidth);
    		if ('noGutter' in $$new_props) $$invalidate(5, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$new_props) $$invalidate(6, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$new_props) $$invalidate(7, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$new_props) $$invalidate(8, padding = $$new_props.padding);
    		if ('$$scope' in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		as,
    		condensed,
    		narrow,
    		fullWidth,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('as' in $$props) $$invalidate(0, as = $$new_props.as);
    		if ('condensed' in $$props) $$invalidate(2, condensed = $$new_props.condensed);
    		if ('narrow' in $$props) $$invalidate(3, narrow = $$new_props.narrow);
    		if ('fullWidth' in $$props) $$invalidate(4, fullWidth = $$new_props.fullWidth);
    		if ('noGutter' in $$props) $$invalidate(5, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$props) $$invalidate(6, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$props) $$invalidate(7, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$props) $$invalidate(8, padding = $$new_props.padding);
    		if ('props' in $$props) $$invalidate(1, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(1, props = {
    			...$$restProps,
    			class: [
    				$$restProps.class,
    				"bx--grid",
    				condensed && "bx--grid--condensed",
    				narrow && "bx--grid--narrow",
    				fullWidth && "bx--grid--full-width",
    				noGutter && "bx--no-gutter",
    				noGutterLeft && "bx--no-gutter--left",
    				noGutterRight && "bx--no-gutter--right",
    				padding && "bx--row-padding"
    			].filter(Boolean).join(" ")
    		});
    	};

    	return [
    		as,
    		props,
    		condensed,
    		narrow,
    		fullWidth,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		$$scope,
    		slots
    	];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			as: 0,
    			condensed: 2,
    			narrow: 3,
    			fullWidth: 4,
    			noGutter: 5,
    			noGutterLeft: 6,
    			noGutterRight: 7,
    			padding: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get as() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set as(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get condensed() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set condensed(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get narrow() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set narrow(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fullWidth() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fullWidth(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutter() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutter(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterLeft() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterLeft(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterRight() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterRight(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Grid$1 = Grid;

    /* node_modules/carbon-components-svelte/src/Grid/Row.svelte generated by Svelte v3.46.4 */

    const file$7 = "node_modules/carbon-components-svelte/src/Grid/Row.svelte";
    const get_default_slot_changes$2 = dirty => ({ props: dirty & /*props*/ 2 });
    const get_default_slot_context$2 = ctx => ({ props: /*props*/ ctx[1] });

    // (50:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let div_levels = [/*props*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$7, 50, 2, 1267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*props*/ 2 && /*props*/ ctx[1]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(50:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:0) {#if as}
    function create_if_block$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$2);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, props*/ 258)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$2),
    						get_default_slot_context$2
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(48:0) {#if as}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*as*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let props;
    	const omit_props_names = ["as","condensed","narrow","noGutter","noGutterLeft","noGutterRight","padding"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Row', slots, ['default']);
    	let { as = false } = $$props;
    	let { condensed = false } = $$props;
    	let { narrow = false } = $$props;
    	let { noGutter = false } = $$props;
    	let { noGutterLeft = false } = $$props;
    	let { noGutterRight = false } = $$props;
    	let { padding = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(10, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('as' in $$new_props) $$invalidate(0, as = $$new_props.as);
    		if ('condensed' in $$new_props) $$invalidate(2, condensed = $$new_props.condensed);
    		if ('narrow' in $$new_props) $$invalidate(3, narrow = $$new_props.narrow);
    		if ('noGutter' in $$new_props) $$invalidate(4, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$new_props) $$invalidate(5, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$new_props) $$invalidate(6, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$new_props) $$invalidate(7, padding = $$new_props.padding);
    		if ('$$scope' in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		as,
    		condensed,
    		narrow,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('as' in $$props) $$invalidate(0, as = $$new_props.as);
    		if ('condensed' in $$props) $$invalidate(2, condensed = $$new_props.condensed);
    		if ('narrow' in $$props) $$invalidate(3, narrow = $$new_props.narrow);
    		if ('noGutter' in $$props) $$invalidate(4, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$props) $$invalidate(5, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$props) $$invalidate(6, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$props) $$invalidate(7, padding = $$new_props.padding);
    		if ('props' in $$props) $$invalidate(1, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(1, props = {
    			...$$restProps,
    			class: [
    				$$restProps.class,
    				"bx--row",
    				condensed && "bx--row--condensed",
    				narrow && "bx--row--narrow",
    				noGutter && "bx--no-gutter",
    				noGutterLeft && "bx--no-gutter--left",
    				noGutterRight && "bx--no-gutter--right",
    				padding && "bx--row-padding"
    			].filter(Boolean).join(" ")
    		});
    	};

    	return [
    		as,
    		props,
    		condensed,
    		narrow,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		$$scope,
    		slots
    	];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			as: 0,
    			condensed: 2,
    			narrow: 3,
    			noGutter: 4,
    			noGutterLeft: 5,
    			noGutterRight: 6,
    			padding: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get as() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set as(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get condensed() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set condensed(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get narrow() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set narrow(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutter() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutter(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterLeft() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterLeft(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterRight() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterRight(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Row$1 = Row;

    /* node_modules/carbon-components-svelte/src/Grid/Column.svelte generated by Svelte v3.46.4 */

    const file$6 = "node_modules/carbon-components-svelte/src/Grid/Column.svelte";
    const get_default_slot_changes$1 = dirty => ({ props: dirty & /*props*/ 2 });
    const get_default_slot_context$1 = ctx => ({ props: /*props*/ ctx[1] });

    // (115:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);
    	let div_levels = [/*props*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$6, 115, 2, 2896);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[13],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*props*/ 2 && /*props*/ ctx[1]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(115:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (113:0) {#if as}
    function create_if_block$4(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, props*/ 8194)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[13],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, get_default_slot_changes$1),
    						get_default_slot_context$1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(113:0) {#if as}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*as*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let columnClass;
    	let props;

    	const omit_props_names = [
    		"as","noGutter","noGutterLeft","noGutterRight","padding","aspectRatio","sm","md","lg","xlg","max"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Column', slots, ['default']);
    	let { as = false } = $$props;
    	let { noGutter = false } = $$props;
    	let { noGutterLeft = false } = $$props;
    	let { noGutterRight = false } = $$props;
    	let { padding = false } = $$props;
    	let { aspectRatio = undefined } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xlg = undefined } = $$props;
    	let { max = undefined } = $$props;
    	const breakpoints = ["sm", "md", "lg", "xlg", "max"];

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(16, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('as' in $$new_props) $$invalidate(0, as = $$new_props.as);
    		if ('noGutter' in $$new_props) $$invalidate(2, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$new_props) $$invalidate(3, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$new_props) $$invalidate(4, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$new_props) $$invalidate(5, padding = $$new_props.padding);
    		if ('aspectRatio' in $$new_props) $$invalidate(6, aspectRatio = $$new_props.aspectRatio);
    		if ('sm' in $$new_props) $$invalidate(7, sm = $$new_props.sm);
    		if ('md' in $$new_props) $$invalidate(8, md = $$new_props.md);
    		if ('lg' in $$new_props) $$invalidate(9, lg = $$new_props.lg);
    		if ('xlg' in $$new_props) $$invalidate(10, xlg = $$new_props.xlg);
    		if ('max' in $$new_props) $$invalidate(11, max = $$new_props.max);
    		if ('$$scope' in $$new_props) $$invalidate(13, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		as,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		aspectRatio,
    		sm,
    		md,
    		lg,
    		xlg,
    		max,
    		breakpoints,
    		columnClass,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('as' in $$props) $$invalidate(0, as = $$new_props.as);
    		if ('noGutter' in $$props) $$invalidate(2, noGutter = $$new_props.noGutter);
    		if ('noGutterLeft' in $$props) $$invalidate(3, noGutterLeft = $$new_props.noGutterLeft);
    		if ('noGutterRight' in $$props) $$invalidate(4, noGutterRight = $$new_props.noGutterRight);
    		if ('padding' in $$props) $$invalidate(5, padding = $$new_props.padding);
    		if ('aspectRatio' in $$props) $$invalidate(6, aspectRatio = $$new_props.aspectRatio);
    		if ('sm' in $$props) $$invalidate(7, sm = $$new_props.sm);
    		if ('md' in $$props) $$invalidate(8, md = $$new_props.md);
    		if ('lg' in $$props) $$invalidate(9, lg = $$new_props.lg);
    		if ('xlg' in $$props) $$invalidate(10, xlg = $$new_props.xlg);
    		if ('max' in $$props) $$invalidate(11, max = $$new_props.max);
    		if ('columnClass' in $$props) $$invalidate(12, columnClass = $$new_props.columnClass);
    		if ('props' in $$props) $$invalidate(1, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sm, md, lg, xlg, max*/ 3968) {
    			$$invalidate(12, columnClass = [sm, md, lg, xlg, max].map((breakpoint, i) => {
    				const name = breakpoints[i];

    				if (breakpoint === true) {
    					return `bx--col-${name}`;
    				} else if (typeof breakpoint === "number") {
    					return `bx--col-${name}-${breakpoint}`;
    				} else if (typeof breakpoint === "object") {
    					let bp = [];

    					if (typeof breakpoint.span === "number") {
    						bp = [...bp, `bx--col-${name}-${breakpoint.span}`];
    					} else if (breakpoint.span === true) {
    						bp = [...bp, `bx--col-${name}`];
    					}

    					if (typeof breakpoint.offset === "number") {
    						bp = [...bp, `bx--offset-${name}-${breakpoint.offset}`];
    					}

    					return bp.join(" ");
    				}
    			}).filter(Boolean).join(" "));
    		}

    		$$invalidate(1, props = {
    			...$$restProps,
    			class: [
    				$$restProps.class,
    				columnClass,
    				!columnClass && "bx--col",
    				noGutter && "bx--no-gutter",
    				noGutterLeft && "bx--no-gutter--left",
    				noGutterRight && "bx--no-gutter--right",
    				aspectRatio && `bx--aspect-ratio bx--aspect-ratio--${aspectRatio}`,
    				padding && "bx--col-padding"
    			].filter(Boolean).join(" ")
    		});
    	};

    	return [
    		as,
    		props,
    		noGutter,
    		noGutterLeft,
    		noGutterRight,
    		padding,
    		aspectRatio,
    		sm,
    		md,
    		lg,
    		xlg,
    		max,
    		columnClass,
    		$$scope,
    		slots
    	];
    }

    class Column extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			as: 0,
    			noGutter: 2,
    			noGutterLeft: 3,
    			noGutterRight: 4,
    			padding: 5,
    			aspectRatio: 6,
    			sm: 7,
    			md: 8,
    			lg: 9,
    			xlg: 10,
    			max: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Column",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get as() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set as(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutter() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutter(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterLeft() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterLeft(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutterRight() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutterRight(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get aspectRatio() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aspectRatio(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xlg() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xlg(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Column$1 = Column;

    /* node_modules/carbon-components-svelte/src/LocalStorage/LocalStorage.svelte generated by Svelte v3.46.4 */

    function create_fragment$7(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function clearAll() {
    	localStorage.clear();
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LocalStorage', slots, []);
    	let { key = "local-storage-key" } = $$props;
    	let { value = "" } = $$props;

    	function clearItem() {
    		localStorage.removeItem(key);
    	}

    	const dispatch = createEventDispatcher();
    	let prevValue = value;

    	function setItem() {
    		if (typeof value === "object") {
    			localStorage.setItem(key, JSON.stringify(value));
    		} else {
    			localStorage.setItem(key, value);
    		}
    	}

    	onMount(() => {
    		const item = localStorage.getItem(key);

    		if (item != null) {
    			try {
    				$$invalidate(0, value = JSON.parse(item));
    			} catch(e) {
    				$$invalidate(0, value = item);
    			}
    		} else {
    			setItem();
    			dispatch("save");
    		}
    	});

    	afterUpdate(() => {
    		if (prevValue !== value) {
    			setItem();
    			dispatch("update", { prevValue, value });
    		}

    		prevValue = value;
    	});

    	const writable_props = ['key', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LocalStorage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		key,
    		value,
    		clearItem,
    		clearAll,
    		onMount,
    		afterUpdate,
    		createEventDispatcher,
    		dispatch,
    		prevValue,
    		setItem
    	});

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('prevValue' in $$props) prevValue = $$props.prevValue;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, key, clearItem, clearAll];
    }

    class LocalStorage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			key: 1,
    			value: 0,
    			clearItem: 2,
    			clearAll: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LocalStorage",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get key() {
    		throw new Error("<LocalStorage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<LocalStorage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<LocalStorage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<LocalStorage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearItem() {
    		return this.$$.ctx[2];
    	}

    	set clearItem(value) {
    		throw new Error("<LocalStorage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearAll() {
    		return clearAll;
    	}

    	set clearAll(value) {
    		throw new Error("<LocalStorage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var LocalStorage$1 = LocalStorage;

    /* node_modules/carbon-components-svelte/src/Select/Select.svelte generated by Svelte v3.46.4 */
    const file$5 = "node_modules/carbon-components-svelte/src/Select/Select.svelte";
    const get_labelText_slot_changes$2 = dirty => ({});
    const get_labelText_slot_context$2 = ctx => ({});

    // (95:4) {#if !noLabel}
    function create_if_block_10(ctx) {
    	let label;
    	let current;
    	const labelText_slot_template = /*#slots*/ ctx[21].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[20], get_labelText_slot_context$2);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block$3(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			attr_dev(label, "for", /*id*/ ctx[5]);
    			toggle_class(label, "bx--label", true);
    			toggle_class(label, "bx--visually-hidden", /*hideLabel*/ ctx[14]);
    			toggle_class(label, "bx--label--disabled", /*disabled*/ ctx[4]);
    			add_location(label, file$5, 95, 6, 2426);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(label, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty[0] & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[20],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[20])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[20], dirty, get_labelText_slot_changes$2),
    						get_labelText_slot_context$2
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty[0] & /*labelText*/ 8192)) {
    					labelText_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*id*/ 32) {
    				attr_dev(label, "for", /*id*/ ctx[5]);
    			}

    			if (dirty[0] & /*hideLabel*/ 16384) {
    				toggle_class(label, "bx--visually-hidden", /*hideLabel*/ ctx[14]);
    			}

    			if (dirty[0] & /*disabled*/ 16) {
    				toggle_class(label, "bx--label--disabled", /*disabled*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(95:4) {#if !noLabel}",
    		ctx
    	});

    	return block;
    }

    // (102:31)            
    function fallback_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[13]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*labelText*/ 8192) set_data_dev(t, /*labelText*/ ctx[13]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$3.name,
    		type: "fallback",
    		source: "(102:31)            ",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#if inline}
    function create_if_block_6(ctx) {
    	let div1;
    	let div0;
    	let select;
    	let select_aria_describedby_value;
    	let select_aria_invalid_value;
    	let select_disabled_value;
    	let select_required_value;
    	let select_class_value;
    	let t0;
    	let chevrondown16;
    	let t1;
    	let div0_data_invalid_value;
    	let t2;
    	let t3;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[21].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);

    	chevrondown16 = new ChevronDown16$1({
    			props: { class: "bx--select__arrow" },
    			$$inline: true
    		});

    	let if_block0 = /*invalid*/ ctx[7] && create_if_block_9(ctx);
    	let if_block1 = /*invalid*/ ctx[7] && create_if_block_8(ctx);
    	let if_block2 = /*helperText*/ ctx[11] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			select = element("select");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			create_component(chevrondown16.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(select, "aria-describedby", select_aria_describedby_value = /*invalid*/ ctx[7] ? /*errorId*/ ctx[16] : undefined);
    			attr_dev(select, "aria-invalid", select_aria_invalid_value = /*invalid*/ ctx[7] || undefined);
    			select.disabled = select_disabled_value = /*disabled*/ ctx[4] || undefined;
    			select.required = select_required_value = /*required*/ ctx[15] || undefined;
    			attr_dev(select, "id", /*id*/ ctx[5]);
    			attr_dev(select, "name", /*name*/ ctx[6]);
    			attr_dev(select, "class", select_class_value = /*size*/ ctx[1] && `bx--select-input--${/*size*/ ctx[1]}`);
    			toggle_class(select, "bx--select-input", true);
    			add_location(select, file$5, 112, 10, 2893);
    			attr_dev(div0, "data-invalid", div0_data_invalid_value = /*invalid*/ ctx[7] || undefined);
    			toggle_class(div0, "bx--select-input__wrapper", true);
    			add_location(div0, file$5, 108, 8, 2769);
    			toggle_class(div1, "bx--select-input--inline__wrapper", true);
    			add_location(div1, file$5, 107, 6, 2706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, select);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			/*select_binding*/ ctx[28](select);
    			append_dev(div0, t0);
    			mount_component(chevrondown16, div0, null);
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t2);
    			if (if_block1) if_block1.m(div1, null);
    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*change_handler*/ ctx[29], false, false, false),
    					listen_dev(select, "input", /*input_handler*/ ctx[25], false, false, false),
    					listen_dev(select, "focus", /*focus_handler*/ ctx[26], false, false, false),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[20],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[20])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[20], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty[0] & /*invalid, errorId*/ 65664 && select_aria_describedby_value !== (select_aria_describedby_value = /*invalid*/ ctx[7] ? /*errorId*/ ctx[16] : undefined)) {
    				attr_dev(select, "aria-describedby", select_aria_describedby_value);
    			}

    			if (!current || dirty[0] & /*invalid*/ 128 && select_aria_invalid_value !== (select_aria_invalid_value = /*invalid*/ ctx[7] || undefined)) {
    				attr_dev(select, "aria-invalid", select_aria_invalid_value);
    			}

    			if (!current || dirty[0] & /*disabled*/ 16 && select_disabled_value !== (select_disabled_value = /*disabled*/ ctx[4] || undefined)) {
    				prop_dev(select, "disabled", select_disabled_value);
    			}

    			if (!current || dirty[0] & /*required*/ 32768 && select_required_value !== (select_required_value = /*required*/ ctx[15] || undefined)) {
    				prop_dev(select, "required", select_required_value);
    			}

    			if (!current || dirty[0] & /*id*/ 32) {
    				attr_dev(select, "id", /*id*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*name*/ 64) {
    				attr_dev(select, "name", /*name*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*size*/ 2 && select_class_value !== (select_class_value = /*size*/ ctx[1] && `bx--select-input--${/*size*/ ctx[1]}`)) {
    				attr_dev(select, "class", select_class_value);
    			}

    			if (dirty[0] & /*size*/ 2) {
    				toggle_class(select, "bx--select-input", true);
    			}

    			if (/*invalid*/ ctx[7]) {
    				if (if_block0) {
    					if (dirty[0] & /*invalid*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*invalid*/ 128 && div0_data_invalid_value !== (div0_data_invalid_value = /*invalid*/ ctx[7] || undefined)) {
    				attr_dev(div0, "data-invalid", div0_data_invalid_value);
    			}

    			if (/*invalid*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*helperText*/ ctx[11]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(chevrondown16.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(chevrondown16.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*select_binding*/ ctx[28](null);
    			destroy_component(chevrondown16);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(107:4) {#if inline}",
    		ctx
    	});

    	return block;
    }

    // (133:10) {#if invalid}
    function create_if_block_9(ctx) {
    	let warningfilled16;
    	let current;

    	warningfilled16 = new WarningFilled16$1({
    			props: { class: "bx--select__invalid-icon" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(warningfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(warningfilled16, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(warningfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(warningfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(warningfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(133:10) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (137:8) {#if invalid}
    function create_if_block_8(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*invalidText*/ ctx[8]);
    			attr_dev(div, "id", /*errorId*/ ctx[16]);
    			toggle_class(div, "bx--form-requirement", true);
    			add_location(div, file$5, 137, 10, 3714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*invalidText*/ 256) set_data_dev(t, /*invalidText*/ ctx[8]);

    			if (dirty[0] & /*errorId*/ 65536) {
    				attr_dev(div, "id", /*errorId*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(137:8) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (143:6) {#if helperText}
    function create_if_block_7(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[11]);
    			toggle_class(div, "bx--form__helper-text", true);
    			toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[4]);
    			add_location(div, file$5, 143, 8, 3872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 2048) set_data_dev(t, /*helperText*/ ctx[11]);

    			if (dirty[0] & /*disabled*/ 16) {
    				toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(143:6) {#if helperText}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#if !inline}
    function create_if_block$3(ctx) {
    	let div;
    	let select;
    	let select_aria_describedby_value;
    	let select_disabled_value;
    	let select_required_value;
    	let select_aria_invalid_value;
    	let select_class_value;
    	let t0;
    	let chevrondown16;
    	let t1;
    	let t2;
    	let div_data_invalid_value;
    	let t3;
    	let t4;
    	let t5;
    	let if_block4_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[21].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);

    	chevrondown16 = new ChevronDown16$1({
    			props: { class: "bx--select__arrow" },
    			$$inline: true
    		});

    	let if_block0 = /*invalid*/ ctx[7] && create_if_block_5(ctx);
    	let if_block1 = !/*invalid*/ ctx[7] && /*warn*/ ctx[9] && create_if_block_4$1(ctx);
    	let if_block2 = !/*invalid*/ ctx[7] && /*helperText*/ ctx[11] && create_if_block_3$1(ctx);
    	let if_block3 = /*invalid*/ ctx[7] && create_if_block_2$2(ctx);
    	let if_block4 = !/*invalid*/ ctx[7] && /*warn*/ ctx[9] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			select = element("select");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			create_component(chevrondown16.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			attr_dev(select, "id", /*id*/ ctx[5]);
    			attr_dev(select, "name", /*name*/ ctx[6]);
    			attr_dev(select, "aria-describedby", select_aria_describedby_value = /*invalid*/ ctx[7] ? /*errorId*/ ctx[16] : undefined);
    			select.disabled = select_disabled_value = /*disabled*/ ctx[4] || undefined;
    			select.required = select_required_value = /*required*/ ctx[15] || undefined;
    			attr_dev(select, "aria-invalid", select_aria_invalid_value = /*invalid*/ ctx[7] || undefined);
    			attr_dev(select, "class", select_class_value = /*size*/ ctx[1] && `bx--select-input--${/*size*/ ctx[1]}`);
    			toggle_class(select, "bx--select-input", true);
    			add_location(select, file$5, 156, 8, 4195);
    			attr_dev(div, "data-invalid", div_data_invalid_value = /*invalid*/ ctx[7] || undefined);
    			toggle_class(div, "bx--select-input__wrapper", true);
    			add_location(div, file$5, 152, 6, 4079);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, select);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			/*select_binding_1*/ ctx[30](select);
    			append_dev(div, t0);
    			mount_component(chevrondown16, div, null);
    			append_dev(div, t1);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*change_handler_1*/ ctx[31], false, false, false),
    					listen_dev(select, "input", /*input_handler_1*/ ctx[22], false, false, false),
    					listen_dev(select, "focus", /*focus_handler_1*/ ctx[23], false, false, false),
    					listen_dev(select, "blur", /*blur_handler_1*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[20],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[20])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[20], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty[0] & /*id*/ 32) {
    				attr_dev(select, "id", /*id*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*name*/ 64) {
    				attr_dev(select, "name", /*name*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*invalid, errorId*/ 65664 && select_aria_describedby_value !== (select_aria_describedby_value = /*invalid*/ ctx[7] ? /*errorId*/ ctx[16] : undefined)) {
    				attr_dev(select, "aria-describedby", select_aria_describedby_value);
    			}

    			if (!current || dirty[0] & /*disabled*/ 16 && select_disabled_value !== (select_disabled_value = /*disabled*/ ctx[4] || undefined)) {
    				prop_dev(select, "disabled", select_disabled_value);
    			}

    			if (!current || dirty[0] & /*required*/ 32768 && select_required_value !== (select_required_value = /*required*/ ctx[15] || undefined)) {
    				prop_dev(select, "required", select_required_value);
    			}

    			if (!current || dirty[0] & /*invalid*/ 128 && select_aria_invalid_value !== (select_aria_invalid_value = /*invalid*/ ctx[7] || undefined)) {
    				attr_dev(select, "aria-invalid", select_aria_invalid_value);
    			}

    			if (!current || dirty[0] & /*size*/ 2 && select_class_value !== (select_class_value = /*size*/ ctx[1] && `bx--select-input--${/*size*/ ctx[1]}`)) {
    				attr_dev(select, "class", select_class_value);
    			}

    			if (dirty[0] & /*size*/ 2) {
    				toggle_class(select, "bx--select-input", true);
    			}

    			if (/*invalid*/ ctx[7]) {
    				if (if_block0) {
    					if (dirty[0] & /*invalid*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*invalid*/ ctx[7] && /*warn*/ ctx[9]) {
    				if (if_block1) {
    					if (dirty[0] & /*invalid, warn*/ 640) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*invalid*/ 128 && div_data_invalid_value !== (div_data_invalid_value = /*invalid*/ ctx[7] || undefined)) {
    				attr_dev(div, "data-invalid", div_data_invalid_value);
    			}

    			if (!/*invalid*/ ctx[7] && /*helperText*/ ctx[11]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_3$1(ctx);
    					if_block2.c();
    					if_block2.m(t4.parentNode, t4);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*invalid*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_2$2(ctx);
    					if_block3.c();
    					if_block3.m(t5.parentNode, t5);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (!/*invalid*/ ctx[7] && /*warn*/ ctx[9]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_1$2(ctx);
    					if_block4.c();
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(chevrondown16.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(chevrondown16.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*select_binding_1*/ ctx[30](null);
    			destroy_component(chevrondown16);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(152:4) {#if !inline}",
    		ctx
    	});

    	return block;
    }

    // (177:8) {#if invalid}
    function create_if_block_5(ctx) {
    	let warningfilled16;
    	let current;

    	warningfilled16 = new WarningFilled16$1({
    			props: { class: "bx--select__invalid-icon" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(warningfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(warningfilled16, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(warningfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(warningfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(warningfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(177:8) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (180:8) {#if !invalid && warn}
    function create_if_block_4$1(ctx) {
    	let warningaltfilled16;
    	let current;

    	warningaltfilled16 = new WarningAltFilled16$1({
    			props: {
    				class: "bx--select__invalid-icon bx--select__invalid-icon--warning"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(warningaltfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(warningaltfilled16, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(warningaltfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(warningaltfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(warningaltfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(180:8) {#if !invalid && warn}",
    		ctx
    	});

    	return block;
    }

    // (186:6) {#if !invalid && helperText}
    function create_if_block_3$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[11]);
    			toggle_class(div, "bx--form__helper-text", true);
    			toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[4]);
    			add_location(div, file$5, 186, 8, 5148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 2048) set_data_dev(t, /*helperText*/ ctx[11]);

    			if (dirty[0] & /*disabled*/ 16) {
    				toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(186:6) {#if !invalid && helperText}",
    		ctx
    	});

    	return block;
    }

    // (194:6) {#if invalid}
    function create_if_block_2$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*invalidText*/ ctx[8]);
    			attr_dev(div, "id", /*errorId*/ ctx[16]);
    			toggle_class(div, "bx--form-requirement", true);
    			add_location(div, file$5, 194, 8, 5349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*invalidText*/ 256) set_data_dev(t, /*invalidText*/ ctx[8]);

    			if (dirty[0] & /*errorId*/ 65536) {
    				attr_dev(div, "id", /*errorId*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(194:6) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (199:6) {#if !invalid && warn}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*warnText*/ ctx[10]);
    			attr_dev(div, "id", /*errorId*/ ctx[16]);
    			toggle_class(div, "bx--form-requirement", true);
    			add_location(div, file$5, 199, 8, 5494);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*warnText*/ 1024) set_data_dev(t, /*warnText*/ ctx[10]);

    			if (dirty[0] & /*errorId*/ 65536) {
    				attr_dev(div, "id", /*errorId*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(199:6) {#if !invalid && warn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let current;
    	let if_block0 = !/*noLabel*/ ctx[12] && create_if_block_10(ctx);
    	let if_block1 = /*inline*/ ctx[2] && create_if_block_6(ctx);
    	let if_block2 = !/*inline*/ ctx[2] && create_if_block$3(ctx);
    	let div1_levels = [/*$$restProps*/ ctx[18]];
    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			toggle_class(div0, "bx--select", true);
    			toggle_class(div0, "bx--select--inline", /*inline*/ ctx[2]);
    			toggle_class(div0, "bx--select--light", /*light*/ ctx[3]);
    			toggle_class(div0, "bx--select--invalid", /*invalid*/ ctx[7]);
    			toggle_class(div0, "bx--select--disabled", /*disabled*/ ctx[4]);
    			toggle_class(div0, "bx--select--warning", /*warn*/ ctx[9]);
    			add_location(div0, file$5, 86, 2, 2159);
    			set_attributes(div1, div1_data);
    			toggle_class(div1, "bx--form-item", true);
    			add_location(div1, file$5, 85, 0, 2105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*noLabel*/ ctx[12]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*noLabel*/ 4096) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*inline*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*inline*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!/*inline*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*inline*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*inline*/ 4) {
    				toggle_class(div0, "bx--select--inline", /*inline*/ ctx[2]);
    			}

    			if (dirty[0] & /*light*/ 8) {
    				toggle_class(div0, "bx--select--light", /*light*/ ctx[3]);
    			}

    			if (dirty[0] & /*invalid*/ 128) {
    				toggle_class(div0, "bx--select--invalid", /*invalid*/ ctx[7]);
    			}

    			if (dirty[0] & /*disabled*/ 16) {
    				toggle_class(div0, "bx--select--disabled", /*disabled*/ ctx[4]);
    			}

    			if (dirty[0] & /*warn*/ 512) {
    				toggle_class(div0, "bx--select--warning", /*warn*/ ctx[9]);
    			}

    			set_attributes(div1, div1_data = get_spread_update(div1_levels, [dirty[0] & /*$$restProps*/ 262144 && /*$$restProps*/ ctx[18]]));
    			toggle_class(div1, "bx--form-item", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let errorId;

    	const omit_props_names = [
    		"selected","size","inline","light","disabled","id","name","invalid","invalidText","warn","warnText","helperText","noLabel","labelText","hideLabel","ref","required"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $selectedValue;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Select', slots, ['labelText','default']);
    	let { selected = undefined } = $$props;
    	let { size = undefined } = $$props;
    	let { inline = false } = $$props;
    	let { light = false } = $$props;
    	let { disabled = false } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { name = undefined } = $$props;
    	let { invalid = false } = $$props;
    	let { invalidText = "" } = $$props;
    	let { warn = false } = $$props;
    	let { warnText = "" } = $$props;
    	let { helperText = "" } = $$props;
    	let { noLabel = false } = $$props;
    	let { labelText = "" } = $$props;
    	let { hideLabel = false } = $$props;
    	let { ref = null } = $$props;
    	let { required = false } = $$props;
    	const dispatch = createEventDispatcher();
    	const selectedValue = writable(selected);
    	validate_store(selectedValue, 'selectedValue');
    	component_subscribe($$self, selectedValue, value => $$invalidate(32, $selectedValue = value));
    	setContext("Select", { selectedValue });

    	afterUpdate(() => {
    		$$invalidate(19, selected = $selectedValue);
    		dispatch("change", $selectedValue);
    	});

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function select_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(0, ref);
    		});
    	}

    	const change_handler = ({ target }) => {
    		selectedValue.set(target.value);
    	};

    	function select_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(0, ref);
    		});
    	}

    	const change_handler_1 = ({ target }) => {
    		selectedValue.set(target.value);
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(18, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('selected' in $$new_props) $$invalidate(19, selected = $$new_props.selected);
    		if ('size' in $$new_props) $$invalidate(1, size = $$new_props.size);
    		if ('inline' in $$new_props) $$invalidate(2, inline = $$new_props.inline);
    		if ('light' in $$new_props) $$invalidate(3, light = $$new_props.light);
    		if ('disabled' in $$new_props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ('id' in $$new_props) $$invalidate(5, id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate(6, name = $$new_props.name);
    		if ('invalid' in $$new_props) $$invalidate(7, invalid = $$new_props.invalid);
    		if ('invalidText' in $$new_props) $$invalidate(8, invalidText = $$new_props.invalidText);
    		if ('warn' in $$new_props) $$invalidate(9, warn = $$new_props.warn);
    		if ('warnText' in $$new_props) $$invalidate(10, warnText = $$new_props.warnText);
    		if ('helperText' in $$new_props) $$invalidate(11, helperText = $$new_props.helperText);
    		if ('noLabel' in $$new_props) $$invalidate(12, noLabel = $$new_props.noLabel);
    		if ('labelText' in $$new_props) $$invalidate(13, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$new_props) $$invalidate(14, hideLabel = $$new_props.hideLabel);
    		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    		if ('required' in $$new_props) $$invalidate(15, required = $$new_props.required);
    		if ('$$scope' in $$new_props) $$invalidate(20, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		selected,
    		size,
    		inline,
    		light,
    		disabled,
    		id,
    		name,
    		invalid,
    		invalidText,
    		warn,
    		warnText,
    		helperText,
    		noLabel,
    		labelText,
    		hideLabel,
    		ref,
    		required,
    		createEventDispatcher,
    		setContext,
    		afterUpdate,
    		writable,
    		ChevronDown16: ChevronDown16$1,
    		WarningFilled16: WarningFilled16$1,
    		WarningAltFilled16: WarningAltFilled16$1,
    		dispatch,
    		selectedValue,
    		errorId,
    		$selectedValue
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('selected' in $$props) $$invalidate(19, selected = $$new_props.selected);
    		if ('size' in $$props) $$invalidate(1, size = $$new_props.size);
    		if ('inline' in $$props) $$invalidate(2, inline = $$new_props.inline);
    		if ('light' in $$props) $$invalidate(3, light = $$new_props.light);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ('id' in $$props) $$invalidate(5, id = $$new_props.id);
    		if ('name' in $$props) $$invalidate(6, name = $$new_props.name);
    		if ('invalid' in $$props) $$invalidate(7, invalid = $$new_props.invalid);
    		if ('invalidText' in $$props) $$invalidate(8, invalidText = $$new_props.invalidText);
    		if ('warn' in $$props) $$invalidate(9, warn = $$new_props.warn);
    		if ('warnText' in $$props) $$invalidate(10, warnText = $$new_props.warnText);
    		if ('helperText' in $$props) $$invalidate(11, helperText = $$new_props.helperText);
    		if ('noLabel' in $$props) $$invalidate(12, noLabel = $$new_props.noLabel);
    		if ('labelText' in $$props) $$invalidate(13, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$props) $$invalidate(14, hideLabel = $$new_props.hideLabel);
    		if ('ref' in $$props) $$invalidate(0, ref = $$new_props.ref);
    		if ('required' in $$props) $$invalidate(15, required = $$new_props.required);
    		if ('errorId' in $$props) $$invalidate(16, errorId = $$new_props.errorId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*id*/ 32) {
    			$$invalidate(16, errorId = `error-${id}`);
    		}

    		if ($$self.$$.dirty[0] & /*selected*/ 524288) {
    			selectedValue.set(selected);
    		}
    	};

    	return [
    		ref,
    		size,
    		inline,
    		light,
    		disabled,
    		id,
    		name,
    		invalid,
    		invalidText,
    		warn,
    		warnText,
    		helperText,
    		noLabel,
    		labelText,
    		hideLabel,
    		required,
    		errorId,
    		selectedValue,
    		$$restProps,
    		selected,
    		$$scope,
    		slots,
    		input_handler_1,
    		focus_handler_1,
    		blur_handler_1,
    		input_handler,
    		focus_handler,
    		blur_handler,
    		select_binding,
    		change_handler,
    		select_binding_1,
    		change_handler_1
    	];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				selected: 19,
    				size: 1,
    				inline: 2,
    				light: 3,
    				disabled: 4,
    				id: 5,
    				name: 6,
    				invalid: 7,
    				invalidText: 8,
    				warn: 9,
    				warnText: 10,
    				helperText: 11,
    				noLabel: 12,
    				labelText: 13,
    				hideLabel: 14,
    				ref: 0,
    				required: 15
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalidText() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalidText(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warn() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set warn(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warnText() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set warnText(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperText() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperText(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Select$1 = Select;

    /* node_modules/carbon-components-svelte/src/Select/SelectItem.svelte generated by Svelte v3.46.4 */
    const file$4 = "node_modules/carbon-components-svelte/src/Select/SelectItem.svelte";

    function create_fragment$5(ctx) {
    	let option;
    	let t_value = (/*text*/ ctx[1] || /*value*/ ctx[0]) + "";
    	let t;
    	let option_class_value;
    	let option_style_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*value*/ ctx[0];
    			option.value = option.__value;
    			option.disabled = /*disabled*/ ctx[3];
    			option.hidden = /*hidden*/ ctx[2];
    			option.selected = /*selected*/ ctx[4];
    			attr_dev(option, "class", option_class_value = /*$$restProps*/ ctx[5].class);
    			attr_dev(option, "style", option_style_value = /*$$restProps*/ ctx[5].style);
    			toggle_class(option, "bx--select-option", true);
    			add_location(option, file$4, 28, 0, 604);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text, value*/ 3 && t_value !== (t_value = (/*text*/ ctx[1] || /*value*/ ctx[0]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*value*/ 1) {
    				prop_dev(option, "__value", /*value*/ ctx[0]);
    				option.value = option.__value;
    			}

    			if (dirty & /*disabled*/ 8) {
    				prop_dev(option, "disabled", /*disabled*/ ctx[3]);
    			}

    			if (dirty & /*hidden*/ 4) {
    				prop_dev(option, "hidden", /*hidden*/ ctx[2]);
    			}

    			if (dirty & /*selected*/ 16) {
    				prop_dev(option, "selected", /*selected*/ ctx[4]);
    			}

    			if (dirty & /*$$restProps*/ 32 && option_class_value !== (option_class_value = /*$$restProps*/ ctx[5].class)) {
    				attr_dev(option, "class", option_class_value);
    			}

    			if (dirty & /*$$restProps*/ 32 && option_style_value !== (option_style_value = /*$$restProps*/ ctx[5].style)) {
    				attr_dev(option, "style", option_style_value);
    			}

    			if (dirty & /*$$restProps*/ 32) {
    				toggle_class(option, "bx--select-option", true);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const omit_props_names = ["value","text","hidden","disabled"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelectItem', slots, []);
    	let { value = "" } = $$props;
    	let { text = "" } = $$props;
    	let { hidden = false } = $$props;
    	let { disabled = false } = $$props;
    	const ctx = getContext("Select") || getContext("TimePickerSelect");
    	let selected = false;

    	const unsubscribe = ctx.selectedValue.subscribe(currentValue => {
    		$$invalidate(4, selected = currentValue === value);
    	});

    	onMount(() => {
    		return () => unsubscribe();
    	});

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('value' in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ('text' in $$new_props) $$invalidate(1, text = $$new_props.text);
    		if ('hidden' in $$new_props) $$invalidate(2, hidden = $$new_props.hidden);
    		if ('disabled' in $$new_props) $$invalidate(3, disabled = $$new_props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		text,
    		hidden,
    		disabled,
    		getContext,
    		onMount,
    		ctx,
    		selected,
    		unsubscribe
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('value' in $$props) $$invalidate(0, value = $$new_props.value);
    		if ('text' in $$props) $$invalidate(1, text = $$new_props.text);
    		if ('hidden' in $$props) $$invalidate(2, hidden = $$new_props.hidden);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ('selected' in $$props) $$invalidate(4, selected = $$new_props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, text, hidden, disabled, selected, $$restProps];
    }

    class SelectItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			value: 0,
    			text: 1,
    			hidden: 2,
    			disabled: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectItem",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get value() {
    		throw new Error("<SelectItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<SelectItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<SelectItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<SelectItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<SelectItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<SelectItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<SelectItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<SelectItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var SelectItem$1 = SelectItem;

    /* node_modules/carbon-components-svelte/src/RadioButtonGroup/RadioButtonGroup.svelte generated by Svelte v3.46.4 */
    const file$3 = "node_modules/carbon-components-svelte/src/RadioButtonGroup/RadioButtonGroup.svelte";
    const get_legendText_slot_changes = dirty => ({});
    const get_legendText_slot_context = ctx => ({});

    // (89:4) {#if legendText || $$slots.legendText}
    function create_if_block$2(ctx) {
    	let legend;
    	let current;
    	const legendText_slot_template = /*#slots*/ ctx[11].legendText;
    	const legendText_slot = create_slot(legendText_slot_template, ctx, /*$$scope*/ ctx[10], get_legendText_slot_context);
    	const legendText_slot_or_fallback = legendText_slot || fallback_block$2(ctx);

    	const block = {
    		c: function create() {
    			legend = element("legend");
    			if (legendText_slot_or_fallback) legendText_slot_or_fallback.c();
    			toggle_class(legend, "bx--label", true);
    			toggle_class(legend, "bx--visually-hidden", /*hideLegend*/ ctx[2]);
    			add_location(legend, file$3, 89, 6, 1940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, legend, anchor);

    			if (legendText_slot_or_fallback) {
    				legendText_slot_or_fallback.m(legend, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (legendText_slot) {
    				if (legendText_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						legendText_slot,
    						legendText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(legendText_slot_template, /*$$scope*/ ctx[10], dirty, get_legendText_slot_changes),
    						get_legendText_slot_context
    					);
    				}
    			} else {
    				if (legendText_slot_or_fallback && legendText_slot_or_fallback.p && (!current || dirty & /*legendText*/ 2)) {
    					legendText_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (dirty & /*hideLegend*/ 4) {
    				toggle_class(legend, "bx--visually-hidden", /*hideLegend*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(legendText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(legendText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(legend);
    			if (legendText_slot_or_fallback) legendText_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(89:4) {#if legendText || $$slots.legendText}",
    		ctx
    	});

    	return block;
    }

    // (91:32) {legendText}
    function fallback_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*legendText*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*legendText*/ 2) set_data_dev(t, /*legendText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$2.name,
    		type: "fallback",
    		source: "(91:32) {legendText}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let fieldset;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = (/*legendText*/ ctx[1] || /*$$slots*/ ctx[8].legendText) && create_if_block$2(ctx);
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	let div_levels = [{ id: /*id*/ ctx[5] }, /*$$restProps*/ ctx[7]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			fieldset = element("fieldset");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			fieldset.disabled = /*disabled*/ ctx[0];
    			toggle_class(fieldset, "bx--radio-button-group", true);
    			toggle_class(fieldset, "bx--radio-button-group--vertical", /*orientation*/ ctx[4] === 'vertical');
    			toggle_class(fieldset, "bx--radio-button-group--label-left", /*labelPosition*/ ctx[3] === 'left');
    			toggle_class(fieldset, "bx--radio-button-group--label-right", /*labelPosition*/ ctx[3] === 'right');
    			add_location(fieldset, file$3, 81, 2, 1585);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--form-item", true);
    			add_location(div, file$3, 72, 0, 1456);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, fieldset);
    			if (if_block) if_block.m(fieldset, null);
    			append_dev(fieldset, t);

    			if (default_slot) {
    				default_slot.m(fieldset, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(div, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*legendText*/ ctx[1] || /*$$slots*/ ctx[8].legendText) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*legendText, $$slots*/ 258) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(fieldset, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*disabled*/ 1) {
    				prop_dev(fieldset, "disabled", /*disabled*/ ctx[0]);
    			}

    			if (dirty & /*orientation*/ 16) {
    				toggle_class(fieldset, "bx--radio-button-group--vertical", /*orientation*/ ctx[4] === 'vertical');
    			}

    			if (dirty & /*labelPosition*/ 8) {
    				toggle_class(fieldset, "bx--radio-button-group--label-left", /*labelPosition*/ ctx[3] === 'left');
    			}

    			if (dirty & /*labelPosition*/ 8) {
    				toggle_class(fieldset, "bx--radio-button-group--label-right", /*labelPosition*/ ctx[3] === 'right');
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				(!current || dirty & /*id*/ 32) && { id: /*id*/ ctx[5] },
    				dirty & /*$$restProps*/ 128 && /*$$restProps*/ ctx[7]
    			]));

    			toggle_class(div, "bx--form-item", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"selected","disabled","legendText","hideLegend","labelPosition","orientation","id"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $selectedValue;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RadioButtonGroup', slots, ['legendText','default']);
    	const $$slots = compute_slots(slots);
    	let { selected = undefined } = $$props;
    	let { disabled = false } = $$props;
    	let { legendText = "" } = $$props;
    	let { hideLegend = false } = $$props;
    	let { labelPosition = "right" } = $$props;
    	let { orientation = "horizontal" } = $$props;
    	let { id = undefined } = $$props;
    	const dispatch = createEventDispatcher();
    	const selectedValue = writable(selected);
    	validate_store(selectedValue, 'selectedValue');
    	component_subscribe($$self, selectedValue, value => $$invalidate(16, $selectedValue = value));

    	setContext("RadioButtonGroup", {
    		selectedValue,
    		add: ({ checked, value }) => {
    			if (checked) {
    				selectedValue.set(value);
    			}
    		},
    		update: value => {
    			$$invalidate(9, selected = value);
    		}
    	});

    	onMount(() => {
    		set_store_value(selectedValue, $selectedValue = selected, $selectedValue);
    	});

    	beforeUpdate(() => {
    		set_store_value(selectedValue, $selectedValue = selected, $selectedValue);
    	});

    	selectedValue.subscribe(value => {
    		$$invalidate(9, selected = value);
    		dispatch("change", value);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('selected' in $$new_props) $$invalidate(9, selected = $$new_props.selected);
    		if ('disabled' in $$new_props) $$invalidate(0, disabled = $$new_props.disabled);
    		if ('legendText' in $$new_props) $$invalidate(1, legendText = $$new_props.legendText);
    		if ('hideLegend' in $$new_props) $$invalidate(2, hideLegend = $$new_props.hideLegend);
    		if ('labelPosition' in $$new_props) $$invalidate(3, labelPosition = $$new_props.labelPosition);
    		if ('orientation' in $$new_props) $$invalidate(4, orientation = $$new_props.orientation);
    		if ('id' in $$new_props) $$invalidate(5, id = $$new_props.id);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		selected,
    		disabled,
    		legendText,
    		hideLegend,
    		labelPosition,
    		orientation,
    		id,
    		beforeUpdate,
    		createEventDispatcher,
    		onMount,
    		setContext,
    		writable,
    		dispatch,
    		selectedValue,
    		$selectedValue
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('selected' in $$props) $$invalidate(9, selected = $$new_props.selected);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$new_props.disabled);
    		if ('legendText' in $$props) $$invalidate(1, legendText = $$new_props.legendText);
    		if ('hideLegend' in $$props) $$invalidate(2, hideLegend = $$new_props.hideLegend);
    		if ('labelPosition' in $$props) $$invalidate(3, labelPosition = $$new_props.labelPosition);
    		if ('orientation' in $$props) $$invalidate(4, orientation = $$new_props.orientation);
    		if ('id' in $$props) $$invalidate(5, id = $$new_props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		disabled,
    		legendText,
    		hideLegend,
    		labelPosition,
    		orientation,
    		id,
    		selectedValue,
    		$$restProps,
    		$$slots,
    		selected,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class RadioButtonGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			selected: 9,
    			disabled: 0,
    			legendText: 1,
    			hideLegend: 2,
    			labelPosition: 3,
    			orientation: 4,
    			id: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RadioButtonGroup",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get selected() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get legendText() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set legendText(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLegend() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLegend(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelPosition() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelPosition(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orientation() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orientation(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var RadioButtonGroup$1 = RadioButtonGroup;

    /* node_modules/carbon-components-svelte/src/TextArea/TextArea.svelte generated by Svelte v3.46.4 */
    const file$2 = "node_modules/carbon-components-svelte/src/TextArea/TextArea.svelte";
    const get_labelText_slot_changes$1 = dirty => ({});
    const get_labelText_slot_context$1 = ctx => ({});

    // (69:2) {#if (labelText || $$slots.labelText) && !hideLabel}
    function create_if_block_3(ctx) {
    	let div;
    	let label;
    	let t;
    	let current;
    	const labelText_slot_template = /*#slots*/ ctx[20].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[19], get_labelText_slot_context$1);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block$1(ctx);
    	let if_block = /*maxCount*/ ctx[5] && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(label, "for", /*id*/ ctx[14]);
    			toggle_class(label, "bx--label", true);
    			toggle_class(label, "bx--visually-hidden", /*hideLabel*/ ctx[11]);
    			toggle_class(label, "bx--label--disabled", /*disabled*/ ctx[7]);
    			add_location(label, file$2, 70, 6, 1651);
    			toggle_class(div, "bx--text-area__label-wrapper", true);
    			add_location(div, file$2, 69, 4, 1595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(label, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty[0] & /*$$scope*/ 524288)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[19],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[19])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[19], dirty, get_labelText_slot_changes$1),
    						get_labelText_slot_context$1
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty[0] & /*labelText*/ 1024)) {
    					labelText_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*id*/ 16384) {
    				attr_dev(label, "for", /*id*/ ctx[14]);
    			}

    			if (dirty[0] & /*hideLabel*/ 2048) {
    				toggle_class(label, "bx--visually-hidden", /*hideLabel*/ ctx[11]);
    			}

    			if (dirty[0] & /*disabled*/ 128) {
    				toggle_class(label, "bx--label--disabled", /*disabled*/ ctx[7]);
    			}

    			if (/*maxCount*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(69:2) {#if (labelText || $$slots.labelText) && !hideLabel}",
    		ctx
    	});

    	return block;
    }

    // (77:31)            
    function fallback_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[10]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*labelText*/ 1024) set_data_dev(t, /*labelText*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(77:31)            ",
    		ctx
    	});

    	return block;
    }

    // (81:6) {#if maxCount}
    function create_if_block_4(ctx) {
    	let div;
    	let t0_value = /*value*/ ctx[0].length + "";
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("/");
    			t2 = text(/*maxCount*/ ctx[5]);
    			toggle_class(div, "bx--label", true);
    			toggle_class(div, "bx--label--disabled", /*disabled*/ ctx[7]);
    			add_location(div, file$2, 81, 8, 1927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*value*/ 1 && t0_value !== (t0_value = /*value*/ ctx[0].length + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*maxCount*/ 32) set_data_dev(t2, /*maxCount*/ ctx[5]);

    			if (dirty[0] & /*disabled*/ 128) {
    				toggle_class(div, "bx--label--disabled", /*disabled*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(81:6) {#if maxCount}",
    		ctx
    	});

    	return block;
    }

    // (92:4) {#if invalid}
    function create_if_block_2$1(ctx) {
    	let warningfilled16;
    	let current;

    	warningfilled16 = new WarningFilled16$1({
    			props: { class: "bx--text-area__invalid-icon" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(warningfilled16.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(warningfilled16, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(warningfilled16.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(warningfilled16.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(warningfilled16, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(92:4) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#if !invalid && helperText}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[9]);
    			toggle_class(div, "bx--form__helper-text", true);
    			toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[7]);
    			add_location(div, file$2, 122, 4, 3010);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 512) set_data_dev(t, /*helperText*/ ctx[9]);

    			if (dirty[0] & /*disabled*/ 128) {
    				toggle_class(div, "bx--form__helper-text--disabled", /*disabled*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(122:2) {#if !invalid && helperText}",
    		ctx
    	});

    	return block;
    }

    // (130:2) {#if invalid}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*invalidText*/ ctx[13]);
    			attr_dev(div, "id", /*errorId*/ ctx[16]);
    			toggle_class(div, "bx--form-requirement", true);
    			add_location(div, file$2, 130, 4, 3179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*invalidText*/ 8192) set_data_dev(t, /*invalidText*/ ctx[13]);

    			if (dirty[0] & /*errorId*/ 65536) {
    				attr_dev(div, "id", /*errorId*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(130:2) {#if invalid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let t1;
    	let textarea;
    	let textarea_aria_invalid_value;
    	let textarea_aria_describedby_value;
    	let textarea_value_value;
    	let textarea_maxlength_value;
    	let div0_data_invalid_value;
    	let t2;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = (/*labelText*/ ctx[10] || /*$$slots*/ ctx[17].labelText) && !/*hideLabel*/ ctx[11] && create_if_block_3(ctx);
    	let if_block1 = /*invalid*/ ctx[12] && create_if_block_2$1(ctx);

    	let textarea_levels = [
    		{
    			"aria-invalid": textarea_aria_invalid_value = /*invalid*/ ctx[12] || undefined
    		},
    		{
    			"aria-describedby": textarea_aria_describedby_value = /*invalid*/ ctx[12] ? /*errorId*/ ctx[16] : undefined
    		},
    		{ disabled: /*disabled*/ ctx[7] },
    		{ id: /*id*/ ctx[14] },
    		{ name: /*name*/ ctx[15] },
    		{ cols: /*cols*/ ctx[3] },
    		{ rows: /*rows*/ ctx[4] },
    		{
    			value: textarea_value_value = /*value*/ ctx[0] ?? ''
    		},
    		{ placeholder: /*placeholder*/ ctx[2] },
    		{ readOnly: /*readonly*/ ctx[8] },
    		{
    			maxlength: textarea_maxlength_value = /*maxCount*/ ctx[5] ?? undefined
    		},
    		/*$$restProps*/ ctx[18]
    	];

    	let textarea_data = {};

    	for (let i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	let if_block2 = !/*invalid*/ ctx[12] && /*helperText*/ ctx[9] && create_if_block_1$1(ctx);
    	let if_block3 = /*invalid*/ ctx[12] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			set_attributes(textarea, textarea_data);
    			toggle_class(textarea, "bx--text-area", true);
    			toggle_class(textarea, "bx--text-area--light", /*light*/ ctx[6]);
    			toggle_class(textarea, "bx--text-area--invalid", /*invalid*/ ctx[12]);
    			add_location(textarea, file$2, 94, 4, 2268);
    			attr_dev(div0, "data-invalid", div0_data_invalid_value = /*invalid*/ ctx[12] || undefined);
    			toggle_class(div0, "bx--text-area__wrapper", true);
    			add_location(div0, file$2, 87, 2, 2081);
    			toggle_class(div1, "bx--form-item", true);
    			add_location(div1, file$2, 61, 0, 1440);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, textarea);
    			if (textarea.autofocus) textarea.focus();
    			/*textarea_binding*/ ctx[31](textarea);
    			append_dev(div1, t2);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t3);
    			if (if_block3) if_block3.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "change", /*change_handler*/ ctx[25], false, false, false),
    					listen_dev(textarea, "input", /*input_handler*/ ctx[26], false, false, false),
    					listen_dev(textarea, "input", /*input_handler_1*/ ctx[32], false, false, false),
    					listen_dev(textarea, "keydown", /*keydown_handler*/ ctx[27], false, false, false),
    					listen_dev(textarea, "keyup", /*keyup_handler*/ ctx[28], false, false, false),
    					listen_dev(textarea, "focus", /*focus_handler*/ ctx[29], false, false, false),
    					listen_dev(textarea, "blur", /*blur_handler*/ ctx[30], false, false, false),
    					listen_dev(div1, "click", /*click_handler*/ ctx[21], false, false, false),
    					listen_dev(div1, "mouseover", /*mouseover_handler*/ ctx[22], false, false, false),
    					listen_dev(div1, "mouseenter", /*mouseenter_handler*/ ctx[23], false, false, false),
    					listen_dev(div1, "mouseleave", /*mouseleave_handler*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((/*labelText*/ ctx[10] || /*$$slots*/ ctx[17].labelText) && !/*hideLabel*/ ctx[11]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*labelText, $$slots, hideLabel*/ 134144) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*invalid*/ ctx[12]) {
    				if (if_block1) {
    					if (dirty[0] & /*invalid*/ 4096) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(textarea, textarea_data = get_spread_update(textarea_levels, [
    				(!current || dirty[0] & /*invalid*/ 4096 && textarea_aria_invalid_value !== (textarea_aria_invalid_value = /*invalid*/ ctx[12] || undefined)) && {
    					"aria-invalid": textarea_aria_invalid_value
    				},
    				(!current || dirty[0] & /*invalid, errorId*/ 69632 && textarea_aria_describedby_value !== (textarea_aria_describedby_value = /*invalid*/ ctx[12] ? /*errorId*/ ctx[16] : undefined)) && {
    					"aria-describedby": textarea_aria_describedby_value
    				},
    				(!current || dirty[0] & /*disabled*/ 128) && { disabled: /*disabled*/ ctx[7] },
    				(!current || dirty[0] & /*id*/ 16384) && { id: /*id*/ ctx[14] },
    				(!current || dirty[0] & /*name*/ 32768) && { name: /*name*/ ctx[15] },
    				(!current || dirty[0] & /*cols*/ 8) && { cols: /*cols*/ ctx[3] },
    				(!current || dirty[0] & /*rows*/ 16) && { rows: /*rows*/ ctx[4] },
    				(!current || dirty[0] & /*value*/ 1 && textarea_value_value !== (textarea_value_value = /*value*/ ctx[0] ?? '')) && { value: textarea_value_value },
    				(!current || dirty[0] & /*placeholder*/ 4) && { placeholder: /*placeholder*/ ctx[2] },
    				(!current || dirty[0] & /*readonly*/ 256) && { readOnly: /*readonly*/ ctx[8] },
    				(!current || dirty[0] & /*maxCount*/ 32 && textarea_maxlength_value !== (textarea_maxlength_value = /*maxCount*/ ctx[5] ?? undefined)) && { maxlength: textarea_maxlength_value },
    				dirty[0] & /*$$restProps*/ 262144 && /*$$restProps*/ ctx[18]
    			]));

    			toggle_class(textarea, "bx--text-area", true);
    			toggle_class(textarea, "bx--text-area--light", /*light*/ ctx[6]);
    			toggle_class(textarea, "bx--text-area--invalid", /*invalid*/ ctx[12]);

    			if (!current || dirty[0] & /*invalid*/ 4096 && div0_data_invalid_value !== (div0_data_invalid_value = /*invalid*/ ctx[12] || undefined)) {
    				attr_dev(div0, "data-invalid", div0_data_invalid_value);
    			}

    			if (!/*invalid*/ ctx[12] && /*helperText*/ ctx[9]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t3);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*invalid*/ ctx[12]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*textarea_binding*/ ctx[31](null);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let errorId;

    	const omit_props_names = [
    		"value","placeholder","cols","rows","maxCount","light","disabled","readonly","helperText","labelText","hideLabel","invalid","invalidText","id","name","ref"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextArea', slots, ['labelText']);
    	const $$slots = compute_slots(slots);
    	let { value = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { cols = 50 } = $$props;
    	let { rows = 4 } = $$props;
    	let { maxCount = undefined } = $$props;
    	let { light = false } = $$props;
    	let { disabled = false } = $$props;
    	let { readonly = false } = $$props;
    	let { helperText = "" } = $$props;
    	let { labelText = "" } = $$props;
    	let { hideLabel = false } = $$props;
    	let { invalid = false } = $$props;
    	let { invalidText = "" } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { name = undefined } = $$props;
    	let { ref = null } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	const input_handler_1 = ({ target }) => {
    		$$invalidate(0, value = target.value);
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(18, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('value' in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ('placeholder' in $$new_props) $$invalidate(2, placeholder = $$new_props.placeholder);
    		if ('cols' in $$new_props) $$invalidate(3, cols = $$new_props.cols);
    		if ('rows' in $$new_props) $$invalidate(4, rows = $$new_props.rows);
    		if ('maxCount' in $$new_props) $$invalidate(5, maxCount = $$new_props.maxCount);
    		if ('light' in $$new_props) $$invalidate(6, light = $$new_props.light);
    		if ('disabled' in $$new_props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ('readonly' in $$new_props) $$invalidate(8, readonly = $$new_props.readonly);
    		if ('helperText' in $$new_props) $$invalidate(9, helperText = $$new_props.helperText);
    		if ('labelText' in $$new_props) $$invalidate(10, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$new_props) $$invalidate(11, hideLabel = $$new_props.hideLabel);
    		if ('invalid' in $$new_props) $$invalidate(12, invalid = $$new_props.invalid);
    		if ('invalidText' in $$new_props) $$invalidate(13, invalidText = $$new_props.invalidText);
    		if ('id' in $$new_props) $$invalidate(14, id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate(15, name = $$new_props.name);
    		if ('ref' in $$new_props) $$invalidate(1, ref = $$new_props.ref);
    		if ('$$scope' in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		placeholder,
    		cols,
    		rows,
    		maxCount,
    		light,
    		disabled,
    		readonly,
    		helperText,
    		labelText,
    		hideLabel,
    		invalid,
    		invalidText,
    		id,
    		name,
    		ref,
    		WarningFilled16: WarningFilled16$1,
    		errorId
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('value' in $$props) $$invalidate(0, value = $$new_props.value);
    		if ('placeholder' in $$props) $$invalidate(2, placeholder = $$new_props.placeholder);
    		if ('cols' in $$props) $$invalidate(3, cols = $$new_props.cols);
    		if ('rows' in $$props) $$invalidate(4, rows = $$new_props.rows);
    		if ('maxCount' in $$props) $$invalidate(5, maxCount = $$new_props.maxCount);
    		if ('light' in $$props) $$invalidate(6, light = $$new_props.light);
    		if ('disabled' in $$props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ('readonly' in $$props) $$invalidate(8, readonly = $$new_props.readonly);
    		if ('helperText' in $$props) $$invalidate(9, helperText = $$new_props.helperText);
    		if ('labelText' in $$props) $$invalidate(10, labelText = $$new_props.labelText);
    		if ('hideLabel' in $$props) $$invalidate(11, hideLabel = $$new_props.hideLabel);
    		if ('invalid' in $$props) $$invalidate(12, invalid = $$new_props.invalid);
    		if ('invalidText' in $$props) $$invalidate(13, invalidText = $$new_props.invalidText);
    		if ('id' in $$props) $$invalidate(14, id = $$new_props.id);
    		if ('name' in $$props) $$invalidate(15, name = $$new_props.name);
    		if ('ref' in $$props) $$invalidate(1, ref = $$new_props.ref);
    		if ('errorId' in $$props) $$invalidate(16, errorId = $$new_props.errorId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*id*/ 16384) {
    			$$invalidate(16, errorId = `error-${id}`);
    		}
    	};

    	return [
    		value,
    		ref,
    		placeholder,
    		cols,
    		rows,
    		maxCount,
    		light,
    		disabled,
    		readonly,
    		helperText,
    		labelText,
    		hideLabel,
    		invalid,
    		invalidText,
    		id,
    		name,
    		errorId,
    		$$slots,
    		$$restProps,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		change_handler,
    		input_handler,
    		keydown_handler,
    		keyup_handler,
    		focus_handler,
    		blur_handler,
    		textarea_binding,
    		input_handler_1
    	];
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				value: 0,
    				placeholder: 2,
    				cols: 3,
    				rows: 4,
    				maxCount: 5,
    				light: 6,
    				disabled: 7,
    				readonly: 8,
    				helperText: 9,
    				labelText: 10,
    				hideLabel: 11,
    				invalid: 12,
    				invalidText: 13,
    				id: 14,
    				name: 15,
    				ref: 1
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextArea",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get value() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rows() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxCount() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxCount(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperText() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperText(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLabel() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalidText() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalidText(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var TextArea$1 = TextArea;

    /* node_modules/carbon-components-svelte/src/Toggle/Toggle.svelte generated by Svelte v3.46.4 */
    const file$1 = "node_modules/carbon-components-svelte/src/Toggle/Toggle.svelte";
    const get_labelB_slot_changes = dirty => ({});
    const get_labelB_slot_context = ctx => ({});
    const get_labelA_slot_changes = dirty => ({});
    const get_labelA_slot_context = ctx => ({});
    const get_labelText_slot_changes = dirty => ({});
    const get_labelText_slot_context = ctx => ({});

    // (79:27)        
    function fallback_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelText*/ ctx[5]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelText*/ 32) set_data_dev(t, /*labelText*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(79:27)        ",
    		ctx
    	});

    	return block;
    }

    // (84:28)            
    function fallback_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelA*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelA*/ 8) set_data_dev(t, /*labelA*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(84:28)            ",
    		ctx
    	});

    	return block;
    }

    // (89:28)            
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*labelB*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelB*/ 16) set_data_dev(t, /*labelB*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(89:28)            ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let span2;
    	let span0;
    	let t2;
    	let span1;
    	let label_aria_label_value;
    	let current;
    	let mounted;
    	let dispose;
    	const labelText_slot_template = /*#slots*/ ctx[11].labelText;
    	const labelText_slot = create_slot(labelText_slot_template, ctx, /*$$scope*/ ctx[10], get_labelText_slot_context);
    	const labelText_slot_or_fallback = labelText_slot || fallback_block_2(ctx);
    	const labelA_slot_template = /*#slots*/ ctx[11].labelA;
    	const labelA_slot = create_slot(labelA_slot_template, ctx, /*$$scope*/ ctx[10], get_labelA_slot_context);
    	const labelA_slot_or_fallback = labelA_slot || fallback_block_1(ctx);
    	const labelB_slot_template = /*#slots*/ ctx[11].labelB;
    	const labelB_slot = create_slot(labelB_slot_template, ctx, /*$$scope*/ ctx[10], get_labelB_slot_context);
    	const labelB_slot_or_fallback = labelB_slot || fallback_block(ctx);
    	let div_levels = [/*$$restProps*/ ctx[8]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.c();
    			t1 = space();
    			span2 = element("span");
    			span0 = element("span");
    			if (labelA_slot_or_fallback) labelA_slot_or_fallback.c();
    			t2 = space();
    			span1 = element("span");
    			if (labelB_slot_or_fallback) labelB_slot_or_fallback.c();
    			attr_dev(input, "type", "checkbox");
    			input.checked = /*toggled*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[2];
    			attr_dev(input, "id", /*id*/ ctx[6]);
    			attr_dev(input, "name", /*name*/ ctx[7]);
    			toggle_class(input, "bx--toggle-input", true);
    			toggle_class(input, "bx--toggle-input--small", /*size*/ ctx[1] === 'sm');
    			add_location(input, file$1, 51, 2, 1086);
    			attr_dev(span0, "aria-hidden", "true");
    			toggle_class(span0, "bx--toggle__text--off", true);
    			add_location(span0, file$1, 82, 6, 1799);
    			attr_dev(span1, "aria-hidden", "true");
    			toggle_class(span1, "bx--toggle__text--on", true);
    			add_location(span1, file$1, 87, 6, 1946);
    			toggle_class(span2, "bx--toggle__switch", true);
    			add_location(span2, file$1, 81, 4, 1752);

    			attr_dev(label, "aria-label", label_aria_label_value = /*labelText*/ ctx[5]
    			? undefined
    			: /*$$props*/ ctx[9]['aria-label'] || 'Toggle');

    			attr_dev(label, "for", /*id*/ ctx[6]);
    			toggle_class(label, "bx--toggle-input__label", true);
    			add_location(label, file$1, 73, 2, 1544);
    			set_attributes(div, div_data);
    			toggle_class(div, "bx--form-item", true);
    			add_location(div, file$1, 43, 0, 969);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);

    			if (labelText_slot_or_fallback) {
    				labelText_slot_or_fallback.m(label, null);
    			}

    			append_dev(label, t1);
    			append_dev(label, span2);
    			append_dev(span2, span0);

    			if (labelA_slot_or_fallback) {
    				labelA_slot_or_fallback.m(span0, null);
    			}

    			append_dev(span2, t2);
    			append_dev(span2, span1);

    			if (labelB_slot_or_fallback) {
    				labelB_slot_or_fallback.m(span1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*change_handler*/ ctx[16], false, false, false),
    					listen_dev(input, "change", /*change_handler_1*/ ctx[20], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[17], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_1*/ ctx[21], false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[18], false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[19], false, false, false),
    					listen_dev(div, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(div, "mouseover", /*mouseover_handler*/ ctx[13], false, false, false),
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*toggled*/ 1) {
    				prop_dev(input, "checked", /*toggled*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 4) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (!current || dirty & /*id*/ 64) {
    				attr_dev(input, "id", /*id*/ ctx[6]);
    			}

    			if (!current || dirty & /*name*/ 128) {
    				attr_dev(input, "name", /*name*/ ctx[7]);
    			}

    			if (dirty & /*size*/ 2) {
    				toggle_class(input, "bx--toggle-input--small", /*size*/ ctx[1] === 'sm');
    			}

    			if (labelText_slot) {
    				if (labelText_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						labelText_slot,
    						labelText_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(labelText_slot_template, /*$$scope*/ ctx[10], dirty, get_labelText_slot_changes),
    						get_labelText_slot_context
    					);
    				}
    			} else {
    				if (labelText_slot_or_fallback && labelText_slot_or_fallback.p && (!current || dirty & /*labelText*/ 32)) {
    					labelText_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (labelA_slot) {
    				if (labelA_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						labelA_slot,
    						labelA_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(labelA_slot_template, /*$$scope*/ ctx[10], dirty, get_labelA_slot_changes),
    						get_labelA_slot_context
    					);
    				}
    			} else {
    				if (labelA_slot_or_fallback && labelA_slot_or_fallback.p && (!current || dirty & /*labelA*/ 8)) {
    					labelA_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (labelB_slot) {
    				if (labelB_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						labelB_slot,
    						labelB_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(labelB_slot_template, /*$$scope*/ ctx[10], dirty, get_labelB_slot_changes),
    						get_labelB_slot_context
    					);
    				}
    			} else {
    				if (labelB_slot_or_fallback && labelB_slot_or_fallback.p && (!current || dirty & /*labelB*/ 16)) {
    					labelB_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (!current || dirty & /*labelText, $$props*/ 544 && label_aria_label_value !== (label_aria_label_value = /*labelText*/ ctx[5]
    			? undefined
    			: /*$$props*/ ctx[9]['aria-label'] || 'Toggle')) {
    				attr_dev(label, "aria-label", label_aria_label_value);
    			}

    			if (!current || dirty & /*id*/ 64) {
    				attr_dev(label, "for", /*id*/ ctx[6]);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 256 && /*$$restProps*/ ctx[8]]));
    			toggle_class(div, "bx--form-item", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(labelText_slot_or_fallback, local);
    			transition_in(labelA_slot_or_fallback, local);
    			transition_in(labelB_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(labelText_slot_or_fallback, local);
    			transition_out(labelA_slot_or_fallback, local);
    			transition_out(labelB_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (labelText_slot_or_fallback) labelText_slot_or_fallback.d(detaching);
    			if (labelA_slot_or_fallback) labelA_slot_or_fallback.d(detaching);
    			if (labelB_slot_or_fallback) labelB_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","toggled","disabled","labelA","labelB","labelText","id","name"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toggle', slots, ['labelText','labelA','labelB']);
    	let { size = "default" } = $$props;
    	let { toggled = false } = $$props;
    	let { disabled = false } = $$props;
    	let { labelA = "Off" } = $$props;
    	let { labelB = "On" } = $$props;
    	let { labelText = "" } = $$props;
    	let { id = "ccs-" + Math.random().toString(36) } = $$props;
    	let { name = undefined } = $$props;
    	const dispatch = createEventDispatcher();

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const change_handler_1 = () => {
    		$$invalidate(0, toggled = !toggled);
    	};

    	const keyup_handler_1 = e => {
    		if (e.key === ' ' || e.key === 'Enter') {
    			e.preventDefault();
    			$$invalidate(0, toggled = !toggled);
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(8, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('size' in $$new_props) $$invalidate(1, size = $$new_props.size);
    		if ('toggled' in $$new_props) $$invalidate(0, toggled = $$new_props.toggled);
    		if ('disabled' in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ('labelA' in $$new_props) $$invalidate(3, labelA = $$new_props.labelA);
    		if ('labelB' in $$new_props) $$invalidate(4, labelB = $$new_props.labelB);
    		if ('labelText' in $$new_props) $$invalidate(5, labelText = $$new_props.labelText);
    		if ('id' in $$new_props) $$invalidate(6, id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate(7, name = $$new_props.name);
    		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		toggled,
    		disabled,
    		labelA,
    		labelB,
    		labelText,
    		id,
    		name,
    		createEventDispatcher,
    		dispatch
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(1, size = $$new_props.size);
    		if ('toggled' in $$props) $$invalidate(0, toggled = $$new_props.toggled);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ('labelA' in $$props) $$invalidate(3, labelA = $$new_props.labelA);
    		if ('labelB' in $$props) $$invalidate(4, labelB = $$new_props.labelB);
    		if ('labelText' in $$props) $$invalidate(5, labelText = $$new_props.labelText);
    		if ('id' in $$props) $$invalidate(6, id = $$new_props.id);
    		if ('name' in $$props) $$invalidate(7, name = $$new_props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toggled*/ 1) {
    			dispatch("toggle", { toggled });
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		toggled,
    		size,
    		disabled,
    		labelA,
    		labelB,
    		labelText,
    		id,
    		name,
    		$$restProps,
    		$$props,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		change_handler,
    		keyup_handler,
    		focus_handler,
    		blur_handler,
    		change_handler_1,
    		keyup_handler_1
    	];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			size: 1,
    			toggled: 0,
    			disabled: 2,
    			labelA: 3,
    			labelB: 4,
    			labelText: 5,
    			id: 6,
    			name: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggled() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggled(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelA() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelA(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelB() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelB(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Toggle$1 = Toggle;

    /* node_modules/carbon-components-svelte/src/Theme/Theme.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const get_default_slot_changes = dirty => ({ theme: dirty & /*theme*/ 1 });
    const get_default_slot_context = ctx => ({ theme: /*theme*/ ctx[0] });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (98:0) {#if persist}
    function create_if_block_2(ctx) {
    	let localstorage;
    	let updating_value;
    	let current;

    	function localstorage_value_binding(value) {
    		/*localstorage_value_binding*/ ctx[9](value);
    	}

    	let localstorage_props = { key: /*persistKey*/ ctx[2] };

    	if (/*theme*/ ctx[0] !== void 0) {
    		localstorage_props.value = /*theme*/ ctx[0];
    	}

    	localstorage = new LocalStorage$1({
    			props: localstorage_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(localstorage, 'value', localstorage_value_binding));

    	const block = {
    		c: function create() {
    			create_component(localstorage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(localstorage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const localstorage_changes = {};
    			if (dirty & /*persistKey*/ 4) localstorage_changes.key = /*persistKey*/ ctx[2];

    			if (!updating_value && dirty & /*theme*/ 1) {
    				updating_value = true;
    				localstorage_changes.value = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			localstorage.$set(localstorage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(localstorage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(localstorage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(localstorage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(98:0) {#if persist}",
    		ctx
    	});

    	return block;
    }

    // (110:30) 
    function create_if_block_1(ctx) {
    	let select_1;
    	let updating_selected;
    	let current;
    	const select_1_spread_levels = [/*select*/ ctx[5]];

    	function select_1_selected_binding(value) {
    		/*select_1_selected_binding*/ ctx[11](value);
    	}

    	let select_1_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < select_1_spread_levels.length; i += 1) {
    		select_1_props = assign(select_1_props, select_1_spread_levels[i]);
    	}

    	if (/*theme*/ ctx[0] !== void 0) {
    		select_1_props.selected = /*theme*/ ctx[0];
    	}

    	select_1 = new Select$1({ props: select_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(select_1, 'selected', select_1_selected_binding));

    	const block = {
    		c: function create() {
    			create_component(select_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(select_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const select_1_changes = (dirty & /*select*/ 32)
    			? get_spread_update(select_1_spread_levels, [get_spread_object(/*select*/ ctx[5])])
    			: {};

    			if (dirty & /*$$scope, select*/ 4128) {
    				select_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_selected && dirty & /*theme*/ 1) {
    				updating_selected = true;
    				select_1_changes.selected = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_selected = false);
    			}

    			select_1.$set(select_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(select_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(110:30) ",
    		ctx
    	});

    	return block;
    }

    // (102:0) {#if render === "toggle"}
    function create_if_block(ctx) {
    	let toggle_1;
    	let current;

    	const toggle_1_spread_levels = [
    		/*toggle*/ ctx[4],
    		{
    			toggled: /*theme*/ ctx[0] === /*toggle*/ ctx[4].themes[1]
    		}
    	];

    	let toggle_1_props = {};

    	for (let i = 0; i < toggle_1_spread_levels.length; i += 1) {
    		toggle_1_props = assign(toggle_1_props, toggle_1_spread_levels[i]);
    	}

    	toggle_1 = new Toggle$1({ props: toggle_1_props, $$inline: true });
    	toggle_1.$on("toggle", /*toggle_handler*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(toggle_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toggle_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toggle_1_changes = (dirty & /*toggle, theme*/ 17)
    			? get_spread_update(toggle_1_spread_levels, [
    					dirty & /*toggle*/ 16 && get_spread_object(/*toggle*/ ctx[4]),
    					{
    						toggled: /*theme*/ ctx[0] === /*toggle*/ ctx[4].themes[1]
    					}
    				])
    			: {};

    			toggle_1.$set(toggle_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggle_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggle_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toggle_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(102:0) {#if render === \\\"toggle\\\"}",
    		ctx
    	});

    	return block;
    }

    // (112:4) {#each select.themes as theme (theme)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let selectitem;
    	let current;

    	selectitem = new SelectItem$1({
    			props: {
    				value: /*theme*/ ctx[0],
    				text: /*themes*/ ctx[6][/*theme*/ ctx[0]]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(selectitem.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(selectitem, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const selectitem_changes = {};
    			if (dirty & /*select*/ 32) selectitem_changes.value = /*theme*/ ctx[0];
    			if (dirty & /*select*/ 32) selectitem_changes.text = /*themes*/ ctx[6][/*theme*/ ctx[0]];
    			selectitem.$set(selectitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(selectitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(112:4) {#each select.themes as theme (theme)}",
    		ctx
    	});

    	return block;
    }

    // (111:2) <Select {...select} bind:selected="{theme}">
    function create_default_slot$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*select*/ ctx[5].themes;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*theme*/ ctx[0];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*select, themes*/ 96) {
    				each_value = /*select*/ ctx[5].themes;
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(111:2) <Select {...select} bind:selected=\\\"{theme}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let current_block_type_index;
    	let if_block1;
    	let t1;
    	let current;
    	let if_block0 = /*persist*/ ctx[1] && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*render*/ ctx[3] === "toggle") return 0;
    		if (/*render*/ ctx[3] === "select") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*persist*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*persist*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, theme*/ 4097)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[12],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[12])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Theme', slots, ['default']);
    	let { theme = "white" } = $$props;
    	let { tokens = {} } = $$props;
    	let { persist = false } = $$props;
    	let { persistKey = "theme" } = $$props;
    	let { render = undefined } = $$props;

    	let { toggle = {
    		themes: ["white", "g100"],
    		labelA: "",
    		labelB: "",
    		labelText: "Dark mode",
    		hideLabel: false
    	} } = $$props;

    	/** @type {Record<CarbonTheme, string>} */
    	const themes = {
    		white: "White",
    		g10: "Gray 10",
    		g80: "Gray 80",
    		g90: "Gray 90",
    		g100: "Gray 100"
    	};

    	/** @type {CarbonTheme} */
    	const themeKeys = Object.keys(themes);

    	let { select = {
    		themes: themeKeys,
    		labelText: "Themes",
    		hideLabel: false
    	} } = $$props;

    	const dispatch = createEventDispatcher();
    	const writable_props = ['theme', 'tokens', 'persist', 'persistKey', 'render', 'toggle', 'select'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Theme> was created with unknown prop '${key}'`);
    	});

    	function localstorage_value_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	const toggle_handler = ({ detail }) => {
    		$$invalidate(0, theme = detail.toggled ? toggle.themes[1] : toggle.themes[0]);
    	};

    	function select_1_selected_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	$$self.$$set = $$props => {
    		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
    		if ('tokens' in $$props) $$invalidate(7, tokens = $$props.tokens);
    		if ('persist' in $$props) $$invalidate(1, persist = $$props.persist);
    		if ('persistKey' in $$props) $$invalidate(2, persistKey = $$props.persistKey);
    		if ('render' in $$props) $$invalidate(3, render = $$props.render);
    		if ('toggle' in $$props) $$invalidate(4, toggle = $$props.toggle);
    		if ('select' in $$props) $$invalidate(5, select = $$props.select);
    		if ('$$scope' in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		tokens,
    		persist,
    		persistKey,
    		render,
    		toggle,
    		themes,
    		themeKeys,
    		select,
    		createEventDispatcher,
    		Toggle: Toggle$1,
    		Select: Select$1,
    		SelectItem: SelectItem$1,
    		LocalStorage: LocalStorage$1,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
    		if ('tokens' in $$props) $$invalidate(7, tokens = $$props.tokens);
    		if ('persist' in $$props) $$invalidate(1, persist = $$props.persist);
    		if ('persistKey' in $$props) $$invalidate(2, persistKey = $$props.persistKey);
    		if ('render' in $$props) $$invalidate(3, render = $$props.render);
    		if ('toggle' in $$props) $$invalidate(4, toggle = $$props.toggle);
    		if ('select' in $$props) $$invalidate(5, select = $$props.select);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tokens, theme*/ 129) {
    			if (typeof window !== "undefined") {
    				Object.entries(tokens).forEach(([token, value]) => {
    					document.documentElement.style.setProperty(`--cds-${token}`, value);
    				});

    				if (theme in themes) {
    					document.documentElement.setAttribute("theme", theme);
    					dispatch("update", { theme });
    				} else {
    					console.warn(`[Theme.svelte] invalid theme "${theme}". Value must be one of: ${JSON.stringify(Object.keys(themes))}`);
    				}
    			}
    		}
    	};

    	return [
    		theme,
    		persist,
    		persistKey,
    		render,
    		toggle,
    		select,
    		themes,
    		tokens,
    		slots,
    		localstorage_value_binding,
    		toggle_handler,
    		select_1_selected_binding,
    		$$scope
    	];
    }

    class Theme extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			theme: 0,
    			tokens: 7,
    			persist: 1,
    			persistKey: 2,
    			render: 3,
    			toggle: 4,
    			select: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Theme",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get theme() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tokens() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tokens(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persist() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persist(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persistKey() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persistKey(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get render() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set render(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<Theme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<Theme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Theme$1 = Theme;

    /* src/App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (74:3) <Row>
    function create_default_slot_6(ctx) {
    	let textarea;
    	let updating_value;
    	let current;

    	function textarea_value_binding(value) {
    		/*textarea_value_binding*/ ctx[7](value);
    	}

    	let textarea_props = { placeholder: /*multi_input*/ ctx[1] };

    	if (/*multi_input*/ ctx[1] !== void 0) {
    		textarea_props.value = /*multi_input*/ ctx[1];
    	}

    	textarea = new TextArea$1({ props: textarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	const block = {
    		c: function create() {
    			create_component(textarea.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textarea, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textarea_changes = {};
    			if (dirty & /*multi_input*/ 2) textarea_changes.placeholder = /*multi_input*/ ctx[1];

    			if (!updating_value && dirty & /*multi_input*/ 2) {
    				updating_value = true;
    				textarea_changes.value = /*multi_input*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			textarea.$set(textarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textarea, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(74:3) <Row>",
    		ctx
    	});

    	return block;
    }

    // (84:4) <Button kind="primary" outline on:click={getResult}>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Post");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(84:4) <Button kind=\\\"primary\\\" outline on:click={getResult}>",
    		ctx
    	});

    	return block;
    }

    // (82:3) <ButtonSet stacked=true>
    function create_default_slot_4(ctx) {
    	let checkbox;
    	let updating_async_check_box_bool;
    	let t;
    	let button;
    	let current;

    	function checkbox_async_check_box_bool_binding(value) {
    		/*checkbox_async_check_box_bool_binding*/ ctx[8](value);
    	}

    	let checkbox_props = { labelText: "Async request" };

    	if (/*async_check_box_bool*/ ctx[2] !== void 0) {
    		checkbox_props.async_check_box_bool = /*async_check_box_bool*/ ctx[2];
    	}

    	checkbox = new Checkbox$1({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'async_check_box_bool', checkbox_async_check_box_bool_binding));

    	button = new Button$1({
    			props: {
    				kind: "primary",
    				outline: true,
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*getResult*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(checkbox.$$.fragment);
    			t = space();
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};

    			if (!updating_async_check_box_bool && dirty & /*async_check_box_bool*/ 4) {
    				updating_async_check_box_bool = true;
    				checkbox_changes.async_check_box_bool = /*async_check_box_bool*/ ctx[2];
    				add_flush_callback(() => updating_async_check_box_bool = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(82:3) <ButtonSet stacked=true>",
    		ctx
    	});

    	return block;
    }

    // (73:2) <Column>
    function create_default_slot_3(ctx) {
    	let row0;
    	let t0;
    	let row1;
    	let t1;
    	let fileuploader;
    	let t2;
    	let buttonset;
    	let current;

    	row0 = new Row$1({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row1 = new Row$1({ $$inline: true });

    	fileuploader = new FileUploader$1({
    			props: {
    				multiple: true,
    				buttonLabel: "Add files",
    				status: "complete",
    				disabled: "true"
    			},
    			$$inline: true
    		});

    	buttonset = new ButtonSet$1({
    			props: {
    				stacked: "true",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row0.$$.fragment);
    			t0 = space();
    			create_component(row1.$$.fragment);
    			t1 = space();
    			create_component(fileuploader.$$.fragment);
    			t2 = space();
    			create_component(buttonset.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fileuploader, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(buttonset, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row0_changes = {};

    			if (dirty & /*$$scope, multi_input*/ 8194) {
    				row0_changes.$$scope = { dirty, ctx };
    			}

    			row0.$set(row0_changes);
    			const buttonset_changes = {};

    			if (dirty & /*$$scope, async_check_box_bool*/ 8196) {
    				buttonset_changes.$$scope = { dirty, ctx };
    			}

    			buttonset.$set(buttonset_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);
    			transition_in(row1.$$.fragment, local);
    			transition_in(fileuploader.$$.fragment, local);
    			transition_in(buttonset.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			transition_out(fileuploader.$$.fragment, local);
    			transition_out(buttonset.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(row1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fileuploader, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(buttonset, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(73:2) <Column>",
    		ctx
    	});

    	return block;
    }

    // (91:2) <Column>
    function create_default_slot_2(ctx) {
    	let copybutton;
    	let updating_text;
    	let t0;
    	let textarea;
    	let updating_value;
    	let t1;
    	let codesnippet;
    	let current;

    	function copybutton_text_binding(value) {
    		/*copybutton_text_binding*/ ctx[9](value);
    	}

    	let copybutton_props = { feedback: "Copied to clipboard" };

    	if (/*result*/ ctx[3] !== void 0) {
    		copybutton_props.text = /*result*/ ctx[3];
    	}

    	copybutton = new CopyButton$1({ props: copybutton_props, $$inline: true });
    	binding_callbacks.push(() => bind(copybutton, 'text', copybutton_text_binding));

    	function textarea_value_binding_1(value) {
    		/*textarea_value_binding_1*/ ctx[10](value);
    	}

    	let textarea_props = {
    		light: true,
    		readonly: true,
    		placeholder: /*result*/ ctx[3]
    	};

    	if (/*result*/ ctx[3] !== void 0) {
    		textarea_props.value = /*result*/ ctx[3];
    	}

    	textarea = new TextArea$1({ props: textarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding_1));

    	codesnippet = new CodeSnippet$1({
    			props: {
    				wrapText: true,
    				type: "multi",
    				code: /*curl_text*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(copybutton.$$.fragment);
    			t0 = space();
    			create_component(textarea.$$.fragment);
    			t1 = space();
    			create_component(codesnippet.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(copybutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(textarea, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(codesnippet, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const copybutton_changes = {};

    			if (!updating_text && dirty & /*result*/ 8) {
    				updating_text = true;
    				copybutton_changes.text = /*result*/ ctx[3];
    				add_flush_callback(() => updating_text = false);
    			}

    			copybutton.$set(copybutton_changes);
    			const textarea_changes = {};
    			if (dirty & /*result*/ 8) textarea_changes.placeholder = /*result*/ ctx[3];

    			if (!updating_value && dirty & /*result*/ 8) {
    				updating_value = true;
    				textarea_changes.value = /*result*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			textarea.$set(textarea_changes);
    			const codesnippet_changes = {};
    			if (dirty & /*curl_text*/ 16) codesnippet_changes.code = /*curl_text*/ ctx[4];
    			codesnippet.$set(codesnippet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copybutton.$$.fragment, local);
    			transition_in(textarea.$$.fragment, local);
    			transition_in(codesnippet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copybutton.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(codesnippet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(copybutton, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(textarea, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(codesnippet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(91:2) <Column>",
    		ctx
    	});

    	return block;
    }

    // (72:1) <Row padding=true>
    function create_default_slot_1(ctx) {
    	let column0;
    	let t;
    	let column1;
    	let current;

    	column0 = new Column$1({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	column1 = new Column$1({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(column0.$$.fragment);
    			t = space();
    			create_component(column1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(column0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(column1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const column0_changes = {};

    			if (dirty & /*$$scope, async_check_box_bool, multi_input*/ 8198) {
    				column0_changes.$$scope = { dirty, ctx };
    			}

    			column0.$set(column0_changes);
    			const column1_changes = {};

    			if (dirty & /*$$scope, curl_text, result*/ 8216) {
    				column1_changes.$$scope = { dirty, ctx };
    			}

    			column1.$set(column1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(column0.$$.fragment, local);
    			transition_in(column1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(column0.$$.fragment, local);
    			transition_out(column1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(column0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(column1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(72:1) <Row padding=true>",
    		ctx
    	});

    	return block;
    }

    // (71:0) <Grid padding=true>
    function create_default_slot(ctx) {
    	let row;
    	let current;

    	row = new Row$1({
    			props: {
    				padding: "true",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, curl_text, result, async_check_box_bool, multi_input*/ 8222) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(71:0) <Grid padding=true>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link;
    	let t0;
    	let theme_1;
    	let updating_theme;
    	let t1;
    	let grid;
    	let current;

    	function theme_1_theme_binding(value) {
    		/*theme_1_theme_binding*/ ctx[6](value);
    	}

    	let theme_1_props = {};

    	if (/*theme*/ ctx[0] !== void 0) {
    		theme_1_props.theme = /*theme*/ ctx[0];
    	}

    	theme_1 = new Theme$1({ props: theme_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(theme_1, 'theme', theme_1_theme_binding));

    	grid = new Grid$1({
    			props: {
    				padding: "true",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			create_component(theme_1.$$.fragment);
    			t1 = space();
    			create_component(grid.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://unpkg.com/carbon-components-svelte@0.30.0/css/g10.css");
    			add_location(link, file, 1, 13, 14);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			mount_component(theme_1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const theme_1_changes = {};

    			if (!updating_theme && dirty & /*theme*/ 1) {
    				updating_theme = true;
    				theme_1_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			theme_1.$set(theme_1_changes);
    			const grid_changes = {};

    			if (dirty & /*$$scope, curl_text, result, async_check_box_bool, multi_input*/ 8222) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(theme_1.$$.fragment, local);
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(theme_1.$$.fragment, local);
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			destroy_component(theme_1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let theme = "g90";
    	let multi_input = 'Loading ...';
    	let async_check_box_bool = false;
    	let result = 'Post to see result';
    	let curl_text = 'Loading ...';

    	let JSON_CURL_TEXT = `# Sync request to fastdeploy
curl -d 'EXAMPLE' -H "Content-Type: application/json" -X POST "http://localhost:8080/infer"

# Async request to fastdeploy
curl -d 'EXAMPLE' -H "Content-Type: application/json" -X POST "http://localhost:8080/infer?async=true"

# Result for async request
curl -d '{"unique_id": "REQUEST_ID"}' -H "Content-Type: application/json" -X POST "http://localhost:8080/res"`;

    	let META = {};

    	onMount(async () => {
    		fetch("/meta").then(response => response.json()).then(data => {
    			META = data;
    			$$invalidate(1, multi_input = JSON.stringify(data["example"], null, 4));

    			if (!META['is_file_input']) {
    				$$invalidate(4, curl_text = JSON_CURL_TEXT.replaceAll('EXAMPLE', JSON.stringify(data["example"])));
    			}

    			console.log("META", META);
    		}).catch(error => {
    			console.log(error);
    			return [];
    		});
    	});

    	async function getResult() {
    		console.log(multi_input);
    		$$invalidate(4, curl_text = JSON_CURL_TEXT.replaceAll('EXAMPLE', JSON.stringify(JSON.parse(multi_input))));

    		const res = await fetch('/infer', {
    			method: 'POST',
    			headers: {
    				'Accept': 'application/json',
    				'Content-Type': 'application/json'
    			},
    			body: JSON.stringify({ "data": JSON.parse(multi_input) })
    		});

    		const json = await res.json();
    		$$invalidate(3, result = JSON.stringify(json['prediction'], null, 4));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function theme_1_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function textarea_value_binding(value) {
    		multi_input = value;
    		$$invalidate(1, multi_input);
    	}

    	function checkbox_async_check_box_bool_binding(value) {
    		async_check_box_bool = value;
    		$$invalidate(2, async_check_box_bool);
    	}

    	function copybutton_text_binding(value) {
    		result = value;
    		$$invalidate(3, result);
    	}

    	function textarea_value_binding_1(value) {
    		result = value;
    		$$invalidate(3, result);
    	}

    	$$self.$capture_state = () => ({
    		CopyButton: CopyButton$1,
    		Theme: Theme$1,
    		ButtonSet: ButtonSet$1,
    		RadioButtonGroup: RadioButtonGroup$1,
    		RadioButton: RadioButton$1,
    		Checkbox: Checkbox$1,
    		Button: Button$1,
    		TextArea: TextArea$1,
    		Grid: Grid$1,
    		Column: Column$1,
    		Row: Row$1,
    		FileUploader: FileUploader$1,
    		CodeSnippet: CodeSnippet$1,
    		theme,
    		onMount,
    		multi_input,
    		async_check_box_bool,
    		result,
    		curl_text,
    		JSON_CURL_TEXT,
    		META,
    		getResult
    	});

    	$$self.$inject_state = $$props => {
    		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
    		if ('multi_input' in $$props) $$invalidate(1, multi_input = $$props.multi_input);
    		if ('async_check_box_bool' in $$props) $$invalidate(2, async_check_box_bool = $$props.async_check_box_bool);
    		if ('result' in $$props) $$invalidate(3, result = $$props.result);
    		if ('curl_text' in $$props) $$invalidate(4, curl_text = $$props.curl_text);
    		if ('JSON_CURL_TEXT' in $$props) JSON_CURL_TEXT = $$props.JSON_CURL_TEXT;
    		if ('META' in $$props) META = $$props.META;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		multi_input,
    		async_check_box_bool,
    		result,
    		curl_text,
    		getResult,
    		theme_1_theme_binding,
    		textarea_value_binding,
    		checkbox_async_check_box_bool_binding,
    		copybutton_text_binding,
    		textarea_value_binding_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
