import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core';
import * as Y from 'yjs';

export interface SDoc {
    type: typeof Y.Doc,
    fields: Record<string, SMap | SArray | SXmlText>
}

interface SMap {
    type: typeof Y.Map,
    fields: Record<string, SNode>
}

interface SArray {
    type: typeof Y.Array,
    member: SNode
 }

interface SXmlText {
    type: typeof Y.XmlText,
}

type SNode = SMap | SArray | SXmlText | 'string' | 'number';

export type GetTypeFromSchema<T> = T extends SDoc
    ? { [key in keyof T['fields']]: GetTypeFromSchema<T['fields'][key]> }
    : T extends SMap
        ? { [key in keyof T['fields']]: GetTypeFromSchema<T['fields'][key]> }
        : T extends SArray
            ? GetTypeFromSchema<T['member']>[]
            : T extends SXmlText
                ? object
                : T extends 'number'
                    ? number
                    : T extends 'string'
                        ? string
                        : never;

export type RecursiveNullable<T> = T extends object
    ? (
        T extends (infer K)[]
            ? RecursiveNullable<K>[]
            : { [P in keyof T]: RecursiveNullable<T[P]> | null | undefined }
    )
    : T;


export function clearDoc(doc: Y.Doc, schema: SDoc) {
    // NOTE: We do not need to recursively clear data
    Object.entries(schema.fields).forEach(([key, node]) => {
        const yElement = doc.get(key, node.type)
        if (yElement instanceof Y.XmlText) {
            yElement.delete(0, yElement.length);
        } else if (yElement instanceof Y.Array) {
            yElement.delete(0, yElement.length);
        } else {
            yElement.clear();
        }
    });
}

function isXmlSchema(node: SNode): node is SXmlText {
    return typeof node === 'object' && node.type === Y.XmlText;
}
function isMapSchema(node: SNode): node is SMap {
    return typeof node === 'object' && node.type === Y.Map;
}
function isArraySchema(node: SNode): node is SArray {
    return typeof node === 'object' && node.type === Y.Array;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recursiveTransform(subdoc: Y.Map<any> | Y.Array<any> | Y.XmlText | string | number, schema: SNode) {
    if (schema === 'string') {
        if (typeof subdoc !== 'string') {
            return null;
        }
        return subdoc
    }
    if (schema === 'number') {
        if (typeof subdoc !== 'number') {
            return null;
        }
        return subdoc
    }
    if (isXmlSchema(schema)) {
        if (!(subdoc instanceof Y.XmlText)) {
            return null;
        }
        return yTextToSlateElement(subdoc);
    }
    if (isMapSchema(schema)) {
        if (!(subdoc instanceof Y.Map)) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const record: Record<string, any> = {};
        Object.entries(schema.fields).forEach(([key, subNode]) => {
            const value = subdoc.get(key);
            record[key] = recursiveTransform(value, subNode);
        });
        return record;
    }
    if (isArraySchema(schema)) {
        if (!(subdoc instanceof Y.Array)) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = [];
        subdoc.forEach((value) => {
            list.push(recursiveTransform(value, schema.member))
        });
        return list;
    }
    return null;
}

export function transformDoc(doc: Y.Doc, schema: SDoc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report: Record<string, any> = {}
    Object.entries(schema.fields).forEach(([key, node]) => {
        const value = doc.get(key, node.type);
        report[key] = recursiveTransform(value, node);
    });
    return report;
}

function recursiveInit(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subdoc: Y.Map<any> | Y.Array<any> | Y.XmlText | string | number | undefined,
    schema: SNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
) {
    if (schema === 'string') {
        if (typeof data !== 'string') {
            return undefined;
        }
        return data;
    }
    if (schema === 'number') {
        if (typeof data !== 'number') {
            return undefined;
        }
        return data
    }

    if (isXmlSchema(schema)) {
        const tmpdoc = subdoc ?? new Y.XmlText();
        if (!(tmpdoc instanceof Y.XmlText)) {
            return undefined;
        }
        if (typeof data !== 'object') {
            return undefined;
        }
        const delta = slateNodesToInsertDelta(data);
        tmpdoc.applyDelta(delta);
        return tmpdoc;
    }
    if (isMapSchema(schema)) {
        const tmpdoc = subdoc ?? new Y.Map();
        if (!(tmpdoc instanceof Y.Map)) {
            return undefined;
        }
        if (typeof data !== 'object') {
            return undefined;
        }
        Object.entries(schema.fields).forEach(([key, subNode]) => {
            const val = data[key];
            tmpdoc.set(key, recursiveInit(undefined, subNode, val))
        });
        return tmpdoc;
    }
    if (isArraySchema(schema)) {
        const tmpdoc = subdoc ?? new Y.Array();
        if (!(tmpdoc instanceof Y.Array)) {
            return undefined;
        }
        if (!Array.isArray(data)) {
            return undefined;
        }
        data.forEach((val, index) => {
            const initVal = recursiveInit(undefined, schema.member, val);
            tmpdoc.insert(index, [initVal]);
        });
        return tmpdoc;
    }
    return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initDoc(doc: Y.Doc, schema: SDoc, data: any) {
    Object.entries(schema.fields).forEach(([key, node]) => {
        const element = doc.get(key, node.type);
        recursiveInit(element, node, data[key])
    });
}
