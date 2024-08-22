package com.postman.collection;
import java.util.ArrayList;


/**
 * 
 * 
 * Abstract class encapsulating a Postman ItemGroup.  This class provides services for recursively finding, adding and removing child elements, eg., a request in a folder.
 
 * <p>Postman SDK analog: <code><a href="http://www.postmanlabs.com/postman-collection/ItemGroup.html">ItemGroup</a></code>.</p>
 * 
 
 * 
 * 
 * 
 * 
 * 
 * 
 */

public abstract class ItemGroup extends Item {
    private ArrayList<Item> item;


    /** 
     * 
     * Return an ArrayList&#60;{@link com.postman.collection.Item Item}&#62; containing the tree of items owned by this item.
     * 
     *      * @return ArrayList&#60;{@link com.postman.collection.Item Item}&#62;  The items
     */
    public ArrayList<Item> getItems() {
        return item;
    }

    /**
     * 
     * Recursively search the entire tree of items in the <code>item</code> property, optionally filter by item type (eg. FOLDER or REQUEST)
     * 
     * 
     * @param filter Enumerated value for the object type, eg., FOLDER or REQUEST.  Passing null returns all items.
     * @return
     */
    public ArrayList<Item> getItems(enumItemType filter) {
        ArrayList<Item> results = new ArrayList<Item>();

        if (item == null) {
            return null;
        }

        for (Item curItem : item) {
            if(filter == null && !(curItem instanceof ItemGroup) ) {
                results.add(curItem);
            }
            else if(filter == null && curItem instanceof ItemGroup) {
                results.addAll(((ItemGroup)curItem).getItems(filter));
            }
            else if (filter != null && curItem instanceof Folder) {
                if(filter == enumItemType.FOLDER) {
                    results.add(curItem);
                }
                try {
                results.addAll(((Folder)curItem).getItems(filter));
    
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            else if((filter != null && filter == enumItemType.REQUEST && curItem instanceof Request)) {
                results.add(curItem);
            }
            

        }

        return results;
    }

    /** 
     * 
     * Set the value of the <code>item</code> array with an ArrayList&#60;Item&#62;.  Passing null effectively removes all children from this item.
     * 
     * @param items  The items, or null to remove all items.
     */
    public void setItems(ArrayList<Item> items) {
        this.item = items;
    }

    
    /** 
     * 
     * Recursively search the contents of the <code>item</code> array for the item with the specified key.  Generally this is the <code>name</code> property for requests and folders.
     * 
     * @param key  The key (name) of the desired item
     * @return Item The item, if it is found in the <code>item</code> array, or null if it is not.
     */
    public Item getItem(String key) {
        return this.getItem(key,  null);
    }

    
    
    
    
    
    /**
     * 
     * Recursively search the contents of the <code>item</code> array for the item with the specified key, optionally returning the item or it's parent item. 
     * 
     * 
     * @param key The key (name) of the desired item
     * @param parent True to return the parent of the item, if found, false to return the item itself. 
     * @param filter Optional, filter on object type, eg., FOLDER or REQUEST.  If null, do not filter 
     * @return Item The item if present, or null
     */
    
    public Item getItem(String key, enumItemType filter) {
        Item result = null;
        if (this.item == null) {
            return null;
        }
        // recursively traverse items looking for name == key
        for (Item curItem : item) {
            if (item == null)
                return null;
            if(filter == null && curItem.getKey().equals(key)) {
                result = curItem;
                break;
            }
            if (curItem.getKey().equals(key)) {
                if (filter != null && (filter == enumItemType.REQUEST) && curItem instanceof Request) {
                    result = curItem;
                } else if(filter != null && filter == enumItemType.FOLDER &&  curItem instanceof Folder) {
                    result = (Item)curItem;
                }
                break;
            } else if (curItem instanceof ItemGroup) {
                result = ((ItemGroup)curItem).getItem(key, filter);
                if (result != null) {
                    break;
                }
            }

        }

        return result;
    }
/** 
     * 
     * Add multiple items to this item.  
     * 
     * @param newItems  The items to add
     * 
     */
    public void addItems(ArrayList<Item> newItems) throws RecursiveItemAddException, IllegalPropertyAccessException {
        if (this.item == null) {
            this.item = new ArrayList<Item>();
        }
        for(Item curItem : newItems) {
            this.addItem(curItem);
        }
        
    }

    /** 
     * 
     * Searches the direct children of this item (eg., non-recursively) to find an entry in the array that is the same Java instance as this item (Object.equals())
     * 
     * @param theItem  The item to search for
     * @return boolean
     */
    public boolean hasItem(Item theItem) {
        if (item == null) {
            return false;
        }
        for (Item curItem : item) {
            if (curItem.equals(theItem))
                ;
            return true;
        }

        return false;
    }

    /** 
     * 
     * Append a new direct child item to the array of items in the <code>item</code> property.  This method does not recursively check for circular additions/references.
     * 
     * @param newItem The item to add 
     * @throws RecursiveItemAddException If newItem is the same item instance as this item.
     * @throws IllegalPropertyAccessException If this item is a request
     */
    public void addItem(Item newItem) throws RecursiveItemAddException, IllegalPropertyAccessException {
        //TODO: These should probably be private.
        if (newItem.equals(this)) {
            throw new RecursiveItemAddException("Cannot add an object to itself, lolz");
        }
        
        if (this.item == null) {
            this.item = new ArrayList<Item>();
        }
        newItem.setParent(this);
        this.item.add(newItem);
        

    }

    public ItemGroup(String name) {
        super(name);
    }

    
    /** 
     * 
     * 
     * Add a new direct child item to the array of items in the <code>item</code> property at the specified index.  This method does not recursively check for circular additions/references.
     * 
     * @param newItem  Item to add
     * @param position Index for new item
     * @throws IllegalPropertyAccessException If newItem is already a direct child of this item, or if position is &#60; 0 or &#62; the size of the existing array
     * @throws RecursiveItemAddException If newItem is already a child of this item
     *
     */
    public void addItem(Item newItem, int position) throws IllegalPropertyAccessException, RecursiveItemAddException {
        if(this.item == null) {
            this.item = new ArrayList<Item>();
        }
        if (this.hasItem(newItem)) {
            throw new IllegalPropertyAccessException("Item is already present");
        }
        // If the newitem already owns this item, it's a circular recursion
        if (newItem instanceof ItemGroup && ((ItemGroup)newItem).getItem(this.getKey()) != null)

        {
            throw new RecursiveItemAddException("Item [" + newItem.getKey() + "] already contains this item [" + this.getKey());
        }
        if(position < 0 || position > this.item.size()) {
            throw new IllegalPropertyAccessException("Position " + position + " is out of bounds");
        }
        
        this.item.add(position, newItem);
        newItem.setParent(this);

    }

    
    /** 
     * 
     * Removes an item from the tree of items comprising the <code>item</code> property
     * 
     * @param oldItem The item to remove
     * 
     */
    public void removeItem(Item oldItem)  {
        this.removeItem(oldItem.getKey());
    }

    /** 
     * 
     * Removes an item with the specified key from the tree of items comprising the <code>item</code> property
     * 
     * @param key Key of the item to remove (ie. it's name)
     * 
     */
    public void removeItem(String key) {
        if (item == null) {
            return;
        }
        for (Item curItem : item) {
            if (curItem.getKey().equals(key)) {
                this.item.remove(curItem);
                break;
            }

        }

    }

    public Request getRequest(String key) {
        return (Request)this.getItem(key, enumItemType.REQUEST);
    }

    public Folder getFolder(String key) {
        return (Folder)this.getItem(key, enumItemType.FOLDER);
    
    }

    



}
