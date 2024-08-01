package com.postman.collection;
/**
 * 
 * 
 * Enumeration listing the possible values for the name of the property containing body data in a {@link com.postman.collection.Request}
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/RequestBody.html#:~:text=(static)-,MODES,-%3Astring">MODES</a></code></p>
 * 
 * 
 * 
 */
public enum enumRequestBodyMode {
    TEXT,FORMDATA,RAW,FILE,GRAPHQL,URLENCODED;
}
