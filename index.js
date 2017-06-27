"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var utils_1 = require("./libs/utils");
/**
 * Decorator variable name
 *
 * @const
 */
var JSON_META_DATA_KEY = 'JsonProperty';
/**
 * DecoratorMetaData
 * Model used for decoration parameters
 *
 * @class
 * @property {string} name, indicate which json property needed to map
 * @property {string} clazz, if the target is not primitive type, map it to corresponding class
 */
var DecoratorMetaData = (function () {
    function DecoratorMetaData(name, clazz) {
        this.name = name;
        this.clazz = clazz;
    }
    return DecoratorMetaData;
}());
/**
 * JsonProperty
 *
 * @function
 * @property {IDecoratorMetaData<T>|string} metadata, encapsulate it to DecoratorMetaData for standard use
 * @return {(target:Object, targetKey:string | symbol)=> void} decorator function
 */
function JsonProperty(metadata) {
    var decoratorMetaData;
    if (utils_1.isTargetType(metadata, 'string')) {
        decoratorMetaData = new DecoratorMetaData(metadata);
    }
    else if (utils_1.isTargetType(metadata, 'object')) {
        decoratorMetaData = metadata;
    }
    else {
        throw new Error('index.ts: meta data in Json property is undefined. meta data: ' + metadata);
    }
    return Reflect.metadata(JSON_META_DATA_KEY, decoratorMetaData);
}
exports.JsonProperty = JsonProperty;
/**
 * getClazz
 *
 * @function
 * @property {any} target object
 * @property {string} propertyKey, used as target property
 * @return {Function} Function/Class indicate the target property type
 * @description Used for type checking, if it is not primitive type, loop inside recursively
 */
function getClazz(target, propertyKey) {
    return Reflect.getMetadata('design:type', target, propertyKey);
}
/**
 * getJsonProperty
 *
 * @function
 * @property {any} target object
 * @property {string} propertyKey, used as target property
 * @return {IDecoratorMetaData<T>} Obtain target property decorator meta data
 */
function getJsonProperty(target, propertyKey) {
    return Reflect.getMetadata(JSON_META_DATA_KEY, target, propertyKey);
}
/**
 * hasAnyNullOrUndefined
 *
 * @function
 * @property {...args:any[]} any arguments
 * @return {IDecoratorMetaData<T>} check if any arguments is null or undefined
 */
function hasAnyNullOrUndefined() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return args.some(function (arg) { return arg === null || arg === undefined; });
}
function mapFromJson(decoratorMetadata, instance, json, key) {
    /**
     * if decorator name is not found, use target property key as decorator name. It means mapping it directly
     */
    var decoratorName = decoratorMetadata.name || key;
    var innerJson = json ? json[decoratorName] : undefined;
    var clazz = getClazz(instance, key);
    if (utils_1.isArrayOrArrayClass(clazz)) {
        var metadata_1 = getJsonProperty(instance, key);
        if (metadata_1 && metadata_1.clazz || utils_1.isPrimitiveOrPrimitiveClass(clazz)) {
            if (innerJson && utils_1.isArrayOrArrayClass(innerJson)) {
                return innerJson.map(function (item) { return deserialize(metadata_1.clazz, item); });
            }
            return;
        }
        else {
            return innerJson;
        }
    }
    if (!utils_1.isPrimitiveOrPrimitiveClass(clazz)) {
        return deserialize(clazz, innerJson);
    }
    // handle boolean
    if (clazz === Boolean) {
        if (typeof json[decoratorName] === 'undefined') {
            return undefined;
        }
        var val = json[decoratorName];
        // allow string/number
        return val >= 1 || val === true;
    }
    return typeof json[decoratorName] === 'undefined' ? undefined : json[decoratorName];
}
/**
 * deserialize
 *
 * @function
 * @param {{new():T}} clazz, class type which is going to initialize and hold a mapping json
 * @param {Object} json, input json object which to be mapped
 *
 * @return {T} return mapped object
 */
