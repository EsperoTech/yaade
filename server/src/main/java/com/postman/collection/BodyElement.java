
package com.postman.collection;

import java.util.HashMap;

/**
 * 
 * <p>Encapsulates the <code>body</code> property of a {@link com.postman.collection.Request} object.  
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/RequestBody.html">RequestBody</a></code></p>
 * 
 * <p>There are several different permutations for this property depending on the </p>
 * <code>mode</code> selected in Postman.  Some examples:
 * </p>
 * 
 * <strong>plaintext:</strong>
 * <pre>
 * "body": {
 *   "mode": "raw",
 *     "raw": "This is some text in the body"
 *   }
 *   </pre>
 * 
 * <strong>Form data</strong>
 * 
 *   Formdata and Urlencoded bodies comprise an array of key value pairs persisted as instance of Property:
 * <pre>
    "body": {
        "mode": "urlencoded",
        "urlencoded": [
            {
                "key": "x-field-1",
                "value": "x-field-1 value",
                "description": "This is x-field-1",
                "type": "text"
            },
            {
                "key": "x-field-2",
                "value": "x-field-2 value",
                "description": "This is x-field-2",
                "type": "text"
            },
            {
                "key": "x-field-3",
                "value": "{{Xfield3value}}",
                "description": "variable",
                "type": "text"
            }
            ]
        }
</pre>
<strong>RAW options</strong>
<p>Other forms of textual data contain an <code>options</code> property which only includes the langauge of the payload, e.g., <code>javascript</code>
<pre>
    "body": {
        "mode": "raw",
        "raw": "pm.test(\"Status code is 200\", function () {\n ...",
        "options": {
            "raw": {
                "language": "javascript"
            }
        }
    }
    </pre>
    <p><strong>GraphQL</strong></p>

    <p>GraphQL includes query and variable properties</p>
    <pre>
    "body": {
        "mode": "graphql",
            "graphql": {
            "query": "query ($limit: Int!) {\n  ...",
            "variables": "{\n    \"limit\":2\n}"
            }
    }
    </pre>
<p><strong>Binary</strong></p>
<p>Binary bodies contain a single <code>src</code> property with a path to the file</p>

    <pre>
    "body": {
        "mode": "file",
        "file": {
            "src": "8vhckkNqZ/jenkins-small.png"
        }
    }
    </pre>
 * 
 * 
 * 
 */
public class BodyElement extends CollectionElement {
  

    
    private GraphQLElement graphql;
    private PropertyList<Property> formdata;
    private PropertyList<Property> urlencoded;
    private BinaryFileElement file;
    
    /** 
     * @return String
     */
    public String getKey() {
        return this.getUUID().toString();
    }
    /**
     * 
     * Constructs a body with the provided <code>mode</code>, content, and language. If <code>mode</code> is not raw, the language value is discarded.  
     * 
     * @param mode  Enumerated value for the underying <code>mode</code> property of this request body
     * @param content The content in the body
     * @param language For bodies with <code>mode</code> RAW, the language of the body content, e.g., <code>javascript</code>
     */
    public BodyElement(enumRequestBodyMode mode, String content, enumRawBodyLanguage language)  {

        this.setMode(mode);

        if (this.getMode() == enumRequestBodyMode.RAW) {
            try {
                this.setOptions(new BodyOptions(language));
                this.setRaw(content);
            }
            catch(IllegalPropertyAccessException e)
            {
                e.printStackTrace();
            }
            
        }

        if (this.getMode() == enumRequestBodyMode.FILE) {
            this.file.setSrc(content);
        }

    }

    /**
     * Convenience constructor, creates an empty body object of the specified mode
     * 
     * 
     * @param mode  Enumerated value for the <code>mode</code> property 
     */
    public BodyElement(enumRequestBodyMode mode) {
        this.setMode(mode);
    }

     
    

