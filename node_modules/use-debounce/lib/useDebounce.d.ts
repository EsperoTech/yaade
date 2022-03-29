import { ControlFunctions } from './useDebouncedCallback';
export default function useDebounce<T>(value: T, delay: number, options?: {
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
    equalityFn?: (left: T, right: T) => boolean;
}): [T, ControlFunctions];
