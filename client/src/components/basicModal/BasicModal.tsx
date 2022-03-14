import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { FunctionComponent } from 'react';

type BasicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRef?: any;
  heading: string;
  isButtonDisabled: boolean;
  onClick: any;
  buttonText: string;
  buttonColor: string;
};

const BasicModal: FunctionComponent<BasicModalProps> = ({
  isOpen,
  onClose,
  initialRef,
  heading,
  onClick,
  isButtonDisabled,
  buttonText,
  buttonColor,
  children,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{heading}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme={buttonColor} onClick={onClick} disabled={isButtonDisabled}>
            {buttonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BasicModal;