    /** 
     * 
     * Returns the <code>options</code> property object as an instance of the inner class {@link com.postman.collection.BodyElement.BodyOptions}
     * 
     * 
     * @return BodyOptions
     */
    private BodyOptions getOptions()  {
        if(this.getMode() == null || this.getMode() != enumRequestBodyMode.RAW) {
            return null;
        }
        return options;
    }

    
    /** 
     * @param options
     */
    private void setOptions(BodyOptions options) {
        this.options = options;
    }

    
    /** 
     * 
     * Returns the content of the <code>raw</code> property of the body, or null if it has not been set
     * 
     * @return String The raw content
     * @throws IllegalPropertyAccessException If body <code>mode</code> is not RAW
     */
    public String getRaw() throws IllegalPropertyAccessException {
        if(this.getMode() != enumRequestBodyMode.RAW) {
            throw new IllegalPropertyAccessException("Body mode must be RAW to access raw content");
        }
        return raw;
    }

    
    /** 
     * 
     * Sets the <code>raw</code> property of the body, or null if it has not been set
     * 
     * @param raw
     * @throws IllegalPropertyAccessException If body <code>mode</code> is not RAW
     */
    public void setRaw(String raw) throws IllegalPropertyAccessException {
        if(this.getMode() != enumRequestBodyMode.RAW) {
            throw new IllegalPropertyAccessException("Body mode must be RAW to access raw content");
        }
        
        this.raw = raw;
    }

    
    /** 
     * 
     * Sets the <code>langauge</code> property of the <code>options</code> property
     * 
     * @param lang
     * @throws IllegalPropertyAccessException If <code>mode</code> is not RAW
     */
    public void setRawLanguage(enumRawBodyLanguage lang) throws IllegalPropertyAccessException {
        
        if(this.getMode() != enumRequestBodyMode.RAW) {
            throw new IllegalPropertyAccessException("Body mode must be RAW to access raw content");
        }
        if (this.getMode() != enumRequestBodyMode.RAW) {
            return;
        }
        try {
            this.options = new BodyOptions(lang);
        }
        catch(Exception e)
        {
            e.printStackTrace();
        }
                
        
    }

    
    /** 
     * 
     * Returns the enumerated value of the <code>language</code> property of the <code>options</code> property
     * 
     * @return enumRawBodyLanguage
     * @throws IllegalPropertyAccessException If <code>mode</code> is not RAW
     */
    public enumRawBodyLanguage getRawLanguage() throws IllegalPropertyAccessException {
        
        if (this.getMode() != enumRequestBodyMode.RAW) {
            throw new IllegalPropertyAccessException("Cannot access options unless body mode is RAW.");
        }
        try {
            return this.getOptions() == null || this.getOptions().getRaw() == null ? null : this.getOptions().getRaw().getLanguage();
        }
        catch(Exception e)
        {
            e.printStackTrace();
        }
        
        return null;
        
    }

    
    /** 
     * 
     * Sets the content (<code>raw</code>) and the <code>language</code> property of the <code>options</code> object
     * 
     * @param raw The content of the body (<code>raw</code>)
     * @param language The language of the content, eg. <code>javascript</code>
     * @throws IllegalPropertyAccessException If <code>mode</code> is not RAW
     */
    public void setRaw(String raw, enumRawBodyLanguage language) throws IllegalPropertyAccessException {

        switch(this.getMode()) {
            case TEXT: {
                this.raw = raw;
                this.options = null;
                break;
            }
            case RAW: {
                this.options = new BodyOptions(new BodyRaw(language));
                this.raw = raw;
                break;
            }
            default: {
                throw new IllegalPropertyAccessException("Mode must be RAW or TEXT to set raw content ");
            }

    }
}

    
    /** 
     * 
     * Return an HashMap&#60;String, String&#62; containing the GraphQL query and variables source code. Either or both may be null if they don't exist.
     * 
     * @return HashMap&#60;String,String&#62; A HashMap with the following keys:
     * <p><code>query</code> The graphql query</p>
     * <p><code>variables</code> The variables, or null if none are configured</p>
     
     * @throws IllegalPropertyAccessException If <code>mode</code> is not GRAPHQL
     * 
     */
    public HashMap<String,String> getGraphql() throws IllegalPropertyAccessException {
        //TODO: This should probably be handled by a typeadapter
        if (this.getMode() != enumRequestBodyMode.GRAPHQL) {
            throw new IllegalPropertyAccessException("Body mode must be GRAPHQL to access file property");
        }
        if(this.graphql == null)
        {
            return null;
        }
        HashMap<String,String> retVal = new HashMap<String,String>();
        retVal.put("query",this.graphql.getRawQueryString());
        retVal.put("variables",this.graphql.getVariables());
        return retVal;
    }

    
    /** 
     * 
     * Sets the query portion of the <code>graphql</code> property
     * 
     * @param graphQL The query part of the GraphQL property
     */
    public void setGraphql(String graphQL) {
        this.setGraphql(graphQL, null);
    }

    
    /** 
     * Sets both the <code>query</code> and <code>variables</code> properties of the <code>graphql</code> element
     * 
     * @param graphQL  The <code>query</code> property of the <code>graphql</code> element
     * @param variables  The <code>variables</code> property of the <code>graphql</code> element
     */
    public void setGraphql(String graphQL, String variables) {
        this.graphql = (new GraphQLElement(graphQL, variables));
    }

    
    /** 
     * Returns an ArrayList&#60;Property&#62; containing formdata paramters:
     * 
     * <pre>
     * {
            "key": "FormField1",
            "value": "Field 1 value",
            "description": "This is for Field 1",
            "type": "text"
        },
        {
            "key": "FormField2",
            "value": "Field 2 value",
            "description": "This is for Field 2",
            "type": "text"
        }
    </pre>
     * 
     * 
     * 
     * @return ArrayList&#60;{@link com.postman.collection.Property Property}&#62; The data
     * @throws IllegalPropertyAccessException If <code>mode</code> is not URLENCODED or FORMDATA
     */
    public PropertyList<Property> getFormdata() throws IllegalPropertyAccessException {
        switch(this.getMode()) {
            case URLENCODED: {
                return this.urlencoded;
                
            }
            case FORMDATA: {
                return this.formdata;
                
            }
            default: {
                throw new IllegalPropertyAccessException("Formdata can only be accessed if body mode is FORMDATA or URLENCODED");
            }
        }
    
    }

    
    /** 
     * 
     * Returns a {@link com.postman.collection.Property Property} containing formdata property at the specified position in the array
     * 
     * @param position The position in the array
     * @return Property The form data.
     * @throws IllegalPropertyAccessException if <code>mode</code> is not URLENCODED or FORMDATA
     */
    public Property getFormdata(int position) throws IllegalPropertyAccessException {
        switch (this.getMode()) {
            case URLENCODED: {
                return this.urlencoded.get(position);
            }
            case FORMDATA: {
                return this.formdata.get(position);
            }
            default: {
                throw new IllegalPropertyAccessException("Formdata can only be accessed if body mode is FORMDATA or URLENCODED");
            }
        }
    }

   

    
    /** 
     * Convenience method to set the formdata with an already filled ArrayList&#60;{@link com.postman.collection.Property Property}&#62; of properties
     * 
     * 
     * @param data  The filled ArrayList&#60;{@link com.postman.collection.Property Property}&#62;
     * @throws IllegalPropertyAccessException If <code>mode</code> is not URLENCODED or FORMDATA
     */
    public void setFormdata(PropertyList<Property> data) throws IllegalPropertyAccessException {
        switch(this.getMode()) {
            case URLENCODED: {
                this.urlencoded = data;
                break;
            }
            case FORMDATA: {
                this.formdata = data;
                
                break;
            }
            default: {
                throw new IllegalPropertyAccessException("Formdata can only be accessed if body mode is FORMDATA or URLENCODED");
            }
        }
        
    }

    
    
    
    /** 
     * 
     * Add a formdata element by string values
     * 
     * @param key  The value for the <code>key</code> property of the formdata element
     * @param value The value for the <code>value</code> property of the formdata element
     * @param description The value 
     * @throws IllegalPropertyAccessException If <code>mode</code> is not URLENCODED or FORMDATA
     */
    public void setFormdata(String key, String value, String description) throws IllegalPropertyAccessException {
        this.setFormdata(new Property(key, value, description));
    }

    
    /** 
     * 
     * Sets an element of the formdata or urlencoded property array 
     * 
     * @param data Populated Property containing the formdata
     * @throws IllegalPropertyAccessException If <code>mode</code> is not URLENCODED or FORMDATA
     */
    public void setFormdata(Property data) throws IllegalPropertyAccessException  {
        switch(this.getMode()) {
            case FORMDATA:
            {
                formdata.add(data);
                break;
            }
            case URLENCODED: {
                urlencoded.add(data);
                break;
            }
            default: {
                throw new IllegalPropertyAccessException("Body mode must be FORMDATA or URLENCODED to access formdata");
            }
        }

        
    }

    
    
    
    

    
    /** 
     * 
     * Returns the value of the <code>file/src</code> property, the path to the file
     * 
     * @return String The stored file spec
     * @throws IllegalPropertyAccessException If <code>mode</code> is not FILE
     */
    public String getFile() throws IllegalPropertyAccessException {
        if (this.getMode() != enumRequestBodyMode.FILE) {
            throw new IllegalPropertyAccessException("Body mode must be FILE to access file property");
        }
        return this.file.getSrc();
    }

    
    /** 
     * Sets the value of the <code>file/src</code> property, the path to the file
     * 
     * @param file The file path or name
     * 
     */
    public void setBinarySrc(String file) {
        if (this.getMode() == enumRequestBodyMode.FILE)
            this.file.setSrc(file);
    }

    
    /** 
     * 
     * Returns the <code>mode</code> property as an enumerated value
     * 
     * @return enumRequestBodyMode
     */
    public enumRequestBodyMode getMode() {
        if (mode == null) {
            return null;
        }
        switch (mode) {
            case "file":
                return enumRequestBodyMode.FILE;
            case "formdata":
                return enumRequestBodyMode.FORMDATA;
            case "urlencoded":
                return enumRequestBodyMode.URLENCODED;
            case "graphql":
                return enumRequestBodyMode.GRAPHQL;
            case "raw":
                return enumRequestBodyMode.RAW;
            default:
                return null;
        }
        
    }

