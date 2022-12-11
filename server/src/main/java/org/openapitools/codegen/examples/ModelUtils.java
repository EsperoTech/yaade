/*
 * This file is copied from https://github.com/OpenAPITools/openapi-generator/blob/d90c9a6f3bdabec92019e7a78837400c575c5735/modules/openapi-generator/src/main/java/org/openapitools/codegen/utils/ModelUtils.java
 * It is therefore licensed under the Apache License, Version 2.0. The origin license description is written below.
 * Code changes were conducted to fit the need for this application.
 *
 * ---------------- Original License ----------------
 * Copyright 2018 OpenAPI-Generator Contributors (https://openapi-generator.tech)
 * Copyright 2018 SmartBear Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.openapitools.codegen.examples;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.parser.util.SchemaTypeUtil;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Collections;
import java.util.Map;

public class ModelUtils {
    private static final String URI_FORMAT = "uri";

    public static boolean isArraySchema(Schema schema) {
        return (schema instanceof ArraySchema);
    }

    public static boolean isSet(Schema schema) {
        return ModelUtils.isArraySchema(schema) && Boolean.TRUE.equals(schema.getUniqueItems());
    }

    public static boolean isStringSchema(Schema schema) {
        if (schema instanceof StringSchema || SchemaTypeUtil.STRING_TYPE.equals(schema.getType())) {
            return true;
        }
        return false;
    }

    public static boolean isIntegerSchema(Schema schema) {
        if (schema instanceof IntegerSchema) {
            return true;
        }
        if (SchemaTypeUtil.INTEGER_TYPE.equals(schema.getType())) {
            return true;
        }
        return false;
    }

    public static boolean isShortSchema(Schema schema) {
        if (SchemaTypeUtil.INTEGER_TYPE.equals(schema.getType()) // type: integer
                && SchemaTypeUtil.INTEGER32_FORMAT.equals(schema.getFormat())) { // format: short (int32)
            return true;
        }
        return false;
    }

    public static boolean isLongSchema(Schema schema) {
        if (SchemaTypeUtil.INTEGER_TYPE.equals(schema.getType()) // type: integer
                && SchemaTypeUtil.INTEGER64_FORMAT.equals(schema.getFormat())) { // format: long (int64)
            return true;
        }
        return false;
    }

    public static boolean isBooleanSchema(Schema schema) {
        if (schema instanceof BooleanSchema) {
            return true;
        }
        if (SchemaTypeUtil.BOOLEAN_TYPE.equals(schema.getType())) {
            return true;
        }
        return false;
    }

    public static boolean isNumberSchema(Schema schema) {
        if (schema instanceof NumberSchema) {
            return true;
        }
        if (SchemaTypeUtil.NUMBER_TYPE.equals(schema.getType())) {
            return true;
        }
        return false;
    }

    public static boolean isFloatSchema(Schema schema) {
        if (SchemaTypeUtil.NUMBER_TYPE.equals(schema.getType())
                && SchemaTypeUtil.FLOAT_FORMAT.equals(schema.getFormat())) { // format: float
            return true;
        }
        return false;
    }

    public static boolean isDoubleSchema(Schema schema) {
        if (SchemaTypeUtil.NUMBER_TYPE.equals(schema.getType())
                && SchemaTypeUtil.DOUBLE_FORMAT.equals(schema.getFormat())) { // format: double
            return true;
        }
        return false;
    }

    public static boolean isDateSchema(Schema schema) {
        if (schema instanceof DateSchema) {
            return true;
        }

        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.DATE_FORMAT.equals(schema.getFormat())) { // format: date
            return true;
        }
        return false;
    }

    public static boolean isDateTimeSchema(Schema schema) {
        if (schema instanceof DateTimeSchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.DATE_TIME_FORMAT.equals(schema.getFormat())) { // format: date-time
            return true;
        }
        return false;
    }

    public static boolean isPasswordSchema(Schema schema) {
        if (schema instanceof PasswordSchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.PASSWORD_FORMAT.equals(schema.getFormat())) { // double
            return true;
        }
        return false;
    }

    public static boolean isByteArraySchema(Schema schema) {
        if (schema instanceof ByteArraySchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.BYTE_FORMAT.equals(schema.getFormat())) { // format: byte
            return true;
        }
        return false;
    }

    public static boolean isBinarySchema(Schema schema) {
        if (schema instanceof BinarySchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.BINARY_FORMAT.equals(schema.getFormat())) { // format: binary
            return true;
        }
        return false;
    }

    public static boolean isFileSchema(Schema schema) {
        if (schema instanceof FileSchema) {
            return true;
        }
        // file type in oas2 mapped to binary in oas3
        return isBinarySchema(schema);
    }

    public static boolean isUUIDSchema(Schema schema) {
        if (schema instanceof UUIDSchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.UUID_FORMAT.equals(schema.getFormat())) { // format: uuid
            return true;
        }
        return false;
    }

    public static boolean isURISchema(Schema schema) {
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && URI_FORMAT.equals(schema.getFormat())) { // format: uri
            return true;
        }
        return false;
    }

    public static boolean isEmailSchema(Schema schema) {
        if (schema instanceof EmailSchema) {
            return true;
        }
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType())
                && SchemaTypeUtil.EMAIL_FORMAT.equals(schema.getFormat())) { // format: email
            return true;
        }
        return false;
    }

    public static boolean isDecimalSchema(Schema schema) {
        if (SchemaTypeUtil.STRING_TYPE.equals(schema.getType()) // type: string
                && "number".equals(schema.getFormat())) { // format: number
            return true;
        }
        return false;
    }

    public static boolean isObjectSchema(Schema schema) {
        if (schema instanceof ObjectSchema) {
            return true;
        }

        // must not be a map
        if (SchemaTypeUtil.OBJECT_TYPE.equals(schema.getType()) && !(schema instanceof MapSchema)) {
            return true;
        }

        // must have at least one property
        if (schema.getType() == null && schema.getProperties() != null && !schema.getProperties().isEmpty()) {
            return true;
        }
        return false;
    }

    public static boolean isMapSchema(Schema schema) {
        if (schema instanceof MapSchema) {
            return true;
        }

        if (schema == null) {
            return false;
        }

        if (schema.getAdditionalProperties() instanceof Schema) {
            return true;
        }

        if (schema.getAdditionalProperties() instanceof Boolean && (Boolean) schema.getAdditionalProperties()) {
            return true;
        }

        return false;
    }

    public static Schema getAdditionalProperties(OpenAPI openAPI, Schema schema) {
        Object addProps = schema.getAdditionalProperties();
        if (addProps instanceof Schema) {
            return (Schema) addProps;
        }
        // NOTE: removed this code block
        if (addProps == null || (addProps instanceof Boolean && (Boolean) addProps)) {
            // Return an empty schema as the properties can take on any type per
            // the spec. See
            // https://github.com/OpenAPITools/openapi-generator/issues/9282 for
            // more details.
            return new Schema();
        }
        return null;
    }


    public static String getSimpleRef(String ref) {
        if (ref == null) {
            return null;
        } else if (ref.startsWith("#/components/")) {
            ref = ref.substring(ref.lastIndexOf("/") + 1);
        } else if (ref.startsWith("#/definitions/")) {
            ref = ref.substring(ref.lastIndexOf("/") + 1);
        } else {
            return null;
        }

        try {
            ref = URLDecoder.decode(ref, "UTF-8");
        } catch (UnsupportedEncodingException ignored) {
        }

        // see https://tools.ietf.org/html/rfc6901#section-3
        // Because the characters '~' (%x7E) and '/' (%x2F) have special meanings in
        // JSON Pointer, '~' needs to be encoded as '~0' and '/' needs to be encoded
        // as '~1' when these characters appear in a reference token.
        // This reverses that encoding.
        ref = ref.replace("~1", "/").replace("~0", "~");

        return ref;
    }

    public static Schema getSchema(OpenAPI openAPI, String name) {
        if (name == null) {
            return null;
        }

        return getSchemas(openAPI).get(name);
    }

    public static Map<String, Schema> getSchemas(OpenAPI openAPI) {
        if (openAPI != null && openAPI.getComponents() != null && openAPI.getComponents().getSchemas() != null) {
            return openAPI.getComponents().getSchemas();
        }
        return Collections.emptyMap();
    }

}
