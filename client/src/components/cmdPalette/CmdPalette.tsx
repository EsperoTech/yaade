import React, { useContext, useState } from 'react';
import CommandPalette, { Command } from 'react-command-palette';

import { CurrentModalContext } from '../../context/CurrentModalContext';
import { FocusElementsContext } from '../../context/FocusElementsContext';
import Collection, { CurrentCollection } from '../../model/Collection';
import { CurrentRestRequest, RestRequest, WebsocketRequest } from '../../model/Request';
import Script, { CurrentScript } from '../../model/Script';
import {
  OpenHistory,
  OpenHistoryAction,
  OpenHistoryActionType,
} from '../../state/openHistory';
import { useKeyPress } from '../../utils/useKeyPress';

type CmdPaletteProps = {
  collections: Collection[];
  currentRequest?: CurrentRestRequest;
  currentCollection?: CurrentCollection;
  currentScript?: CurrentScript;
  selectCollection: any;
  selectRequest: any;
  selectScript: any;
  setCollectionPanelTabIndex: (index: number) => void;
  setRequestPanelTabIndex: (index: number) => void;
  openHistory: OpenHistory;
  dispatchOpenHistory: React.Dispatch<OpenHistoryAction>;
};

function CmdPalette({
  collections,
  currentRequest,
  currentCollection,
  currentScript,
  selectCollection,
  selectRequest,
  selectScript,
  setCollectionPanelTabIndex,
  setRequestPanelTabIndex,
  openHistory,
  dispatchOpenHistory,
}: CmdPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentModal: setModal } = useContext(CurrentModalContext);
  const { uriBarView } = useContext(FocusElementsContext);
  useKeyPress(() => setIsOpen((open) => !open), 'p', true, true);

  function getCurrentCollectionId() {
    return (
      currentCollection?.id || currentRequest?.collectionId || currentScript?.collectionId
    );
  }
  useKeyPress(() => setIsOpen(true), 'p', true, true);

  async function openCollectionPanelTab(index: number) {
    const collectionId = getCurrentCollectionId();
    if (!collectionId) return;
    await selectCollection.current(collectionId);
    setCollectionPanelTabIndex(index);
  }

  async function openRequestPanelTab(index: number, focusElement?: any) {
    const requestId = currentRequest?.id;
    if (!requestId) return;
    await selectRequest.current(requestId);
    setRequestPanelTabIndex(index);
    if (focusElement) {
      focusElement.focus();
    }
  }

  const commands = [];

  if (
    currentCollection?.id ||
    (currentRequest?.id && currentRequest?.id !== -1) ||
    currentScript?.id
  ) {
    const collectionCommands: Command[] = [
      {
        id: commands.length,
        name: 'Open Current Collection',
        command: () => openCollectionPanelTab(0),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Current Environment',
        command: () => openCollectionPanelTab(1),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Collection Headers',
        command: () => openCollectionPanelTab(2),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Collection Auth',
        command: () => openCollectionPanelTab(3),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Collection Request Script',
        command: () => openCollectionPanelTab(4),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Collection Response Script',
        command: () => openCollectionPanelTab(5),
        color: '',
      },
      {
        id: commands.length,
        name: 'Open Collection Settings',
        command: () => openCollectionPanelTab(6),
        color: '',
      },
      {
        id: commands.length,
        name: 'New Request',
        command: () => {
          setModal('newRequest', 'collection', getCurrentCollectionId() ?? 0);
        },
        color: '',
      },
    ];
    commands.push(...collectionCommands);
  }

  if (openHistory.index !== openHistory.items.length - 1) {
    commands.push({
      id: commands.length,
      name: 'History: Forward',
      command: () => {
        const item = openHistory.items[openHistory.index + 1];
        if (!item) {
          return;
        }
        dispatchOpenHistory({ type: OpenHistoryActionType.FORWARD });
        if (item.type === 'request') {
          selectRequest.current(item.id, false);
        } else if (item.type === 'collection') {
          selectCollection.current(item.id, false);
        } else if (item.type === 'script') {
          selectScript.current(item.id, false);
        }
      },
      color: '',
    });
  }

  if (openHistory.index > 0) {
    commands.push({
      id: commands.length,
      name: 'History: Backward',
      command: () => {
        const item = openHistory.items[openHistory.index - 1];
        if (!item) {
          return;
        }
        dispatchOpenHistory({ type: OpenHistoryActionType.BACKWARD });
        if (item.type === 'request') {
          selectRequest.current(item.id, false);
        } else if (item.type === 'collection') {
          selectCollection.current(item.id, false);
        } else if (item.type === 'script') {
          selectScript.current(item.id, false);
        }
      },
      color: '',
    });
  }

  if (currentRequest) {
    const requestCommands = [
      // {
      //   id: commands.length,
      //   name: 'Edit Request Description',
      //   command: () => openRequestPanelTab(0),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Request Parameters',
      //   command: () => openRequestPanelTab(1),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Request Headers',
      //   command: () => openRequestPanelTab(2),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Request Body',
      //   command: () => openRequestPanelTab(3, bodyEditorView),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Request Auth',
      //   command: () => openRequestPanelTab(4),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Request Script',
      //   command: () => openRequestPanelTab(5, requestScriptEditorView),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Edit Response Script',
      //   command: () => openRequestPanelTab(6, responseScriptEditorView),
      //   color: '',
      // },
      // {
      //   id: commands.length,
      //   name: 'Open Request Code',
      //   command: () => openRequestPanelTab(7),
      //   color: '',
      // },
      {
        id: commands.length,
        name: 'Edit Request URL',
        command: () => {
          console.log('edit request url', uriBarView);
          if (uriBarView) {
            uriBarView.focus();
          }
        },
        color: '',
      },
    ];
    commands.push(...requestCommands);
  }

  function getFlattenedCollections(collections: Collection[]): Collection[] {
    if (!collections) return [];
    const res = [...collections];
    for (const c of collections) {
      res.push(...getFlattenedCollections(c.children));
    }
    return res;
  }
  function getFlattenedRequests(
    collections: Collection[],
  ): (RestRequest | WebsocketRequest)[] {
    return getFlattenedCollections(collections).flatMap((c) => c.requests ?? []);
  }
  function getFlattenedScripts(collections: Collection[]): Script[] {
    return getFlattenedCollections(collections).flatMap((c) => c.scripts ?? []);
  }

  const openCollectionCommands = getFlattenedCollections(collections).map(
    (c, i) =>
      ({
        id: commands.length + i,
        name: `Open Collection: ${c.data.name} [${c.id}]`,
        command: () => selectCollection.current(c.id),
        color: '',
      } as Command),
  );

  commands.push(...openCollectionCommands);

  const openRequestCommands = getFlattenedRequests(collections).map(
    (r, i) =>
      ({
        id: commands.length + i,
        name: `Open Request: ${r.data.name} [${r.id}]`,
        command: () => selectRequest.current(r.id),
        color: '',
      } as Command),
  );

  commands.push(...openRequestCommands);

  const openScriptCommands = getFlattenedScripts(collections).map(
    (s, i) =>
      ({
        id: commands.length + i,
        name: `Open Script: ${s.data.name} [${s.id}]`,
        command: () => selectScript.current(s.id),
        color: '',
      } as Command),
  );

  commands.push(...openScriptCommands);

  return (
    <div
      style={{
        display: 'none',
        zIndex: 2,
        // NOTE: this is a workaround to fix a bug where the screen jumps when the command opens a modal
        height: '800px',
        maxHeight: '800px',
        overflow: 'hidden',
      }}
    >
      <CommandPalette
        commands={commands}
        open={isOpen}
        closeOnSelect={true}
        onRequestClose={() => setIsOpen(false)}
        resetInputOnOpen={true}
      />
    </div>
  );
}

export default CmdPalette;