    /** 
     * Sets the value of the <code>mode</code> property and initializes relevant internal properties
     * 
     * @param newMode
     */
    public void setMode(enumRequestBodyMode newMode) {
        switch (newMode) {
            case FILE:
                this.mode = "file";
                this.file = new BinaryFileElement("");
                this.formdata = null;
                this.urlencoded = null;
                this.graphql = null;
                this.options = null;

                break;
            case FORMDATA:
                this.mode = "formdata";
                this.file = null;
                this.formdata = new PropertyList<Property>();
                this.urlencoded = null;
                this.graphql = null;
                this.options = null;
                break;
            case URLENCODED:
                this.mode = "urlencoded";
                this.file = null;
                this.formdata = null;
                this.urlencoded = new PropertyList<Property>();
                this.graphql = null;
                this.options = null;
                break;
            case GRAPHQL:
                this.mode = "graphql";
                this.file = null;
                this.formdata = null;
                this.urlencoded = null;
                this.graphql = null;
                this.options = null;
                break;
            case RAW:
                this.mode = "raw";
                this.file = null;
                this.formdata = null;
                this.urlencoded = null;
                this.graphql = null;
                this.options = null;
                break;
            case TEXT:
                this.mode = "raw";
                this.file = null;
                this.formdata = null;
                this.urlencoded = null;
                this.graphql = null;
                this.options = null;
        }
    }

