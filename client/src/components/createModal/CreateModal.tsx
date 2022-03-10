import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';

type CreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  handleCreateClick: any;
};

function CreateModal({ isOpen, onClose, type, handleCreateClick }: CreateModalProps) {
  const [name, setName] = useState<string>('');
  const initialRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setName('');
        onClose();
      }}
      initialFocusRef={initialRef}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a new {type}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Name"
            w="100%"
            borderRadius={20}
            colorScheme="green"
            value={name}
            onChange={(e) => setName(e.target.value)}
            ref={initialRef}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="green" onClick={handleCreateClick} disabled={name === ''}>
            CREATE
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateModal;
