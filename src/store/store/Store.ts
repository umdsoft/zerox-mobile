import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { rootReducer } from '../reducers';

/**
 * Redux store configuration with middleware for React Native
 * Serializable check is disabled for compatibility with React Native navigation
 */
export const Store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false }),
});

// ============================================================================
// TypeScript Type Definitions
// ============================================================================

/**
 * Root state type inferred from the store
 * Use this type for accessing state in selectors and components
 */
export type RootState = ReturnType<typeof Store.getState>;

/**
 * App dispatch type inferred from the store
 * Use this type for dispatching actions with proper typing
 */
export type AppDispatch = typeof Store.dispatch;

// ============================================================================
// Typed Hooks
// ============================================================================

/**
 * Typed version of useDispatch hook
 * Use this throughout the app instead of plain useDispatch
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Use this throughout the app instead of plain useSelector
 * @example
 * const user = useAppSelector(state => state.user);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