    /** 
     * 
     * Removes the formdata element at the specified position in the formdata array
     * 
     * @param position The position in the array of formdata elements to remove.  This value is not bounds checked, so an ArrayOutOfBounds exception may occur.
     * @throws IllegalPropertyAccessException If <code>mode</code> is not FORMDATA or URLENCODED
     */
    public void removeFormData(int position) throws IllegalPropertyAccessException {
        switch(this.getMode()) {
            case FORMDATA: {
                this.formdata.remove(position);
                break;
            }
            case URLENCODED: {
                this.urlencoded.remove(position);
                break;
            }
            default: {
                throw new IllegalPropertyAccessException("Mode must be FORMDATA or URLENCODED to access formdata");
            }

        }
    }

    /** 
     * 
     * Removes the formdata element at the specified position in the formdata array
     * 
     * @param data The Property to remove.  
     * @throws IllegalPropertyAccessException If <code>mode</code> is not FORMDATA or URLENCODED
     */
    public void removeFormData(Property data) throws IllegalPropertyAccessException {
        switch(this.getMode()) {
            case FORMDATA: {
                this.formdata.remove(data);
                break;
            }
            case URLENCODED: {
                this.urlencoded.remove(data);
                break;
            }
            default: {
                throw new IllegalPropertyAccessException("Mode must be FORMDATA or URLENCODED to access formdata");
            }

        }
    }

