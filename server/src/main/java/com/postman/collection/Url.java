package com.postman.collection;

import java.util.regex.*;

import java.util.ArrayList;
import java.util.Arrays;

/**
 * Class to encapsulate the properties in the <code>url</code> object of a {@link com.postman.collection.RequestBody} object.  
 * 
 * <p>Postman SDK Analog: <code><a href="http://www.postmanlabs.com/postman-collection/Url.html">Url</a></code>.</p>
 * 
 * <p>The URL object properties contain the raw URL itself, the protocol, the port an array of strings for the individual host and path elements, arrays of key/value pairs for query parameters, as well as 
 * path variables.</p>
 * <pre>
 * "url": {
                    "raw": "https://foo.com:8080/bar/:path1/bat.json?foo=1&amp;bar=2",
                    "host": [
                        "foo",
                        "com"
                    ],
                    "path": [
                        "bar",
                        ":path1",
                        "bat.json"
                    ],
                    "query": [
                        {
                            "key": "foo",
                            "value": "1"
                        },
                        {
                            "key": "bar",
                            "value": "2"
                        }
                    ],
                    "variable": [
                        {
                            "key": "path1"
                        }
                    ],
                    "protocol": "https",
                    "port": "8080"
                }   
                </pre>                 
 */

public class Url extends CollectionElement {
    private String raw = "";
    private ArrayList<String> host;
    private ArrayList<String> path;
    private PropertyList<Property> query;
    private PropertyList<Property> variable = null;
    
    private String protocol;
    private String port;

    /** 
     * 
     * Sets the raw URL.  The host, path, query,protocl, query and port properties are parsed from the raw url.  
     * Parsing does not always result in these properties being filled, as collection URLs are not always valid URLs in the java sense.  
     * For example, URLs containing variables may not produce discrete values, eg.
     * <pre> {{baseUrl}}/{{theHost}}/foo/{{filename}}</pre>
     * 
     * @param rawUrl The raw URL as a String.  The URL is not validated
     *
     */
    public void setRaw(String rawUrl) throws DuplicateVariableKeyException {

        //Is there a query String
        
        String queryString;
        
        this.raw = rawUrl;
        

        if(rawUrl.split("\\?").length == 2)
        {
            queryString = rawUrl.split("\\?")[1];
            rawUrl = rawUrl.split("\\?")[0];
            this.setQuery(queryString);
        }

        String regex = "^(https?)(://)(.*)";
        Pattern pnProtocol = Pattern.compile(regex);
        Matcher maProtocol = pnProtocol.matcher(rawUrl);
        
        if(maProtocol.matches() && maProtocol.groupCount() == 3)
        {
            this.setProtocol(maProtocol.group(1));
            rawUrl = maProtocol.group(3);
            
        }

        Pattern pnPort = Pattern.compile("(:)([0-9]{2,4})");
        Matcher maPort = pnPort.matcher(rawUrl);
        if(maPort.find()) {
            this.setPort(maPort.group(2));
            rawUrl = rawUrl.replace(":" + this.getPort(),"");
        }

        if(rawUrl.length() == 0) {
            return;
        }
        
        String strHost = rawUrl.split("/")[0];
        this.setHost(strHost);
        rawUrl = rawUrl.replace(strHost, "");
        
        

        
        if(rawUrl != null && rawUrl.length() > 0) {
            this.setPath(rawUrl);
        }
    
        

    }

    
    /** 
     * @return String
     * @throws VariableResolutionException
     */
    private String resolvePathVariables() throws VariableResolutionException {
        
        String strResolved = this.getRaw();
        Pattern pnPath = Pattern.compile(":([a-z]+[0-9]+)/?");
        Matcher maPath = pnPath.matcher(this.getRaw());
        String curVarName;
        
        Property curVar;
        while(maPath.find()) {
            
                curVarName = maPath.group(1);
                curVar = this.getPathVariable(curVarName);

                {
                    if(curVar == null) {
                        throw new VariableResolutionException("No entry found or null value for variable: " + curVarName);
                    }
                    
                }
                if(curVar.getValue() != null) {
                    strResolved = strResolved.replace(":" + curVarName, curVar.getValue());
                }
                
        }
        
        return strResolved;
    }
    /** 
     * 
     * 
     * Add a variable to the array of query elements
     * 
     * @param key Value for the <code>key</code> property 
     * @param value Value for the <code>value</code> property
     * @param description Value for the <code>description</code> property
     * 
     */
    public void addPathVariable(String key, String value, String description) throws DuplicateVariableKeyException {

        this.addPathVariable(new Property(key, value, description));

    }


   

    
    /** 
     * Set the path element using a String.  Elements of the <code>path</code> array are parsed out
     * 
     * @param rawPath the raw path, e.g., /foo/:path1/bat

     */
    public void setPath(String rawPath)  throws DuplicateVariableKeyException {

        ArrayList<String> pathElements;
        ArrayList<String> liPath;
        this.path = new ArrayList<String>();
        if (rawPath != null && rawPath.length() > 0) {
            pathElements = new ArrayList<String>(Arrays.asList(rawPath.split("/")));
            liPath = new ArrayList<String>(Arrays.asList(new String[0]));
            for (int i = 0; i < pathElements.size(); i++) {
                if (pathElements.get(i) != null && pathElements.get(i).length() > 0) {
                    liPath.add(pathElements.get(i));
                    if (pathElements.get(i).substring(0, 1).equals(":")) {
                            this.addPathVariable(pathElements.get(i).substring(1), null, null);
                    }
                }
            }

            this.path = liPath;
        }

    }

    
    /** 
     * 
     * Set the elements of the <code>query</code> array with a string
     * 
     * @param rawQuery String with the query component, e.g., "foo=bar&amp;bat=big"
     * 
     */
    public void setQuery(String rawQuery) {
        ArrayList<String> queryElements;
        if (rawQuery != null && rawQuery.length() > 0) {
            queryElements = new ArrayList<String>(Arrays.asList(rawQuery.split("&", 0)));

            for (int i = 0; i < queryElements.size(); i++) {
                this.addQuery(queryElements.get(i));
            }
        } else {
            this.query = null;
        }
    }

    
    /** 
     * 
     * Set the host component of the URL with a string.  The elements of the <code>host</code> array are parsed out.
     * 
     * @param rawHost The host as a string, e.g., foo.com
     */
    public void setHost(String rawHost) {

        if (rawHost == null || rawHost.length() < 1) {
            return;
        }

        this.host = new ArrayList<String>(Arrays.asList(rawHost.split("\\.", 0)));

    }

