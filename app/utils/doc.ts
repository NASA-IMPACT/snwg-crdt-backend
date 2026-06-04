// TODO: rename this to "report"
const DOC_PREFIX = 'document';
const SCHEMA_VERSION = 'v1';

// NOTE: At runtime SlateText also carries `comment_${string}: boolean` keys to
// track per-comment marks, but we omit that template-literal index signature
// here. tsoa cannot represent it in OpenAPI, and modelling it would force every
// node type below to be generic just to keep a loose variant alive at the
// route boundary. Code that needs to read/write comment marks accesses those
// keys dynamically.
interface SlateText {
    text: string;
    underline?: boolean;
    italic?: boolean;
    bold?: boolean;
    subscript?: boolean;
    superscript?: boolean;
    comment?: boolean;
}

interface SlateBaseNode {
    id?: string;
}

// Link

interface SlateAnchor extends SlateBaseNode {
    type: 'a';
    url: string;
    children: SlateText[];
}

// Paragraph

interface SlateParagraph extends SlateBaseNode {
    type: 'p';
    children: (SlateText | SlateAnchor)[];
}

// Heading

interface SlateSubSection extends SlateBaseNode {
    type: 'sub-section';
    children: SlateText[];
}

// List

interface SlateLi extends SlateBaseNode {
    type: 'li';
    children: (SlateParagraph | SlateOl | SlateUl)[];
}

interface SlateOl extends SlateBaseNode {
    type: 'ol';
    children: SlateLi[];
}

interface SlateUl extends SlateBaseNode {
    type: 'ul';
    children: SlateLi[];
}

// Table

interface SlateTd extends SlateBaseNode {
    type: 'td';
    children: SlateParagraph[];
}

interface SlateTr extends SlateBaseNode {
    type: 'tr';
    children: SlateTd[];
}

interface SlateTable extends SlateBaseNode {
    type: 'table';
    children: SlateTr[];
}

interface SlateTableCaption extends SlateBaseNode {
    type: 'caption';
    children: (SlateText)[];
}

interface SlateTableBlock extends SlateBaseNode {
    type: 'table-block';
    id?: string;
    // NOTE: Has one table and one table caption
    children: (SlateTable | SlateTableCaption)[];
}

// Image

interface SlateImage extends SlateBaseNode {
    type: 'img';
    objectKey: string;
    children: SlateTr[];
}

interface SlateImageCaption extends SlateBaseNode {
    type: 'caption';
    children: (SlateAnchor | SlateText)[];
}

interface SlateImageBlock extends SlateBaseNode {
    type: 'image-block';
    id?: string;
    // NOTE: Has one image and one image caption
    children: (SlateImage | SlateImageCaption)[];
}

/**
 * Represents the slate element
 */
export interface SlateElement {
    children?: (SlateParagraph | SlateSubSection | SlateOl | SlateUl | SlateTableBlock | SlateImageBlock)[];
};

export function validateDocName(docName: string) {
    const [prefix, version, id] = docName.split('_');
    if (prefix != DOC_PREFIX) {
        return Error(`Document name should start with "${DOC_PREFIX}"`);
    }
    if (version != SCHEMA_VERSION) {
        return Error(`Document schema version should be "${SCHEMA_VERSION}"`);
    }
    if (!/^\d+$/.test(id)) {
        return Error('Document id should be an integer');
    }
    return { prefix, version, id: Number(id) };
}