    //Inner Classes

    private class BodyRaw {
        private String language;

        public BodyRaw(enumRawBodyLanguage language) {
            this.setLanguage(language);
        }

        public enumRawBodyLanguage getLanguage() {
            if (language == null) {
                return null;
            }
            switch (language) {
                case "javascript":
                    return enumRawBodyLanguage.JAVASCRIPT;
                case "json":
                    return enumRawBodyLanguage.JSON;
                case "html":
                    return enumRawBodyLanguage.HTML;
                case "xml":
                    return enumRawBodyLanguage.XML;
                case "graphql":
                    return enumRawBodyLanguage.GRAPHQL;
                default:
                    return null;
            }
            
        }

        public void setLanguage(enumRawBodyLanguage newLanguage) {
            switch (newLanguage) {
                case JSON:
                    this.language = "json";
                    break;
                case JAVASCRIPT:
                    this.language = "javascript";
                    break;
                case HTML:
                    this.language = "html";
                    break;
                case XML:
                    this.language = "xml";
                    break;
                case GRAPHQL:
                    this.language = "graphql";
                    break;
                default:
                    this.language = null;
            }
        }
    }
    private class BinaryFileElement {
        private String src;

        public BinaryFileElement(String src) {
            this.src = src;
        }

        public String getSrc() {
            return src;
        }

        public void setSrc(String src) {
            this.src = src;
        }
    }
    private class GraphQLElement {
        private String rawQueryString;
        private String variables;

        public GraphQLElement(String query) {
            this(query, null);
        }

        public GraphQLElement(String query, String variables) {
            this.rawQueryString = query;
            this.variables = variables;
        }

        public String getRawQueryString() {
            return rawQueryString;
        }

        public void setRawQueryString(String query) {
            this.rawQueryString = query;
        }

        public String getVariables() {
            return variables;
        }

        public void setVariables(String variables) {
            this.variables = variables;
        }
    }
    private class BodyOptions {
        private BodyRaw raw;

        public BodyOptions(BodyRaw raw) {
            this.raw = raw;
        }

        public BodyOptions(enumRawBodyLanguage language) {
            this.raw = new BodyRaw(language);
        }

        public BodyRaw getRaw() {
            return raw;
        }

        public void setRaw(BodyRaw raw) {
            this.raw = raw;
        }
    }
    private String mode;
    private BodyOptions options;
    private String raw;
}
