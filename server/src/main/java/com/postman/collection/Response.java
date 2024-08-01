package com.postman.collection;

import java.util.ArrayList;
/**
 * 
 * Class to encapsulate the <code>response</code> object property of a {@link com.postman.collection.Request}.
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/Response.html">Response</a></code>.</p>
 * 
 * A RequestBody includes an optional array of expected responses: 
 * <pre>
 *  "response": [
                {
                    "name": "NORMAL Urlencoded",
                    "originalRequest": {
                        "method": "POST",
                        "url": {
                            "raw": "https://postman-echo.com/post",
                            "host": [
                                "postman-echo",
                                "com"
                            ],
                            "path": [
                                "post"
                            ],
                            "protocol": "https"
                        },
                        "body": {
                            "mode": "urlencoded",
                            "urlencoded": [
                                {
                                    "key": "x-field-2",
                                    "value": "value 2",
                                    "description": "This is value 2"
                                },
                                {
                                    "key": "x-field-1",
                                    "value": "value 1",
                                    "description": "This is value 1"
                                }
                            ]
                        }
                    },
                    "code": 200,
                    "status": "OK",
                    "_postman_previewlanguage": "",
                    "body": "this is the expected response body"
                }
            ]
            </pre>

The response object includes a RequestBody object describing the original request associated with this response.  

 * 
 * 
 */
public class Response extends CollectionElement {
    private String name = "";
    private RequestBody originalRequest = null;
    private int code;
    private String status;
    private String _postman_previewlanguage = "";
    private ArrayList<Cookie> cookie = null;
    private String body = "";
    private PropertyList<Property> header;

    public Response(String name, RequestBody originalRequest, int code, String status,
            String _postman_previewlanguage, ArrayList<Cookie> cookie, String body) {
        this.name = name;
        this.originalRequest = originalRequest;
        this.code = code;
        this.status = status;
        this._postman_previewlanguage = _postman_previewlanguage;
        this.cookie = cookie;
        this.body = body;
    }

    
    /** 
     * Set the value of the <code>header</code> element array with a pre-populated ArrayList of Property key-value pairs
     * 
     * 
     * @param headers
     */
    public void setHeader(PropertyList<Property> headers) {
        this.header = headers;
    }

    
    /** 
     * Get the ArrayList containing the key-value paris in the <code>header</code> element array
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Property Property}&#62;
     */
    public PropertyList<Property> getHeader() {
        return this.header;
    }

    public Response(String name, RequestBody req, String status, int code, String body) {
        this.originalRequest = req;
        this.status = status;
        this.code = code;
        this.body = body;
        this.name = name;
    }

    
    /** 
     * 
     * Get the name of this response.
     * 
     * @return String The name
     */
    public String getName() {
        return name;
    }

    
    /** 
     * Set the name of this response
     * 
     * @param name The name
     */
    public void setName(String name) {
        this.name = name;
    }

    
    /** 
     * 
     * Get the value of the <code>originalRequest</code> for this response as a RequestBody, or null if it has not been set.
     * 
     * @return RequestBody
     */
    public RequestBody getOriginalRequest() {
        return originalRequest;
    }

    
    /** 
     * 
     * Set the value of the <code>originalRequest</code> property
     * 
     * @param originalRequest
     */
    public void setOriginalRequest(RequestBody originalRequest) {
        this.originalRequest = originalRequest;
    }

    
    /** 
     * 
     * Get the value of the <code>code</code> property, the HTML status code associated with this response.
     * @return int
     */
    public int getCode() {
        return code;
    }

    
    /** 
     * Set the value of the <code>code</code> property, the HTML status code associated with this response.
     * 
     * @param code
     */
    public void setCode(int code) {
        this.code = code;
    }

    
    /** 
     * 
     * Get the value of the <code>status</code> property for this response, the string associated with the <code>code></code> property, eg. "OK"
     * 
     * @return String The status as a string, eg. "OK"
     */
    public String getStatus() {
        return status;
    }

    
    /** 
     * 
     * Set the value of the <code>status</code> property for this response, the string associated with the <code>code></code> property, eg. "OK"
     * 
     * @param status The status. Not validated against existing http response codes
     */
    public void setStatus(String status) {
        this.status = status;
    }

    
    /** 
     * 
     * Get the value of the <code>_postman_previewlanguage</code> property 
     * @return String The language
     */
    public String getPostmanPreviewlanguage() {
        return _postman_previewlanguage;
    }

    
    /** 
     * 
     * 
     * Set the value of the <code>_postman_previewlanguage</code> property 
     * 
     * @param previewLanguage The language
     */
    public void SetPostmanPreviewlanguage(String previewLanguage) {
        this._postman_previewlanguage = previewLanguage;
    }

    
    /** 
     * 
     * Return an ArrayList containing the Cookie objects comprising the value of the <code>cookie</code> array property
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Cookie}&#62; The cookies
     */
    public ArrayList<Cookie> getCookies() {
        return cookie;
    }

    
    /** 
     * 
     * Set the value of the <code>cookie</code> array property with a pre-populated ArrayList
     * 
     * @param cookie
     */
    public void setCookies(ArrayList<Cookie> cookie) {
        this.cookie = cookie;
    }

    
    /** 
     * 
     * Get the value of the <code>body</code> property of the response, or null if not set.
     * 
     * @return String The body
     */
    public String getBody() {
        return body;
    }

    
    /** 
     * Set the value of the <code>body</code> property of the response
     * 
     * @param body  The body.
     */

     //TODO: Ensure string is properly escaped? 
    public void setBody(String body) {
        this.body = body;
    }

    
    /** 
     * 
     * Return the Key for this object.  Not currently implemented
     * 
     * @return String  The key
     */
    @Override
    public String getKey() {

        return null;
    }

}
