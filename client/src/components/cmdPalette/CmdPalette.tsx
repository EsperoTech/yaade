import { useState } from 'react';
import CommandPalette, { Command } from 'react-command-palette';

import Collection, { CurrentCollection } from '../../model/Collection';
import { CurrentRequest } from '../../model/Request';
import { useKeyPress } from '../../utils/useKeyPress';

type CmdPaletteProps = {
  collections: Collection[];
  currentRequest?: CurrentRequest;
  currentCollection?: CurrentCollection;
  selectCollection: any;
  setCollectionPanelTabIndex: (index: number) => void;
};

function CmdPalette({
  collections,
  currentRequest,
  currentCollection,
  selectCollection,
  setCollectionPanelTabIndex,
}: CmdPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  useKeyPress(() => setIsOpen(true), 'p', true, true);

  async function openCollectionPanelTab(index: number) {
    const collectionId = currentCollection?.id || currentRequest?.collectionId;
    if (!collectionId) return;

    if (collectionId !== currentCollection?.id) {
      await selectCollection.current(collectionId);
    }

    setCollectionPanelTabIndex(index);
  }

  const commands: Command[] = [
    {
      id: 0,
      name: 'Open Current Collection',
      async command() {
        if (!currentRequest) return;
        await selectCollection.current(currentRequest.collectionId);
      },
      color: 'red',
    },
    {
      id: 1,
      name: 'Open Current Environment',
      async command() {
        await openCollectionPanelTab(1);
      },
      color: '',
    },
    {
      id: 2,
      name: 'Open Collection Headers',
      async command() {
        await openCollectionPanelTab(2);
      },
      color: '',
    },
  ];

  return <CommandPalette commands={commands} open={isOpen} closeOnSelect={true} />;
}

export default CmdPalette;
