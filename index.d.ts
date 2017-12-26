import 'reflect-metadata';
/**
 * provide interface to indicate the object is allowed to be traversed
 *
 * @interface
 */
export interface IGenericObject {
    [key: string]: any;
}
/**
 * When custom mapping of a property is required.
 *
 * @interface
 */
export interface ICustomConverter {
    fromJson(data: any): any;
    toJson(data: any): any;
}
/**
 * IDecoratorMetaData<T>
 * DecoratorConstraint
 *
 * @interface
 * @property {ICustomConverter} customConverter, will be used for mapping the property, if specified
 * @property {boolean} excludeToJson, will exclude the property for serialization, if true
 * @property {string} jsonTargetKey, instead of reversing the instance to it's original json you can assign a property key when serialized
 */
export interface IDecoratorMetaData<T> {
    name?: string;
    clazz?: {
        new (): T;
    };
    customConverter?: ICustomConverter;
    excludeToJson?: boolean;
    jsonTargetKey?: string;
}
/**
 * JsonProperty
 *
 * @function
 * @property {IDecoratorMetaData<T>|string} metadata, encapsulate it to DecoratorMetaData for standard use
 * @return {(target:Object, targetKey:string | symbol)=> void} decorator function
 */
export declare function JsonProperty<T>(metadata?: IDecoratorMetaData<T> | string): (target: Object, targetKey: string | symbol) => void;
/**
 * deserialize
 *
 * @function
 * @param {{new():T}} clazz, class type which is going to initialize and hold a mapping json
 * @param {Object} json, input json object which to be mapped
 *
 * @return {T} return mapped object
 */
export declare function deserialize<T extends IGenericObject>(Clazz: {
    new (): T;
}, json: IGenericObject): T;
/**
 * deserialize array
 *
 * @function
 * @param {{new():T}} clazz, class type which is going to initialize and hold a mapping json
 * @param {Object[]} json, input json array which to be mapped
 *
 * @return {T[]} return array of mapped object
 */
export declare function deserializeArray<T extends IGenericObject>(Clazz: {
    new (): T;
}, json: IGenericObject[]): T[];
/**
 * Serialize: Creates a ready-for-json-serialization object from the provided model instance.
 * Only @JsonProperty decorated properties in the model instance are processed.
 *
 * @param instance an instance of a model class
 * @returns {any} an object ready to be serialized to JSON
 */
export declare function serialize(instance: any): any;
/**
 * Serialize array: Creates an array of ready-for-json-serialization object from the provided model instances.
 * Only @JsonProperty decorated properties in the model instance are processed.
 *
 * @param instances an array of instance of a model classes
 * @returns {any[]} an array of object ready to be serialized to JSON
 */
export declare function serializeArray(instances: any[]): any[];
