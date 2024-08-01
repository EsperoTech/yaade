package com.postman.collection;

import java.util.ArrayList;



/**
 * 
 * <p>Postman SDK analog: <a href="http://www.postmanlabs.com/postman-collection/PropertyList.html">PropertyList</a></p>
 * 
 * 
 * <p> Extends ArrayList with Map like capabilities, including:
 * <ul>
 * <li>Support for retrieving by variable key which is always {@link com.postman.collection.Property#getKey()}
 * <li>Support for retrieving by index
 * <li>Support for adding by index
 * <li>Duplicate keys are not allowed
 * <li>Null keys are allowed.
 * <li>Contains returns results based on {@link com.postman.collection.Property#equals(Object)}
 * <li>Set will set the value of the variable in this ListMap if it exists, otherwise it will set the value of the specified <code>index</code>
 * <li>the <code>add</code> method returns false if the specified key already exists in the collection and does not change the collection
 * </ul>
 * 
 * 
 * 
 * 
 * 
 * 
 */
public class PropertyList<T> extends ArrayList<Property> 
{
    /**
     * Returns a PropertyList populated with the contents of <code>vars</code>
     * @param vars ArrayList&#60;Property&#62; of variables
     */
    
    public PropertyList(ArrayList<Property> vars) {
        super(vars);
    }


    /**
     * 
     * Returns an empty <code>PropertyList</code>
     */
    public PropertyList() {
        super(new ArrayList<Property>());
    }

    
    /** 
     * 
     * 
     * Get a variable whose key matches <code>key</code>, or null if it is not present
     * 
     * @param key
     * @return Property
     */
    public Property get(String key) {
        
        
        for(Property curVar : this) {
            String curVarKey;
            if(key == null) {
                curVarKey = curVar.getKey();
                if(curVarKey == null) {
                    return curVar;
                }
            }
            else if (curVar.getKey() != null && curVar.getKey().equals(key))
                return curVar;
            }
            
        
        return null;
    }

    
    /** 
     * @param key
     * @return boolean
     */
    public boolean containsKey(String key) {
        return(this.get(key) != null);
    }
  
    
    /** 
     * @param index
     * @return Property
     */
    @Override
    public Property get(int index) {
        return super.get(index);
    }

    
    /** 
     * @param compare
     * @return boolean
     */
    public boolean contains(Property compare) {
        for(Property curVar : this) {
            if(curVar.equals(compare)) {
                return true;
            }
        }
        return false;
    }

    
    /** 
     * @param pvVar
     * @return int
     */
    
    public int indexOf(Property pvVar) {
        for(int i = 0; i < this.size(); i++)
        {
            if(this.get(i).getKey().equals(pvVar.getKey())){
                return i;
            }
        }
        return -1;
    }

    
    /** 
     * @param pvVar
     * @return boolean
     */
    @Override
    public boolean add(Property pvVar) {
        
        if(pvVar == null || (pvVar.getKey() == null && pvVar.getValue() == null)) {
            throw new NullPointerException("Key and Value properties are both null");
        }
        if(this.containsKey(pvVar.getKey())) {
            this.set(pvVar);
            return true;
        }
        else {
            super.add(pvVar);
            return true;
        }
    }

    
    /** 
     * @param vars
     * @return boolean
     */
    public boolean addAll(PropertyList<Property> vars) {
        return this.addAll(this.size(), vars);
    }


/** 
 * @param index
 * @param vars
 * @return boolean
 */
public boolean addAll(int index, PropertyList<Property> vars) {
    boolean changed = false;
    
        for(int i = 0; i < vars.size(); i++) {
            if(!this.containsKey(vars.get(i).getKey())) {
                this.add(index, vars.get(i));
                changed = true;
            }
            else {
                this.remove(i);
                this.add(i, vars.get(i));
                changed = true;
            }
            
        }
        return changed;
}

    
    /** 
     * @param key
     */
    public void remove(String key) {
        Property curVar;
        for(int i = 0 ; i < this.size() ; i++) {
            curVar = this.get(i);
            if(key == null) {
                if(curVar.getKey() == null) {
                    this.remove(i);
                    break;
                }
            }
            else if(curVar.getKey() != null && curVar.getKey().equals(key)) {
                this.remove(i);
                break;
            }
        }
        
    }

    
    /** 
     * @param index
     * @param pvVar
     * @return Property
     * @throws IndexOutOfBoundsException
     */
    @Override
    public Property set(int index, Property pvVar) throws IndexOutOfBoundsException {
        
        if(index > this.size()) {
            throw new IndexOutOfBoundsException("Index out of bounds: " + index + "> " + this.size());
        }


        Property retVal = null;
        int curIndex;

        if((this.containsKey(pvVar.getKey())  && this.indexOf(pvVar) == index) || !this.containsKey(pvVar.getKey())) {
            retVal = super.set(index, pvVar);
        }
        else if(this.containsKey(pvVar.getKey()) && this.indexOf(pvVar) != index) {
            curIndex = this.indexOf(pvVar);
            retVal = super.remove(curIndex);
            super.add(curIndex, pvVar);
        }
        return retVal;
        
    }

    public Property set(Property pvVar) {
        if(!this.containsKey(pvVar.getKey())) {
            return null;
        }
        return this.set(this.indexOf(pvVar), pvVar);
    }
    
    
}