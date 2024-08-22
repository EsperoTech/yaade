package com.postman.collection;

import java.util.ArrayList;
/**
 * 
 * Encapsulates members of the <code>event</code> array object.  Events contain pre-request and test scripts for Folders, Requests, and Collections
 * 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/Event.html">event</code>.</p>
 *   
 * <pre>
 * "event": [  
    {
        "listen": "test",
        "script": {
            "exec": [
                "pm.test(\"Status code is 200\", function () {",
                "    pm.response.to.have.status(200);",
                "});",
                "",
                "var latencyTestName = \"Response time is less than \" + pm.collectionVariables.get(\"latencyLimit\") + \" ms\";",
                "",
                "pm.test(latencyTestName, function () {",
                "    pm.expect(pm.response.responseTime).to.be.below(parseInt(pm.collectionVariables.get(\"latencyLimit\")));",
                "});",
                "",
                "pm.test(\"Response contains fact\", function () {",
                "    var jsonData = pm.response.json();",
                "    pm.expect(pm.response.json().length).to.be.greaterThan(1);",
                "});"
            ],
            "type": "text/javascript"
        }
    },
    {
        "listen": "prerequest",
        "script": {
            "exec": [
                "console.log(\"last fact: \" + pm.collectionVariables.get(\"curFact\"));"
            ],
            "type": "text/javascript"
        }
    }
    ]

                    </pre>
 * 
 * 
 */
public class Event extends CollectionElement {

    private String listen = ""; // basically the name
    private PostmanScript script = null;

    /**
     * 
     * Create a new Event object with the specified EventType (eg., pre-request or test) and source code.  The <code>type</code> property is excluded because it is always 'text/javascript', 
     * although the schema does theoretically allow for different values
     * 
     * 
     * @param evtType  Enumerated value of the event type, eg. pre-request or test
     * @param sourceCode Source code for the script
     * @param evtType Content type of the script, always "text/javascript"
     * 
     */
    public Event(enumEventType evtType, String sourceCode)  {
        this.setEventType(evtType);
        this.setScript(new PostmanScript(this.getScriptType(), sourceCode));
    }

    
    /** 
     * 
     * Unimplemented because type is always text/javascript
    /*
    public void setScriptType(String scriptType) {
        this.script.setType(scriptType);
    }
    */

    
    /** 
     * @return String
     */
    public String getScriptType() {
        //return this.script.getType();
        return "text/javascript";
    }

    
    /** 
     * 
     * Returns the type of this script, eg., pre-request or test, as an enumerated value.
     * 
     * @return enumEventType The event type
     */
    public enumEventType getEventType() {
        if (this.getListen().equals("test")) {
            return enumEventType.TEST;
        } else if (this.getListen().equals("prerequest")) {
            return enumEventType.PRE_REQUEST;
        } else {
            return null;
        }
    }

    
    /** 
     * 
     * Sets the type of this event, eg. pre-request or test, as an enumerated value
     * 
     * @param eventType The type of the event
     * 
     */
    public void setEventType(enumEventType eventType)   {
        if (eventType == enumEventType.PRE_REQUEST) {
            this.setListen("prerequest");
        } else if (eventType == enumEventType.TEST) {
            this.setListen("test");
        }
    }

    
    /** 
     * @return String
     */
    private String getListen() {
        return listen;
    }

    
    /** 
     * @param listen
     */
    private void setListen(String listen) {
        this.listen = listen;
    }

    /**
     * 
     * Get complete source for this script, or null if none is set.  Concatenates all the elements of the <code>exec</code> array.  
     * 
     * @return
     */
    public String getSourceCode() throws InvalidPropertyException {
        String srcCode = "";
        if(this.getScript() == null || this.getScript().getSourceCode() == null) {
            return null;
        }
        String chunk = "";
        for(int i = 0; i < this.getScript().getSourceCode().size(); i++) {
            
            chunk = this.getScript().getSourceCodeElement(i);
            srcCode = srcCode + (i > 0 && i < (this.getScript().getSourceCode().size() -1) ? "\n" : "") + chunk;
        }
        

        return srcCode;
    }

    
    /** 
     * @return ArrayList&#60;String&#62;
     */
    public ArrayList<String> getSourceCodeElements() {
        if(this.getScript() == null || this.getScript().getSourceCode() == null)
        {
            return null;
        }
        else {
            return this.getScript().getSourceCode();
        }
    }


    /**
     * 
     * Set the source code for this script
     * 
     * @param srcCode The source code (javascript)
     */
    public void setSourceCode(String srcCode) {
        this.setScript(new PostmanScript("text/javascript", srcCode));
    }

    


    /** 
     * @return PostmanScript
     */
    private PostmanScript getScript() {
        return script;
    }

    
    /** 
     * @param script
     */
    private void setScript(PostmanScript script) {
        this.script = script;
    }

    
    /** 
     * @return String
     */
    @Override
    public String getKey() {

        return listen;
    }

    
    /** 
     * 
     * Pre-pend source code to the end of the <code>exec</code> property array.  
     * 
     * @param code
     */
    public void addSourceCodeElement(String code, int position) {
        if(this.getScript() == null) {
            this.setScript(new PostmanScript("text/javascript",code));
            return;
        }
        this.getScript().addSourceCodeElement(code, position);
        
    }

    
    /** 
     * @param position
     * @throws InvalidPropertyException
     */
    public void removeSourceCodeElement(int position) throws InvalidPropertyException{
        if(this.getScript() == null || this.getScript().getSourceCode() == null || position < 0 || position > this.getScript().getSourceCode().size()) {
            throw new InvalidPropertyException("Source code null or position out of bounds");
        }
        this.getScript().removeSourceCodeElement(position);
    }

    public class PostmanScript extends CollectionElement {
        private String type = "";
        private ArrayList<String> exec;

        public PostmanScript(String scriptType, ArrayList<String> sourceCode) {
            this.type = scriptType;
            exec = sourceCode;
        }

        public PostmanScript(String scriptType, String sourceCode) {
            this.exec = new ArrayList<String>();
            this.exec.add(sourceCode);
            this.type = scriptType;

        }

        public void addSourceCodeElement(String code, int position) {
            if(this.getSourceCode() == null || position < 0 || position > this.getSourceCode().size())
            {
                this.exec = new ArrayList<String>();
                this.exec.add(code);
            }
            else {
                this.exec.add(code);
            }
        }

        public void removeSourceCodeElement(int position) throws InvalidPropertyException {
            
            if(this.exec == null || (position < 0 || position > this.exec.size())) {
                throw new InvalidPropertyException("Postion " + position + "out of bounds" );
            }
            this.exec.remove(position);
        }

        

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getSourceCodeElement(int position) throws InvalidPropertyException {
            if(position < 0 || exec == null || position > (exec.size() - 1)) {
                throw new InvalidPropertyException("Source code not set or position out of bounds");
            }
            return exec.get(position);
        }

        public ArrayList<String>getSourceCode() {
            return exec;
        }

        public void setSourceCode(ArrayList<String> exec) {
            this.exec = exec;
        }

        @Override
        public String getKey() {

            return null;
        }

    }

}
