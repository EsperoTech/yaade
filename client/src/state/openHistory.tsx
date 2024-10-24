type OpenHistoryItem = {
  type: 'collection' | 'request' | 'script';
  id: number;
};

type OpenHistory = {
  items: OpenHistoryItem[];
  index: number;
};

const defaultOpenHistory: OpenHistory = {
  items: [],
  index: -1,
};

enum OpenHistoryActionType {
  PUSH = 'PUSH',
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
}

type PushAction = {
  type: OpenHistoryActionType.PUSH;
  item: OpenHistoryItem;
};

type ForwardAction = {
  type: OpenHistoryActionType.FORWARD;
};

type BackwardAction = {
  type: OpenHistoryActionType.BACKWARD;
};

function push(state: OpenHistory, item: OpenHistoryItem): OpenHistory {
  if (state.index === state.items.length - 1) {
    return {
      items: [...state.items, item],
      index: state.index + 1,
    };
  }
  if (
    state.items[state.index + 1].id === item.id &&
    state.items[state.index + 1].type === item.type
  ) {
    return {
      items: [...state.items],
      index: state.index + 1,
    };
  }
  return {
    items: [...state.items.slice(0, state.index + 1), item],
    index: state.index + 1,
  };
}

function forward(state: OpenHistory): OpenHistory {
  return {
    items: state.items,
    index: Math.min(state.index + 1, state.items.length - 1),
  };
}

function backward(state: OpenHistory): OpenHistory {
  return {
    items: state.items,
    index: Math.max(state.index - 1, 0),
  };
}

type OpenHistoryAction = PushAction | ForwardAction | BackwardAction;

function openHistoryReducer(
  state: OpenHistory | undefined = defaultOpenHistory,
  action: OpenHistoryAction,
) {
  switch (action.type) {
    case OpenHistoryActionType.PUSH:
      return push(state, action.item);
    case OpenHistoryActionType.FORWARD:
      return forward(state);
    case OpenHistoryActionType.BACKWARD:
      return backward(state);
    default:
      console.error('Invalid action type', action);
      return state;
  }
}

export type { OpenHistory, OpenHistoryAction };

export { defaultOpenHistory, OpenHistoryActionType, openHistoryReducer };
