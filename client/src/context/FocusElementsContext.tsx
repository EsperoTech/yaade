import { createContext, FunctionComponent, useState } from 'react';

interface IFocusElementsContext {
  uriBarView: any;
  setUriBarView: any;
  bodyEditorView: any;
  setBodyEditorView: any;
  requestScriptEditorView: any;
  setRequestScriptEditorView: any;
  responseScriptEditorView: any;
  setResponseScriptEditorView: any;
  i: number;
  setI: any;
}

const FocusElementsContext = createContext<IFocusElementsContext>({
  uriBarView: null,
  setUriBarView: () => {},
  bodyEditorView: null,
  setBodyEditorView: () => {},
  requestScriptEditorView: null,
  setRequestScriptEditorView: () => {},
  responseScriptEditorView: null,
  setResponseScriptEditorView: () => {},
  i: 0,
  setI: () => {},
});

const FocusElementsProvider: FunctionComponent = ({ children }) => {
  const [uriBarView, setUriBarView] = useState<any>();
  const [bodyEditorView, setBodyEditorView] = useState<any>();
  const [requestScriptEditorView, setRequestScriptEditorView] = useState<any>();
  const [responseScriptEditorView, setResponseScriptEditorView] = useState<any>();
  const [i, setI] = useState(0);

  return (
    <FocusElementsContext.Provider
      value={{
        uriBarView,
        setUriBarView,
        bodyEditorView,
        setBodyEditorView,
        requestScriptEditorView,
        setRequestScriptEditorView,
        responseScriptEditorView,
        setResponseScriptEditorView,
        i,
        setI,
      }}
    >
      {children}
    </FocusElementsContext.Provider>
  );
};

export { FocusElementsContext };

export default FocusElementsProvider;