    /**
     * Generate the raw URL from the component properties of this Url.  If <code>raw</code> has been set, the output of this method
     * should equal the raw URL provided.  
     * 
     * @return The generated URL.  Note that this may not be a valid URL
     */
    //TO-DO: Add resolve argument to allow resolving variables to their values.
    public String generateURL() {
        String retVal = "";
        retVal = this.protocol == null ? retVal : retVal + this.protocol + "://";
        
        if(this.getHosts() != null) {
            for(String curHost: this.getHosts()) {
                retVal = retVal + curHost + ".";
            }
            if(retVal.substring(retVal.length() - 1).equals(".")) {
                retVal = retVal.substring(0,retVal.length() -1);
            }
        }

        
        
        if(this.getPort() != null && this.getPort().length() > 0) {
            retVal = retVal + ":" + this.getPort();
        }
    
        
        if(this.getPaths() != null && this.getPaths().size() > 0) {
            for(String curPath: this.getPaths())
            {
                retVal = retVal + "/"+curPath;
            }
            if(retVal.substring(retVal.length() - 1).equals("/")) {
                retVal = retVal.substring(0,retVal.length() -1);
            }
        }
        
        if(this.getQueryElements() == null || this.getQueryElements().size() == 0) {
            return retVal;
        }
        
        retVal = retVal + "?";
        for(Property curQuery : this.getQueryElements()) {
            retVal = retVal + curQuery.getKey() + "=" + curQuery.getValue() + "&";
        }
        if(retVal.substring(retVal.length() - 1).equals("&")) {
            retVal = retVal.substring(0,retVal.length() -1);
        }
        

        return retVal;
    }

    
    /** 
     * Set the value of the <code>protocol</code> property with a string.  This method will attempt to resolve the provided value to either 'http' or 'https', or null 
     * if a reasonable guess results in anything else.  
     * 
     * @param rawProtocol The protocol, eg http
     */
    public void setProtocol(String rawProtocol) {

        
        if (rawProtocol == null || rawProtocol.length() < 1) {
            protocol = null;
        } else if (rawProtocol.toLowerCase().contains("https")) {
            protocol = "https";
        } else if (rawProtocol.toLowerCase().contains("http")) {
            protocol = "http";
        } else {
            protocol = null;
        }

    }

    
    /** 
     * 
     * Returns the value of the <code>raw</code> property, or null if it has not been set.  Note that the Postman application doesn't seem to mind ingesting 
     * URLs with no value in the <code>raw</code> property.
     * 
     * @return String
     */
    public String getRaw() {
        //Won't "magically" set this to the value of generated URL.  Postman won't care anway
        return raw;
    }

