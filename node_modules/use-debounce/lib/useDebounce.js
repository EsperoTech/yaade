"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var useDebouncedCallback_1 = require("./useDebouncedCallback");
function valueEquality(left, right) {
    return left === right;
}
function adjustFunctionValueOfSetState(value) {
    return typeof value === 'function' ? function () { return value; } : value;
}
function useStateIgnoreCallback(initialState) {
    var _a = react_1.useState(adjustFunctionValueOfSetState(initialState)), state = _a[0], setState = _a[1];
    var setStateIgnoreCallback = react_1.useCallback(function (value) { return setState(adjustFunctionValueOfSetState(value)); }, []);
    return [state, setStateIgnoreCallback];
}
function useDebounce(value, delay, options) {
    var eq = (options && options.equalityFn) || valueEquality;
    var _a = useStateIgnoreCallback(value), state = _a[0], dispatch = _a[1];
    var debounced = useDebouncedCallback_1.default(react_1.useCallback(function (value) { return dispatch(value); }, [dispatch]), delay, options);
    var previousValue = react_1.useRef(value);
    if (!eq(previousValue.current, value)) {
        debounced(value);
        previousValue.current = value;
    }
    return [state, debounced];
}
exports.default = useDebounce;
