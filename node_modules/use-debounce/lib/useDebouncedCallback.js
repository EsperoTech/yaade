"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked, or until the next browser frame is drawn. The debounced function
 * comes with a `cancel` method to cancel delayed `func` invocations and a
 * `flush` method to immediately invoke them. Provide `options` to indicate
 * whether `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. The `func` is invoked with the last arguments provided to the
 * debounced function. Subsequent calls to the debounced function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
 * invocation will be deferred until the next frame is drawn (typically about
 * 16ms).
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `debounce` and `throttle`.
 *
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0]
 *  The number of milliseconds to delay; if omitted, `requestAnimationFrame` is
 *  used (if available, otherwise it will be setTimeout(...,0)).
 * @param {Object} [options={}] The options object.
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.leading=false]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {number} [options.maxWait]
 *  Specify invoking on the trailing edge of the timeout.
 * @param {boolean} [options.trailing=true]
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * const resizeHandler = useDebouncedCallback(calculateLayout, 150);
 * window.addEventListener('resize', resizeHandler)
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * const clickHandler = useDebouncedCallback(sendMail, 300, {
 *   leading: true,
 *   trailing: false,
 * })
 * <button onClick={clickHandler}>click me</button>
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * const debounced = useDebouncedCallback(batchLog, 250, { 'maxWait': 1000 })
 * const source = new EventSource('/stream')
 * source.addEventListener('message', debounced)
 *
 * // Cancel the trailing debounced invocation.
 * window.addEventListener('popstate', debounced.cancel)
 *
 * // Check for pending invocations.
 * const status = debounced.pending() ? "Pending..." : "Ready"
 */
function useDebouncedCallback(func, wait, options) {
    var _this = this;
    var lastCallTime = react_1.useRef(null);
    var lastInvokeTime = react_1.useRef(0);
    var timerId = react_1.useRef(null);
    var lastArgs = react_1.useRef([]);
    var lastThis = react_1.useRef();
    var result = react_1.useRef();
    var funcRef = react_1.useRef(func);
    var mounted = react_1.useRef(true);
    funcRef.current = func;
    // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
    var useRAF = !wait && wait !== 0 && typeof window !== 'undefined';
    if (typeof func !== 'function') {
        throw new TypeError('Expected a function');
    }
    wait = +wait || 0;
    options = options || {};
    var leading = !!options.leading;
    var trailing = 'trailing' in options ? !!options.trailing : true; // `true` by default
    var maxing = 'maxWait' in options;
    var maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : null;
    react_1.useEffect(function () {
        mounted.current = true;
        return function () {
            mounted.current = false;
        };
    }, []);
    // You may have a question, why we have so many code under the useMemo definition.
    //
    // This was made as we want to escape from useCallback hell and
    // not to initialize a number of functions each time useDebouncedCallback is called.
    //
    // It means that we have less garbage for our GC calls which improves performance.
    // Also, it makes this library smaller.
    //
    // And the last reason, that the code without lots of useCallback with deps is easier to read.
    // You have only one place for that.
    var debounced = react_1.useMemo(function () {
        var invokeFunc = function (time) {
            var args = lastArgs.current;
            var thisArg = lastThis.current;
            lastArgs.current = lastThis.current = null;
            lastInvokeTime.current = time;
            return (result.current = funcRef.current.apply(thisArg, args));
        };
        var startTimer = function (pendingFunc, wait) {
            if (useRAF)
                cancelAnimationFrame(timerId.current);
            timerId.current = useRAF ? requestAnimationFrame(pendingFunc) : setTimeout(pendingFunc, wait);
        };
        var shouldInvoke = function (time) {
            if (!mounted.current)
                return false;
            var timeSinceLastCall = time - lastCallTime.current;
            var timeSinceLastInvoke = time - lastInvokeTime.current;
            // Either this is the first call, activity has stopped and we're at the
            // trailing edge, the system time has gone backwards and we're treating
            // it as the trailing edge, or we've hit the `maxWait` limit.
            return (!lastCallTime.current ||
                timeSinceLastCall >= wait ||
                timeSinceLastCall < 0 ||
                (maxing && timeSinceLastInvoke >= maxWait));
        };
        var trailingEdge = function (time) {
            timerId.current = null;
            // Only invoke if we have `lastArgs` which means `func` has been
            // debounced at least once.
            if (trailing && lastArgs.current) {
                return invokeFunc(time);
            }
            lastArgs.current = lastThis.current = null;
            return result.current;
        };
        var timerExpired = function () {
            var time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            // https://github.com/xnimorz/use-debounce/issues/97
            if (!mounted.current) {
                return;
            }
            // Remaining wait calculation
            var timeSinceLastCall = time - lastCallTime.current;
            var timeSinceLastInvoke = time - lastInvokeTime.current;
            var timeWaiting = wait - timeSinceLastCall;
            var remainingWait = maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
            // Restart the timer
            startTimer(timerExpired, remainingWait);
        };
        var func = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var time = Date.now();
            var isInvoking = shouldInvoke(time);
            lastArgs.current = args;
            lastThis.current = _this;
            lastCallTime.current = time;
            if (isInvoking) {
                if (!timerId.current && mounted.current) {
                    // Reset any `maxWait` timer.
                    lastInvokeTime.current = lastCallTime.current;
                    // Start the timer for the trailing edge.
                    startTimer(timerExpired, wait);
                    // Invoke the leading edge.
                    return leading ? invokeFunc(lastCallTime.current) : result.current;
                }
                if (maxing) {
                    // Handle invocations in a tight loop.
                    startTimer(timerExpired, wait);
                    return invokeFunc(lastCallTime.current);
                }
            }
            if (!timerId.current) {
                startTimer(timerExpired, wait);
            }
            return result.current;
        };
        func.cancel = function () {
            if (timerId.current) {
                useRAF ? cancelAnimationFrame(timerId.current) : clearTimeout(timerId.current);
            }
            lastInvokeTime.current = 0;
            lastArgs.current = lastCallTime.current = lastThis.current = timerId.current = null;
        };
        func.isPending = function () {
            return !!timerId.current;
        };
        func.flush = function () {
            return !timerId.current ? result.current : trailingEdge(Date.now());
        };
        return func;
    }, [leading, maxing, wait, maxWait, trailing, useRAF]);
    return debounced;
}
exports.default = useDebouncedCallback;