    /**
     * Create a Url with the specified URL
     * @param rawURL The raw URL
     
     */

    public Url(String rawURL) throws DuplicateVariableKeyException {
        this.setRaw(rawURL);
    }

    /**
     * Create a Url with the specified host and path. 
     * @param host The host, e.g., "foo.com"
     * @param path The path, e.g., "/bar/bat"
     */
    
    public Url(String host, String path) throws DuplicateVariableKeyException {
        this.host = new ArrayList<String>();
        this.setHost(host);
        this.path = new ArrayList<String>();
        this.setPath(path);
    }

    
    /** 
     * 
     * Return the array of elements in the <code>host</code> array.
     * 
     * @return ArrayList&#60;String&#62; Elements of the <code>host</code> property of this url.
     */
    public ArrayList<String> getHosts() {
        return host;
    }

    private void updateRaw() {
        StringBuilder sbRaw = new StringBuilder();
        sbRaw.append(this.protocol);
        for(String curHost : this.getHosts()) {
            sbRaw.append("/" + curHost);
        }
        for(String curPath : this.getPaths()) {
            sbRaw.append("/" + curPath);
        }

        if(this.query != null) {
            sbRaw.append("?" + this.getQueryString());
        }
        this.raw = sbRaw.toString();
        
    }

    
    /** 
     * @return String
     */
    public String getProtocol() {
        return this.protocol;
    }

    

    
    /** 
     * @param resolvePathVariables
     * @return String
     * @throws VariableResolutionException
     */
    public String getUrl(boolean resolvePathVariables) throws VariableResolutionException {
        if(!resolvePathVariables) {
            return this.raw;
        }
        return resolvePathVariables();
    }

    
    /** 
     * Set the value of the elements in the <code>host</code> array with a pre-populated ArrayList&#60;String&#62;
     * 
     * @param host ArrayList&#60;String&#62; with host elements.
     */
    public void setHosts(ArrayList<String> host) {
        this.host = host;
    }

    
    /** 
     * 
     * Returns the contents of the <code>path</code> element array
     * 
     * @return ArrayList&#60;String&#62; containing the path elements
     */
    public ArrayList<String> getPaths() {
        return path;
    }

    
    /** 
     * 
     * Set the elements of the <code>path</code> element array
     * 
     * @param path  ArrayList&#60;String&#62; containing the path elements
     */
    public void setPaths(ArrayList<String> path) {
        this.path = path;
    }

    
    /** 
     * 
     * Return an ArrayList&#60;{@link com.postman.collection.Property Property}&#62; of key value pairs comprising the <code>query</code> array
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Property Property}&#62; containing the key value paris
     */
    public PropertyList<Property> getQueryElements() {
        return query;
    }


    
    /** 
     * @param key
     * @return Property
     */
    public Property getQueryElement(String key) {
        if(this.query == null) {
            return null;
        }
        for(Property curVar : this.query) {
            if(curVar.getKey().equals(key)) {
                return curVar;
            }
        }
        return null;

    }

    
    /** 
     * @param index
     * @return Property
     * @throws IllegalPropertyAccessException
     */
    public Property getQueryElement(int index) throws IllegalPropertyAccessException {
        {
            if(this.query == null) {
                return null;
            }
            if(index < 0 || index > this.query.size()) {
                throw new IllegalPropertyAccessException("Index [" + index + "] is out of bounds");
            }
            return this.query.get(index);


        }
    }

    
    /** 
     * @param element
     * @param index
     * @throws IllegalPropertyAccessException
     */
    public void setQueryELement(Property element, int index) throws IllegalPropertyAccessException {
        if(this.query == null) {
            this.query = new PropertyList<Property>();
        }
        if(index < 0 || index > this.query.size() + 1) {
            throw new IllegalPropertyAccessException("Index [" + index + "] is out of bounds");
        }
        this.query.set(index, element);
    }

