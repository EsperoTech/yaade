package com.postman.collection;
/**
 * 
 * 
 * <p>Enumeration listing variable resolution strategies</p>
 * 
 * <table>
 * <tbody>
 * <tr>
 * <th>Strategy</th>
 * <th>Description</th>
 * </tr>
 * <tr>
 *   <td>RESOLVE</td>
 *   <td>Resolve a variable token, eg. {{baseUrl}} into the value stored in this collections <code>variable</code> element</td>
 * </tr>
 * <td>TRANSFORM</td>
 * <td>Transform the Postman variable syntax into another syntax,  For example, {{baseUrl}} to ${baseUrl} (JMeter syntax).</td>
 * </tr>
 * <tr>
 * <td>NONE</td>
 * <td>Return the literal value</td>
 * </tr>
 * </tbody>
 * </table>
 * 
 * 
 */
public enum enumVariableResolution {
    RESOLVE, TRANSFORM, NONE
}
