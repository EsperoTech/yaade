package com.postman.collection;
import java.util.ArrayList;

/**
 * 
 * 
 * Encapsulates a Postman collection request.  
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/Request.html">Request</a></code.</p>
 * 
 * 
 * 
 */


public class Request extends Item {
    private RequestBody request = null;
    private ArrayList<Response> response = null;
    
    
    /**
     * 
     * Create a request with the specific name and pre-populated {@link com.postman.collection.RequestBody}.
     * @param req A {@link com.postman.collection.RequestBody} instance.
     * @param name The name of the request.
     */
    
    
    public Request(RequestBody req, String name) {
        super(name);
        this.request = req;
        req.setParent(this);
    }

    /**
     * 
     * Create an empety Request with the specific name
     *
     * @param name The name of the request.
     */
    public Request(String name) {
        super(name);
    }



    /** 
     * 
     * Return the object containing the values in the <code>request</code> property, or null if this item does not contain a request (e.g., is a folder);
     * 
     * 
     * @return RequestBody The request, or null if no request is defined.
     */
    public RequestBody getRequestBody() {
        return request;
    }

    
    /** 
     * 
     * Set the object containing the values in the <code>request</code> property
     * 
     * @param request
     */
    public void setRequestBody(RequestBody request) {
        this.request = request;
    }

    
    /** 
     * 
     * Return an ArrayList&#60;Response&#62; containing the values in the <code>response</code> property array, or null if none are defined.
     * 
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Response Response}&#62;  The responses, or null if none are defined.
     */
    public ArrayList<Response> getResponses() {
        return response;
    }

    
    /** 
     * 
     * Set the ArrayList&#60;Response&#62;  containing the values in the <code>response</code> property array.  Passing null to this method removes the response array
     * 
     * @param response
     */
    public void setResponses(ArrayList<Response> response) {
        this.response = response;
    }

    /** 
     * 
     * Add a Response object to the <code>response</code> array
     * 
     * @param resp The new response
     * 
     */
    public void addResponse(Response resp)  {
        if (this.response == null) {
            this.response = new ArrayList<Response>();
        }
        this.response.add(resp);
    }
/** 
     * 
     * Add a response object to the request contained by this collection specified by <code>requestKey</code>
     * 
     * 
     * @param requestKey Key identifying the request to add the response to
     * @param response New response to add to the request
     * @throws InvalidCollectionActionException If the specifyed request is not contained by this collection
     */
    public void addResponse(String requestKey, Response response) throws InvalidCollectionActionException {
        RequestBody req = this.getRequestBody();
        if(req == null) {
            throw new InvalidCollectionActionException("Request with key [" + requestKey + "] not found");
        }
        this.addResponse(response);

    }
    

}
