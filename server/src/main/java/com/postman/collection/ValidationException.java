package com.postman.collection;

/**
 * 
 * 
 * Exception thrown if there is a system, syntax or other error/exception which interrupts or prevents actual validation of the element.
 * 
 * 
 * 
 * 
 */


public class ValidationException extends Exception {
    
    public ValidationException(Throwable cause) {
        super("Validation Exception", cause);
    }

    public ValidationException(String message) {
        super(message);
        
    }

}
