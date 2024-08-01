package com.postman.collection;

/**
 * 
 * Encapsulates the <code>cookie</code> property of a Postman Collection.  
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/Cookie.html">Cookie</a></code>.</p>
 * 
 * <p>NOTE: Provided for serialization/de-serialization only, doesn't provide any method capability.</p>
 * 
 * 
 * 
 * 
 */

public class Cookie extends CollectionElement {
    private String domain = "";
    private String expires = "";
    private String maxAge = "";
    private boolean hostOnly;
    private boolean httpOnly;
    private String name = "";
    private String path = "";
    private boolean secure;
    private boolean session;
    private String value = "";
    private PropertyList<Property> extensions;

    public Cookie() {
        super();
    }

    
    /** 
     * @return String
     */
    public String getDomain() {
        return domain;
    }

    
    /** 
     * @param domain
     */
    public void setDomain(String domain) {
        this.domain = domain;
    }

    
    /** 
     * @return String
     */
    public String getExpires() {
        return expires;
    }

    
    /** 
     * @param expires
     */
    public void setExpires(String expires) {
        this.expires = expires;
    }

    
    /** 
     * @return String
     */
    public String getMaxAge() {
        return maxAge;
    }

    
    /** 
     * @param maxAge
     */
    public void setMaxAge(String maxAge) {
        this.maxAge = maxAge;
    }

    
    /** 
     * @return boolean
     */
    public boolean isHostOnly() {
        return hostOnly;
    }

    
    /** 
     * @param hostOnly
     */
    public void setHostOnly(boolean hostOnly) {
        this.hostOnly = hostOnly;
    }

    
    /** 
     * @return boolean
     */
    public boolean isHttpOnly() {
        return httpOnly;
    }

    
    /** 
     * @param httpOnly
     */
    public void setHttpOnly(boolean httpOnly) {
        this.httpOnly = httpOnly;
    }

    
    /** 
     * @return String
     */
    public String getName() {
        return name;
    }

    
    /** 
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    
    /** 
     * @return String
     */
    public String getPath() {
        return path;
    }

    
    /** 
     * @param path
     */
    public void setPath(String path) {
        this.path = path;
    }

    
    /** 
     * @return boolean
     */
    public boolean isSecure() {
        return secure;
    }

    
    /** 
     * @param secure
     */
    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    
    /** 
     * @return boolean
     */
    public boolean isSession() {
        return session;
    }

    
    /** 
     * @param session
     */
    public void setSession(boolean session) {
        this.session = session;
    }

    
    /** 
     * @return String
     */
    public String getValue() {
        return value;
    }

    
    /** 
     * @param value
     */
    public void setValue(String value) {
        this.value = value;
    }

    
    /** 
     * @return ArrayList&#60;{@link com.postman.collection.Property Property}&#62;
     */
    public PropertyList<Property> getExtensions() {
        return extensions;
    }

    
    /** 
     * @param extensions
     */
    public void setExtensions(PropertyList<Property> extensions) {
        this.extensions = extensions;
    }

    
    /** 
     * @return String
     */
    @Override
    public String getKey() {

        return getName();
    }

}
