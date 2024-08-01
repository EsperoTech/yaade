package com.postman.collection;


/**
 * 
 * Error thrown if something prevents the resolution of a variable value, eg., the specified variable doesn't exist, etc.
 * 
 * 
 */


public class VariableResolutionException extends Exception {

    public VariableResolutionException(String message) {
        super(message);
    }

}
