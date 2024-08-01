package com.postman.collection;
import java.util.ArrayList;
    /**
     * 
     * Encapsulates the <code>item</code> object in the postman schema
     * 
     * <p>Postman SDK analog: <code><a href=http://www.postmanlabs.com/postman-collection/Item.html>Item</a></code>.</p>

     * <pre>
     * {
    "name": "Get a list of facts",

    "event": [
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
    ],
    
    "request": {
        "method": "GET",
        "header": [
            {
                "key": "Accept",
                "value": "application/json"
            }
        ],
        "url": {
            "raw": "{{baseUrl}}/facts?max_length=200&amp;limit=2",
            "host": [
                "{{baseUrl}}"
            ],
            "path": [
                "facts"
            ],
            "query": [
                {
                    "key": "max_length",
                    "value": "200"
                },
                {
                    "key": "limit",
                    "value": "2",
                    "description": "limit the amount of results returned"
                }
            ]
        },
        "description": "Returns a a list of facts"
    },
    "response": [
        {
            "name": "successful operation",
            "originalRequest": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{baseUrl}}/facts?max_length=200&amp;limit=2",
                    "host": [
                        "{{baseUrl}}"
                    ],
                    "path": [
                        "facts"
                    ],
                    "query": [
                        {
                            "key": "max_length",
                            "value": "200"
                        },
                        {
                            "key": "limit",
                            "value": "2"
                        }
                    ]
                }
            },
            "status": "OK",
            "code": 200,
            "_postman_previewlanguage": "json",
            "header": [
                {
                    "key": "Content-Type",
                    "value": "application/json"
                }
            ],
            "cookie": [],
            "body": "[\n  {\n    \"fact\": \"ex ad\",\n    \"length\": 200\n  }, (...)}\n]"
        }
    ]
}
],
"description": "Cat Facts"

}
</pre>
        

        <strong>Hierarchy</strong>

        <p>Folders and requests are both items.  An item with no <code>request</code> property is rendered by the Postman UI as a Folder.  Items with a <code>request</code> property
        are rendered as requests.  Folders can contain other items, both folders and requests.  Requests are always leaf nodes, they cannot contain other items.</p>

        <p> A collection is the top level item in the hierarchy.  It can contain a tree of items, but cannot itself be contained.  </p>

*/
public abstract class Item extends CollectionElement {

    private String description;
    private ArrayList<Event> event = null;
    private String name;
    

    private transient ItemGroup parent = null;
    
    

    protected Item() {
        
    }
     /**
     * 
     * 
     * Construct an empty item with only a <code>name</code> property and assign it as a child of <code>parent</code>  
     * 
     * @param name  The name of the object
     * @param parent The Item containing this item. 
     */
    protected Item(String name, ItemGroup parent) {
        this(name);
        this.setParent(parent);

    }
   /**
    *  * Construct an empty item with only a <code>name</code>>; property.  Once added to a Collection, the Postman UI will render this object as an empty folder.

    * @param name The name of the object
    */
    
    protected Item(String name) {
        this.setName(name);
    }


    
    /** 
     * 
     * Return the value of the <code>description</code> property
     * 
     * @return String The description
     */
    public String getDescription() {
        return description;
    }

    
    /** 
     * 
     * Set the value of the <code>description</code> property
     * 
     * 
     * @param description The description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    
    /** 
     * 
     * Return the ArrayList&#60;Event&#62; containing the objects comprising the <code>event</code> array
     * 
     * @return ArrayList&#60;Event&#62;
     */
    public ArrayList<Event> getEvents() {

        return event;
    }

    
    /** 
     * 
     * Get an event, specifying whether to return the pre-request script or test script associated with this item. 
     * 
     * 
     * @param evtType Enumerated value for the event type, eg., pre-request or test.
     * @return Event The event, if it exists
     */
    public Event getEvent(enumEventType evtType) {
        if (event == null) {
            return null;
        }
        for (int i = 0; i < event.size(); i++) {
            if (event.get(i).getEventType() == evtType) {
                return event.get(i);
            }
        }
        return null;
    }

    
    /** 
     * Set the ArrayList&#60;Event&#62; comprising the values in the <code>event</code> array.
     * 
     * @param events
     */
    public void setEvents(ArrayList<Event> events) {
        this.event = events;
    }

    
    
    
    
    
    
    /**
     * 
     * Set the parent of this item.
     *  
     * @param parent  The parent item.
     */
    public void setParent(ItemGroup parent) {
        this.parent = parent;
    }

    
    /** 
     * 
     * Get the parent of this item, or null if one is not defined (eg. this item is a collection);
     * 
     * @return Item The parent item.
     */
    @Override
    public ItemGroup getParent() {
        return this.parent;
    }

    
    
    
    
    
    /** 
     * 
     * Add an event to the array of items in the <code>event</code> property
     * 
     * @param newEvent
     */
    private void addEvent(Event newEvent) {
        if (event == null) {
            event = new ArrayList<Event>();
        }
        if (this.getEvent(newEvent.getEventType()) == null) {
            event.add(newEvent);
        } else {
            event.remove(this.getEvent(newEvent.getEventType()));
            event.add(newEvent);
        }
    }

    
    
    /** 
     * 
     * Set the pre-request script for this item in the <code>event</code> array
     * 
     * @param code The source code for the script
     * 
     */
    public void setPreRequestScript(String code)  {

        Event prEvent = new Event(enumEventType.PRE_REQUEST, code);
        this.addEvent(prEvent);
    }

    
    /** 
     * @return Event
     */
    public Event getPreRequestScript() {
        return this.getEvent(enumEventType.PRE_REQUEST);
    }

    
    /** 
     * @return Event
     */
    public Event getTestScript() {
        return this.getEvent(enumEventType.TEST);
    }

    
    /** 
     * Set the test script for this item in the <code>event</code> array
     * 
     * @param code The source code for the script
     * 
     */
    public void setTestScript(String code)  {

        Event prEvent = new Event(enumEventType.TEST, code);
        this.addEvent(prEvent);
    }

    
    
    /** 
     * @return String
     */
    public String getName() {
        return this.name;
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
    @Override
    public String getKey() {

        return this.getName();
    }

    

    

}