    /**
     * 
     * Get the raw query string for this URL.  
     * 
     * 
     * 
     * @return
     */
    public String getQueryString() {
        if (query == null)
        {
            return null;
        }
        String queryString = "";
        String curQueryElement;
        for(Property curVar : query) {
            curQueryElement = curVar.getKey() + "" + "=" + curVar.getValue() + "";
            queryString = queryString + (queryString.length() > 0 ? "&" : "") + curQueryElement;
        }

        return queryString;
    }
    /**
     * 
     * Remove a query element key-value pair from the array of query elements, if it exists.
     * 
     * @param queryElement
     */
    public void removeQueryElement(Property queryElement) {
        if(this.query != null){
            this.query.remove(queryElement);
        }
    }

    
    /** 
     * 
     * Set the contents of the <code>query</code> array with a pre-populated ArrayList&#60;{@link com.postman.collection.Property Property}&#62; containing the key value pairs
     * 
     * @param query
     */
    public void setQueries(PropertyList<Property> query) {
        this.query = query;
    }

    
    /** 
     * 
     * Get an ArrayList&#60;{@link com.postman.collection.Property Property}&#62; containing the key-value pairs comprising the <code>variable</code> array, or null if none exit.
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Property Property}&#62; The ArrayList containing the key-value pairs, or null if there are none.
     */
    public PropertyList<Property> getPathVariables() {
        return variable;
    }

    
    /** 
     * @param key
     * @return Property
     */
    public Property getPathVariable(String key) {
        if(this.variable == null) {
            return null;
        }
        for(Property curVar : this.variable) {
            if(curVar.getKey().equals(key)) {
                return curVar;
            }
        }
        return null;
    }

    
    /** 
     * 
     * Set the values of the <code>variable</code> array with a pre-populated ArrayList&#60;{@link com.postman.collection.Property Property}&#62; containing the key-value paris
     * 
     * @param variable the ArrayList&#60;{@link com.postman.collection.Property Property}&#62; containing the key-value paris
     */
    public void setPathVariables(PropertyList<Property> variable) {
        this.variable = variable;
    }



    
    /** 
     * @param varPath
     */
    public void setPathVariable(Property varPath) {
        if(this.variable == null) {
            this.variable = new PropertyList<Property>();
        }
        for(Property curVar : this.variable) {
            if (curVar.getKey().equals(varPath.getKey())) {
                this.variable.set(this.variable.indexOf(curVar),varPath);
            }
        }
    }

    
    /** 
     * @param varPath
     * @throws DuplicateVariableKeyException
     */
    public void addPathVariable(Property varPath) throws DuplicateVariableKeyException {
        if(this.variable != null && this.variable.contains(varPath)){
            throw new DuplicateVariableKeyException("Path variable [" + varPath.getKey() + "] already present in this collection");
        }
        if(this.variable == null) {
            this.variable = new PropertyList<Property>();
        }
        this.variable.add(varPath);
    }

    
    /** 
     * @param key
     */
    public void removePathVariable(String key) {
        for(Property curVar : this.variable) {
            if(curVar.getKey().equals(key)) {
                this.variable.remove(curVar);
            }
        }
    }

    
    /** 
     * Currently unimplemented
     * 
     * @return String
     */
    @Override
    public String getKey() {

        return null;
    }

    
    /** 
     * 
     * Add an element to the <code>query</code> array using raw string values.
     * 
     * @param key  The key
     * @param value The value
     * 
     */
    public void addQuery(String key, String value)  {
        this.addQuery(key, value, null);
    }

    
    /** 
     * 
     * Add an element to the <code>query</code> array using raw String values, with a description property
     * 
     * @param key  The key
     * @param value The value
     * @param description The description
     * 
     */
    public void addQuery(String key, String value, String description)  {

        if (this.query == null) {
            this.query = new PropertyList<Property>();
        }
        this.query.add(new Property(key, value, description));

    }

    
    /** 
     * 
     * Populate the elements of the <code>query</code> array with an http query string.  Replaces any existing query string.
     * 
     * @param queryString  The query string, e.g., foo=bar&amp;bat=bing
     */
    public void addQuery(String queryString)  {

        ArrayList<String> elements;

        if ((queryString == null || queryString.length() < 1)) {
            return;
        }

        elements = new ArrayList<String>(Arrays.asList(queryString.split("=", 0)));
        if (elements.size() == 1) {
            this.addQuery(elements.get(0), "");

        }
        if (elements.size() == 2) {
            this.addQuery(elements.get(0), elements.get(1));
        }

    }

    
    /** 
     * 
     * Get the value of the <code>port</code> property 
     * 
     * @return String  The port
     */
    public String getPort() {
        return this.port;
    }

    
    /** 
     * Set the value of the <code>port</code> property
     * 
     * @param port The port as a string.  
     */
    public void setPort(String port)  {
        if(port == null) {
            this.port = null;
        }
        else {
            this.port = port;
            
        }
    }
}
