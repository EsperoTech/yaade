import { useCallback, useRef, useState } from 'react';
import useDebouncedCallback from './useDebouncedCallback';
function valueEquality(left, right) {
    return left === right;
}
function adjustFunctionValueOfSetState(value) {
    return typeof value === 'function' ? function () { return value; } : value;
}
function useStateIgnoreCallback(initialState) {
    var _a = useState(adjustFunctionValueOfSetState(initialState)), state = _a[0], setState = _a[1];
    var setStateIgnoreCallback = useCallback(function (value) { return setState(adjustFunctionValueOfSetState(value)); }, []);
    return [state, setStateIgnoreCallback];
}
export default function useDebounce(value, delay, options) {
    var eq = (options && options.equalityFn) || valueEquality;
    var _a = useStateIgnoreCallback(value), state = _a[0], dispatch = _a[1];
    var debounced = useDebouncedCallback(useCallback(function (value) { return dispatch(value); }, [dispatch]), delay, options);
    var previousValue = useRef(value);
    if (!eq(previousValue.current, value)) {
        debounced(value);
        previousValue.current = value;
    }
    return [state, debounced];
}