function deserialize(Clazz, json) {
    if (json === null) {
        return null;
    }
    /**
     * As it is a recursive function, ignore any arguments that are unset
     */
    if (hasAnyNullOrUndefined(Clazz, json)) {
        return void 0;
    }
    /**
     * Prevent non-json continue
     */
    if (!utils_1.isTargetType(json, 'object')) {
        // convert date
        var date = new Date(json);
        if (isNaN(date.getTime())) {
            return void 0;
        }
        else {
            return date;
        }
    }
    /**
     * init root class to contain json
     */
    var instance = new Clazz();
    Object.keys(instance).forEach(function (key) {
        /**
         * get decoratorMetaData, structure: { name?:string, clazz?:{ new():T } }
         */
        var decoratorMetaData = getJsonProperty(instance, key);
        /**
         * pass value to instance
         */
        if (decoratorMetaData && decoratorMetaData.customConverter) {
            instance[key] = decoratorMetaData.customConverter.fromJson(json[decoratorMetaData.name || key]);
        }
        else {
            instance[key] = decoratorMetaData ? mapFromJson(decoratorMetaData, instance, json, key) : json[key];
        }
    });
    return instance;
}
exports.deserialize = deserialize;
/**
 * deserialize array
 *
 * @function
 * @param {{new():T}} clazz, class type which is going to initialize and hold a mapping json
 * @param {Object[]} json, input json array which to be mapped
 *
 * @return {T[]} return array of mapped object
 */
function deserializeArray(Clazz, json) {
    var results = [];
    for (var _i = 0, json_1 = json; _i < json_1.length; _i++) {
        var o = json_1[_i];
        results.push(deserialize(Clazz, o));
    }
    return results;
}
exports.deserializeArray = deserializeArray;
/**
 * Serialize: Creates a ready-for-json-serialization object from the provided model instance.
 * Only @JsonProperty decorated properties in the model instance are processed.
 *
 * @param instance an instance of a model class
 * @returns {any} an object ready to be serialized to JSON
 */
function serialize(instance) {
    if (!utils_1.isTargetType(instance, 'object') || utils_1.isArrayOrArrayClass(instance)) {
        return instance;
    }
    var obj = {};
    Object.keys(instance).forEach(function (key) {
        var metadata = getJsonProperty(instance, key);
        obj[metadata && metadata.name ? metadata.name : key] = serializeProperty(metadata, instance[key]);
    });
    return obj;
}
exports.serialize = serialize;
/**
 * Serialize array: Creates an array of ready-for-json-serialization object from the provided model instances.
 * Only @JsonProperty decorated properties in the model instance are processed.
 *
 * @param instances an array of instance of a model classes
 * @returns {any[]} an array of object ready to be serialized to JSON
 */
function serializeArray(instances) {
    var results = [];
    for (var _i = 0, instances_1 = instances; _i < instances_1.length; _i++) {
        var instance = instances_1[_i];
        results.push(serialize(instance));
    }
    return results;
}
exports.serializeArray = serializeArray;
/**
 * Prepare a single property to be serialized to JSON.
 *
 * @param metadata
 * @param prop
 * @returns {any}
 */
function serializeProperty(metadata, prop) {
    if (typeof prop === 'undefined') {
        return undefined;
    }
    if (prop === null) {
        return null;
    }
    if (!metadata || metadata.excludeToJson === true) {
        return;
    }
    if (metadata.customConverter) {
        return metadata.customConverter.toJson(prop);
    }
    if (!metadata.clazz) {
        if (prop instanceof Date) {
            var tzoffset = prop.getTimezoneOffset() * 60000; //offset in milliseconds
            var localISOTime = (new Date(prop.getTime() - tzoffset)).toISOString().slice(0, -1);
            prop = localISOTime;
        }
        return prop;
    }
    if (utils_1.isArrayOrArrayClass(prop)) {
        return prop.map(function (propItem) { return serialize(propItem); });
    }
    return serialize(prop);
}
//# sourceMappingURL=index.js.map