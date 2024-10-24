import { createContext, FunctionComponent, useState } from 'react';

interface ICurrentModalContext {
  currentModalState?: string;
  currentModalType?: string;
  currentModalId?: number;
  setCurrentModal: (modal: string, type: string, id: number) => void;
  clearCurrentModal: () => void;
}

const CurrentModalContext = createContext<ICurrentModalContext>({
  setCurrentModal: () => {},
  clearCurrentModal: () => {},
});

type CurrentModalState = {
  currentModalState?: string;
  currentModalType?: string;
  currentModalId?: number;
};

const CurrentModalProvider: FunctionComponent = ({ children }) => {
  const [state, setState] = useState<CurrentModalState>({});

  return (
    <CurrentModalContext.Provider
      value={{
        currentModalState: state.currentModalState,
        currentModalType: state.currentModalType,
        currentModalId: state.currentModalId,
        setCurrentModal: (
          currentModal: string,
          currentModalType: string,
          currentModalId: number,
        ) => {
          setState({ currentModalState: currentModal, currentModalType, currentModalId });
        },
        clearCurrentModal: () => {
          setState({});
        },
      }}
    >
      {children}
    </CurrentModalContext.Provider>
  );
};

export { CurrentModalContext };

export default CurrentModalProvider;
